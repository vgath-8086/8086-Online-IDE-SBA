'use client';
import { useRef, useEffect, useCallback } from 'react';
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
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rendererRef = useRef<CanvasRenderer | null>(null);

  const redraw = useCallback(() => {
    const renderer = rendererRef.current;
    if (!renderer) return;
    renderer.clear();
    chars.forEach((ch, i) => renderer.renderChar(i, ch.char, ch.fg, ch.bg));
    if (waiting) renderer.updateCursor(chars.length);
  }, [chars, waiting]);

  // Always callable with the latest chars/waiting, even from the resize observer below
  // (which is only set up once and would otherwise close over stale props).
  const redrawRef = useRef(redraw);
  useEffect(() => { redrawRef.current = redraw; }, [redraw]);

  // Fit the canvas to its container, in actual CSS pixels, and redraw on every resize.
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;
    if (!rendererRef.current) rendererRef.current = new CanvasRenderer(canvas);
    const renderer = rendererRef.current;

    const handleResize = () => {
      renderer.resize(container.clientWidth, container.clientHeight);
      redrawRef.current();
    };
    handleResize();
    const ro = new ResizeObserver(handleResize);
    ro.observe(container);
    return () => ro.disconnect();
  }, []);

  // Redraw whenever the console content itself changes (no resize involved).
  useEffect(() => {
    redraw();
  }, [redraw]);

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
          <button onClick={onExpand} className="text-zinc-400 hover:text-zinc-100 rounded p-0.5 hover:bg-zinc-800/60" title="Expand">
            <Maximize2 size={11} />
          </button>
        )}
      </div>
      <div ref={containerRef} className="flex-1 min-h-0 w-full overflow-auto">
        <canvas ref={canvasRef} className="block" style={{ imageRendering: 'pixelated' }} />
      </div>
    </div>
  );
}
