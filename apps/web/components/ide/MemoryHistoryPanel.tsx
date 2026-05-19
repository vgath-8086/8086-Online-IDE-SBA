'use client';
import { useMemo } from 'react';
import { Maximize2 } from 'lucide-react';
import type { EmulatorController } from '@emu8086/emulator';

interface Props {
  controller: EmulatorController | null;
  tick: number;
  standalone?: boolean;
  onExpand?: () => void;
}

export function MemoryHistoryPanel({ controller, tick: _tick, standalone = false, onExpand }: Props) {
  const t = controller?.t ?? 0;

  const log = useMemo(() => {
    if (!controller || t === 0) return [];
    const entries: Array<{ step: number; addr: number; prevVal: number; newVal: number }> = [];
    for (let i = 1; i <= t; i++) {
      for (const ch of controller.ramChangesAt(i)) {
        entries.push({ step: i, addr: ch.addr, prevVal: ch.prevVal, newVal: ch.newVal });
      }
    }
    return entries.reverse();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [controller, t]);

  const table = (
    <div className="overflow-auto h-full">
      {!controller
        ? <div className="p-2 text-xs text-zinc-600">Compile to view memory history</div>
        : log.length === 0
        ? <div className="p-2 text-xs text-zinc-600">No memory writes yet</div>
        : (
          <table className="w-full text-xs font-mono border-collapse">
            <thead className="sticky top-0 bg-zinc-900">
              <tr>
                <th className="text-left px-2 py-0.5 text-zinc-500 font-normal">Step</th>
                <th className="text-left px-2 py-0.5 text-zinc-500 font-normal">Address</th>
                <th className="text-left px-2 py-0.5 text-zinc-500 font-normal">Old</th>
                <th className="text-left px-2 py-0.5 text-zinc-500 font-normal">New</th>
              </tr>
            </thead>
            <tbody>
              {log.map((e, i) => (
                <tr key={i} className={i === 0 ? 'bg-yellow-950/30' : ''}>
                  <td className="px-2 py-0 text-zinc-600">{e.step}</td>
                  <td className="px-2 py-0 text-zinc-400">{e.addr.toString(16).toUpperCase().padStart(5, '0')}</td>
                  <td className="px-2 py-0 text-zinc-500">{e.prevVal.toString(16).toUpperCase().padStart(2, '0')}</td>
                  <td className="px-2 py-0 text-zinc-200">{e.newVal.toString(16).toUpperCase().padStart(2, '0')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )
      }
    </div>
  );

  if (!standalone) return table;

  return (
    <div className="flex flex-col h-full">
      <div className="px-2 py-1 text-xs font-semibold text-zinc-400 border-b border-zinc-800 bg-zinc-900 flex items-center justify-between flex-shrink-0">
        <span>Memory Write History</span>
        {onExpand && (
          <button onClick={onExpand} className="text-zinc-600 hover:text-zinc-300 rounded p-0.5 hover:bg-zinc-800" title="Expand">
            <Maximize2 size={11} />
          </button>
        )}
      </div>
      {table}
    </div>
  );
}
