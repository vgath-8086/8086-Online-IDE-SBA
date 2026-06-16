'use client';
import { useRef } from 'react';
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
  expanded?: boolean;   // wider layout when shown in a modal
  onExpand?: () => void;
}

function FlagCardExpanded({ flag, set, changed }: { flag: FlagBit; set: boolean; changed: boolean }) {
  return (
    <div className={`rounded-lg p-3 ${changed ? 'bg-yellow-950/30 border border-yellow-900/50' : 'bg-zinc-800/60 border border-zinc-800'}`}>
      <div className="flex items-baseline justify-between mb-1">
        <span className="text-sm font-bold text-zinc-200">{flag.name}</span>
        <span className={`font-mono text-lg tabular-nums rounded px-2 font-bold ${
          set
            ? changed ? 'text-yellow-200 bg-yellow-800/60' : 'text-green-400 bg-green-900/40'
            : changed ? 'text-yellow-500 bg-yellow-900/30' : 'text-zinc-400 bg-zinc-700/50'
        }`}>
          {set ? '1' : '0'}
        </span>
      </div>
      <div className="text-xs font-medium text-zinc-300 mb-2">{flag.fullName}</div>
      <div className="text-[11px] text-zinc-200 leading-snug mb-2">{set ? flag.whenSet : flag.whenClear}</div>
      <div className="text-[10px] text-zinc-500 leading-snug">
        {set ? `If 0: ${flag.whenClear}` : `If 1: ${flag.whenSet}`}
      </div>
    </div>
  );
}

export function FlagsPanel({ flagsHex, expanded = false, onExpand }: Props) {
  const prevRef = useRef<number | null>(null);
  const val = parseInt(flagsHex, 16) || 0;
  const prev = prevRef.current ?? val;
  prevRef.current = val;

  if (expanded) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-3">
        {FLAG_BITS.map(flag => {
          const set = !!((val >> flag.bit) & 1);
          const wasSet = !!((prev >> flag.bit) & 1);
          return <FlagCardExpanded key={flag.name} flag={flag} set={set} changed={set !== wasSet} />;
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
        {FLAG_BITS.map(({ name, bit, desc, whenSet, whenClear }) => {
          const set = (val >> bit) & 1;
          const wasSet = (prev >> bit) & 1;
          const changed = set !== wasSet;
          return (
            <Tooltip key={name}>
              <TooltipTrigger
                render={
                  <div className={`flex items-center gap-1.5 rounded-md px-1.5 py-1 cursor-default ${changed ? 'bg-yellow-950/40' : 'bg-zinc-800/60'}`} />
                }
              >
                <span className={`font-mono text-xs tabular-nums rounded px-1.5 py-0.5 font-bold ${
                  set
                    ? changed ? 'text-yellow-200 bg-yellow-800/60' : 'text-green-400 bg-green-900/40'
                    : changed ? 'text-yellow-500 bg-yellow-900/30' : 'text-zinc-400 bg-zinc-700/50'
                }`}>
                  {set ? '1' : '0'}
                </span>
                <span className="text-zinc-300 text-[11px] font-medium">{name}</span>
              </TooltipTrigger>
              <TooltipContent>{name} ({desc}) — {set ? whenSet : whenClear}</TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </div>
  );
}
