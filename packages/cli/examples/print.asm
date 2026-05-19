org 100h

; INT 21h / AH=02h  — write one character (ASCII in DL) to the console

mov dl, 48h     ; 'H'
mov ah, 02h
int 21h

mov dl, 65h     ; 'e'
mov ah, 02h
int 21h

mov dl, 6Ch     ; 'l'
mov ah, 02h
int 21h

mov dl, 6Ch     ; 'l'
mov ah, 02h
int 21h

mov dl, 6Fh     ; 'o'
mov ah, 02h
int 21h

mov dl, 21h     ; '!'
mov ah, 02h
int 21h

ret
