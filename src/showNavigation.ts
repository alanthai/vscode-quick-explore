import { Disposable, QuickPick, window } from 'vscode';
import * as fs from 'fs/promises';
import * as path from 'path';
import { Dirent } from 'fs';
import { QuickPickItemWithValue } from './types';

let current: QuickPick<any> | undefined;
let disposables: Disposable[] = [];

export async function showNavigation(
  root: string,
  relativePath: string,
  aliases: QuickPickItemWithValue[]
) {
  const items = (await fs.readdir(relativePath, { withFileTypes: true })).sort(
    sortFileTypes
  );

  const filesAndFolders = items.map((item) => ({
    label: item.name,
    value: item,
    description: item.isDirectory() ? '/' : undefined,
  }));

  const all = [...filesAndFolders, ...aliases];

  const quickPick = window.createQuickPick();
  disposables = [];
  if (current) {
    current.dispose();
  }
  current = quickPick;

  return new Promise<QuickPickItemWithValue | undefined>((resolve) => {
    quickPick.title = path.relative(root, relativePath) || 'root';
    quickPick.matchOnDescription = true;
    quickPick.items = all;

    disposables.push(
      quickPick.onDidChangeSelection(([selection]) => {
        resolve(selection as QuickPickItemWithValue);
      }),
      quickPick.onDidChangeValue((value) => {
        if (value.endsWith('/')) {
          const strSelection = value.slice(0, -1);
          const selection = all.find((item) => item.label === strSelection);
          if (selection) {
            resolve(selection);
          }
        }
      }),
      quickPick.onDidHide(() => {
        resolve(undefined);
      })
    );
    quickPick.show();
  }).then((value) => {
    disposables.forEach((d) => d.dispose());
    quickPick.dispose();
    current = undefined;
    return value;
  });
}

function sortFileTypes(a: Dirent, b: Dirent) {
  return rankFileType(a) - rankFileType(b);
}

function rankFileType(dirent: Dirent) {
  if (dirent.isDirectory()) {
    return 0;
  }
  if (dirent.isSymbolicLink()) {
    return 1;
  }
  if (dirent.isFile()) {
    return 2;
  }
  return 3;
}
