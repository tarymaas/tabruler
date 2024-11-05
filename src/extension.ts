// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

let lastSpacePress = 0;

export function activate(context: vscode.ExtensionContext) {
    let disposable = vscode.commands.registerCommand('extension.insertSpacesToNextRuler', () => {
        const now = Date.now();
        const editor = vscode.window.activeTextEditor;
        const doubleTapTime = vscode.workspace.getConfiguration('tabruler').get<number>('doubleTapTime', 200);

        if (editor) {
            if (now - lastSpacePress < doubleTapTime) { // Use the configured double-tap time
                lastSpacePress = 0; // Reset the timer

                // Custom behavior: insert spaces to align with the next ruler
                const currentPosition = editor.selection.active;
                const rulersConfig = vscode.workspace.getConfiguration('editor').get<{ column: number }[]>('rulers') || [];
                const rulers = rulersConfig.map(ruler => ruler.column).sort((a, b) => a - b);
                let nextRuler;
                for (let i = 0; i < rulers.length; i++) {
                    if (rulers[i] > currentPosition.character) {
                        nextRuler = rulers[i];
                        break;
                    }
                }

                if (nextRuler !== undefined) {
                    const spacesToInsert = nextRuler - currentPosition.character;
                    editor.edit(editBuilder => {
                        editBuilder.insert(currentPosition, ' '.repeat(spacesToInsert));
                    });
                } else {
                    editor.edit(editBuilder => {
                        editBuilder.insert(currentPosition, ' '); // Insert 1 space if there is no next ruler
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
