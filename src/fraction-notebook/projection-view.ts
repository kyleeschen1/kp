import type { Node as ProseNode } from 'prosemirror-model';
import type { NodeView } from 'prosemirror-view';
import { uuid } from '../notebook/model.ts';
import { coordinate } from '../projection-explanation/draft.ts';
import { projectionFields, type ProjectionField } from '../projection-explanation/resource.ts';
import type { ProjectionRuntime } from './projection-runtime.ts';
import type { ProjectionObjectCell } from './types.ts';

export interface ProjectionViewOwner {
  readonly runtime: ProjectionRuntime;
  subscribe(fn: () => void): () => void;
  select(id: string): void;
  edit(id: string, field: ProjectionField, text: string): void;
  bind(button: HTMLButtonElement, command: string, cell: string): void;
  undo(redo: boolean): void;
}
export function readProjectionCell(node: ProseNode): ProjectionObjectCell {
  const view: unknown = node.attrs['view'];
  if (view !== 'inputs' && view !== 'explanation') throw new Error('Unsupported projection view.');
  return { type: 'projectionObject', id: uuid(node.attrs['id']), resource: uuid(node.attrs['resource']),
    metadata: node.attrs['metadata'], view, folded: node.attrs['folded'] === true };
}
type Player = ReturnType<typeof import('../projection-explanation/player.ts').mountProjectionPlayer>;
export function createProjectionNodeView(initial: ProseNode, owner: ProjectionViewOwner, editable = true): NodeView {
  let cell = readProjectionCell(initial), disposed = false, generation = 0;
  const el = <K extends keyof HTMLElementTagNameMap>(tag: K, cls = '') => { const e = document.createElement(tag); e.className = cls; return e; };
  const dom = el('section', 'fn-math-object fn-projection-object'), heading = el('div', 'fn-math-heading');
  const title = el('span'), body = el('div', 'fn-math-body'), controls = el('div', 'fn-math-controls');
  const summary = el('p'), diagnostic = el('p', 'fn-math-diagnostic'), toolbar = el('div', 'fn-math-actions'), host = el('div');
  dom.contentEditable = 'false'; dom.tabIndex = 0;
  diagnostic.setAttribute('role', 'status'); host.dataset['projectionPlayer'] = '';
  const button = (label: string, command: string, parent = toolbar) => {
    const b = el('button'); b.type = 'button'; b.textContent = label; owner.bind(b, command, cell.id); parent.append(b); return b;
  };
  if (editable) button('▾', 'projection.fold', heading).setAttribute('aria-label', 'Fold vector-pair object');
  heading.append(title); body.append(controls, summary, diagnostic, host, toolbar); dom.append(heading, body);
  const inputs = editable && cell.view === 'inputs' ? projectionFields.map(field => {
    const label = el('label'), input = el('input'), name = ['a x', 'a y', 'b x', 'b y'][field]!;
    input.type = 'text'; input.inputMode = 'numeric'; input.maxLength = 32; label.textContent = name;
    input.setAttribute('aria-label', name); label.append(input); controls.append(label);
    input.oninput = () => owner.edit(cell.resource, field, input.value); return input;
  }) : [];
  if (editable) { button('Explain projection', 'projection.explain'); button('Linked view', 'projection.linked'); if (cell.view === 'explanation') button('Return to inputs', 'projection.return'); }
  let player: Player | undefined, visibilityOwner: Element | null = null, observer: MutationObserver | undefined;
  let lastSource: ReturnType<ProjectionRuntime['read']>['source'] | undefined, lastValid: boolean | undefined;
  let pin = '', progress = 0;
  const positionKey = `kp-projection-position-v1:${editable ? 'editor' : 'reader'}:${cell.id}`;
  const save = () => { try { localStorage.setItem(positionKey, JSON.stringify({ pin, progress })); } catch { /* Optional UI state cannot invalidate source. */ } };
  const stop = () => { generation++; if (player) { progress = player.progress(); save(); player.dispose(); player = undefined; } lastSource = undefined; };
  const hidden = () => cell.folded || visibilityOwner?.getAttribute('aria-hidden') === 'true';
  const render = async () => {
    if (disposed) return;
    const state = owner.runtime.read(cell.resource), resource = state.resource;
    dom.dataset['cellId'] = cell.id; dom.dataset['projectionResource'] = cell.resource; dom.dataset['projectionView'] = cell.view;
    title.textContent = cell.view === 'inputs' ? 'Vector pair · a and b' : 'Projection · parallel part and remainder'; body.hidden = cell.folded;
    inputs.forEach((input, i) => { if (input.value !== resource.draft[i]) input.value = resource.draft[i]!; input.setAttribute('aria-invalid', String(!coordinate(resource.draft[i]!))); });
    summary.textContent = `a = (${resource.admitted.slice(0, 2).join(', ')}), b = (${resource.admitted.slice(2).join(', ')})`;
    diagnostic.textContent = state.valid ? '' : 'Use integer coordinates from −1000 to 1000. Showing the last valid vector pair.';
    host.hidden = cell.view !== 'explanation';
    if (hidden() || cell.view !== 'explanation') { stop(); return; }
    if (player && lastSource === state.source && lastValid === state.valid) return;
    const attempt = ++generation;
    try {
      const module = await import('../projection-explanation/player.ts');
      if (disposed || attempt !== generation || hidden() || !dom.isConnected) return;
      const nextPin = JSON.stringify(resource.admitted);
      if (!player) {
        try { const stored: unknown = JSON.parse(localStorage.getItem(positionKey) ?? 'null');
          if (stored && typeof stored === 'object' && 'pin' in stored && stored.pin === nextPin && 'progress' in stored
            && typeof stored.progress === 'number' && Number.isFinite(stored.progress) && stored.progress >= 0 && stored.progress <= 1) progress = stored.progress;
        } catch { /* Invalid optional UI preferences start at the current/default position. */ }
        player = module.mountProjectionPlayer(host, cell.id, progress, value => { progress = value; save(); });
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
    cell = readProjectionCell(node); void render(); return true;
  }, stopEvent: () => true, ignoreMutation: () => true,
  selectNode() { dom.classList.add('ProseMirror-selectednode'); }, deselectNode() { dom.classList.remove('ProseMirror-selectednode'); },
  destroy() { disposed = true; stop(); observer?.disconnect(); unsubscribe(); dom.remove(); } };
}
