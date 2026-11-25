import { Decoration, DecorationSet } from 'prosemirror-view';
import type { EditorState } from 'prosemirror-state';

const graphemes = new Intl.Segmenter(undefined, { granularity: 'grapheme' });

/** Paint a real character without inserting text or taking selection ownership.
 * The decoration follows transactions; no measuring loop or synthetic caret DOM
 * enters the notebook. Widgets cover only empty/end positions. */
export function normalCursor(state: EditorState): DecorationSet {
  const { selection } = state;
  if (!selection.empty || !selection.$head.parent.isTextblock || selection.$head.parent.type.name === 'specification') return DecorationSet.empty;
  const next = selection.$head.nodeAfter;
  if (next?.isText) {
    const length = graphemes.segment(next.text ?? '')[Symbol.iterator]().next().value?.segment.length ?? 1;
    return DecorationSet.create(state.doc, [Decoration.inline(selection.head, selection.head + length, { class: 'fn-normal-cursor' })]);
  }
  return DecorationSet.create(state.doc, [Decoration.widget(selection.head, () => {
    const cursor = document.createElement('span'); cursor.className = 'fn-normal-cursor fn-empty-cursor';
    cursor.setAttribute('aria-hidden', 'true'); return cursor;
  }, { key: 'normal-cursor', side: -1, ignoreSelection: true })]);
}
