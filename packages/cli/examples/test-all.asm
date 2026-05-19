org 100h

; ── MOV ─────────────────────────────────────────────────────────
mov ax, 000Ah       ; ax = 10
mov bx, 0005h       ; bx = 5

; ── ADD / SUB ────────────────────────────────────────────────────
add ax, bx          ; ax = 15
sub bx, 0003h       ; bx = 2

; ── MUL ──────────────────────────────────────────────────────────
mov ax, 0003h
mov bx, 0004h
mul bx              ; ax = 12, dx = 0

; ── PUSH / POP ───────────────────────────────────────────────────
push ax             ; save 12
mov  ax, 0FFFFh
pop  ax             ; ax = 12 again

; ── INC / DEC ────────────────────────────────────────────────────
inc ax              ; ax = 13
dec ax              ; ax = 12

; ── AND / OR / XOR ───────────────────────────────────────────────
mov ax, 0F0Fh
and ax, 00FFh       ; ax = 000Fh
or  ax, 00F0h       ; ax = 00FFh
xor ax, 00F0h       ; ax = 000Fh

; ── SHL / SHR ────────────────────────────────────────────────────
mov cl, 04h
shl ax, cl          ; ax = 00F0h
shr ax, cl          ; ax = 000Fh

; ── NEG ──────────────────────────────────────────────────────────
mov dx, 0001h
neg dx              ; dx = FFFFh

; ── XCHG ─────────────────────────────────────────────────────────
mov bx, 0ABCh
xchg ax, bx         ; ax = 0ABCh, bx = 000Fh

; ── LOOP ─────────────────────────────────────────────────────────
mov cx, 0005h
mov si, 0000h
lp:
    inc si
    loop lp         ; si = 5 when cx reaches 0

; ── CMP + conditional jump ───────────────────────────────────────
mov ax, 0005h
cmp ax, si          ; ax == si == 5
jne fail

; ── Success: final sentinel value ────────────────────────────────
mov ax, 1234h
ret

fail:
    mov ax, 0DEADh
    ret
