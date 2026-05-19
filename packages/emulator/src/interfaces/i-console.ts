export interface IConsole {
  writeChar(char: string | undefined, fg?: number, bg?: number): void;
  readChar(): void;
  waitForEnter(): Promise<void>;
}
