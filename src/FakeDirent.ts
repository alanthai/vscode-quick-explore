export class FakeDirent {
  constructor(public name: string, private type: 'dir' | 'file' = 'dir') {}

  isDirectory() {
    return this.type === 'dir';
  }

  isFile() {
    return this.type === 'file';
  }
}
