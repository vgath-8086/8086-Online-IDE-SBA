'use client';
import { useEffect, useRef, useCallback, useMemo } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { oneDark } from '@codemirror/theme-one-dark';
import { lineNumbers, highlightActiveLine, EditorView } from '@codemirror/view';
import { asm8086Language } from '@/lib/asm-language';
import { executingLineExtension, setCurrentInstructionLine } from '@/lib/asm-highlight';
import { breakpointGutterExtension, setBreakpointLines } from '@/lib/asm-breakpoints';

interface Props {
  source: string;
  onChange(value: string): void;
  currentLineIdx: number;
  onEditorReady(view: EditorView): void;
  readOnly: boolean;
  breakpoints: ReadonlySet<number>;
  onBreakpointToggle(lineIdx: number): void;
  breakpointsEnabled: boolean;
}

export function EditorPane({
  source, onChange, currentLineIdx, onEditorReady, readOnly,
  breakpoints, onBreakpointToggle, breakpointsEnabled,
}: Props) {
  const viewRef = useRef<EditorView | null>(null);
  // Stable refs so gutter handlers never need the extension to be re-created
  const onBreakpointToggleRef = useRef(onBreakpointToggle);
  useEffect(() => { onBreakpointToggleRef.current = onBreakpointToggle; }, [onBreakpointToggle]);
  const breakpointsEnabledRef = useRef(breakpointsEnabled);
  useEffect(() => { breakpointsEnabledRef.current = breakpointsEnabled; }, [breakpointsEnabled]);

  // Dispatch highlight effect whenever currentLineIdx changes
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    view.dispatch({
      effects: setCurrentInstructionLine.of(currentLineIdx),
    });
    if (currentLineIdx >= 0) {
      try {
        const line = view.state.doc.line(currentLineIdx + 1);
        view.dispatch({ effects: EditorView.scrollIntoView(line.from, { y: 'center' }) });
      } catch { /* line out of range */ }
    }
  }, [currentLineIdx]);

  // Sync React breakpoint state into CodeMirror
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    view.dispatch({ effects: setBreakpointLines.of(breakpoints) });
  }, [breakpoints]);

  const handleCreate = useCallback((view: EditorView) => {
    viewRef.current = view;
    onEditorReady(view);
  }, [onEditorReady]);

  // Stable callback passed once into the gutter extension — reads latest values from refs at call time
  const stableToggle = useCallback((lineIdx: number) => {
    if (!breakpointsEnabledRef.current) return;
    onBreakpointToggleRef.current(lineIdx);
  }, []);

  const extensions = useMemo(() => [
    asm8086Language,
    lineNumbers(),
    highlightActiveLine(),
    executingLineExtension(),
    breakpointGutterExtension(stableToggle),
    EditorView.lineWrapping,
    EditorView.theme({
      '&': { height: '100%', backgroundColor: 'hsl(var(--background))' },
      '.cm-content': { fontFamily: 'var(--font-mono, var(--font-geist-mono)), monospace', fontSize: '13px' },
      '.cm-gutters': { backgroundColor: '#18181b', borderRight: '1px solid #27272a' },
    }),
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ], []);

  return (
    <div className={`h-full overflow-hidden${!breakpointsEnabled ? ' [&_.cm-breakpoint-gutter]:!cursor-default [&_.cm-breakpoint-gutter]:opacity-30' : ''}`}>
      <CodeMirror
        value={source}
        height="100%"
        theme={oneDark}
        extensions={extensions}
        onChange={onChange}
        readOnly={readOnly}
        onCreateEditor={handleCreate}
        className="h-full"
      />
    </div>
  );
}
