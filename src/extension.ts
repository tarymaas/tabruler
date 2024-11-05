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
            const startOfLinePosition = line.range.start;

            let commentString = '';
            if (startComment) {
                const languageId = document.languageId;
                switch (languageId) {
                    case 'python':
                    case 'ruby':
                    case 'shellscript':
                    case 'powershell':
                        commentString = '# ';
                        break;
                    case 'javascript':
                    case 'typescript':
                    case 'c':
                    case 'cpp':
                    case 'csharp':
                    case 'java':
                    case 'php':
                    case 'go':
                    case 'rust':
                        commentString = '// ';
                        break;
                    case 'html':
                    case 'xml':
                        commentString = '<!-- ';
                        break;
                    case 'css':
                        commentString = '/* ';
                        break;
                    case 'sql':
                        commentString = '-- ';
                        break;
                    case 'yaml':
                        commentString = '# ';
                        break;
                    case 'matlab':
                        commentString = '% ';
                        break;
                    case 'gcode':
                        commentString = '; ';
                        break;
                    // Add more languages as needed
                    default:
                        commentString = '// ';
                        break;
                }
            }

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
}

export function deactivate() {}
