import { StateEffect, StateField, RangeSet } from '@codemirror/state';
import { GutterMarker, gutter, EditorView } from '@codemirror/view';

// ── State effects ──────────────────────────────────────────────────────────────

/** Toggle breakpoint at the given 0-based line index. */
export const toggleBreakpointLine = StateEffect.define<number>();

/** Replace the full breakpoint set (used to sync external React state → CodeMirror). */
export const setBreakpointLines = StateEffect.define<ReadonlySet<number>>();

// ── State field ────────────────────────────────────────────────────────────────

export const breakpointLinesField = StateField.define<ReadonlySet<number>>({
  create: () => new Set<number>(),
  update(lines, tr) {
    let next = lines;
    for (const effect of tr.effects) {
      if (effect.is(toggleBreakpointLine)) {
        const set = new Set(next);
        if (set.has(effect.value)) set.delete(effect.value);
        else set.add(effect.value);
        next = set;
      }
      if (effect.is(setBreakpointLines)) {
        next = effect.value;
      }
    }
    return next;
  },
});

// ── Gutter marker ──────────────────────────────────────────────────────────────

class BreakpointMarker extends GutterMarker {
  toDOM(): HTMLElement {
    const el = document.createElement('div');
    el.className = 'cm-breakpoint-marker';
    el.textContent = '●';
    return el;
  }
}

const marker = new BreakpointMarker();

// ── Gutter extension ───────────────────────────────────────────────────────────

/**
 * Creates the breakpoint gutter extension. Pass the toggle callback so clicks
 * bubble up to React state without needing a separate effect round-trip.
 */
export function breakpointGutterExtension(onToggle: (lineIdx: number) => void) {
  return [
    breakpointLinesField,
    gutter({
      class: 'cm-breakpoint-gutter',
      markers(view) {
        const lines = view.state.field(breakpointLinesField);
        const ranges: Array<{ from: number; marker: BreakpointMarker }> = [];
        for (const lineIdx of lines) {
          try {
            const line = view.state.doc.line(lineIdx + 1);
            ranges.push({ from: line.from, marker });
          } catch { /* line out of range — ignore */ }
        }
        ranges.sort((a, b) => a.from - b.from);
        return RangeSet.of(ranges.map(r => r.marker.range(r.from)));
      },
      initialSpacer: () => marker,
      domEventHandlers: {
        mousedown(view, _blockInfo, event) {
          // Use posAtCoords with the raw mouse coordinates instead of relying on
          // the BlockInfo argument, which is computed from layout-dependent pixel
          // offsets and can be wrong when the gutter column has custom CSS.
          const pos = view.posAtCoords({
            x: (event as MouseEvent).clientX,
            y: (event as MouseEvent).clientY,
          });
          if (pos == null) return false;
          const lineIdx = view.state.doc.lineAt(pos).number - 1;
          onToggle(lineIdx);
          return true;
        },
      },
    }),
    EditorView.baseTheme({
      // Style the gutter COLUMN without touching its layout model.
      // CodeMirror stacks gutter cells as plain block divs using height/margin-top;
      // applying display:flex to the column disrupts that and misplaces the cells.
      '.cm-breakpoint-gutter': {
        width: '16px',
        cursor: 'pointer',
      },
      // Apply flex centering to individual CELLS so the dot is centred within each row.
      '.cm-breakpoint-gutter .cm-gutterElement': {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      },
      '.cm-breakpoint-marker': {
        color: '#e53e3e',
        fontSize: '10px',
        lineHeight: '1',
        userSelect: 'none',
      },
    }),
  ];
}
