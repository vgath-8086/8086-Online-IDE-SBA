'use client';

import { useState, useCallback, useRef, type DragEvent } from 'react';
import { X, FolderOpen, ChevronRight } from 'lucide-react';
import { EXAMPLES, CATEGORIES, type AsmExample } from '@/lib/examples';

interface Props {
  onLoad(source: string): void;
  onClose(): void;
}

// ── Minimal ASM token colouring (no dep) ─────────────────────────────────────
const KEYWORDS = new Set([
  'mov','add','sub','mul','div','neg','inc','dec','cmp','and','or','xor','not',
  'test','shl','sal','shr','sar','rol','ror','rcl','rcr','push','pop','pushf',
  'popf','call','ret','jmp','loop','je','jne','jz','jnz','jl','jle','jg','jge',
  'jb','jbe','ja','jae','jc','jnc','jo','jno','js','jns','jp','jnp','xchg',
  'lea','movs','movsb','movsw','lods','lodsb','lodsw','stos','stosb','stosw',
  'cmps','cmpsb','cmpsw','scas','scasb','scasw','rep','repe','repne','repnz',
  'repz','clc','stc','cmc','cld','std','int','org','db','dw','dup','adc','sbb',
]);
const REGS = new Set([
  'ax','bx','cx','dx','si','di','bp','sp','ip','cs','ds','es','ss',
  'al','ah','bl','bh','cl','ch','dl','dh',
]);

function tokenise(line: string): Array<{ text: string; cls: string }> {
  const tokens: Array<{ text: string; cls: string }> = [];
  // comment
  const ci = line.indexOf(';');
  const code = ci >= 0 ? line.slice(0, ci) : line;
  const comment = ci >= 0 ? line.slice(ci) : '';

  const re = /([A-Za-z_]\w*|0[xX][0-9a-fA-F]+h?|[0-9][0-9a-fA-F]*h|[0-9]+b|[0-9]+|'[^']*'|[^\s\w]+|\s+)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(code)) !== null) {
    const t = m[0];
    const lo = t.toLowerCase();
    let cls = 'text-zinc-300';
    if (/^\s+$/.test(t)) cls = '';
    else if (KEYWORDS.has(lo)) cls = 'text-sky-400';
    else if (REGS.has(lo)) cls = 'text-emerald-400';
    else if (/^([0-9][0-9a-fA-F]*h|0[xX][0-9a-fA-F]+|[0-9]+b|[0-9]+)$/.test(t)) cls = 'text-amber-400';
    else if (t.startsWith("'")) cls = 'text-orange-400';
    else if (/^\w/.test(t) && code.includes(t + ':')) cls = 'text-violet-400'; // label def
    tokens.push({ text: t, cls });
  }
  if (comment) tokens.push({ text: comment, cls: 'text-zinc-500 italic' });
  return tokens;
}

function SourcePreview({ source }: { source: string }) {
  const lines = source.split('\n');
  return (
    <pre className="text-[11px] leading-5 font-mono p-3 overflow-auto h-full bg-zinc-950 select-text">
      {lines.map((line, i) => (
        <div key={i} className="flex">
          <span className="select-none text-zinc-700 w-7 text-right pr-2 flex-shrink-0">{i + 1}</span>
          <span>
            {tokenise(line).map((tok, j) =>
              tok.cls
                ? <span key={j} className={tok.cls}>{tok.text}</span>
                : tok.text
            )}
          </span>
        </div>
      ))}
    </pre>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export function ImportModal({ onLoad, onClose }: Props) {
  const [selectedCategory, setSelectedCategory] = useState<string>(CATEGORIES[0]);
  const [selectedExample, setSelectedExample] = useState<AsmExample | null>(null);
  const [fileSource, setFileSource] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const visibleExamples = EXAMPLES.filter(e => e.category === selectedCategory);
  const previewSource = fileSource ?? selectedExample?.source ?? null;
  const canLoad = previewSource !== null;

  const readFile = useCallback((file: File) => {
    if (!file.name.match(/\.(asm|s|txt)$/i)) return;
    const reader = new FileReader();
    reader.onload = e => {
      setFileSource(e.target?.result as string);
      setFileName(file.name);
      setSelectedExample(null);
    };
    reader.readAsText(file);
  }, []);

  const handleDrop = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) readFile(file);
  }, [readFile]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) readFile(file);
  }, [readFile]);

  const handleLoad = useCallback(() => {
    if (previewSource) { onLoad(previewSource); onClose(); }
  }, [previewSource, onLoad, onClose]);

  // Close on backdrop click
  const handleBackdrop = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4"
      onClick={handleBackdrop}
    >
      <div className="bg-zinc-900 border border-zinc-700 rounded-lg w-full max-w-5xl h-[85vh] flex flex-col shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 flex-shrink-0">
          <span className="font-semibold text-zinc-100">Load Program</span>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-100 rounded p-1 hover:bg-zinc-800">
            <X size={15} />
          </button>
        </div>

        {/* Body — three-column layout */}
        <div className="flex flex-1 min-h-0 overflow-hidden divide-x divide-zinc-800">

          {/* Col 1: Category sidebar */}
          <div className="w-44 flex-shrink-0 bg-zinc-950 overflow-y-auto py-2">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => { setSelectedCategory(cat); setSelectedExample(null); setFileSource(null); setFileName(null); }}
                className={[
                  'w-full text-left px-3 py-2 text-xs flex items-center justify-between gap-1 transition-colors',
                  selectedCategory === cat
                    ? 'bg-zinc-800 text-zinc-100'
                    : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200',
                ].join(' ')}
              >
                <span>{cat}</span>
                {selectedCategory === cat && <ChevronRight size={11} className="flex-shrink-0" />}
              </button>
            ))}
          </div>

          {/* Col 2: Example list */}
          <div className="w-56 flex-shrink-0 overflow-y-auto py-2 bg-zinc-900">
            {visibleExamples.map(ex => (
              <button
                key={ex.id}
                onClick={() => { setSelectedExample(ex); setFileSource(null); setFileName(null); }}
                className={[
                  'w-full text-left px-3 py-2.5 border-b border-zinc-800/50 transition-colors',
                  selectedExample?.id === ex.id && !fileSource
                    ? 'bg-zinc-700/60 text-zinc-100'
                    : 'text-zinc-300 hover:bg-zinc-800/60',
                ].join(' ')}
              >
                <div className="text-xs font-medium leading-tight">{ex.name}</div>
                <div className="text-[10px] text-zinc-500 mt-0.5 leading-tight line-clamp-2">{ex.description}</div>
              </button>
            ))}
          </div>

          {/* Col 3: Preview + file import */}
          <div className="flex-1 min-w-0 flex flex-col overflow-hidden">

            {/* Source preview */}
            <div className="flex-1 min-h-0 overflow-hidden">
              {previewSource
                ? <SourcePreview source={previewSource} />
                : (
                  <div className="h-full flex items-center justify-center text-zinc-600 text-sm">
                    Select an example to preview its source
                  </div>
                )
              }
            </div>

            {/* File import zone */}
            <div className="flex-shrink-0 border-t border-zinc-800 p-3">
              <p className="text-[10px] text-zinc-500 mb-2 uppercase tracking-wide">Or import a local file</p>
              <div
                onDragOver={e => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={[
                  'flex items-center gap-2 px-3 py-2.5 rounded border border-dashed cursor-pointer transition-colors',
                  dragging
                    ? 'border-blue-500 bg-blue-900/20 text-blue-300'
                    : fileName
                    ? 'border-green-700 bg-green-900/20 text-green-400'
                    : 'border-zinc-700 hover:border-zinc-500 text-zinc-500 hover:text-zinc-300',
                ].join(' ')}
              >
                <FolderOpen size={14} className="flex-shrink-0" />
                <span className="text-xs truncate">
                  {fileName ?? 'Drop a .asm file here, or click to browse'}
                </span>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".asm,.s,.txt"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-zinc-800 flex-shrink-0 bg-zinc-950">
          <span className="text-xs text-zinc-600">
            {selectedExample && !fileSource && `${selectedExample.category} — ${selectedExample.name}`}
            {fileSource && fileName && `Local file: ${fileName}`}
          </span>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 text-xs rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
            >
              Cancel
            </button>
            <button
              onClick={handleLoad}
              disabled={!canLoad}
              className="px-4 py-1.5 text-xs rounded bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-40 disabled:cursor-not-allowed font-medium"
            >
              Load →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
