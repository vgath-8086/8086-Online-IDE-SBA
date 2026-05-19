export interface IMemory {
  readByte(address: number): number;
  readWord(address: number): number;
  writeByte(address: number, value: number): void;
  writeWord(address: number, value: number): void;
  _writeByte(address: number, value: number): void;
}
