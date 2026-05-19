'use client';
import { useMemo } from 'react';
import { Maximize2 } from 'lucide-react';
import type { EmulatorController } from '@emu8086/emulator';

interface Props {
  controller: EmulatorController | null;
  tick: number;
  /** When true, renders as a standalone panel with its own header (used inside PanelModal) */
  standalone?: boolean;
  onExpand?: () => void;
}

export function StackPanel({ controller, tick, standalone = false, onExpand }: Props) {
  const entries = useMemo(() => {
    if (!controller) return [];
    return controller.getStackEntries(64);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [controller, tick]);

  const table = (
    <div className="overflow-auto h-full">
      {!controller
        ? <div className="p-2 text-xs text-zinc-600">Compile to view stack</div>
        : (
          <table className="w-full text-xs font-mono">
            <thead className="sticky top-0 bg-zinc-900">
              <tr>
                <th className="text-left px-2 py-0.5 text-zinc-500 font-normal">Address</th>
                <th className="text-left px-2 py-0.5 text-zinc-500 font-normal">Value</th>
                <th className="text-left px-2 py-0.5 text-zinc-500 font-normal"></th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e, i) => (
                <tr key={i} className={e.isSP ? 'bg-yellow-950/30' : ''}>
                  <td className="px-2 py-0 text-zinc-500">{e.address}</td>
                  <td className="px-2 py-0 text-zinc-300">{e.value.toString(16).toUpperCase().padStart(4, '0')}</td>
                  <td className="px-2 py-0 text-zinc-600 text-[10px]">{e.isSP ? '← SP' : ''}</td>
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
        <span>Stack</span>
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
