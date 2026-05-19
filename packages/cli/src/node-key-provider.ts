import type { KeyProvider } from '@emu8086/emulator';

/**
 * Node/Ink adapter for the KeyProvider port.
 * Ink owns stdin, so keys are pushed in via deliverKey() from useInput callbacks
 * rather than being pulled directly from the OS.
 */
export class NodeKeyProvider implements KeyProvider {
  private _pendingKey: ((key: string) => void) | null = null;
  private _pendingEnter: (() => void) | null = null;

  /** Called by the Ink useInput handler to forward a keystroke to the emulator. */
  deliverKey(key: string): void {
    if ((key === '\r' || key === 'return') && this._pendingEnter) {
      const resolve = this._pendingEnter;
      this._pendingEnter = null;
      resolve();
    }
    if (this._pendingKey) {
      const resolve = this._pendingKey;
      this._pendingKey = null;
      resolve(key);
    }
  }

  waitForKey(): Promise<string> {
    return new Promise((resolve) => {
      this._pendingKey = resolve;
    });
  }

  waitForEnter(): Promise<void> {
    return new Promise((resolve) => {
      this._pendingEnter = resolve;
    });
  }
}
