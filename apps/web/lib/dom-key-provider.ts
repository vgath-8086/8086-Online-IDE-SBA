import type { KeyProvider } from '@emu8086/emulator';

export class DomKeyProvider implements KeyProvider {
  waitForKey(): Promise<string> {
    return new Promise<string>((resolve) => {
      const handler = (e: KeyboardEvent) => {
        if (e.key !== 'Enter' && e.key.length === 1) {
          document.removeEventListener('keydown', handler);
          resolve(e.key);
        }
      };
      document.addEventListener('keydown', handler);
    });
  }
  waitForEnter(): Promise<void> {
    return new Promise<void>((resolve) => {
      const handler = (e: KeyboardEvent) => {
        if (e.key === 'Enter') {
          document.removeEventListener('keydown', handler);
          resolve();
        }
      };
      document.addEventListener('keydown', handler);
    });
  }
}
