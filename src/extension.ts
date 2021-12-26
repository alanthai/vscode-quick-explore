import * as vscode from 'vscode';
import * as path from 'path';
import { showNavigation } from './showNavigation';
import { Aliases } from './types';
import { FakeDirent } from './FakeDirent';

export function activate(context: vscode.ExtensionContext) {
  const workspaceFolder = vscode.workspace.workspaceFolders?.[0]!;
  const root = workspaceFolder.uri.path;

  let disposable = vscode.commands.registerCommand(
    'quick-explore.open',
    async () => {
      const config = vscode.workspace.getConfiguration('quick-explore');
      const startPath = config.get<string>('startPath')!;

      const activeEditorPath =
        vscode.window.activeTextEditor?.document.uri.path;
      let nextPath =
        startPath.startsWith('.') && activeEditorPath
          ? path.resolve(path.dirname(activeEditorPath), startPath)
          : path.resolve(root, startPath);

      while (true) {
        const aliases = getAliases(config, nextPath, root);
        const newItem = await showNavigation(root, nextPath, aliases).catch(
          (e) => console.log('error!', e)
        );

        if (newItem) {
          nextPath = newItem.alias ?? path.join(nextPath, newItem.value!.name);

          if (!nextPath) {
            break;
          }

          await vscode.commands.executeCommand(
            'revealInExplorer',
            vscode.Uri.parse(nextPath)
          );

          // newItem.value === undefined means it's an alias
          if (newItem.value && !newItem.value.isDirectory()) {
            await vscode.commands.executeCommand(
              'vscode.open',
              vscode.Uri.parse(nextPath)
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

function getAliases(
  config: vscode.WorkspaceConfiguration,
  nextPath: string,
  root: string
) {
  const aliases = config.get<Aliases>('aliases')!;
  const aliasItems = Object.entries(aliases)
    .filter(([_, option]) => path.relative(option.path, nextPath) !== '')
    .map(([alias, option]) => ({
      ...option,
      alias: getAbsolutePath(option.path, nextPath, root),
      label: alias,
    }));

  const parentName = path.basename(path.dirname(nextPath));
  const parent =
    nextPath !== root
      ? [
          {
            label: '..',
            description: `${parentName}/`,
            value: new FakeDirent('..'),
          },
        ]
      : [];

  return [...parent, ...aliasItems];

  function getAbsolutePath(
    relativePath: string,
    nextPath: string,
    root: string
  ) {
    return path.resolve(
      relativePath.startsWith('.') ? nextPath : root,
      relativePath
    );
  }
}
