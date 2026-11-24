import { columnCardHtml } from '../experiments/matrix-column-combinations/view.ts';
import { mountColumnPlayer } from '../experiments/matrix-column-combinations/player.ts';
import { renderLatexToHtml } from '../rendering/katex-adapter.ts';
import { type Reference, type UUID } from './model.ts';
import { type ResolvedBlock } from './resolve.ts';
import { readViewState, saveViewState } from './persistence.ts';

export function element<K extends keyof HTMLElementTagNameMap>(tag: K, className = '', text?: string) {
  const el = document.createElement(tag); el.className = className; if (text !== undefined) el.textContent = text; return el;
}
export function button(text: string, action: () => void) {
  const el = element('button', '', text); el.type = 'button'; el.onclick = action; return el;
}
type Player = ReturnType<typeof mountColumnPlayer>;
interface BlockView {
  el: HTMLElement; header: HTMLElement; title: HTMLElement; fold: HTMLButtonElement;
  body: HTMLElement; content: HTMLElement; children: HTMLElement; problem: HTMLElement;
  selection?: HTMLButtonElement; player?: Player; signature?: string;
  visible: boolean; textSignature?: string; block: ResolvedBlock;
}

export function mountNotebookView(root: HTMLElement, outline: HTMLElement, notebookId: UUID, select?: (source: Reference) => void) {
  const stored = readViewState(notebookId), folded = new Set(stored.folded), positions = { ...stored.positions };
  const views = new Map<string, BlockView>(); let current: readonly ResolvedBlock[] = [], disposed = false;
  const save = () => saveViewState(notebookId, { folded: [...folded], positions });
  const remember = (key: string, value: number) => { positions[key] = value; save(); };
  const make = (block: ResolvedBlock): BlockView => {
    const el = element('section', 'nb-block'); el.dataset['blockKey'] = block.key; el.dataset['nodeId'] = block.node.id;
    el.id = `block-${block.key.replaceAll('/', '-')}`;
    const header = element('header', 'nb-block-heading'), title = element('h2'), body = element('div', 'nb-block-body');
    const content = element('div', 'nb-content'), children = element('div', 'nb-children'), problem = element('p', 'nb-problem');
    problem.setAttribute('role', 'alert'); problem.hidden = true;
    const fold = button('Collapse', () => { if (folded.has(block.key)) folded.delete(block.key); else folded.add(block.key); save(); update(current); });
    fold.className = 'nb-fold'; header.append(fold, title); body.append(problem, content, children); el.append(header, body);
    const view: BlockView = { el, header, title, fold, body, content, children, problem, visible: false, block };
    if (select) { view.selection = button('Edit', () => select(view.block.source)); header.append(view.selection); }
    return view;
  };
  const synchronize = (view: BlockView, visible: boolean) => {
    const block = view.block;
    const wasVisible = view.visible; view.visible = visible;
    if (!visible) { if (wasVisible && view.player) { view.player.pause(); remember(block.key, view.player.progress()); } return; }
    if (block.problem) { view.player?.pause(); return; }
    if (block.scene && block.signature) {
      if (view.signature !== block.signature || !view.player) {
        const progress = view.player?.progress() ?? positions[block.key] ?? 0;
        view.player?.dispose(); delete view.player; delete view.signature;
        view.content.innerHTML = columnCardHtml(block.scene); view.content.className = 'nb-content matrix-player';
        try {
          view.player = mountColumnPlayer(view.content, block.scene, progress, value => remember(block.key, value));
          view.signature = block.signature;
          view.el.dataset['mountCount'] = String(Number(view.el.dataset['mountCount'] ?? 0) + 1);
        } catch (error) { view.problem.hidden = false; view.problem.textContent = `Cannot prepare this scene: ${String(error)}`; }
      } else if (!wasVisible) view.player.prepare();
    }
  };
  function update(blocks: readonly ResolvedBlock[]) {
    if (disposed) return; current = blocks;
    const retained = new Set<string>(), visibility: [BlockView, boolean][] = [], navigation = element('div');
    const walk = (items: readonly ResolvedBlock[], parent: HTMLElement, depth: number, ancestorsVisible: boolean) => {
      let previous: HTMLElement | null = null;
      for (const block of items) {
        let view = views.get(block.key); if (!view) { view = make(block); views.set(block.key, view); }
        retained.add(block.key); view.block = block;
        // Keep existing elements connected and keyed when order has not changed.
        const expected: Element | null = previous ? previous.nextElementSibling : parent.firstElementChild;
        if (expected !== view.el) parent.insertBefore(view.el, expected);
        previous = view.el;
        const n = block.node, collapsible = block.children.length > 0 || n.type === 'scene';
        view.el.dataset['type'] = n.type;
        view.title.textContent = n.title; view.title.setAttribute('aria-level', String(Math.min(6, depth + 2)));
        view.fold.hidden = !collapsible; view.fold.textContent = folded.has(block.key) ? 'Expand' : 'Collapse';
        view.fold.setAttribute('aria-label', `${folded.has(block.key) ? 'Expand' : 'Collapse'} ${n.title}`);
        view.fold.setAttribute('aria-expanded', String(!folded.has(block.key)));
        view.body.hidden = folded.has(block.key); view.problem.hidden = !block.problem;
        view.problem.textContent = block.problem ? `${block.problem.message}${view.player ? ' The last valid scene is retained.' : ''}` : '';
        if (view.selection) view.selection.textContent = block.source.notebookId === notebookId ? 'Edit' : 'Open source';
        if (!block.scene && !block.problem) {
          const signature = JSON.stringify([n, n.type === 'import' ? block.children[0]?.sourceRevision : undefined]);
          if (view.textSignature !== signature) {
            view.textSignature = signature;
            view.content.replaceChildren();
            if (n.type === 'prose') for (const paragraph of n.text.split(/\n\s*\n/)) view.content.append(element('p', '', paragraph));
            if (n.type === 'matrix') {
              const math = element('div', 'nb-matrix');
              // Static objects can express exponent notation honestly even when
              // the animation's narrower numeral capability rejects that input.
              const numeral = (value: number) => String(value).replace(/e([+-]?\d+)/i, '\\times 10^{$1}');
              math.innerHTML = renderLatexToHtml(`\\begin{bmatrix}${n.rows.map(r => r.map(numeral).join('&')).join('\\\\')}\\end{bmatrix}`, { output: 'htmlAndMathml' });
              view.content.append(math);
            }
            if (n.type === 'import') view.content.append(element('p', 'nb-provenance', `Live import · source revision ${block.children[0]?.sourceRevision ?? 'unavailable'} · independent playback`));
            if (n.type === 'component') view.content.append(element('p', 'nb-provenance', `Component inputs: ${n.inputs.map(i => i.name).join(', ')}`));
          }
        }
        if (n.type === 'section' || n.type === 'import' || n.type === 'component' || n.type === 'scene') {
          const link = element('a', 'nb-outline-link', n.title); link.href = `#${view.el.id}`; link.style.paddingInlineStart = `${depth * .65}rem`; navigation.append(link);
        }
        const visible = ancestorsVisible && !folded.has(block.key);
        walk(block.children, view.children, depth + 1, visible); visibility.push([view, visible]);
      }
    };
    walk(blocks, root, 0, true);
    for (const [key, view] of views) if (!retained.has(key)) { view.player?.dispose(); view.el.remove(); views.delete(key); }
    outline.replaceChildren(element('h2', '', 'In this notebook'), navigation);
    for (const [view, visible] of visibility) synchronize(view, visible);
  }
  return { update, dispose() { if (disposed) return; disposed = true; for (const view of views.values()) { view.player?.pause(); view.player?.dispose(); } views.clear(); root.replaceChildren(); } };
}
