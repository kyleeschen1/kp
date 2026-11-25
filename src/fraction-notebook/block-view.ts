import type { Node as ProseNode } from 'prosemirror-model';
import { Selection } from 'prosemirror-state';
import { closeHistory } from 'prosemirror-history';
import type { EditorView, NodeView } from 'prosemirror-view';

export class BlockView implements NodeView {
  readonly dom = document.createElement('section');
  readonly contentDOM = document.createElement('div');
  private readonly fold = document.createElement('button');
  private node: ProseNode;
  constructor(node: ProseNode, outer: EditorView, getPos: () => number | undefined) {
    this.node = node; this.dom.className = 'fn-block'; this.contentDOM.className = 'fn-block-content';
    this.fold.type = 'button'; this.fold.className = 'fn-block-fold'; this.fold.contentEditable = 'false';
    this.fold.onmousedown = event => event.preventDefault();
    this.fold.onclick = () => {
      const pos = getPos(); if (pos === undefined) return;
      const tr = closeHistory(outer.state.tr).setNodeMarkup(pos, undefined, { ...this.node.attrs, folded: !this.node.attrs['folded'] });
      outer.dispatch(tr.setSelection(Selection.near(tr.doc.resolve(pos + 1), 1))); outer.focus();
    };
    this.dom.append(this.fold, this.contentDOM); this.update(node);
  }
  update(node: ProseNode) {
    if (node.type !== this.node.type) return false;
    this.node = node;
    this.dom.dataset['cellId'] = node.attrs['id']; this.dom.dataset['kpMeta'] = JSON.stringify(node.attrs['metadata']);
    this.dom.dataset['layout'] = node.attrs['layout']; this.dom.dataset['kind'] = node.attrs['kind'];
    this.dom.dataset['folded'] = String(node.attrs['folded']);
    const count = node.childCount - (node.firstChild?.type.name === 'blockTitle' ? 2 : 1);
    this.fold.hidden = !count; this.fold.textContent = node.attrs['folded'] ? '▸' : '▾';
    this.fold.setAttribute('aria-label', `${node.attrs['folded'] ? 'Expand' : 'Collapse'} ${count} child blocks`);
    this.fold.setAttribute('aria-expanded', String(!node.attrs['folded']));
    return true;
  }
  stopEvent(event: Event) { return event.target === this.fold; }
  ignoreMutation(mutation: { type: string; target: Node }) { return mutation.type !== 'selection' && !this.contentDOM.contains(mutation.target); }
}
