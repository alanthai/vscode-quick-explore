import {Disposable, QuickPickItem, window} from 'vscode';
import * as fs from 'fs/promises';
import * as path from 'path';
import {Dirent} from 'fs';

class FakeDirent {
  constructor(public name: string, private type: 'dir' | 'file' = 'dir') {}

  isDirectory() {
    return this.type === 'dir';
  }

  isFile() {
    return this.type === 'file';
  }
}

type Value = Dirent | FakeDirent | undefined;
type QuickPickItemWithValue = QuickPickItem & {value: Value};

export async function showNavigation(root: string, relativePath: string) {
  const items = await fs.readdir(relativePath, {withFileTypes: true});
  const isRoot = root === relativePath;

  const filesAndFolders = items.map((item) => ({
    label: item.name,
    value: item,
    description: item.isDirectory() ? '/' : undefined,
  }));

  const parentName = path.basename(path.dirname(relativePath));
  const parent =
    relativePath !== root
      ? [
          {
            label: '..',
            description: `${parentName}/`,
            value: new FakeDirent('..'),
          },
        ]
      : [];

  const rootItem = isRoot
    ? [{label: '~', description: '(Project root)', value: undefined}]
    : [];

  const all = [...filesAndFolders, ...parent, ...rootItem];

  const quickPick = window.createQuickPick();
  const disposables: Disposable[] = [];

  return new Promise<QuickPickItemWithValue | undefined>((resolve) => {
    quickPick.title = path.relative(root, relativePath) || 'root';
    quickPick.matchOnDescription = true;
    quickPick.items = all;

    disposables.push(
      quickPick.onDidChangeSelection(([selection]) => {
        disposables.forEach((d) => d.dispose());
        console.log('selection', selection);
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
      quickPick.onDidHide(() => quickPick.dispose())
    );
    quickPick.show();
  }).then((value) => {
    quickPick.dispose();
    return value;
  });
}
