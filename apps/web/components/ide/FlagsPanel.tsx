'use client';
import { useRef } from 'react';
import { Maximize2 } from 'lucide-react';

const FLAG_BITS: Array<{ name: string; bit: number; desc: string }> = [
  { name: 'OF', bit: 11, desc: 'Overflow'  },
  { name: 'DF', bit: 10, desc: 'Direction' },
  { name: 'IF', bit:  9, desc: 'Interrupt' },
  { name: 'TF', bit:  8, desc: 'Trap'      },
  { name: 'SF', bit:  7, desc: 'Sign'      },
  { name: 'ZF', bit:  6, desc: 'Zero'      },
  { name: 'AF', bit:  4, desc: 'Aux Carry' },
  { name: 'PF', bit:  2, desc: 'Parity'    },
  { name: 'CF', bit:  0, desc: 'Carry'     },
];

interface Props {
  flagsHex: string;
  expanded?: boolean;   // wider layout when shown in a modal
  onExpand?: () => void;
}

export function FlagsPanel({ flagsHex, expanded = false, onExpand }: Props) {
  const prevRef = useRef<number | null>(null);
  const val = parseInt(flagsHex, 16) || 0;
  const prev = prevRef.current ?? val;
  prevRef.current = val;

  return (
    <div className="border-b border-zinc-800 bg-zinc-900">
      <div className="px-2 py-1 text-xs font-semibold text-zinc-400 border-b border-zinc-800 flex items-center justify-between">
        <span>Flags</span>
        {onExpand && (
          <button onClick={onExpand} className="text-zinc-600 hover:text-zinc-300 rounded p-0.5 hover:bg-zinc-800" title="Expand">
            <Maximize2 size={11} />
          </button>
        )}
      </div>
      <div className={`flex flex-wrap gap-x-2 gap-y-1 px-2 py-2 ${expanded ? 'gap-x-6' : ''}`}>
        {FLAG_BITS.map(({ name, bit, desc }) => {
          const set = (val >> bit) & 1;
          const wasSet = (prev >> bit) & 1;
          const changed = set !== wasSet;
          return (
            <div key={name} className={`flex items-center gap-1 ${expanded ? 'flex-col items-center' : ''}`}>
              <span className={`font-mono text-[11px] tabular-nums rounded px-1 py-0.5 font-bold ${
                set
                  ? changed ? 'text-yellow-200 bg-yellow-800/60' : 'text-green-400 bg-green-900/30'
                  : changed ? 'text-yellow-700/70 bg-yellow-900/20' : 'text-zinc-600'
              }`}>
                {set ? '1' : '0'}
              </span>
              <span className="text-zinc-500 text-[10px]">{name}</span>
              {expanded && <span className="text-zinc-600 text-[9px]">{desc}</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
