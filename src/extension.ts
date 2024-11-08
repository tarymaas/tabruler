import { start } from 'repl';
import * as vscode from 'vscode';

let lastSpacePress = 0;

export function activate(context: vscode.ExtensionContext) {
    let disposable = vscode.commands.registerCommand('extension.insertSpacesToNextRuler', async () => {
        const now = Date.now();
        const editor = vscode.window.activeTextEditor;
        const doubleTapTime = vscode.workspace.getConfiguration('tabruler').get<number>('doubleTapTime', 200);
        const startComment = vscode.workspace.getConfiguration('tabruler').get<boolean>('startComment', false);

        if (editor) {
            const document = editor.document;
            const currentPosition = editor.selection.active;
            const line = document.lineAt(currentPosition.line);
            const endOfLinePosition = line.range.end;

            let commentString = getCommentString(document.languageId);
            
            if (now - lastSpacePress < doubleTapTime) { // Use the configured double-tap time
                lastSpacePress = 0; // Reset the timer

                // Custom behavior: insert spaces to align with the next ruler
                const rulersConfig = vscode.workspace.getConfiguration('editor').get<{ column: number }[]>('rulers') || [];
                const rulers = rulersConfig.map(ruler => ruler.column).sort((a, b) => a - b);
                let nextRuler;
                for (let i = 0; i < rulers.length; i++) {
                    if (rulers[i] > endOfLinePosition.character) {
                        nextRuler = rulers[i];
                        break;
                    }
                }

                if (nextRuler !== undefined) {
                    // Remove the space inserted on the first press
                    await editor.edit(editBuilder => {
                        const positionBeforeSpace = currentPosition.translate(0, -1);
                        editBuilder.delete(new vscode.Range(positionBeforeSpace, currentPosition));
                    });

                    // Check if the line ends with the comment string (and optionally a space)
                    const lineText = line.text.trimEnd();
                    const trailingSpacesCount = line.text.length - lineText.length;
                    if (commentString && (lineText.endsWith(commentString.trim()))) {
                        // const commentStartPosition = lineText.length - commentString.trim().length;
                        const commentStartPosition = endOfLinePosition.translate(0, -commentString.trim().length - trailingSpacesCount);
                        await editor.edit(editBuilder => {
                            editBuilder.delete(new vscode.Range(commentStartPosition, endOfLinePosition));
                            editBuilder.insert(endOfLinePosition, ' '.repeat(trailingSpacesCount));
                        });
                    }

                    // Move the cursor to the end of the line
                    editor.selection = new vscode.Selection(endOfLinePosition, endOfLinePosition);

                    const spacesToInsert = nextRuler - endOfLinePosition.character + 1;
                    await editor.edit(editBuilder => {
                        editBuilder.insert(endOfLinePosition, ' '.repeat(spacesToInsert));
                    });

                    // Start a comment if configured
                    if (startComment) {
                        await editor.edit(editBuilder => {
                            editBuilder.insert(editor.selection.active, commentString);
                        });
                    }
                } else {
                    await editor.edit(editBuilder => {
                        editBuilder.insert(currentPosition, ' '); // Insert 1 more space if there is no next ruler
                    });
                }
            } else {
                lastSpacePress = now; // Update the last press time

                // Default behavior: insert 1 space on a single tap
                vscode.commands.executeCommand('type', { text: ' ' });
            }
        }
    });

    context.subscriptions.push(disposable);

    // Listen for text changes in the document
    vscode.workspace.onDidChangeTextDocument(async (event) => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {return;}

        const document = event.document;
        const rulersConfig = vscode.workspace.getConfiguration('editor').get<{ column: number }[]>('rulers') || [];
        const rulers = rulersConfig.map(ruler => ruler.column).sort((a, b) => a - b);

        for (const change of event.contentChanges) {
            const line = document.lineAt(change.range.start.line);
            const lineText = line.text;
            const commentString = getCommentString(document.languageId);
            const insertIndex = change.range.start.character;
            const beginning = lineText.substring(0, insertIndex);
            const insertedText = change.text;
            const commentIndex = lineText.indexOf(commentString.trim());
            const textBeforeComment = lineText.substring(0, commentIndex);
            const numOfSpaces = textBeforeComment.length - textBeforeComment.trimEnd().length;

            for (const ruler of rulers) {    
                if (commentIndex !== -1 && commentIndex === ruler + insertedText.length) {
                    const rest = lineText.substring(0, ruler);
                    // const spacesBeforeComment = lineText.substring(ruler, commentIndex);
                    const comment = lineText.substring(commentIndex);

                    if (change.text.length > 0 && change.range.end.character < ruler) {
                        // Character typed before the ruler
                        if (numOfSpaces > insertedText.length) {
                            await editor.edit(editBuilder => {
                                const startPosition = line.range.start.translate(0, commentIndex - insertedText.length);
                                const endPosition = line.range.start.translate(0, commentIndex);

                                editBuilder.delete(new vscode.Range(startPosition, endPosition));
                            });
                        }
                    }
                } else if (commentIndex !== -1 && commentIndex === ruler - change.rangeLength) { 
                    if (change.rangeLength > 0 && change.range.end.character < ruler) {
                        // Character deleted before the ruler
                        await editor.edit(editBuilder => {
                            editBuilder.insert(line.range.start.translate(0, commentIndex), ' '.repeat(change.rangeLength));
                        });
                    }
                }
            }
        }
    });
}

export function deactivate() {}

function getCommentString(languageId: string): string {
    switch (languageId) {
        case 'python':
        case 'ruby':
        case 'shellscript':
        case 'powershell':
            return '# ';
        case 'javascript':
        case 'typescript':
        case 'c':
        case 'cpp':
        case 'csharp':
        case 'java':
        case 'php':
        case 'go':
        case 'rust':
            return '// ';
        case 'html':
        case 'xml':
            return '<!-- ';
        case 'css':
            return '/* ';
        case 'sql':
            return '-- ';
        case 'yaml':
            return '# ';
        case 'matlab':
            return '% ';
        case 'gcode':
            return '; ';
        // Add more languages as needed
        default:
            return '// ';
    }
}
