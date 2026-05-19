'use client';
import { useMemo, useState, useCallback, useRef, useEffect } from 'react';
import { Maximize2 } from 'lucide-react';
import type { EmulatorController } from '@emu8086/emulator';

// Full 20-bit address space: 0x00000–0xFFFFF → 65 536 rows of 16 bytes
const TOTAL_ROWS = 0x10000;
const ROW_H = 18; // px — must stay fixed so scroll math works
const OVERSCAN = 4; // extra rows above and below the visible window

interface Props {
  controller: EmulatorController | null;
  regs: { ip: string; ipNum: number; cs: string };
  tick: number;
  onExpand?: () => void;
}

function parseAddr(raw: string): number | null {
  const s = raw.trim().replace(/^0x/i, '');
  if (!s) return null;
  const n = parseInt(s, 16);
  return isNaN(n) ? null : Math.max(0, Math.min(0xfffff, n));
}

export function RamPanel({ controller, regs, tick, onExpand }: Props) {
  const [search, setSearch] = useState('');
  const [followIP, setFollowIP] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerH, setContainerH] = useState(300);

  // Track container height so visible row count stays accurate after resize
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    setContainerH(el.clientHeight);
    const ro = new ResizeObserver(() => setContainerH(el.clientHeight));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Auto-scroll when following IP
  useEffect(() => {
    if (!followIP || !controller || !scrollRef.current) return;
    const cs = parseInt(regs.cs, 16);
    const ipPhys = (cs << 4) + regs.ipNum;
    const ipRow = Math.floor(ipPhys / 16);
    // Centre IP ~4 rows from the top
    const target = Math.max(0, (ipRow - 4) * ROW_H);
    scrollRef.current.scrollTop = target;
  // regs.ip is the hex string — use it so this runs whenever IP changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [followIP, controller, regs.ip, regs.cs]);

  const handleScroll = useCallback(() => {
    const top = scrollRef.current?.scrollTop ?? 0;
    setScrollTop(top);
    setFollowIP(false); // manual scroll breaks follow-mode
  }, []);

  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    const addr = parseAddr(search);
    if (addr === null) return;
    const row = Math.floor(addr / 16);
    if (scrollRef.current) scrollRef.current.scrollTop = Math.max(0, (row - 4) * ROW_H);
    setFollowIP(false);
  }, [search]);

  // Derive which rows are visible
  const startRow = Math.max(0, Math.floor(scrollTop / ROW_H) - OVERSCAN);
  const visibleCount = Math.ceil(containerH / ROW_H) + OVERSCAN * 2;

  const rows = useMemo(() => {
    if (!controller) return [];
    const cs = parseInt(regs.cs, 16);
    const ipPhys = (cs << 4) + regs.ipNum;
    const result = [];
    for (let i = 0; i < visibleCount; i++) {
      const row = startRow + i;
      if (row >= TOTAL_ROWS) break;
      const addr = row * 16;
      const bytes = Array.from({ length: 16 }, (_, j) =>
        controller.processor.RAM.readByte(addr + j).toString(16).padStart(2, '0').toUpperCase()
      );
      result.push({ row, addr, bytes, isIP: Math.abs(addr - ipPhys) < 16 });
    }
    return result;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [controller, startRow, visibleCount, regs.ip, regs.cs, tick]);

  if (!controller) return <div className="p-2 text-xs text-zinc-600">Compile to view RAM</div>;

  const searchedAddr = parseAddr(search);
  const viewStart = startRow * 16;
  const viewEnd = Math.min(0xfffff, (startRow + visibleCount) * 16);

  return (
    <div className="flex flex-col h-full">

      {/* ── Search toolbar ── */}
      <form
        onSubmit={handleSearch}
        className="flex items-center gap-1 px-2 py-1 border-b border-zinc-800 bg-zinc-900 flex-shrink-0"
      >
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Jump to address (hex)"
          className="flex-1 bg-zinc-800 text-zinc-200 text-xs font-mono px-2 py-0.5 rounded border border-zinc-700 focus:outline-none focus:border-zinc-500 placeholder-zinc-600"
        />
        <button
          type="submit"
          disabled={search !== '' && searchedAddr === null}
          className="text-xs px-2 py-0.5 bg-zinc-700 hover:bg-zinc-600 text-zinc-200 rounded disabled:opacity-40"
        >
          Go
        </button>
        {!followIP && (
          <button
            type="button"
            onClick={() => setFollowIP(true)}
            className="text-xs px-2 py-0.5 bg-blue-900/50 hover:bg-blue-800/60 text-blue-400 rounded border border-blue-800 whitespace-nowrap"
          >
            Follow IP
          </button>
        )}
        {onExpand && (
          <button
            type="button"
            onClick={onExpand}
            className="text-zinc-600 hover:text-zinc-300 rounded p-0.5 hover:bg-zinc-700"
            title="Expand"
          >
            <Maximize2 size={13} />
          </button>
        )}
      </form>

      {/* ── Fixed column headers ── */}
      <div className="flex-shrink-0 bg-zinc-900 border-b border-zinc-800">
        <table className="w-full text-xs font-mono">
          <thead>
            <tr>
              <th className="text-left px-2 py-0.5 text-zinc-500 font-normal w-16">Addr</th>
              {Array.from({ length: 16 }, (_, i) => (
                <th key={i} className="px-1 text-zinc-600 font-normal w-6">
                  {i.toString(16).toUpperCase()}
                </th>
              ))}
            </tr>
          </thead>
        </table>
      </div>

      {/* ── Virtual scroll viewport ── */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-scroll overflow-x-auto relative min-h-0"
        onScroll={handleScroll}
      >
        {/* Phantom spacer gives the scrollbar its full range */}
        <div style={{ height: TOTAL_ROWS * ROW_H }} aria-hidden="true" />

        {/* Rendered rows, translated to their logical Y position */}
        <div
          className="absolute inset-x-0 top-0"
          style={{ transform: `translateY(${startRow * ROW_H}px)` }}
        >
          <table className="w-full text-xs font-mono border-collapse">
            <tbody>
              {rows.map(row => (
                <tr
                  key={row.row}
                  style={{ height: ROW_H }}
                  className={row.isIP && followIP ? 'bg-yellow-950/40' : ''}
                >
                  <td className="px-2 text-zinc-500 whitespace-nowrap w-16">
                    {row.addr.toString(16).toUpperCase().padStart(5, '0')}
                  </td>
                  {row.bytes.map((b, i) => (
                    <td key={i} className="px-1 text-zinc-300 w-6">{b}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Address range indicator ── */}
      <div className="flex-shrink-0 px-2 py-0.5 text-[10px] font-mono text-zinc-600 border-t border-zinc-800 bg-zinc-900">
        <span>{viewStart.toString(16).toUpperCase().padStart(5, '0')}</span>
        <span className="mx-1">–</span>
        <span>{viewEnd.toString(16).toUpperCase().padStart(5, '0')}</span>
        {followIP && <span className="ml-3 text-blue-500/70">following IP</span>}
      </div>
    </div>
  );
}
