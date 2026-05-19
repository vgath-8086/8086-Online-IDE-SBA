'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { createCompiler } from '@emu8086/compiler';
import type { CompilerResult } from '@emu8086/compiler';
import { EmulatorController, ExecutionStopReason } from '@emu8086/emulator';
import type { LoadableProgram } from '@emu8086/emulator';
import { useEmulatorLoop, useRegisters, useConsoleOutput, useSourceHighlight } from '@emu8086/react';
import { DomKeyProvider } from '@/lib/dom-key-provider';
import { EditorPane } from '@/components/ide/EditorPane';
import { RegisterPanel } from '@/components/ide/RegisterPanel';
import { FlagsPanel } from '@/components/ide/FlagsPanel';
import { ConsolePanel } from '@/components/ide/ConsolePanel';
import { RamPanel } from '@/components/ide/RamPanel';
import { StackPanel } from '@/components/ide/StackPanel';
import { MemoryHistoryPanel } from '@/components/ide/MemoryHistoryPanel';
import { PanelModal } from '@/components/ide/PanelModal';
import { ImportModal } from '@/components/ide/ImportModal';
import { Toolbar } from '@/components/ide/Toolbar';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { EditorView } from '@codemirror/view';

type FinalViewLine = NonNullable<CompilerResult['finalView']>[number];
type AppMode = 'edit' | 'idle' | 'running' | 'done';
type ExpandedPanel = 'registers' | 'flags' | 'console' | 'ram' | 'stack' | 'history' | null;

/** Build lineIdx → instructionAddr map from the compiler's finalView. */
function buildLineToAddrMap(finalView: FinalViewLine[]): Map<number, number> {
  const map = new Map<number, number>();
  for (const line of finalView) {
    if (line.executableLine && line.lexicalLine?.index != null) {
      map.set(line.lexicalLine.index, line.instructionAddr);
    }
  }
  return map;
}

const DEFAULT_SOURCE = `org 100h

mov ax, 0005h
mov bx, 0003h
add ax, bx

ret`;

export default function IdePage() {
  const [source, setSource] = useState(DEFAULT_SOURCE);
  const [mode, setMode] = useState<AppMode>('edit');
  const [status, setStatus] = useState('Write your program and press Compile');
  const [compileError, setCompileError] = useState<string | null>(null);
  const [finalView, setFinalView] = useState<FinalViewLine[]>([]);
  const [expandedPanel, setExpandedPanel] = useState<ExpandedPanel>(null);
  const [showImport, setShowImport] = useState(false);
  const [breakpoints, setBreakpoints] = useState<ReadonlySet<number>>(new Set());
  const lineToAddrRef = useRef<Map<number, number>>(new Map());

  const editorViewRef = useRef<EditorView | null>(null);
  const keyProviderRef = useRef<DomKeyProvider | null>(null);
  const controllerRef = useRef<EmulatorController | null>(null);
  const [controller, setController] = useState<EmulatorController | null>(null);

  useEffect(() => {
    keyProviderRef.current = new DomKeyProvider();
  }, []);

  const { tick, refresh } = useEmulatorLoop(controller);
  const regs = useRegisters(controller, tick);
  const consoleState = useConsoleOutput(controller, tick);
  const { currentLineIdx } = useSourceHighlight(finalView, regs.ipNum);

  const handleBreakpointToggle = useCallback((lineIdx: number) => {
    if (mode === 'edit') return; // no compiled program yet — nothing to break on
    // Sync to emulator BEFORE the setState updater — StrictMode calls updaters twice,
    // which would double-toggle the address (on then off) leaving the emulator with no breakpoint.
    const ctrl = controllerRef.current;
    const addr = ctrl ? lineToAddrRef.current.get(lineIdx) : undefined;
    if (ctrl && addr != null) ctrl.toggleBreakpoint(addr);
    setBreakpoints(prev => {
      const next = new Set(prev);
      if (next.has(lineIdx)) next.delete(lineIdx);
      else next.add(lineIdx);
      return next;
    });
  }, [mode]);

  const closeModal = useCallback(() => setExpandedPanel(null), []);

  const doStop = useCallback(() => {
    controllerRef.current?.stopRun();
    setMode('idle');
    setStatus('Stopped.');
  }, []);

  useEffect(() => {
    if (!controller || mode === 'edit') return;
    const handler = (e: KeyboardEvent) => {
      if (expandedPanel) return; // don't fire shortcuts while a modal is open
      const target = e.target as HTMLElement;
      if (target.tagName === 'TEXTAREA' || target.tagName === 'INPUT') return;
      if (e.key === 'ArrowRight' && mode === 'idle') { doStep(); e.preventDefault(); }
      if (e.key === 'ArrowLeft') { doStepBack(); e.preventDefault(); }
      if (e.key === ' ' && mode === 'running') { doStop(); e.preventDefault(); }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [controller, mode, expandedPanel]);

  const doCompile = useCallback(() => {
    if (!keyProviderRef.current) return;
    const result = createCompiler().compile(source);
    if (!result.status || !result.finalView || result.origin === null) {
      setCompileError(result.message);
      setMode('edit');
      return;
    }
    setCompileError(null);
    const fv = result.finalView;
    setFinalView(fv);

    const lineToAddr = buildLineToAddrMap(fv);
    lineToAddrRef.current = lineToAddr;

    const program: LoadableProgram = {
      origin: result.origin,
      instructions: fv
        .filter((l: FinalViewLine) => l.executableLine)
        .map((l: FinalViewLine) => ({ addr: l.instructionAddr, opcodes: l.opcodes })),
    };

    let ctrl = controllerRef.current;
    if (!ctrl) {
      ctrl = new EmulatorController(keyProviderRef.current);
      controllerRef.current = ctrl;
    }
    ctrl.loadProgram(program);

    // Re-apply breakpoints after load (addresses may have changed if source changed)
    ctrl.clearBreakpoints();
    setBreakpoints(prev => {
      for (const lineIdx of prev) {
        const addr = lineToAddr.get(lineIdx);
        if (addr != null) ctrl!.addBreakpoint(addr);
      }
      return prev;
    });

    setController(ctrl);
    setMode('idle');
    setStatus('Compiled. →=step  ←=step back  Space=stop');
  }, [source]);

  const doStep = useCallback(() => {
    const ctrl = controllerRef.current;
    if (!ctrl || mode !== 'idle') return;
    const result = ctrl.singleStep();
    refresh();
    if (result.done) {
      setMode('done');
      setStatus(`Done: ${result.endReason ?? 'execution ended'}`);
    }
  }, [mode, refresh]);

  const doStepBack = useCallback(() => {
    const ctrl = controllerRef.current;
    if (!ctrl || mode === 'edit' || mode === 'running') return;
    ctrl.stepBack();
    refresh();
    if (mode === 'done') setMode('idle');
  }, [mode, refresh]);

  const doRun = useCallback(() => {
    const ctrl = controllerRef.current;
    if (!ctrl || mode !== 'idle') return;
    setMode('running');
    setStatus('Running... Space to stop');
    ctrl.startRun(
      () => refresh(),
      (reason) => {
        refresh();
        if (reason === ExecutionStopReason.BREAKPOINT_HIT) {
          setMode('idle');
          setStatus('Breakpoint hit. →=step  ←=step back  Space=stop');
        } else {
          setMode('done');
          setStatus(`Done: ${reason}`);
        }
      },
    );
  }, [mode, refresh]);

  const doReset = useCallback(() => {
    const ctrl = controllerRef.current;
    if (!ctrl) return;
    ctrl.stopRun();
    ctrl.reset();
    refresh();
    setMode('idle');
    setStatus('Reset.');
  }, [refresh]);

  return (
    <div className="flex flex-col h-screen bg-zinc-950 text-zinc-100 overflow-hidden">
      <Toolbar
        mode={mode}
        status={status}
        compileError={compileError}
        waiting={consoleState.waiting}
        waitingForChar={consoleState.waitingForChar}
        onImport={() => setShowImport(true)}
        onCompile={doCompile}
        onStep={doStep}
        onStepBack={doStepBack}
        onRun={doRun}
        onStop={doStop}
        onReset={doReset}
        stepCount={controller?.t ?? 0}
      />

      <ResizablePanelGroup orientation="horizontal" className="flex-1 min-h-0">
        {/* Left: Editor */}
        <ResizablePanel defaultSize={55} minSize={30}>
          <EditorPane
            source={source}
            onChange={setSource}
            currentLineIdx={currentLineIdx}
            onEditorReady={(view) => { editorViewRef.current = view; }}
            readOnly={mode === 'running'}
            breakpoints={breakpoints}
            onBreakpointToggle={handleBreakpointToggle}
            breakpointsEnabled={mode !== 'edit'}
          />
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Right column */}
        <ResizablePanel defaultSize={45} minSize={25}>
          <div className="flex flex-col h-full min-h-0">

            {/* Registers */}
            <RegisterPanel
              regs={regs}
              className="flex-shrink-0"
              onExpand={() => setExpandedPanel('registers')}
            />

            {/* Flags */}
            <FlagsPanel
              flagsHex={regs.flags}
              onExpand={() => setExpandedPanel('flags')}
            />

            {/* Console */}
            <ConsolePanel
              chars={consoleState.chars}
              waiting={consoleState.waiting}
              waitingForChar={consoleState.waitingForChar}
              className="flex-1 min-h-0"
              onExpand={() => setExpandedPanel('console')}
            />

            {/* Bottom tabs: RAM / Stack / Memory History */}
            <div className="flex-shrink-0 h-52 border-t border-zinc-800">
              <Tabs defaultValue="ram" className="h-full flex flex-col">
                <TabsList className="h-8 rounded-none border-b border-zinc-800 bg-zinc-900 justify-start px-2 flex-shrink-0">
                  <TabsTrigger value="ram" className="text-xs h-6">RAM</TabsTrigger>
                  <TabsTrigger value="stack" className="text-xs h-6">Stack</TabsTrigger>
                  <TabsTrigger value="history" className="text-xs h-6">Mem History</TabsTrigger>
                </TabsList>
                <TabsContent value="ram" className="flex-1 min-h-0 mt-0 overflow-hidden">
                  <RamPanel
                    controller={controller}
                    regs={regs}
                    tick={tick}
                    onExpand={() => setExpandedPanel('ram')}
                  />
                </TabsContent>
                <TabsContent value="stack" className="flex-1 min-h-0 mt-0 overflow-hidden">
                  <StackPanel
                    controller={controller}
                    tick={tick}
                    standalone
                    onExpand={() => setExpandedPanel('stack')}
                  />
                </TabsContent>
                <TabsContent value="history" className="flex-1 min-h-0 mt-0 overflow-hidden">
                  <MemoryHistoryPanel
                    controller={controller}
                    tick={tick}
                    standalone
                    onExpand={() => setExpandedPanel('history')}
                  />
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>

      {/* ── Import / examples modal ── */}
      {showImport && (
        <ImportModal
          onLoad={src => { setSource(src); setShowImport(false); setMode('edit'); setController(null); controllerRef.current = null; }}
          onClose={() => setShowImport(false)}
        />
      )}

      {/* ── Expanded panel modals ── */}
      {expandedPanel === 'registers' && (
        <PanelModal title="Registers" onClose={closeModal}>
          <RegisterPanel regs={regs} />
        </PanelModal>
      )}
      {expandedPanel === 'flags' && (
        <PanelModal title="Flags" onClose={closeModal}>
          <FlagsPanel flagsHex={regs.flags} expanded />
        </PanelModal>
      )}
      {expandedPanel === 'console' && (
        <PanelModal title="Console" onClose={closeModal}>
          <ConsolePanel
            chars={consoleState.chars}
            waiting={consoleState.waiting}
            waitingForChar={consoleState.waitingForChar}
            className="h-full"
          />
        </PanelModal>
      )}
      {expandedPanel === 'ram' && (
        <PanelModal title="RAM" onClose={closeModal}>
          <RamPanel controller={controller} regs={regs} tick={tick} />
        </PanelModal>
      )}
      {expandedPanel === 'stack' && (
        <PanelModal title="Stack" onClose={closeModal}>
          <StackPanel controller={controller} tick={tick} standalone />
        </PanelModal>
      )}
      {expandedPanel === 'history' && (
        <PanelModal title="Memory Write History" onClose={closeModal}>
          <MemoryHistoryPanel controller={controller} tick={tick} standalone />
        </PanelModal>
      )}
    </div>
  );
}
