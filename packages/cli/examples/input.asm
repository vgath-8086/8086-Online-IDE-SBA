org 100h

; INT 21h / AH=01h  — read one character from keyboard, ASCII stored in AL
; The emulator echoes the typed character to the console automatically.
mov ah, 01h
int 21h          ; waits for keypress → AL = ASCII code

; Echo the character back explicitly using AH=02h so it appears a second time.
; Remove these three lines if you only want the auto-echo.
mov dl, al
mov ah, 02h
int 21h

ret
