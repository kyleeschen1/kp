import type { Node as ProseNode } from 'prosemirror-model';
import { NodeSelection, TextSelection } from 'prosemirror-state';
import type { EditorView, NodeView } from 'prosemirror-view';
import { closeHistory, undo, redo } from 'prosemirror-history';
import { presentInline } from './inline-source.ts';
import { inlineKey } from './inline-plugin.ts';
import { vimKey } from './vim.ts';

export class InlineSourceView implements NodeView {
  readonly dom = document.createElement('span');
  private readonly display = document.createElement('span');
  private readonly input = document.createElement('input');
  private readonly error = document.createElement('span');
  private node: ProseNode;
  private readonly outer: EditorView;
  private readonly getPos: () => number | undefined;
  private editing = false;
  private composing = false;
  private fresh = true;
  private disposed = false;
  private focusEpoch = 0;
  constructor(node: ProseNode, outer: EditorView, getPos: () => number | undefined) {
    this.node = node; this.outer = outer; this.getPos = getPos;
    this.dom.className = 'fn-inline-object'; this.dom.contentEditable = 'false'; this.dom.dataset['inlineKind'] = node.type.name;
    this.display.className = 'fn-inline-display'; this.input.className = 'fn-inline-source'; this.input.type = 'text'; this.input.maxLength = 8000;
    this.input.spellcheck = false; this.input.setAttribute('aria-label', node.type.name === 'math' ? 'Math source' : 'Link source');
    this.error.className = 'fn-inline-error'; this.error.id = `error-${node.attrs['id']}`; this.input.setAttribute('aria-describedby', this.error.id);
    this.dom.append(this.display, this.input, this.error); this.paint(); this.hide();
    this.display.onmousedown = event => {
      event.preventDefault(); const pos = this.getPos(); if (pos === undefined) return;
      // Clicking editable source explicitly enters text entry, including after
      // recovery starts the surrounding document in Normal mode.
      outer.dispatch(outer.state.tr.setSelection(NodeSelection.create(outer.state.doc, pos)).setMeta(inlineKey, 'end').setMeta(vimKey, 'insert'));
      this.open('end');
    };
    this.input.oninput = () => { if (!this.composing) this.write(); };
    this.input.addEventListener('compositionstart', () => { this.composing = true; });
    this.input.addEventListener('compositionend', () => { this.composing = false; this.write(); });
    this.input.onblur = () => {
      const epoch = this.focusEpoch;
      queueMicrotask(() => {
        // A history transaction may blur and reopen this input in one turn.
        // A stale blur must not close the newer source-editing session.
        if (!this.disposed && epoch === this.focusEpoch && !this.dom.contains(document.activeElement)) { this.write(); this.hide(); }
      });
    };
    this.input.onkeydown = event => {
      if (event.isComposing || this.composing) return;
      const modifier = event.metaKey || event.ctrlKey;
      if (modifier && ['z', 'y'].includes(event.key.toLowerCase())) {
        event.preventDefault(); (event.shiftKey || event.key.toLowerCase() === 'y' ? redo : undo)(outer.state, outer.dispatch);
        // History restores the old outer selection, which may be outside this
        // object. Keep an active source session open while its identity exists.
        const pos = this.getPos();
        if (!this.disposed && this.dom.isConnected && pos !== undefined) {
          outer.dispatch(outer.state.tr.setSelection(NodeSelection.create(outer.state.doc, pos)).setMeta('addToHistory', false));
          this.open('end');
        } else outer.focus();
        return;
      }
      const empty = this.input.selectionStart === this.input.selectionEnd;
      if (event.key === 'Enter' || event.key === 'Escape' || event.key === 'Tab') {
        event.preventDefault(); this.leave(event.key === 'Tab' && event.shiftKey ? -1 : 1); return;
      }
      if (empty && event.key === 'ArrowLeft' && this.input.selectionStart === 0) { event.preventDefault(); this.leave(-1); }
      if (empty && event.key === 'ArrowRight' && this.input.selectionEnd === this.input.value.length) { event.preventDefault(); this.leave(1); }
      if (empty && event.key === 'Backspace' && this.input.selectionStart === 0 && this.input.value.length === 0) {
        event.preventDefault(); const pos = this.getPos(); if (pos !== undefined) { outer.dispatch(closeHistory(outer.state.tr).delete(pos, pos + this.node.nodeSize)); outer.focus(); }
      }
    };
  }
  private write() {
    if (this.disposed || this.composing || this.input.value === this.node.textContent) return;
    const pos = this.getPos(); if (pos === undefined) return;
    const old = this.node.textContent, next = this.input.value;
    let start = 0, end = 0;
    while (start < old.length && start < next.length && old[start] === next[start]) start++;
    while (end < old.length - start && end < next.length - start && old[old.length - end - 1] === next[next.length - end - 1]) end++;
    let tr = this.outer.state.tr; if (this.fresh) { tr = closeHistory(tr); this.fresh = false; }
    this.outer.dispatch(tr.insertText(next.slice(start, next.length - end), pos + 1 + start, pos + 1 + old.length - end));
  }
  private paint() {
    this.dom.dataset['cellId'] = this.node.attrs['id']; this.dom.dataset['kpMeta'] = JSON.stringify(this.node.attrs['metadata']);
    if (!this.composing && this.input.value !== this.node.textContent) {
      const from = this.input.selectionStart ?? 0, to = this.input.selectionEnd ?? from;
      this.input.value = this.node.textContent;
      if (this.editing) this.input.setSelectionRange(Math.min(from, this.input.value.length), Math.min(to, this.input.value.length));
    }
    this.input.size = Math.max(8, Math.min(54, this.input.value.length + 1));
    try {
      if (this.node.type.name !== 'link' && this.node.type.name !== 'math') throw new Error('Unsupported inline object.');
      const value = presentInline(this.node.type.name, this.node.textContent);
      if (value.kind === 'math') this.display.innerHTML = value.html;
      else { this.display.textContent = value.label; this.display.classList.add('fn-inline-link'); }
      this.error.textContent = ''; this.dom.removeAttribute('data-invalid'); this.input.removeAttribute('aria-invalid');
    } catch (error) {
      this.display.textContent = this.node.textContent || (this.node.type.name === 'math' ? 'Empty math' : 'Empty link');
      this.error.textContent = error instanceof Error ? error.message : String(error);
      this.dom.dataset['invalid'] = 'true'; this.input.setAttribute('aria-invalid', 'true');
    }
  }
  private open(side: 'start' | 'end') {
    if (this.disposed) return;
    const epoch = ++this.focusEpoch;
    if (!this.editing) this.fresh = true;
    this.editing = true; this.input.hidden = false; this.display.hidden = true; this.error.hidden = false; this.dom.classList.add('fn-inline-editing');
    queueMicrotask(() => { if (!this.disposed && epoch === this.focusEpoch && this.editing && this.dom.isConnected) { this.input.focus(); const pos = side === 'start' ? 0 : this.input.value.length; this.input.setSelectionRange(pos, pos); } });
  }
  private hide() { this.editing = false; this.input.hidden = true; this.display.hidden = false; this.error.hidden = true; this.dom.classList.remove('fn-inline-editing'); }
  private leave(direction: -1 | 1) {
    this.write(); const pos = this.getPos(); if (pos === undefined) return;
    this.hide(); const target = direction < 0 ? pos : pos + this.node.nodeSize;
    this.outer.dispatch(closeHistory(this.outer.state.tr).setSelection(TextSelection.create(this.outer.state.doc, target))); this.outer.focus();
  }
  selectNode() { this.open(inlineKey.getState(this.outer.state)?.side ?? 'end'); }
  deselectNode() { this.hide(); }
  update(node: ProseNode) { if (node.type !== this.node.type || node.attrs['id'] !== this.node.attrs['id']) return false; this.node = node; this.paint(); return true; }
  stopEvent() { return true; }
  ignoreMutation() { return true; }
  destroy() { this.disposed = true; }
}
