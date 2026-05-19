type MemoryWriteCallback = (change: { addr: number; prevVal: number; newVal: number }) => void;

export class Memory {
    size: number;
    onWrite: MemoryWriteCallback | null;
    _buffer: number[];

    constructor(size: number, onWrite: MemoryWriteCallback | null = null) {
        this.size    = size;
        this.onWrite = onWrite;
        this._buffer = new Array<number>(this.size);

        for (let i = 0; i < size; i++)
            this._buffer[i] = 0;
    }

    /** Zeroes all memory bytes to 0. */
    reset(): void {
        for (let i = 0; i < this._buffer.length; i++)
            this._buffer[i] = 0;
    }

    /** Reads a byte directly from the buffer without address normalization (used for stack view). */
    peekByte(i: number): number {
        return this._buffer[i];
    }

    readByte(address: number): number {
        address = this.normalizeAddress(address);
        return this._buffer[address];
    }

    readWord(address: number): number {
        address = this.normalizeAddress(address);
        return this._buffer[address] + (this._buffer[address + 1] << 8);
    }

    writeByte(address: number, value: number): void {
        address = this.normalizeAddress(address);
        if (value >> 8 != 0)
            console.log("Error: Trying to write more than a byte.");
        else {
            if (this.onWrite)
                this.onWrite({ addr: address, prevVal: this._buffer[address], newVal: value });
            this._buffer[address] = value;
        }
    }

    _writeByte(address: number, value: number): void {
        address = this.normalizeAddress(address);
        if (value >> 8 != 0)
            console.log("Error: Trying to write more than a byte.");
        else
            this._buffer[address] = value;
    }

    writeWord(address: number, value: number): void {
        address = this.normalizeAddress(address);
        if (value >> 16 != 0) {
            console.log("Error: Trying to write more than a word.");
        } else {
            if (this.onWrite) {
                this.onWrite({ addr: address,     prevVal: this._buffer[address],     newVal: (value % 256) });
                this.onWrite({ addr: address + 1, prevVal: this._buffer[address + 1], newVal: (value >> 8)  });
            }
            this._buffer[address + 1] = value >> 8;
            this._buffer[address]     = value % 256;
        }
    }

    _writeWord(address: number, value: number): void {
        address = this.normalizeAddress(address);
        if (value >> 16 != 0)
            console.log("Error: Trying to write more than a word.");
        else {
            this._buffer[address + 1] = value >> 8;
            this._buffer[address]     = value % 256;
        }
    }

    /** Wraps address to valid range; logs a warning if it exceeded memory size. */
    normalizeAddress(address: number): number {
        if (address > this.size) {
            console.log("Warning: Trying to access an unmapped address of the memory ");
            address %= this.size;
        }
        return address;
    }

    dump(): number[] {
        const copy = new Array<number>(this.size);
        for (let i = 0; i < this.size; i++)
            copy[i] = this._buffer[i];
        return copy;
    }
}
