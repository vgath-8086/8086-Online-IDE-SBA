'use client';
import { useRef, useEffect } from 'react';
import { CanvasRenderer } from '@/lib/canvas-renderer';
import { Maximize2 } from 'lucide-react';

interface Props {
  chars: Array<{ char: string; fg: number; bg: number }>;
  waiting: boolean;
  waitingForChar: boolean;
  className?: string;
  onExpand?: () => void;
}

export function ConsolePanel({ chars, waiting, waitingForChar, className = '', onExpand }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rendererRef = useRef<CanvasRenderer | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    if (!rendererRef.current) {
      rendererRef.current = new CanvasRenderer(canvasRef.current);
    }
    const renderer = rendererRef.current;
    renderer.clear();
    chars.forEach((ch, i) => renderer.renderChar(i, ch.char, ch.fg, ch.bg));
    if (waiting) renderer.updateCursor(chars.length);
  }, [chars, waiting]);

  return (
    <div className={`flex flex-col border-b border-zinc-800 bg-black min-h-0 ${className}`}>
      <div
        className={`px-2 py-1 text-xs font-semibold border-b flex items-center justify-between flex-shrink-0
          ${waiting ? 'border-cyan-800 text-cyan-400 bg-cyan-950/30' : 'border-zinc-800 text-zinc-400 bg-zinc-900'}`}
      >
        <span className="flex items-center gap-2">
          Console
          {waiting && (
            <span className="animate-pulse text-cyan-300 text-xs">
              {waitingForChar ? '— press any key' : '— type & press Enter'}
            </span>
          )}
        </span>
        {onExpand && (
          <button onClick={onExpand} className="text-zinc-600 hover:text-zinc-300 rounded p-0.5 hover:bg-zinc-800/60" title="Expand">
            <Maximize2 size={11} />
          </button>
        )}
      </div>
      <canvas
        ref={canvasRef}
        width={500}
        height={200}
        className="flex-1 min-h-0 w-full"
        style={{ imageRendering: 'pixelated' }}
      />
    </div>
  );
}
