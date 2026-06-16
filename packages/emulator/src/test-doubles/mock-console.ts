import type { IConsole } from '../interfaces/i-console.js';

export class MockConsole implements IConsole {
  /** Characters written by writeChar, as char codes. */
  readonly written: number[] = [];
  /** fg/bg passed to each writeChar call, parallel to `written`. */
  readonly attributes: Array<{ fg: number; bg: number }> = [];

  writeChar(char: string | undefined, fg: number = 15, bg: number = 0): void {
    if (char != null && char !== '') {
      this.written.push(char.charCodeAt(0));
      this.attributes.push({ fg, bg });
    }
  }

  readChar(): void { /* no-op in tests */ }

  waitForEnter(): Promise<void> { return Promise.resolve(); }
}
