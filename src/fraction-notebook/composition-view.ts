import type { Node as ProseNode } from 'prosemirror-model';
import type { NodeView } from 'prosemirror-view';
import { uuid } from '../notebook/model.ts';
import { coordinate } from '../composition-explanation/draft.ts';
import { compositionFields, type CompositionField } from '../composition-explanation/resource.ts';
import type { CompositionRuntime } from './composition-runtime.ts';
import type { CompositionObjectCell } from './types.ts';

export interface CompositionViewOwner {
  readonly runtime: CompositionRuntime;
  subscribe(fn: () => void): () => void;
  select(id: string): void;
  edit(id: string, field: CompositionField, text: string): void;
  bind(button: HTMLButtonElement, command: string, cell: string): void;
  undo(redo: boolean): void;
}
export function readCompositionCell(node: ProseNode): CompositionObjectCell {
  const view: unknown = node.attrs['view'];
  if (view !== 'inputs' && view !== 'explanation') throw new Error('Unsupported composition view.');
  return { type: 'compositionObject', id: uuid(node.attrs['id']), resource: uuid(node.attrs['resource']),
    metadata: node.attrs['metadata'], view, folded: node.attrs['folded'] === true };
}
type Player = ReturnType<typeof import('../composition-explanation/player.ts').mountCompositionPlayer>;
export function createCompositionNodeView(initial: ProseNode, owner: CompositionViewOwner, editable = true): NodeView {
  let cell = readCompositionCell(initial), disposed = false, generation = 0;
  const el = <K extends keyof HTMLElementTagNameMap>(tag: K, cls = '') => { const e = document.createElement(tag); e.className = cls; return e; };
  const dom = el('section', 'fn-math-object fn-composition-object'), heading = el('div', 'fn-math-heading');
  const title = el('span'), body = el('div', 'fn-math-body'), controls = el('div', 'fn-math-controls');
  const summary = el('p'), diagnostic = el('p', 'fn-math-diagnostic'), toolbar = el('div', 'fn-math-actions'), host = el('div');
  dom.contentEditable = 'false'; dom.tabIndex = 0;
  diagnostic.setAttribute('role', 'status'); host.dataset['compositionPlayer'] = '';
  const button = (label: string, command: string, parent = toolbar) => {
    const b = el('button'); b.type = 'button'; b.textContent = label; owner.bind(b, command, cell.id); parent.append(b); return b;
  };
  if (editable) button('▾', 'composition.fold', heading).setAttribute('aria-label', 'Fold matrix-pair object');
  heading.append(title); body.append(controls, summary, diagnostic, host, toolbar); dom.append(heading, body);
  const inputs = editable && cell.view === 'inputs' ? compositionFields.map(field => {
    const label = el('label'), input = el('input'), name = `${field < 4 ? 'A' : 'B'} row ${Math.floor(field % 4 / 2) + 1} column ${field % 2 + 1}`;
    input.type = 'text'; input.inputMode = 'numeric'; input.maxLength = 12; label.textContent = `${field < 4 ? 'A' : 'B'}${Math.floor(field % 4 / 2) + 1}${field % 2 + 1}`;
    input.setAttribute('aria-label', name); label.append(input); controls.append(label);
    input.oninput = () => owner.edit(cell.resource, field, input.value); return input;
  }) : [];
  if (editable) { button('Explain composition', 'composition.explain'); button('Linked view', 'composition.linked'); if (cell.view === 'explanation') button('Return to inputs', 'composition.return'); }
  let player: Player | undefined, visibilityOwner: Element | null = null, observer: MutationObserver | undefined;
  let lastSource: ReturnType<CompositionRuntime['read']>['source'] | undefined, lastValid: boolean | undefined;
  let pin = '', progress = 0;
  const positionKey = `kp-composition-position-v1:${editable ? 'editor' : 'reader'}:${cell.id}`;
  const save = () => { try { localStorage.setItem(positionKey, JSON.stringify({ pin, progress })); } catch { /* Optional UI state cannot invalidate source. */ } };
  const stop = () => { generation++; if (player) { progress = player.progress(); save(); player.dispose(); player = undefined; } lastSource = undefined; };
  const hidden = () => cell.folded || visibilityOwner?.getAttribute('aria-hidden') === 'true';
  const render = async () => {
    if (disposed) return;
    const state = owner.runtime.read(cell.resource), resource = state.resource;
    dom.dataset['cellId'] = cell.id; dom.dataset['compositionResource'] = cell.resource; dom.dataset['compositionView'] = cell.view;
    title.textContent = cell.view === 'inputs' ? 'Matrix pair · A and B' : 'Composition · order and signed area'; body.hidden = cell.folded;
    inputs.forEach((input, i) => { if (input.value !== resource.draft[i]) input.value = resource.draft[i]!; input.setAttribute('aria-invalid', String(!coordinate(resource.draft[i]!))); });
    summary.textContent = `A = [${resource.admitted.slice(0, 2).join(', ')}; ${resource.admitted.slice(2, 4).join(', ')}], B = [${resource.admitted.slice(4, 6).join(', ')}; ${resource.admitted.slice(6).join(', ')}]`;
    diagnostic.textContent = state.valid ? '' : 'Use integer entries from −5 to 5. Showing the last valid matrix pair.';
    host.hidden = cell.view !== 'explanation';
    if (hidden() || cell.view !== 'explanation') { stop(); return; }
    if (player && lastSource === state.source && lastValid === state.valid) return;
    const attempt = ++generation;
    try {
      const module = await import('../composition-explanation/player.ts');
      if (disposed || attempt !== generation || hidden() || !dom.isConnected) return;
      const nextPin = JSON.stringify(resource.admitted);
      if (!player) {
        try { const stored: unknown = JSON.parse(localStorage.getItem(positionKey) ?? 'null');
          if (stored && typeof stored === 'object' && 'pin' in stored && stored.pin === nextPin && 'progress' in stored
            && typeof stored.progress === 'number' && Number.isFinite(stored.progress) && stored.progress >= 0 && stored.progress <= 1) progress = stored.progress;
        } catch { /* Invalid optional UI preferences start at the current/default position. */ }
        player = module.mountCompositionPlayer(host, cell.id, progress, (value, _beat, playing) => { progress = value; if (!playing) save(); });
      }
      pin = nextPin; lastSource = state.source; lastValid = state.valid; player.update(state.source, state.valid);
    } catch (error) { if (!disposed && attempt === generation) { stop(); diagnostic.textContent = String(error); } }
  };
  dom.onpointerdown = () => owner.select(cell.id); dom.addEventListener('focusin', () => owner.select(cell.id));
  dom.onkeydown = event => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') { event.preventDefault(); owner.undo(event.shiftKey); }
    if (event.key === 'Escape') { event.preventDefault(); dom.focus(); }
  };
  const unsubscribe = owner.subscribe(() => { void render(); });
  queueMicrotask(() => {
    if (disposed) return; visibilityOwner = dom.closest('[aria-hidden]');
    if (visibilityOwner) { observer = new MutationObserver(() => { void render(); }); observer.observe(visibilityOwner, { attributes: true, attributeFilter: ['aria-hidden'] }); }
    void render();
  });
  void render();
  return { dom, update(node) {
    if (node.type !== initial.type || node.attrs['id'] !== cell.id || node.attrs['resource'] !== cell.resource || node.attrs['view'] !== cell.view) return false;
    cell = readCompositionCell(node); void render(); return true;
  }, stopEvent: () => true, ignoreMutation: () => true,
  selectNode() { dom.classList.add('ProseMirror-selectednode'); }, deselectNode() { dom.classList.remove('ProseMirror-selectednode'); },
  destroy() { disposed = true; stop(); observer?.disconnect(); unsubscribe(); dom.remove(); } };
}
