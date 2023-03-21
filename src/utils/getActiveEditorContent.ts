import * as vscode from 'vscode';

export function getActiveEditorContent(): string | null {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    return null;
  }

  const document = editor.document;
  return document.getText();
}
