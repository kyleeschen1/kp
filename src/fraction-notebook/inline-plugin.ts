import { Plugin, PluginKey, NodeSelection, type Command } from 'prosemirror-state';
import type { EditorView } from 'prosemirror-view';
import { isHistoryTransaction } from 'prosemirror-history';
import { schema } from './schema.ts';

interface InlineState { readonly side: 'start' | 'end'; readonly suppressed: boolean }
export const inlineKey = new PluginKey<InlineState>('fractionInline');
export const isInlineObject = (name: string) => name === 'link' || name === 'math';
export const enterInline = (direction: -1 | 1): Command => (state, dispatch) => {
  const { selection } = state;
  if (!selection.empty || !selection.$from.parent.isTextblock) return false;
  const node = direction < 0 ? selection.$from.nodeBefore : selection.$from.nodeAfter;
  if (!node || !isInlineObject(node.type.name)) return false;
  const pos = direction < 0 ? selection.from - node.nodeSize : selection.from;
  if (dispatch) dispatch(state.tr.setSelection(NodeSelection.create(state.doc, pos)).setMeta(inlineKey, direction < 0 ? 'end' : 'start'));
  return true;
};

/** Rendering is a view state. Conversion creates one identified object only
 * after the author leaves a complete delimited expression. Undo suppresses
 * automatic reconversion until an actual new document edit occurs. */
export function createInlinePlugin() {
  let composing = false, destroyed = false;
  let live: EditorView | undefined;
  return new Plugin<InlineState>({
    key: inlineKey,
    state: {
      init: () => ({ side: 'end', suppressed: false }),
      apply(tr, old) {
        const side: unknown = tr.getMeta(inlineKey);
        return { side: side === 'start' || side === 'end' ? side : old.side,
          suppressed: isHistoryTransaction(tr) ? true : tr.docChanged ? false : old.suppressed };
      }
    },
    view(view) { live = view; return { destroy() { destroyed = true; live = undefined; } }; },
    props: { handleDOMEvents: {
      compositionstart() { composing = true; return false; },
      compositionend() { composing = false; return false; },
      blur(view) {
        queueMicrotask(() => { if (!destroyed && !view.dom.contains(document.activeElement)) view.dispatch(view.state.tr.setMeta('finishInline', true)); });
        return false;
      }
    } },
    appendTransaction(transactions, _old, state) {
      if (composing || live?.composing || inlineKey.getState(state)?.suppressed || transactions.some(isHistoryTransaction)) return null;
      const finish = transactions.some(tr => tr.getMeta('finishInline'));
      if (!finish && !transactions.some(tr => tr.docChanged || tr.selectionSet)) return null;
      const found: { from: number; to: number; kind: 'math' | 'link'; source: string }[] = [];
      state.doc.descendants((node, pos, parent) => {
        if (isInlineObject(node.type.name)) return false;
        if (!node.isText || node.marks.length || !parent || !['paragraph', 'title', 'blockTitle'].includes(parent.type.name)) return true;
        // Inline syntax is intentionally bounded; code/annotated text stays literal.
        const pattern = /\[[^\]\n]+\]\([^()\n]+\)|(?<![\\$])\$[^$\n]+\$(?!\$)/g;
        for (const match of node.text!.matchAll(pattern)) {
          const from = pos + match.index, to = from + match[0].length;
          if (!finish && state.selection.from <= to && state.selection.to >= from) continue;
          found.push({ from, to, kind: match[0].startsWith('$') ? 'math' : 'link', source: match[0] });
        }
        return true;
      });
      if (!found.length) return null;
      const tr = state.tr;
      for (const f of found.reverse()) tr.replaceWith(f.from, f.to, schema.node(f.kind, { id: crypto.randomUUID(), metadata: {} }, schema.text(f.source)));
      return tr;
    }
  });
}
