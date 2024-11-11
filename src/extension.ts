import * as vscode from 'vscode';

let lastSpacePress = 0;

export function activate(context: vscode.ExtensionContext) {
    // Function to update editor.rulers from tabruler.rulerLocations and tabruler.rulerColors
    const updateEditorRulers = () => {
        const rulerLocations = vscode.workspace.getConfiguration('tabruler').get<number[]>('rulerLocations') || [];
        const rulerColors = vscode.workspace.getConfiguration('tabruler').get<string[]>('rulerColors') || [];
        const editorRulers = rulerLocations.map((column, index) => ({
            column,
            color: rulerColors[index] || undefined
        }));
        vscode.workspace.getConfiguration('editor').update('rulers', editorRulers, vscode.ConfigurationTarget.Workspace);
    };

    // Initial update of editor.rulers
    updateEditorRulers();

    // Listen for configuration changes
    vscode.workspace.onDidChangeConfiguration(event => {
        if (event.affectsConfiguration('tabruler.rulerLocations') || event.affectsConfiguration('tabruler.rulerColors')) {
            updateEditorRulers();
        }
    });

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
                const rulerLocations = vscode.workspace.getConfiguration('tabruler').get<number[]>('rulerLocations') || [];
                const rulers = rulerLocations.sort((a, b) => a - b);
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

    // Command to align existing comments with rulers
    let alignCommentsDisposable = vscode.commands.registerCommand('extension.alignCommentsWithRulers', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) { return; }

        const document = editor.document;
        const rulerLocations = vscode.workspace.getConfiguration('tabruler').get<number[]>('rulerLocations') || [];
        const rulers = rulerLocations.sort((a, b) => a - b);

        const selections = editor.selections;
        const linesToAlign = new Set<number>();

        if (selections.length === 1 && selections[0].isEmpty) {
            // No selection, align the current line
            linesToAlign.add(editor.selection.active.line);
        } else {
            // Align only the selected lines
            for (const selection of selections) {
                for (let lineIndex = selection.start.line; lineIndex <= selection.end.line; lineIndex++) {
                    linesToAlign.add(lineIndex);
                }
            }
        }

        await editor.edit(editBuilder => {
            for (const lineIndex of linesToAlign) {
                const line = document.lineAt(lineIndex);
                const lineText = line.text;
                const commentString = getCommentString(document.languageId);
                const commentIndex = lineText.indexOf(commentString.trim());

                if (commentIndex > 0 && !lineText.trimStart().startsWith(commentString.trim())) { // Exclude comments that start at the beginning of the line
                    let nearestRuler = rulers.find(ruler => ruler >= commentIndex);
                    if (nearestRuler !== undefined) {
                        const spacesToInsert = nearestRuler - commentIndex;
                        const newText = lineText.substring(0, commentIndex) + ' '.repeat(spacesToInsert) + lineText.substring(commentIndex);
                        editBuilder.replace(line.range, newText);
                    }
                }
            }
        });
    });

    context.subscriptions.push(alignCommentsDisposable);

    // Listen for text changes in the document
    vscode.workspace.onDidChangeTextDocument(async (event) => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {return;}

        const document = event.document;
        const rulerLocations = vscode.workspace.getConfiguration('tabruler').get<number[]>('rulerLocations') || [];
        const rulers = rulerLocations.sort((a, b) => a - b);

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
