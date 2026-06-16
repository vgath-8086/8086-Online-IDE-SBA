'use client';
import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Play, SkipBack, SkipForward, Square, RotateCcw, AlertCircle, FolderOpen,
  Minus, Plus, MoreVertical, Code2, Cpu,
} from 'lucide-react';

export type AppMode = 'edit' | 'idle' | 'running' | 'done';
export type MobileView = 'code' | 'debug';

interface Props {
  mode: AppMode;
  status: string;
  compileError: string | null;
  waiting: boolean;
  waitingForChar: boolean;
  onImport(): void;
  onCompile(): void;
  onStep(): void;
  onStepBack(): void;
  onRun(): void;
  onStop(): void;
  onReset(): void;
  stepCount: number;
  fontSize: number;
  onIncreaseFontSize(): void;
  onDecreaseFontSize(): void;
  vimMode: boolean;
  onToggleVimMode(): void;
  isMobile: boolean;
  mobileView: MobileView;
  onMobileViewChange(view: MobileView): void;
}

function useModeBadge(mode: AppMode, waiting: boolean, waitingForChar: boolean, stepCount: number) {
  if (waiting) {
    return (
      <Badge variant="outline" className="border-cyan-500 text-cyan-400 animate-pulse">
        {waitingForChar ? 'Press any key' : 'Type & Enter'}
      </Badge>
    );
  }
  if (mode === 'running') return <Badge variant="outline" className="border-yellow-500 text-yellow-400">Running</Badge>;
  if (mode === 'done') return <Badge variant="outline" className="border-green-500 text-green-400">Done</Badge>;
  if (mode === 'idle') return <Badge variant="outline" className="border-zinc-500 text-zinc-400">Step {stepCount}</Badge>;
  return null;
}

export function Toolbar(props: Props) {
  const {
    mode, status, compileError, waiting, waitingForChar,
    onImport, onCompile, onStep, onStepBack, onRun, onStop, onReset, stepCount,
    fontSize, onIncreaseFontSize, onDecreaseFontSize, vimMode, onToggleVimMode,
    isMobile, mobileView, onMobileViewChange,
  } = props;

  const canStep = mode === 'idle' && !waiting;
  const canStepBack = (mode === 'idle' || mode === 'done') && !waiting;
  const canRun = mode === 'idle' && !waiting;
  const canReset = mode !== 'edit';
  const modeBadge = useModeBadge(mode, waiting, waitingForChar, stepCount);

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [menuOpen]);

  if (isMobile) {
    return (
      <div className="flex flex-col border-b border-zinc-800 bg-zinc-900 flex-shrink-0">
        {/* Row 1: logo, view toggle, overflow menu */}
        <div className="flex items-center gap-2 h-12 px-2">
          <Link href="/" title="Back to homepage" className="flex items-center rounded hover:opacity-80 flex-shrink-0">
            <Image src="/logo.png" alt="" width={20} height={13} className="h-6 w-auto" />
          </Link>
          <div className="flex items-center gap-1 bg-zinc-800 rounded-lg p-0.5 mx-auto">
            <button
              onClick={() => onMobileViewChange('code')}
              className={`flex items-center gap-1.5 h-9 px-3 rounded-md text-sm font-medium ${mobileView === 'code' ? 'bg-zinc-700 text-zinc-100' : 'text-zinc-400'}`}
            >
              <Code2 className="h-4 w-4" /> Code
            </button>
            <button
              onClick={() => onMobileViewChange('debug')}
              className={`flex items-center gap-1.5 h-9 px-3 rounded-md text-sm font-medium ${mobileView === 'debug' ? 'bg-zinc-700 text-zinc-100' : 'text-zinc-400'}`}
            >
              <Cpu className="h-4 w-4" /> Debug
            </button>
          </div>
          <div ref={menuRef} className="relative flex-shrink-0">
            <button
              onClick={() => setMenuOpen(o => !o)}
              className="flex items-center justify-center h-11 w-11 rounded text-zinc-300 hover:bg-zinc-800"
              title="More"
            >
              <MoreVertical className="h-5 w-5" />
            </button>
            {menuOpen && (
              <div className="absolute top-full right-0 mt-1 w-56 bg-zinc-900 border border-zinc-700 rounded-md shadow-2xl z-50 py-1">
                <button
                  onClick={() => { onImport(); setMenuOpen(false); }}
                  disabled={mode === 'running'}
                  className="flex items-center gap-2 w-full px-3 py-2.5 text-sm text-zinc-200 hover:bg-zinc-800 disabled:opacity-40"
                >
                  <FolderOpen className="h-4 w-4" /> Examples
                </button>
                <div className="flex items-center justify-between px-3 py-2.5">
                  <span className="text-sm text-zinc-200">Font size</span>
                  <div className="flex items-center gap-1">
                    <button onClick={onDecreaseFontSize} className="h-8 w-8 flex items-center justify-center rounded text-zinc-300 hover:bg-zinc-800"><Minus className="h-4 w-4" /></button>
                    <span className="text-xs text-zinc-300 tabular-nums w-8 text-center">{fontSize}px</span>
                    <button onClick={onIncreaseFontSize} className="h-8 w-8 flex items-center justify-center rounded text-zinc-300 hover:bg-zinc-800"><Plus className="h-4 w-4" /></button>
                  </div>
                </div>
                <div className="flex items-center justify-between px-3 py-2.5">
                  <span className="text-sm text-zinc-200">Keybindings</span>
                  <div className="flex items-center gap-0.5 bg-zinc-800 rounded p-0.5">
                    <button onClick={() => vimMode && onToggleVimMode()} className={`h-7 px-2 rounded text-xs ${!vimMode ? 'bg-zinc-700 text-zinc-100' : 'text-zinc-400'}`}>Normal</button>
                    <button onClick={() => !vimMode && onToggleVimMode()} className={`h-7 px-2 rounded text-xs ${vimMode ? 'bg-zinc-700 text-zinc-100' : 'text-zinc-400'}`}>Vim</button>
                  </div>
                </div>
                <button
                  onClick={() => { onReset(); setMenuOpen(false); }}
                  disabled={!canReset}
                  className="flex items-center gap-2 w-full px-3 py-2.5 text-sm text-zinc-200 hover:bg-zinc-800 disabled:opacity-40"
                >
                  <RotateCcw className="h-4 w-4" /> Reset execution
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Row 2: execution controls */}
        <div className="flex items-center gap-1 h-12 px-2 border-t border-zinc-800 overflow-x-auto">
          <Button size="sm" variant="default" onClick={onCompile} disabled={mode === 'running'} className="h-10 px-4 flex-shrink-0">
            Compile
          </Button>
          <Button size="icon" variant="ghost" className="h-10 w-10 flex-shrink-0" onClick={onStepBack} disabled={!canStepBack} title="Step back">
            <SkipBack className="h-5 w-5" />
          </Button>
          <Button size="icon" variant="ghost" className="h-10 w-10 flex-shrink-0" onClick={onStep} disabled={!canStep} title="Single step">
            <SkipForward className="h-5 w-5" />
          </Button>
          {mode === 'running' ? (
            <Button size="icon" variant="ghost" className="h-10 w-10 flex-shrink-0" onClick={onStop} title="Stop">
              <Square className="h-5 w-5" />
            </Button>
          ) : (
            <Button size="icon" variant="ghost" className="h-10 w-10 flex-shrink-0" onClick={onRun} disabled={!canRun} title="Run">
              <Play className="h-5 w-5" />
            </Button>
          )}
          <div className="flex-shrink-0 ml-1">{modeBadge}</div>
        </div>

        {compileError && (
          <div className="flex items-center gap-1 px-3 py-1.5 border-t border-zinc-800 bg-red-950/30 text-red-400 text-xs">
            <AlertCircle className="h-3 w-3 flex-shrink-0" />
            <span className="truncate">{compileError}</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 h-12 px-3 border-b border-zinc-800 bg-zinc-900 flex-shrink-0">
      <Link href="/" title="Back to homepage" className="flex items-center gap-2 mr-1 rounded hover:opacity-80">
        <Image src="/logo.png" alt="" width={20} height={13} className="h-5 w-auto" />
        <span className="font-bold text-sm text-zinc-200">8086 Online IDE</span>
      </Link>
      <Separator orientation="vertical" className="h-6" />

      <Button size="sm" variant="outline" onClick={onImport} disabled={mode === 'running'} className="gap-1.5">
        <FolderOpen className="h-3.5 w-3.5" /> Examples
      </Button>
      <Button size="sm" variant="default" onClick={onCompile} disabled={mode === 'running'}>
        Compile
      </Button>

      <Separator orientation="vertical" className="h-6" />

      <Button
        size="icon"
        variant="ghost"
        className="h-8 w-8"
        onClick={onStepBack}
        disabled={!canStepBack}
        title="Step back"
      >
        <SkipBack className="h-4 w-4" />
      </Button>
      <Button
        size="icon"
        variant="ghost"
        className="h-8 w-8"
        onClick={onStep}
        disabled={!canStep}
        title="Single step"
      >
        <SkipForward className="h-4 w-4" />
      </Button>
      <Button
        size="icon"
        variant="ghost"
        className="h-8 w-8"
        onClick={onRun}
        disabled={!canRun}
        title="Run"
      >
        <Play className="h-4 w-4" />
      </Button>
      <Button
        size="icon"
        variant="ghost"
        className="h-8 w-8"
        onClick={onStop}
        disabled={mode !== 'running'}
        title="Stop"
      >
        <Square className="h-4 w-4" />
      </Button>
      <Button
        size="icon"
        variant="ghost"
        className="h-8 w-8"
        onClick={onReset}
        disabled={!canReset}
        title="Reset"
      >
        <RotateCcw className="h-4 w-4" />
      </Button>

      <Separator orientation="vertical" className="h-6" />
      {modeBadge}

      <Separator orientation="vertical" className="h-6" />
      <div className="flex items-center gap-0.5" title="Editor font size">
        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7"
          onClick={onDecreaseFontSize}
          title="Decrease font size"
        >
          <Minus className="h-3 w-3" />
        </Button>
        <span className="text-xs text-zinc-300 tabular-nums w-9 text-center">{fontSize}px</span>
        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7"
          onClick={onIncreaseFontSize}
          title="Increase font size"
        >
          <Plus className="h-3 w-3" />
        </Button>
      </div>

      <Separator orientation="vertical" className="h-6" />
      <div className="flex items-center gap-0.5" title="Editor keybindings">
        <Button
          size="sm"
          variant={vimMode ? 'ghost' : 'secondary'}
          className="h-7 px-2 text-xs"
          onClick={() => vimMode && onToggleVimMode()}
        >
          Normal
        </Button>
        <Button
          size="sm"
          variant={vimMode ? 'secondary' : 'ghost'}
          className="h-7 px-2 text-xs"
          onClick={() => !vimMode && onToggleVimMode()}
        >
          Vim
        </Button>
      </div>

      <div className="flex-1 min-w-0 ml-2">
        {compileError ? (
          <span className="flex items-center gap-1 text-red-400 text-xs truncate">
            <AlertCircle className="h-3 w-3 flex-shrink-0" /> {compileError}
          </span>
        ) : (
          <span className="text-zinc-400 text-xs truncate">{status}</span>
        )}
      </div>
    </div>
  );
}
