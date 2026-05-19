import { StateEffect, StateField } from '@codemirror/state';
import { Decoration, DecorationSet, EditorView } from '@codemirror/view';

export const setCurrentInstructionLine = StateEffect.define<number>(); // 0-based

const lineDecoration = Decoration.line({ class: 'cm-executing-line' });

export const currentInstructionField = StateField.define<DecorationSet>({
  create: () => Decoration.none,
  update(deco, tr) {
    deco = deco.map(tr.changes);
    for (const effect of tr.effects) {
      if (effect.is(setCurrentInstructionLine)) {
        if (effect.value < 0) return Decoration.none;
        try {
          const line = tr.newDoc.line(effect.value + 1);
          return Decoration.set([lineDecoration.range(line.from)]);
        } catch { return Decoration.none; }
      }
    }
    return deco;
  },
  provide: f => EditorView.decorations.from(f),
});

export const executingLineTheme = EditorView.baseTheme({
  '.cm-executing-line': { backgroundColor: 'rgba(250, 204, 21, 0.15) !important' },
  '.cm-executing-line *': { color: 'rgb(250, 204, 21) !important' },
});

export function executingLineExtension() {
  return [currentInstructionField, executingLineTheme];
}
