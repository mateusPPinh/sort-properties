import { getActiveEditorContent } from './utils/getActiveEditorContent';
import { sortInterfacesAndPropsAlphabetically } from './utils/sortInterfacesAndPropsAlphabetically';
import { applyChangesToFile } from './utils/applyChangesToFile';

import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
	let disposable = vscode.commands.registerCommand('props-sort.sortInterfacesAndProps', async () => {
    const content = getActiveEditorContent();
    if (!content) {
      vscode.window.showErrorMessage('No active editor found.');
      return;
    }

    const sortedContent = sortInterfacesAndPropsAlphabetically(content);
    await applyChangesToFile(sortedContent);

    vscode.window.showInformationMessage('Interfaces and properties sorted alphabetically.');
  });

  context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate() {}
