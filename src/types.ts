import { Dirent } from 'fs';
import { QuickPickItem } from 'vscode';
import { FakeDirent } from './FakeDirent';

export type Aliases = {
  [alias: string]: { path: string; description?: string };
};

export type Dir = Dirent | FakeDirent;
export type QuickPickItemWithValue = QuickPickItem & {
  alias?: string;
  value?: Dir;
};
