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

type StackEntry = { address: string; value: number; isSP: boolean };
type EntryRow = StackEntry & { offset: number };
type Row = EntryRow | { note: true; count: number };

const MIN_COLLAPSE_RUN = 3;
const UNUSED_PREVIEW = 10;

function offsetLabel(offset: number): string {
  if (offset === 0) return 'SP';
  return offset > 0 ? `SP+${offset}` : `SP${offset}`;
}

/**
 * Shows a preview of untouched (zero, non-SP) stack bytes rather than dumping
 * hundreds of identical rows — but keeps the rest in the list (just noted),
 * so scrolling still reaches every fetched byte instead of hiding them.
 */
function buildRows(entries: StackEntry[]): Row[] {
  const spIndex = entries.findIndex(e => e.isSP);
  const spOffset = spIndex >= 0 ? parseInt(entries[spIndex].address.split(':')[1], 16) : 0;
  const toRow = (e: StackEntry): EntryRow => ({ ...e, offset: parseInt(e.address.split(':')[1], 16) - spOffset });

  const rows: Row[] = [];
  let i = 0;
  while (i < entries.length) {
    const e = entries[i];
    if (e.value === 0 && !e.isSP) {
      let j = i;
      while (j < entries.length && entries[j].value === 0 && !entries[j].isSP) j++;
      const runLength = j - i;
      if (runLength >= MIN_COLLAPSE_RUN) {
        const previewEnd = Math.min(i + UNUSED_PREVIEW, j);
        for (let k = i; k < previewEnd; k++) rows.push(toRow(entries[k]));
        if (j > previewEnd) {
          rows.push({ note: true, count: j - previewEnd });
          for (let k = previewEnd; k < j; k++) rows.push(toRow(entries[k]));
        }
        i = j;
        continue;
      }
    }
    rows.push(toRow(e));
    i++;
  }
  return rows;
}

export function StackPanel({ controller, tick, standalone = false, onExpand }: Props) {
  const rows = useMemo(() => {
    if (!controller) return [];
    return buildRows(controller.getStackEntries(512));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [controller, tick]);

  const table = (
    <div className="overflow-auto h-full">
      {!controller
        ? <div className="p-2 text-sm text-zinc-400">Compile to view stack</div>
        : (
          <table className="w-full text-sm font-mono">
            <thead className="sticky top-0 bg-zinc-900">
              <tr>
                <th className="text-left px-2 py-0.5 text-zinc-400 font-normal">Offset</th>
                <th className="text-left px-2 py-0.5 text-zinc-400 font-normal">Address</th>
                <th className="text-left px-2 py-0.5 text-zinc-400 font-normal">Value</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) =>
                'note' in row ? (
                  <tr key={i}>
                    <td colSpan={3} className="px-2 py-1 text-center text-zinc-400 text-[11px] italic border-y border-dashed border-zinc-800">
                      ↓ {row.count} more unused bytes below — scroll to see them ↓
                    </td>
                  </tr>
                ) : (
                  <tr key={i} className={row.isSP ? 'bg-yellow-950/40' : ''}>
                    <td className={`px-2 py-0 ${row.isSP ? 'text-yellow-300 font-semibold' : 'text-zinc-400'}`}>{offsetLabel(row.offset)}</td>
                    <td className="px-2 py-0 text-zinc-400">{row.address}</td>
                    <td className={`px-2 py-0 ${row.isSP ? 'text-yellow-300 font-semibold' : row.value === 0 ? 'text-zinc-400' : 'text-zinc-200'}`}>{row.value.toString(16).toUpperCase().padStart(2, '0')}</td>
                  </tr>
                )
              )}
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
          <button onClick={onExpand} className="text-zinc-400 hover:text-zinc-100 rounded p-0.5 hover:bg-zinc-800" title="Expand">
            <Maximize2 size={11} />
          </button>
        )}
      </div>
      {table}
    </div>
  );
}
