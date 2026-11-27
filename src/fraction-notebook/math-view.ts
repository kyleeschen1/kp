import type { Node as ProseNode } from 'prosemirror-model';
import type { NodeView } from 'prosemirror-view';
import katex from 'katex';
import { expressionToLatex } from '../math/expression.ts';
import { coefficientLimit, tangentLimit, type QuadraticCoefficients } from '../math/authoring/quadratic-contract.ts';
import { uuid } from '../notebook/model.ts';
import { mathDraftError, readMathViewport } from '../notebook/math-model.ts';
import type { NotebookMathRuntime } from '../notebook/math-runtime.ts';
import type { MathObjectCell } from './types.ts';
import { mountMathGraph } from './math-graph.ts';

export interface MathViewOwner {
  readonly runtime: NotebookMathRuntime;
  subscribe(listener: () => void): () => void;
  select(id: string): void;
  coefficient(id: string, field: keyof QuadraticCoefficients, text: string): void;
  tangent(id: string, text: string, preview: boolean): void;
  cancelPreview(): void;
  bind(button: HTMLButtonElement, command: string, occurrence: string): void;
  undo(redo: boolean): void;
}
export function readMathCell(node: ProseNode): MathObjectCell {
  const view: unknown = node.attrs['view']; if (view !== 'equation' && view !== 'graph') throw new Error('Unsupported mathematical view.');
  return { type: 'mathObject', id: uuid(node.attrs['id']), metadata: node.attrs['metadata'], resource: uuid(node.attrs['resource']), view,
    viewport: readMathViewport(node.attrs['viewport']), folded: node.attrs['folded'] === true };
}
export function createMathNodeView(initial: ProseNode, owner: MathViewOwner, editable = true): NodeView {
  let node = initial, cell = readMathCell(node), lastExpression = '', controlsFor = '';
  const el = <K extends keyof HTMLElementTagNameMap>(tag: K, className = '') => { const element = document.createElement(tag); element.className = className; return element; };
  const dom = el('section', 'fn-math-object'), heading = el('div', 'fn-math-heading'), label = el('span'), relation = el('span', 'fn-math-relation');
  dom.contentEditable = 'false'; dom.dataset['cellId'] = cell.id; dom.dataset['mathResource'] = cell.resource; dom.tabIndex = 0;
  const formula = el('div', 'fn-math-equation'), name = el('span'), notation = el('span'); formula.append(name, notation);
  const body = el('div', 'fn-math-body'), controls = el('div', 'fn-math-controls'), graphHost = el('div', 'fn-math-graph');
  const legend = el('p', 'fn-math-legend'), diagnostics = el('p', 'fn-math-diagnostic'), toolbar = el('div', 'fn-math-actions'); diagnostics.setAttribute('role', 'status');
  const fields = new Map<string, HTMLInputElement>(); let graph: ReturnType<typeof mountMathGraph> | undefined;
  const formsHost = el('div', 'fn-quadratic-forms');
  const formsEnabled = new URLSearchParams(location.search).get('forms') === '1';
  let forms: ReturnType<typeof import('./quadratic-forms-view.ts').mountQuadraticForms> | undefined;
  let loadingForms = false, disposed = false;
  let formsSource: QuadraticCoefficients | undefined;
  const updateForms = () => {
    if (!formsSource || disposed) return;
    if (forms) { forms.update(formsSource); return; }
    if (loadingForms) return;
    loadingForms = true;
    // Alternate forms are a lazy projection of the source, never the evaluator
    // used to draw the curve or another persisted mathematical resource.
    void import('./quadratic-forms-view.ts').then(module => {
      if (disposed) return;
      forms = module.mountQuadraticForms(formsHost);
      if (formsSource) forms.update(formsSource);
    }).catch(error => { if (!disposed) formsHost.textContent = `Forms unavailable: ${String(error)}`; })
      .finally(() => { loadingForms = false; });
  };
  const button = (title: string, command: string, parent = toolbar) => { const button = el('button'); button.type = 'button'; button.textContent = title; owner.bind(button, command, cell.id); parent.append(button); return button; };
  if (editable) button('▾', 'math.fold', heading).setAttribute('aria-label', 'Fold mathematical object');
  heading.append(label, relation); body.append(formula, controls, graphHost, formsHost, legend, diagnostics, toolbar); dom.append(heading, body);
  const select = () => owner.select(cell.id);
  dom.addEventListener('pointerdown', select, true); dom.addEventListener('focusin', select);
  dom.addEventListener('keydown', event => {
    if (editable && (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'z') { event.preventDefault(); event.stopPropagation(); owner.undo(event.shiftKey); }
    if (event.key === 'Escape' && event.target instanceof HTMLInputElement) { event.preventDefault(); owner.cancelPreview(); dom.focus(); }
  });
  const field = (key: string, title: string, value: string, change: (value: string) => void) => {
    const wrapper = el('label'), input = el('input'); wrapper.append(document.createTextNode(title), input);
    input.type = 'text'; input.inputMode = 'decimal'; input.value = value; input.maxLength = 32; input.setAttribute('aria-label', title);
    input.oninput = () => change(input.value); controls.append(wrapper); fields.set(key, input); return input;
  };
  const draw = () => {
    const resource = owner.runtime.resource(cell.resource), source = resource.kind === 'quadratic' ? resource : owner.runtime.resource(resource.source);
    dom.dataset['mathKind'] = resource.kind; dom.dataset['mathView'] = cell.view; dom.dataset['folded'] = String(cell.folded);
    dom.setAttribute('aria-label', `${resource.name} ${resource.kind} ${cell.view}`); dom.dataset['resourceRevision'] = String(resource.revision);
    label.textContent = `${resource.name} · ${resource.kind === 'quadratic' ? 'polynomial' : resource.kind}`;
    relation.textContent = resource.kind === 'quadratic' ? '' : `from ${source.name}`;
    const error = mathDraftError(resource) ?? mathDraftError(source); diagnostics.textContent = error ?? '';
    const fold = heading.querySelector('button'); if (fold) { fold.textContent = cell.folded ? '▸' : '▾'; fold.setAttribute('aria-expanded', String(!cell.folded)); }
    body.hidden = cell.folded;
    formsHost.hidden = !formsEnabled || resource.kind !== 'quadratic' || cell.view !== 'graph';
    formsSource = !formsHost.hidden && resource.kind === 'quadratic' ? resource.coefficients : undefined;
    if (cell.folded) return;
    updateForms();
    const latex = expressionToLatex(owner.runtime.expression(resource.id), { numbers: 'round-trip' });
    name.textContent = `${resource.name}(x) = `;
    if (latex !== lastExpression) { katex.render(latex, notation, { throwOnError: true, trust: false, output: 'htmlAndMathml' }); lastExpression = latex; }
    const nextControls = `${resource.id}:${resource.kind}:${cell.view}`;
    if (controlsFor !== nextControls) {
      controls.replaceChildren(); toolbar.replaceChildren(); fields.clear(); controlsFor = nextControls;
      if (editable && resource.kind === 'quadratic') {
        if (cell.view === 'equation') {
          for (const key of ['a', 'b', 'c'] as const) field(key, key, resource.draft[key], value => owner.coefficient(resource.id, key, value));
          controls.title = `a x² + b x + c · each coefficient between -${coefficientLimit} and ${coefficientLimit}`;
          button('Graph', 'math.graph'); button('Derivative', 'math.derivative'); button('Tangent', 'math.tangent');
        }
      } else if (editable && resource.kind === 'tangent') {
        field('at', 'Contact x', resource.draftAt, value => owner.tangent(resource.id, value, false));
        const slider = el('input'); slider.type = 'range'; slider.min = String(-tangentLimit); slider.max = String(tangentLimit); slider.step = '0.01';
        slider.setAttribute('aria-label', 'Move tangent point'); controls.append(slider); fields.set('slider', slider);
        slider.oninput = () => owner.tangent(resource.id, slider.value, true);
        slider.onchange = () => owner.tangent(resource.id, slider.value, false);
        slider.onpointercancel = () => owner.cancelPreview();
        button('Play', 'math.play'); button('Reverse', 'math.reverse'); button('Pause', 'math.pause');
      } else if (editable) button('Graph', 'math.graph');
      if (editable && cell.view === 'graph') { button('Zoom out', 'math.zoom-out'); button('Zoom in', 'math.zoom-in'); }
    }
    for (const [key, input] of fields) {
      const value = resource.kind === 'quadratic' ? resource.draft[key as keyof QuadraticCoefficients]
        : resource.kind === 'tangent' ? key === 'slider' ? String(resource.at) : resource.draftAt : undefined;
      if (value !== undefined && input.value !== value) input.value = value;
    }
    graphHost.hidden = cell.view !== 'graph' || cell.folded;
    if (!graphHost.hidden) { if (!graph) graph = mountMathGraph(graphHost, cell, owner.runtime); else graph.update(cell); }
    legend.textContent = cell.view === 'graph' ? `${source.name}${resource.kind === 'quadratic' ? '' : ` · ${resource.name}`} · x ${cell.viewport.x.join(' … ')} · y ${cell.viewport.y.join(' … ')}` : '';
    if (resource.kind === 'tangent') {
      const { slope } = owner.runtime.tangentSample(resource.id);
      legend.textContent = `At x = ${Number(resource.at.toFixed(2))}, slope = ${Number(slope.toFixed(3))}`;
    }
  };
  const unsubscribe = owner.subscribe(draw); draw();
  return { dom, update(next) { if (next.type !== node.type || next.attrs['id'] !== cell.id) return false; node = next; cell = readMathCell(next); draw(); return true; },
    selectNode() { dom.classList.add('ProseMirror-selectednode'); }, deselectNode() { dom.classList.remove('ProseMirror-selectednode'); },
    stopEvent: event => event.target instanceof Element && Boolean(event.target.closest('input, button')),
    ignoreMutation: () => true, destroy() { disposed = true; unsubscribe(); graph?.dispose(); forms?.dispose(); } };
}
