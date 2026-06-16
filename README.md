# 8086 Online IDE

An 8086 assembler and emulator available as a **web IDE** and a **terminal CLI**. Write assembly, compile it, and step through execution with full register, RAM, stack, and console visibility.

---

## Quick start

```bash
# Install all workspace dependencies
pnpm install

# Build the emulator and compiler packages first
pnpm --filter @emu8086/emulator build
pnpm --filter @emu8086/compiler build

# Run the web IDE
pnpm --filter @emu8086/web dev

# Run a program in the terminal
pnpm --filter @emu8086/cli start packages/cli/examples/hello.asm
```

---

## Monorepo layout

```
packages/
  compiler/   — 8086 assembler (lexer → preprocessor → syntax → linker → encoder)
  emulator/   — 8086 CPU core (registers, memory, opcode decoder, virtual console)
  cli/        — Terminal UI built with React Ink; demonstrates env-agnostic design

apps/
  web/        — Browser IDE built with Vite + CodeMirror + Canvas
```

`packages/compiler` and `packages/emulator` have **no browser or Node dependencies** — they are plain TypeScript that runs in any JavaScript environment. The web and CLI apps are adapters that wire up keyboard input and rendering.

---

## Supported instructions

| Category | Instructions |
|---|---|
| Data transfer | `MOV`, `XCHG`, `LEA`, `PUSH`, `POP`, `PUSHF`, `POPF` |
| Arithmetic | `ADD`, `SUB`, `MUL`, `DIV`, `NEG`, `INC`, `DEC`, `CMP` |
| Bitwise / shift | `AND`, `OR`, `XOR`, `NOT`, `TEST`, `SHL`/`SAL`, `SHR`, `SAR`, `ROL`, `ROR`, `RCL`, `RCR` |
| Control flow | `JMP`, `CALL`, `RET`, `Jcc` (JE/JNE/JG/JGE/JL/JLE/JA/JAE/JB/JBE/JS/JNS/JO/JNO/JP/JNP/JCXZ), `LOOP` |
| String | `MOVSB`, `MOVSW`, `LODSB`, `LODSW`, `STOSB`, `STOSW`, `CMPSB`, `CMPSW`, `SCASB`, `SCASW`, `REP`, `REPE`, `REPNE` |
| Flags | `CLC`, `STC`, `CMC`, `CLD`, `STD` |
| Interrupt | `INT` (10h AH=09h write char+color / 21h AH=01h,02h,09h,0Ah DOS-style I/O) |
| Segment override | `CS:`, `DS:`, `ES:`, `SS:` prefixes |

---

## Assembly syntax

Programs begin with an origin directive and end with `RET`:

```asm
org 100h

mov ax, 0005h   ; hex immediate (h suffix)
mov bx, 10      ; decimal immediate
add ax, bx      ; ax = 15

mov cx, 3       ; loop counter
lp:
    dec ax
    loop lp     ; loop until cx = 0

ret             ; exit (pops 0xFFFE from stack → execution ends)
```

**Literals:** decimal (`42`), hex with `h` suffix (`0FFh`, `1234h`), binary with `b` suffix (`1010b`).  
**Data:** `DB` (byte), `DW` (word), `DUP` for arrays.  
**Labels:** any identifier followed by `:`.  
**Macros:** `MACRO` / `ENDM`, with `LOCAL` to keep a label private per expansion.  
**Procedures:** `PROC` / `ENDP` — mnemonic-first (`PROC name`), invoked with `CALL name`.

---

## Architecture

The design follows **dependency inversion**: the emulator package defines the domain and ports; the web and CLI apps supply adapters.

```
packages/emulator  ←  KeyProvider (interface / port)
                       ↑                    ↑
              DomKeyProvider          NodeKeyProvider
              (apps/web)              (packages/cli)
```

`EmulatorController` is fully environment-agnostic — `startRun()` uses `setInterval` (works in Node and browser), `tick()` drives per-frame key processing, and `getDisplayChars()` returns rendering-agnostic character data.

---

## Running tests (CLI)

```bash
pnpm --filter @emu8086/cli start packages/cli/examples/test-all.asm
# or headless:
cd packages/cli && node_modules/.bin/tsx examples/test-runner.ts
```
