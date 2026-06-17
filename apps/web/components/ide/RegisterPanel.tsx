'use client';
import { Maximize2 } from 'lucide-react';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

type Regs = {
  ax: string; bx: string; cx: string; dx: string;
  cs: string; ds: string; es: string; ss: string;
  sp: string; bp: string; si: string; di: string;
  ip: string; flags: string;
};

interface Props {
  regs: Regs;
  prev?: Regs;
  className?: string;
  expanded?: boolean;
  onExpand?: () => void;
}

const REGISTER_INFO: Record<string, { fullName: string; desc: string }> = {
  AX: { fullName: 'Accumulator', desc: 'Primary register for arithmetic and I/O. AL/AH are its low/high bytes.' },
  BX: { fullName: 'Base register', desc: 'General-purpose register, commonly used as a memory pointer.' },
  CX: { fullName: 'Count register', desc: 'Loop counter for LOOP, and repeat count for string instructions (REP).' },
  DX: { fullName: 'Data register', desc: 'I/O port addressing, and holds the high word of MUL/DIV results.' },
  CS: { fullName: 'Code Segment', desc: 'Segment containing the instruction currently being executed (paired with IP).' },
  DS: { fullName: 'Data Segment', desc: 'Default segment used for data access (most memory operands).' },
  ES: { fullName: 'Extra Segment', desc: 'Additional segment, frequently used as the destination for string operations.' },
  SS: { fullName: 'Stack Segment', desc: 'Segment containing the call stack (paired with SP).' },
  SP: { fullName: 'Stack Pointer', desc: 'Offset to the current top of the stack within SS. Decreases on PUSH/CALL.' },
  BP: { fullName: 'Base Pointer', desc: 'Typically anchors a stack frame to reference function args and locals.' },
  SI: { fullName: 'Source Index', desc: 'Source pointer for string/array operations (e.g. MOVSB, LODSB).' },
  DI: { fullName: 'Destination Index', desc: 'Destination pointer for string/array operations (e.g. MOVSB, STOSB).' },
  IP: { fullName: 'Instruction Pointer', desc: 'Offset of the next instruction to execute within CS. Not directly writable.' },
  FL: { fullName: 'Flags', desc: 'Packed status bits (CF, ZF, SF, OF...) set by arithmetic and logic operations.' },
};

function toSigned16(n: number): number {
  return n >= 0x8000 ? n - 0x10000 : n;
}

function RegCell({ label, value, prev }: { label: string; value: string; prev?: string }) {
  const changed = prev !== undefined && value !== prev;
  return (
    <Tooltip>
      <TooltipTrigger
        className={`flex items-center gap-1.5 px-2 py-1 m-0.5 rounded-md cursor-default transition-colors ${
          changed ? 'bg-yellow-400 text-zinc-950 font-bold' : 'bg-zinc-800/60 text-zinc-100'
        }`}
      >
        <span className={`text-sm font-medium w-5 text-right ${changed ? 'text-zinc-800' : 'text-zinc-400'}`}>{label}</span>
        <span className="font-mono text-sm tabular-nums">
          {value}
        </span>
      </TooltipTrigger>
      <TooltipContent>{REGISTER_INFO[label]?.desc}</TooltipContent>
    </Tooltip>
  );
}

function RegCardExpanded({ label, value, prev }: { label: string; value: string; prev?: string }) {
  const changed = prev !== undefined && value !== prev;
  const info = REGISTER_INFO[label];
  const num = parseInt(value, 16) || 0;
  return (
    <div
      className={`rounded-lg p-3 border transition-colors bg-zinc-900/40 ${
        changed ? 'border-amber-500/50 shadow-[0_0_15px_-5px_rgba(245,158,11,0.2)]' : 'border-zinc-800'
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-bold text-zinc-400">{label}</span>
        <span className={`font-mono text-lg tabular-nums px-2 rounded-md transition-colors ${
          changed ? 'bg-amber-500 text-zinc-950 font-bold' : 'text-zinc-100 bg-zinc-800/50'
        }`}>
          {value}h
        </span>
      </div>
      <div className="text-xs font-semibold text-zinc-200 mb-1">{info?.fullName}</div>
      <div className="text-[11px] text-zinc-400 leading-snug mb-3 line-clamp-2 h-8">{info?.desc}</div>
      <div className="flex gap-4 text-[11px] font-mono text-zinc-500 border-t border-zinc-800/50 pt-2">
        <span className="flex items-baseline gap-1">
          <span className="text-[9px] uppercase tracking-wider opacity-60 font-sans">dec</span>
          <span className="text-zinc-300">{num}</span>
        </span>
        <span className="flex items-baseline gap-1">
          <span className="text-[9px] uppercase tracking-wider opacity-60 font-sans">signed</span>
          <span className="text-zinc-300">{toSigned16(num)}</span>
        </span>
      </div>
    </div>
  );
}

export function RegisterPanel({ regs, prev, className = '', expanded = false, onExpand }: Props) {
  const pairs: [string, keyof Regs][] = [
    ['AX', 'ax'], ['BX', 'bx'], ['CX', 'cx'], ['DX', 'dx'],
    ['CS', 'cs'], ['DS', 'ds'], ['ES', 'es'], ['SS', 'ss'],
    ['SP', 'sp'], ['BP', 'bp'], ['SI', 'si'], ['DI', 'di'],
    ['IP', 'ip'], ['FL', 'flags'],
  ];

  if (expanded) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 bg-zinc-950">
        {pairs.map(([label, key]) => (
          <RegCardExpanded key={label} label={label} value={regs[key]} prev={prev?.[key]} />
        ))}
      </div>
    );
  }

  return (
    <div className={`border-b border-zinc-800 bg-zinc-900 ${className}`}>
      <div className="px-2 py-1 text-xs font-semibold text-zinc-400 border-b border-zinc-800 flex items-center justify-between">
        <span>Registers</span>
        {onExpand && (
          <button onClick={onExpand} className="text-zinc-400 hover:text-zinc-100 rounded p-0.5 hover:bg-zinc-800" title="Expand">
            <Maximize2 size={11} />
          </button>
        )}
      </div>
      <div className="grid grid-cols-4 p-0.5">
        {pairs.map(([label, key]) => (
          <RegCell key={label} label={label} value={regs[key]} prev={prev?.[key]} />
        ))}
      </div>
    </div>
  );
}
