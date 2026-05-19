# @emu8086/cli

Interactive terminal UI for the 8086 emulator. Write an `.asm` file, pass it as an argument, and step through execution in your terminal.

## Prerequisites

- Node.js ≥ 18
- pnpm

## Usage

```bash
# From the monorepo root — build dependencies first if you haven't already
pnpm --filter @emu8086/emulator build
pnpm --filter @emu8086/compiler build

# Then run any .asm file
pnpm --filter @emu8086/cli start path/to/program.asm

# Or from inside this package
cd packages/cli
node_modules/.bin/tsx src/index.tsx examples/hello.asm
```

## Running the included examples

Four example programs are in `packages/cli/examples/`:

```bash
# Simple arithmetic: sets AX=0008h, then returns
pnpm --filter @emu8086/cli start packages/cli/examples/hello.asm

# Full feature test: exercises MOV, ADD/SUB, MUL, PUSH/POP, INC/DEC,
# AND/OR/XOR, SHL/SHR, NEG, XCHG, LOOP, CMP/JNE — ends with AX=1234h
pnpm --filter @emu8086/cli start packages/cli/examples/test-all.asm

# Console output: prints "Hello!" character by character using INT 21h / AH=02h
pnpm --filter @emu8086/cli start packages/cli/examples/print.asm

# Console input: waits for a keypress (INT 21h / AH=01h), then echoes it back
pnpm --filter @emu8086/cli start packages/cli/examples/input.asm
```

Step through any program with `s` and watch the source panel highlight each instruction as it executes.

### Console I/O (INT 21h)

The emulator supports these DOS-style interrupt services — **INT 10h is not implemented**:

| Call | Effect |
|------|--------|
| `MOV AH, 01h` / `INT 21h` | Wait for keypress; ASCII stored in AL, char echoed to console |
| `MOV AH, 02h` / `INT 21h` | Write character in DL to console |
| `MOV AH, 09h` / `INT 21h` | Write `$`-terminated string; DX = address of string in memory |

Programs that do no I/O (like `test-all.asm`) will show an empty console panel — that is expected.

## Keyboard controls

| Key | Action |
|-----|--------|
| `s` | Single step — execute one instruction |
| `b` | Step back — undo the last instruction |
| `r` | Run — execute until program ends or step limit |
| `R` | Reset — reload the program from the beginning |
| `?` | Toggle this help panel |
| `q` | Quit |

Any other printable key or Enter is forwarded to the emulated program when it is waiting for console input (`INT 21h` / `INT 10h` read operations).

## Layout

```
8086 Emulator — CLI  (step 4)  ? for help

┌─ Source ────────────────────────────────┐  ┌─ Registers ──┐
│    1  org 100h                          │  │ AX   000F    │
│    2                                    │  │ BX   0005    │
│    3  ; ── MOV ───────────────          │  │ CX   0000    │
│    4  mov ax, 000Ah       ; ax = 10     │  │ DX   0000    │
│ ▶  5  mov bx, 0005h                     │  │              │
│    6                                    │  │ CS   0100    │
│    7  ; ── ADD / SUB ──────────         │  │ ...          │
│    8  add ax, bx                        │  └──────────────┘
│    9  sub bx, 0003h                     │  ┌─ Console ────┐
│   10  ...                               │  │ (empty)      │
└─────────────────────────────────────────┘  └──────────────┘

┌─ status bar ─────────────────────────────────────────────────┐
│ Loaded. s=step  b=back  r=run  R=reset  ?=help  q=quit       │
└──────────────────────────────────────────────────────────────┘
```

The `▶` marker tracks the instruction about to execute. The source window scrolls to keep the current line centered. Registers update live after each step.

## Writing programs

Programs must start with `org 100h` and exit with `ret`:

```asm
org 100h

mov ax, 0Ah     ; ax = 10
mov bx, 05h     ; bx = 5
add ax, bx      ; ax = 15

ret             ; pops 0xFFFE from stack → ends execution
```

**Hex literals** use the `h` suffix: `0FFh`, `1234h`, `0ABCDh`.  
**Decimal** is written plain: `10`, `255`, `65535`.  
**Binary** uses the `b` suffix: `10110101b`.

See [`examples/test-all.asm`](examples/test-all.asm) for a program that exercises every major instruction group.

## Running the headless test suite

```bash
cd packages/cli
node_modules/.bin/tsx examples/test-runner.ts
```

The test runner compiles `examples/test-all.asm`, executes it step-by-step without the UI, and asserts the final register values — useful for verifying that the emulator and compiler are working correctly.

## How it works

`NodeKeyProvider` implements the `KeyProvider` port from `@emu8086/emulator`. Ink's `useInput` hook routes keystrokes to the provider via `deliverKey()` instead of reading stdin directly — Ink owns the terminal, so we push keys in rather than pulling them.

The `EmulatorController` from `@emu8086/emulator` is identical to what the web app uses. No environment-specific code lives in the package — only the `NodeKeyProvider` adapter is CLI-specific.
