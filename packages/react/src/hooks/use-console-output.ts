import { useMemo } from 'react';
import type { EmulatorController } from '@emu8086/emulator';

export function useConsoleOutput(controller: EmulatorController | null, tick: number) {
  return useMemo(() => {
    if (!controller) {
      return {
        chars: [] as Array<{ char: string; fg: number; bg: number }>,
        text: '',
        waiting: false,
        waitingForChar: false,
      };
    }
    const chars = controller.processor.cnsl.getDisplayChars();
    const cols = 80;
    let raw = '';
    for (let i = 0; i < chars.length; i++) {
      if (i > 0 && i % cols === 0) raw += '\n';
      raw += chars[i].char || ' ';
    }
    return {
      chars,
      text: raw.trimEnd(),
      waiting: controller.processor.cnsl.readMode,
      waitingForChar: controller.processor.int21_01,
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [controller, tick]);
}
