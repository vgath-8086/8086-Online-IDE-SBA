import type { IConsole } from '../interfaces/i-console.js';

export class MockConsole implements IConsole {
  /** Characters written by writeChar, as char codes. */
  readonly written: number[] = [];

  writeChar(char: string | undefined): void {
    if (char != null && char !== '') this.written.push(char.charCodeAt(0));
  }

  readChar(): void { /* no-op in tests */ }

  waitForEnter(): Promise<void> { return Promise.resolve(); }
}
