import { Code, Footprints, Cpu, Database, History, Terminal, FolderOpen, type LucideIcon } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

interface Feature {
  icon: LucideIcon;
  heading: string;
  bullets: string[];
}

function buildFeatures(exampleCount: number, categoryCount: number): Feature[] {
  return [
    {
      icon: Code,
      heading: 'Write & Debug Assembly',
      bullets: [
        'Syntax highlighting for every 8086 mnemonic',
        'Click the gutter to set breakpoints',
        'Live highlight on the executing line',
        'Step backward to undo execution',
        'Optional Vim keybindings, adjustable font size',
      ],
    },
    {
      icon: Footprints,
      heading: 'Step Through Execution',
      bullets: [
        'Step forward one instruction at a time',
        'Step backward to rewind state',
        'Run to a breakpoint or program end',
        'Live step counter in the toolbar',
      ],
    },
    {
      icon: Cpu,
      heading: 'See Every Register Update',
      bullets: [
        'All 14 registers updated in real time',
        'Changed values flash so you never miss a step',
        '9 individual status flag bits (CF, ZF, SF, OF...)',
        'Expand any panel to a full-screen view',
      ],
    },
    {
      icon: Database,
      heading: 'Browse the Full 1MB Address Space',
      bullets: [
        'Virtualized scroll across all 65,536 rows',
        'Jump straight to any hex address',
        'Auto-follow the instruction pointer',
        '16 bytes per row, just like a real debugger',
      ],
    },
    {
      icon: History,
      heading: 'Replay Every Memory Write',
      bullets: [
        'Step-by-step log of every byte written',
        'Old value next to new value, side by side',
        'Live stack viewer with the SP pointer marked',
        'Spot bugs by watching exactly what changed',
      ],
    },
    {
      icon: Terminal,
      heading: 'DOS-Style Text I/O',
      bullets: [
        'INT 21h character and string output',
        'INT 10h video service support',
        'Execution pauses for live keyboard input',
        'Rendered on a real pixel canvas, not a div',
      ],
    },
    {
      icon: FolderOpen,
      heading: `${exampleCount} Programs, ${categoryCount} Categories`,
      bullets: [
        'From single MOV demos to full algorithms',
        'Bubble sort, Fibonacci, string length, and more',
        'Drag and drop your own .asm file instead',
        'Colorized preview before you load anything',
      ],
    },
  ];
}

interface Props {
  exampleCount: number;
  categoryCount: number;
}

export function FeatureGrid({ exampleCount, categoryCount }: Props) {
  const features = buildFeatures(exampleCount, categoryCount);
  return (
    <section className="w-full max-w-5xl px-6 py-16">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {features.map(f => (
          <Card key={f.heading}>
            <CardHeader>
              <f.icon className="h-5 w-5 text-brand-400 mb-1" />
              <CardTitle className="text-zinc-100">{f.heading}</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1.5">
                {f.bullets.map(b => (
                  <li key={b} className="flex items-start gap-2 text-sm text-zinc-400">
                    <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-brand-400 flex-shrink-0" />
                    {b}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
