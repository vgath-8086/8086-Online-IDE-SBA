import { useState, useEffect, useCallback } from 'react';
import type { EmulatorController } from '@emu8086/emulator';

export function useEmulatorLoop(controller: EmulatorController | null, intervalMs = 16) {
  const [tick, setTick] = useState(0);
  const refresh = useCallback(() => setTick(t => t + 1), []);

  useEffect(() => {
    if (!controller) return;
    const id = setInterval(() => {
      controller.tick();
      setTick(t => t + 1);
    }, intervalMs);
    return () => clearInterval(id);
  }, [controller, intervalMs]);

  return { tick, refresh };
}
