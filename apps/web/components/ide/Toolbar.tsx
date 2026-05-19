'use client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Play, SkipBack, SkipForward, Square, RotateCcw, Cpu, AlertCircle, FolderOpen } from 'lucide-react';

type AppMode = 'edit' | 'idle' | 'running' | 'done';

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
}

export function Toolbar({
  mode, status, compileError, waiting, waitingForChar,
  onImport, onCompile, onStep, onStepBack, onRun, onStop, onReset, stepCount,
}: Props) {
  const canStep = mode === 'idle' && !waiting;
  const canStepBack = (mode === 'idle' || mode === 'done') && !waiting;
  const canRun = mode === 'idle' && !waiting;
  const canReset = mode !== 'edit';

  const modeBadge = waiting
    ? (
      <Badge variant="outline" className="border-cyan-500 text-cyan-400 animate-pulse">
        {waitingForChar ? 'Press any key' : 'Type & Enter'}
      </Badge>
    )
    : mode === 'running'
    ? <Badge variant="outline" className="border-yellow-500 text-yellow-400">Running</Badge>
    : mode === 'done'
    ? <Badge variant="outline" className="border-green-500 text-green-400">Done</Badge>
    : mode === 'idle'
    ? <Badge variant="outline" className="border-zinc-500 text-zinc-400">Step {stepCount}</Badge>
    : null;

  return (
    <div className="flex items-center gap-2 h-12 px-3 border-b border-zinc-800 bg-zinc-900 flex-shrink-0">
      <Cpu className="h-5 w-5 text-zinc-400" />
      <span className="font-bold text-sm text-zinc-200 mr-1">8086 IDE</span>
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

      <div className="flex-1 min-w-0 ml-2">
        {compileError ? (
          <span className="flex items-center gap-1 text-red-400 text-xs truncate">
            <AlertCircle className="h-3 w-3 flex-shrink-0" /> {compileError}
          </span>
        ) : (
          <span className="text-zinc-500 text-xs truncate">{status}</span>
        )}
      </div>
    </div>
  );
}
