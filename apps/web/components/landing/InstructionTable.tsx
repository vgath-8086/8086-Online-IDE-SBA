import type { InstructionGroup } from '@/lib/instructions';
import { Badge } from '@/components/ui/badge';

interface Props {
  groups: InstructionGroup[];
}

export function InstructionTable({ groups }: Props) {
  return (
    <section className="w-full max-w-5xl px-6 py-16">
      <div className="text-center mb-10">
        <span className="inline-block text-xs font-semibold uppercase tracking-wide text-brand-400 bg-brand-900/30 rounded-full px-3 py-1 mb-3">
          Instruction Set
        </span>
        <h2 className="text-2xl font-bold text-zinc-100">Every instruction below is fully emulated</h2>
      </div>
      <div className="space-y-5">
        {groups.map(g => (
          <div key={g.category} className="flex flex-col sm:flex-row sm:items-baseline gap-2 sm:gap-4">
            <div className="sm:w-40 flex-shrink-0 text-sm font-semibold text-zinc-300">{g.category}</div>
            <div className="flex flex-wrap gap-1.5">
              {g.instructions.map(i => (
                <Badge key={i} variant="outline" className="font-mono text-[11px] text-zinc-300 border-zinc-700">
                  {i}
                </Badge>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
