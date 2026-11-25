import { Plugin, PluginKey, Selection, TextSelection, type Command } from 'prosemirror-state';
import { undo, redo } from 'prosemirror-history';
import { addBlock } from './structure.ts';

type Mode = 'normal' | 'insert' | 'visual';
export const vimKey = new PluginKey<Mode>('fraction-vim');
/** Bounded prose Vim bindings. JSON uses CodeMirror's existing Vim engine.
 * Normal mode blocks browser text input as well as keydown (IME/mobile/paste). */
export const setVimMode = (mode: Mode): Command => (state, dispatch) => {
  dispatch?.(state.tr.setMeta(vimKey, mode)); return true;
};
export function proseVim() {
  let pendingG = false;
  return new Plugin<Mode>({
    key: vimKey,
    state: { init: () => 'normal', apply: (tr, mode) => tr.getMeta(vimKey) ?? mode },
    props: {
      attributes: state => ({ 'data-vim-mode': vimKey.getState(state) ?? 'normal' }),
      handleTextInput: view => vimKey.getState(view.state) !== 'insert',
      handleDOMEvents: { beforeinput: (view, event) => {
        if (vimKey.getState(view.state) === 'insert') return false;
        event.preventDefault(); return true;
      } },
      handleKeyDown(view, event) {
        const { state } = view, mode = vimKey.getState(state), run = (command: Command) => command(state, view.dispatch, view);
        if (event.key === 'Escape') { pendingG = false; return run(setVimMode('normal')); }
        if (mode === 'insert' || event.metaKey || event.altKey) return false;
        if (event.ctrlKey) return event.key === 'r' ? run(redo) : false;
        const { $head, anchor, head } = state.selection;
        const move = (pos: number) => {
          const near = Selection.near(state.doc.resolve(Math.max(0, Math.min(state.doc.content.size, pos))));
          view.dispatch(state.tr.setSelection(mode === 'visual' ? TextSelection.between(state.doc.resolve(anchor), near.$head) : near).scrollIntoView());
          return true;
        };
        if (event.key !== 'g') pendingG = false;
        switch (event.key) {
          case 'i': return run(setVimMode('insert'));
          case 'a': move(Math.min($head.end(), head + 1)); return setVimMode('insert')(view.state, view.dispatch);
          case 'I': move($head.start()); return setVimMode('insert')(view.state, view.dispatch);
          case 'A': move($head.end()); return setVimMode('insert')(view.state, view.dispatch);
          case 'v': return run(setVimMode(mode === 'visual' ? 'normal' : 'visual'));
          case 'h': return move(head - 1);
          case 'l': return move(head + 1);
          case '0': return move($head.start());
          case '$': return move($head.end());
          case 'g': if (pendingG) { pendingG = false; return move(0); } pendingG = true; return true;
          case 'G': return move(state.doc.content.size);
          case 'j': case 'k': {
            const rect = view.coordsAtPos(head), direction = event.key === 'j' ? 1 : -1;
            const target = view.posAtCoords({ left: rect.left, top: (rect.top + rect.bottom) / 2 + direction * (rect.bottom - rect.top + 3) });
            return target ? move(target.pos) : true;
          }
          case 'w': {
            const rest = $head.parent.textBetween($head.parentOffset, $head.parent.content.size, ' ', ' ');
            return move(head + (rest.match(/^\S*\s+/)?.[0].length ?? (rest.length || 2)));
          }
          case 'b': {
            const before = $head.parent.textBetween(0, $head.parentOffset, ' ', ' ');
            return move(head - (before.match(/\S+\s*$/)?.[0].length ?? (before.length || 2)));
          }
          case 'o': if (run(addBlock)) return setVimMode('insert')(view.state, view.dispatch); return true;
          case 'u': return run(undo);
          case 'x': case 'd':
            if (mode === 'visual' && !state.selection.empty) { view.dispatch(state.tr.deleteSelection().setMeta(vimKey, 'normal')); return true; }
            if (event.key === 'x' && $head.parent.isTextblock && head < $head.end()) view.dispatch(state.tr.delete(head, head + 1));
            return true;
          default: return event.key.length === 1 || event.key === 'Backspace' || event.key === 'Delete' || event.key === 'Enter';
        }
      }
    }
  });
}
