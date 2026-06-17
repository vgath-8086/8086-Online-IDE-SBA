'use client';
import { Maximize2 } from 'lucide-react';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

interface FlagBit {
  name: string;
  bit: number;
  desc: string;
  fullName: string;
  whenSet: string;
  whenClear: string;
}

const FLAG_BITS: FlagBit[] = [
  { name: 'OF', bit: 11, desc: 'Overflow', fullName: 'Overflow Flag',
    whenSet: "The last signed operation produced a result that didn't fit in the destination.",
    whenClear: 'The last signed operation fit cleanly — no overflow.' },
  { name: 'DF', bit: 10, desc: 'Direction', fullName: 'Direction Flag',
    whenSet: 'String instructions (MOVSB, LODSB...) decrement SI/DI, processing backward.',
    whenClear: 'String instructions increment SI/DI, processing forward.' },
  { name: 'IF', bit:  9, desc: 'Interrupt', fullName: 'Interrupt Flag',
    whenSet: 'Maskable hardware interrupts are enabled.',
    whenClear: 'Maskable hardware interrupts are disabled (blocked).' },
  { name: 'TF', bit:  8, desc: 'Trap', fullName: 'Trap Flag',
    whenSet: 'Single-step mode — the CPU raises a debug interrupt after every instruction.',
    whenClear: 'Normal execution, no single-step trapping.' },
  { name: 'SF', bit:  7, desc: 'Sign', fullName: 'Sign Flag',
    whenSet: "The result's most significant bit is 1 — negative if interpreted as signed.",
    whenClear: "The result's most significant bit is 0 — non-negative if interpreted as signed." },
  { name: 'ZF', bit:  6, desc: 'Zero', fullName: 'Zero Flag',
    whenSet: 'The result of the last operation was exactly zero.',
    whenClear: 'The result of the last operation was non-zero.' },
  { name: 'AF', bit:  4, desc: 'Aux Carry', fullName: 'Auxiliary Carry Flag',
    whenSet: 'There was a carry/borrow out of bit 3 (the low nibble) — used by BCD instructions.',
    whenClear: 'No carry/borrow out of the low nibble.' },
  { name: 'PF', bit:  2, desc: 'Parity', fullName: 'Parity Flag',
    whenSet: 'The low byte of the result has an even number of 1 bits.',
    whenClear: 'The low byte of the result has an odd number of 1 bits.' },
  { name: 'CF', bit:  0, desc: 'Carry', fullName: 'Carry Flag',
    whenSet: 'The operation produced a carry out of (or borrow into) the most significant bit.',
    whenClear: 'No carry or borrow occurred.' },
];

interface Props {
  flagsHex: string;
  prevFlagsHex?: string;
  expanded?: boolean;
  onExpand?: () => void;
}

function FlagCardExpanded({ flag, set, changed }: { flag: FlagBit; set: boolean; changed: boolean }) {
  return (
    <div
      className={`rounded-lg p-3 border transition-colors bg-zinc-900/40 ${
        changed ? 'border-amber-500/50 shadow-[0_0_15px_-5px_rgba(245,158,11,0.2)]' : 'border-zinc-800'
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-bold text-zinc-400">{flag.name}</span>
        <span className={`font-mono text-lg tabular-nums px-3 rounded-md transition-colors ${
          set
            ? changed ? 'bg-amber-500 text-zinc-950 font-bold' : 'text-green-400 bg-green-950/50 border border-green-900/30'
            : changed ? 'bg-amber-500 text-zinc-950 font-bold' : 'text-zinc-500 bg-zinc-800/50'
        }`}>
          {set ? '1' : '0'}
        </span>
      </div>
      <div className="text-xs font-semibold text-zinc-200 mb-1">{flag.fullName}</div>
      <div className="text-[11px] text-zinc-400 leading-snug mb-2 line-clamp-2 h-8">{set ? flag.whenSet : flag.whenClear}</div>
      <div className="text-[10px] text-zinc-500 italic border-t border-zinc-800/50 pt-2">
        {set ? `Clear: ${flag.whenClear}` : `Set: ${flag.whenSet}`}
      </div>
    </div>
  );
}

export function FlagsPanel({ flagsHex, prevFlagsHex, expanded = false, onExpand }: Props) {
  const val = parseInt(flagsHex, 16) || 0;
  const prevVal = prevFlagsHex !== undefined ? (parseInt(prevFlagsHex, 16) || 0) : val;

  if (expanded) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 bg-zinc-950">
        {FLAG_BITS.map(flag => {
          const set = !!((val >> flag.bit) & 1);
          const wasSet = !!((prevVal >> flag.bit) & 1);
          return <FlagCardExpanded key={flag.name} flag={flag} set={set} changed={prevFlagsHex !== undefined && set !== wasSet} />;
        })}
      </div>
    );
  }

  return (
    <div className="border-b border-zinc-800 bg-zinc-900">
      <div className="px-2 py-1 text-xs font-semibold text-zinc-400 border-b border-zinc-800 flex items-center justify-between">
        <span>Flags</span>
        {onExpand && (
          <button onClick={onExpand} className="text-zinc-400 hover:text-zinc-100 rounded p-0.5 hover:bg-zinc-800" title="Expand">
            <Maximize2 size={11} />
          </button>
        )}
      </div>
      <div className="flex flex-wrap gap-1.5 px-2 py-2">
        {FLAG_BITS.map((flag) => {
          const { name, bit, desc, whenSet, whenClear } = flag;
          const set = (val >> bit) & 1;
          const wasSet = (prevVal >> bit) & 1;
          const changed = prevFlagsHex !== undefined && set !== wasSet;
          return (
            <Tooltip key={name}>
              <TooltipTrigger
                className={`flex items-center gap-1.5 rounded-md px-1.5 py-1 cursor-default transition-colors ${
                  changed ? 'bg-yellow-400 text-zinc-950' : 'bg-zinc-800/60'
                }`}
              >
                <span className={`font-mono text-xs tabular-nums rounded px-1.5 py-0.5 font-bold transition-colors ${
                  set
                    ? changed ? 'text-zinc-900 bg-yellow-200' : 'text-green-400 bg-green-950/50 border border-green-900/30'
                    : changed ? 'text-zinc-900 bg-yellow-500' : 'text-zinc-500 bg-zinc-800/50'
                }`}>
                  {set ? '1' : '0'}
                </span>
                <span className={`text-[11px] font-medium transition-colors ${changed ? 'text-zinc-900 font-bold' : 'text-zinc-300'}`}>{name}</span>
              </TooltipTrigger>
              <TooltipContent>{name} ({desc}) — {set ? whenSet : whenClear}</TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </div>
  );
}
