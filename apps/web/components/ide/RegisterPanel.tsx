'use client';
import { useRef } from 'react';
import { Maximize2 } from 'lucide-react';

type Regs = {
  ax: string; bx: string; cx: string; dx: string;
  cs: string; ds: string; es: string; ss: string;
  sp: string; bp: string; si: string; di: string;
  ip: string; flags: string;
};

interface Props {
  regs: Regs;
  className?: string;
  onExpand?: () => void;
}

function RegCell({ label, value, prev }: { label: string; value: string; prev: string }) {
  const changed = value !== prev && prev !== '';
  return (
    <div className="flex items-center gap-1 px-2 py-0.5">
      <span className="text-zinc-500 text-xs w-5 text-right">{label}</span>
      <span className={`font-mono text-xs tabular-nums ${changed ? 'text-yellow-400' : 'text-zinc-200'}`}>
        {value}
      </span>
    </div>
  );
}

export function RegisterPanel({ regs, className = '', onExpand }: Props) {
  const prevRef = useRef<Regs | null>(null);
  const prev = prevRef.current ?? regs;
  prevRef.current = regs;

  const pairs: [string, keyof Regs][] = [
    ['AX', 'ax'], ['BX', 'bx'], ['CX', 'cx'], ['DX', 'dx'],
    ['CS', 'cs'], ['DS', 'ds'], ['ES', 'es'], ['SS', 'ss'],
    ['SP', 'sp'], ['BP', 'bp'], ['SI', 'si'], ['DI', 'di'],
    ['IP', 'ip'], ['FL', 'flags'],
  ];

  return (
    <div className={`border-b border-zinc-800 bg-zinc-900 ${className}`}>
      <div className="px-2 py-1 text-xs font-semibold text-zinc-400 border-b border-zinc-800 flex items-center justify-between">
        <span>Registers</span>
        {onExpand && (
          <button onClick={onExpand} className="text-zinc-600 hover:text-zinc-300 rounded p-0.5 hover:bg-zinc-800" title="Expand">
            <Maximize2 size={11} />
          </button>
        )}
      </div>
      <div className="grid grid-cols-4 py-0.5">
        {pairs.map(([label, key]) => (
          <RegCell key={label} label={label} value={regs[key]} prev={prev[key]} />
        ))}
      </div>
    </div>
  );
}
