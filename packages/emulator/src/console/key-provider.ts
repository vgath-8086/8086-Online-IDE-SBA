export interface KeyProvider {
  waitForKey(): Promise<string>;
  waitForEnter(): Promise<void>;
}
