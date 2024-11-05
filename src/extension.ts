import * as vscode from 'vscode';

let lastSpacePress = 0;

export function activate(context: vscode.ExtensionContext) {
    let disposable = vscode.commands.registerCommand('extension.insertSpacesToNextRuler', async () => {
        const now = Date.now();
        const editor = vscode.window.activeTextEditor;
        const doubleTapTime = vscode.workspace.getConfiguration('tabruler').get<number>('doubleTapTime', 200);

        if (editor) {
            const document = editor.document;
            const currentPosition = editor.selection.active;
            const line = document.lineAt(currentPosition.line);
            const endOfLinePosition = line.range.end;

            if (now - lastSpacePress < doubleTapTime) { // Use the configured double-tap time
                lastSpacePress = 0; // Reset the timer

                // Remove the space inserted on the first press
                await editor.edit(editBuilder => {
                    const positionBeforeSpace = currentPosition.translate(0, -1);
                    editBuilder.delete(new vscode.Range(positionBeforeSpace, currentPosition));
                });

                // Move the cursor to the end of the line
                editor.selection = new vscode.Selection(endOfLinePosition, endOfLinePosition);

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
                    const spacesToInsert = nextRuler - endOfLinePosition.character + 1;
                    editor.edit(editBuilder => {
                        editBuilder.insert(endOfLinePosition, ' '.repeat(spacesToInsert));
                    });
                } else {
                    editor.edit(editBuilder => {
                        editBuilder.insert(endOfLinePosition, '  '); // Insert 2 spaces if there is no next ruler
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
