import * as vscode from 'vscode';
import * as path from 'path';
import {showNavigation} from './showNavigation';

export function activate(context: vscode.ExtensionContext) {
  const workspaceFolder = vscode.workspace.workspaceFolders?.[0]!;
  const root = workspaceFolder.uri.path;

  let disposable = vscode.commands.registerCommand(
    'quick-explore.navigate',
    async () => {
      const activeEditorPath =
        vscode.window.activeTextEditor?.document.uri.path;
      let relativePath = activeEditorPath
        ? path.dirname(activeEditorPath)
        : root;

      while (true) {
        const newItem = await showNavigation(root, relativePath).catch((e) =>
          console.log('error!', e)
        );

        if (newItem) {
          relativePath = newItem.value
            ? path.join(relativePath, newItem.value.name)
            : workspaceFolder.uri.path;
          if (!relativePath) {
            break;
          }

          vscode.commands.executeCommand(
            'revealInExplorer',
            vscode.Uri.parse(relativePath)
          );

          // newItem.value === undefined means it's root
          if (newItem.value && !newItem.value.isDirectory()) {
            vscode.commands.executeCommand(
              'vscode.open',
              vscode.Uri.parse(relativePath)
            );
            break;
          }
        } else {
          break;
        }
      }
    }
  );

  context.subscriptions.push(disposable);
}
