import * as vscode from 'vscode';

export async function applyChangesToFile(newContent: string) {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    return;
  }

  const document = editor.document;
  const entireDocumentRange = new vscode.Range(
    document.positionAt(0),
    document.positionAt(document.getText().length)
  );

  await editor.edit((editBuilder) => {
    editBuilder.replace(entireDocumentRange, newContent);
  });
}
