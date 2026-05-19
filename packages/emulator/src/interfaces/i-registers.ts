export interface IRegisters {
  readReg(id: number): number;
  writeReg(id: number, value: number): void;
  readByteReg(id: number): number;
  writeByteReg(id: number, value: number): void;
  readWordReg(id: number): number;
  writeWordReg(id: number, value: number): void;
  readSegReg(id: number): number;
  writeSegReg(id: number, value: number): void;
  extractFlag(name: string): number;
  setFlag(name: string, bit: number): void;
  incIP(by: number): void;
  incSP(): void;
  decSP(): void;
  copyRegister(destId: number, srcId: number, type1: number, type2: number): void;
  executeMul(registerId: number, type: number): void;
  executeDiv(registerId: number, type: number): void;
}
