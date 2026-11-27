import type { Node as ProseNode } from 'prosemirror-model';
import type { NodeView } from 'prosemirror-view';
import katex from 'katex';
import { uuid } from '../notebook/model.ts';
import { invalidResourceFields, matrixFields, vectorFields, type ResourceEdit } from '../math-resources/public-api.ts';
import type { MatrixObjectCell } from './types.ts';
import type { MatrixNotebookRuntime } from './matrix-runtime.ts';
import { mountMatrixGraph } from './matrix-graph.ts';
import { createMatrixExplanation } from './matrix-explanation.ts';
import type { MatrixNote, MatrixBinding } from './matrix-reuse-data.ts';

export interface MatrixViewOwner {
  readonly runtime: MatrixNotebookRuntime;
  subscribe(listener: () => void): () => void;
  select(id: string): void;
  edit(id: string, edit: ResourceEdit): void;
  bind(button: HTMLButtonElement, command: string, cell: string): void;
  undo(redo: boolean): void;
  details?(id: string): { readonly note: MatrixNote | undefined; readonly binding: MatrixBinding | undefined };
}
export function readMatrixCell(node: ProseNode): MatrixObjectCell {
  return { type: 'matrixObject', id: uuid(node.attrs['id']), metadata: node.attrs['metadata'], resource: uuid(node.attrs['resource']), occurrence: uuid(node.attrs['occurrence']), folded: node.attrs['folded'] === true };
}
export function createMatrixNodeView(initial: ProseNode, owner: MatrixViewOwner, editable = true): NodeView {
  let node = initial, cell = readMatrixCell(node), lastLatex = '';
  const el = <K extends keyof HTMLElementTagNameMap>(tag: K, cls = '') => { const e = document.createElement(tag); e.className = cls; return e; };
  const dom = el('section', 'fn-math-object fn-matrix-object'), heading = el('div', 'fn-math-heading'), title = el('span');
  dom.contentEditable = 'false'; dom.tabIndex = 0; dom.dataset['cellId'] = cell.id;
  const body = el('div', 'fn-math-body'), formula = el('div', 'fn-math-equation'), controls = el('div', 'fn-math-controls');
  const note = el('section', 'fn-matrix-note'), noteTitle = el('h3'), noteContent = el('p'), provenance = el('p', 'fn-matrix-provenance');
  note.append(noteTitle, noteContent); note.setAttribute('aria-label', 'Matrix explanation note');
  const host = el('div', 'fn-math-graph'), legend = el('p', 'fn-math-legend'), diagnostic = el('p', 'fn-math-diagnostic'), toolbar = el('div', 'fn-math-actions');
  diagnostic.setAttribute('role', 'status');
  let graph: ReturnType<typeof mountMatrixGraph> | undefined;
  const explanationHost = el('div', 'fn-matrix-explanation');
  let explanation: ReturnType<typeof createMatrixExplanation> | undefined, explanationDiagnostic = '';
  const fields: { input: HTMLInputElement; edit: (text: string) => ResourceEdit; key: string }[] = [];
  const button = (title: string, command: string, parent = toolbar) => {
    const b = el('button'); b.type = 'button'; b.textContent = title; owner.bind(b, command, cell.id); parent.append(b); return b;
  };
  if (editable) button('▾', 'matrix.fold', heading).setAttribute('aria-label', 'Fold mathematical object');
  heading.append(title); body.append(note, formula, controls, host, explanationHost, legend, provenance, diagnostic, toolbar); dom.append(heading, body);
  const initialView = owner.runtime.read(cell).view;
  if (editable) {
    if (initialView.view === 'equation') {
      const add = (name: string, key: string, edit: (text: string) => ResourceEdit) => {
        const label = el('label'), input = el('input'); label.textContent = name; input.type = 'text'; input.inputMode = 'decimal'; input.maxLength = 32;
        input.setAttribute('aria-label', name); label.append(input); controls.append(label); fields.push({ input, edit, key });
        input.addEventListener('input', () => owner.edit(cell.resource, edit(input.value)));
      };
      matrixFields.forEach((field, index) => add(`A${Math.floor(index / 2) + 1}${index % 2 + 1}`, `matrix.${field}`, text => ({ kind: 'matrix', field, text })));
      vectorFields.forEach(field => add(`v${field === 'x' ? '1' : '2'}`, `vector.${field}`, text => ({ kind: 'vector', field, text })));
    }
    button('Graph', 'matrix.graph');
    button('Explain', 'matrix.explain');
    if (initialView.view === 'columns') button('Return to inputs', 'matrix.return-to-source');
    if (initialView.view === 'graph') { button('Zoom in', 'matrix.zoom-in'); button('Zoom out', 'matrix.zoom-out'); }
  }
  const render = () => {
    const { document: d, view } = owner.runtime.read(cell);
    const details = owner.details?.(cell.resource), binding = details?.binding;
    note.hidden = !details?.note; noteTitle.textContent = details?.note?.title ?? ''; noteContent.textContent = details?.note?.content ?? '';
    provenance.textContent = binding ? `${binding.kind === 'derive' ? 'Derived matrix · local vector' : 'Transcluded source'} · ${binding.mode} · revision ${binding.revision}` : '';
    provenance.hidden = !binding;
    dom.dataset['matrixResource'] = cell.resource; dom.dataset['matrixOccurrence'] = cell.occurrence; dom.dataset['mathView'] = view.view;
    title.textContent = view.view === 'equation' ? 'A · v = Av' : view.view === 'columns' ? 'Av · column combination' : 'v → Av · linked graph'; body.hidden = cell.folded;
    if (cell.folded) { explanation?.dispose(); explanation = undefined; return; }
    const sample = owner.runtime.sample(d.id);
    if (sample.latex !== lastLatex) { katex.render(sample.latex, formula, { throwOnError: true }); lastLatex = sample.latex; }
    const invalid = invalidResourceFields(d);
    for (const field of fields) {
      const edit = field.edit(''), value = edit.kind === 'matrix' ? d.matrix.draft[edit.field] : d.vector.draft[edit.field];
      if (field.input.value !== value) field.input.value = value;
      field.input.setAttribute('aria-invalid', String(invalid.includes(field.key)));
      field.input.readOnly = !!binding && (binding.kind === 'transclude' || edit.kind === 'matrix');
    }
    diagnostic.textContent = invalid.length ? 'Incomplete or out-of-range input. Showing the last valid values (−10 to 10).' : explanationDiagnostic;
    host.hidden = view.view !== 'graph';
    explanationHost.hidden = view.view !== 'columns';
    if (view.view === 'columns') {
      explanation ??= createMatrixExplanation(explanationHost, cell.occurrence, editable ? 'editor' : 'reader', () => owner.runtime.explanation(cell.resource), message => {
        explanationDiagnostic = message; diagnostic.textContent = message;
      });
      void explanation.update();
    }
    legend.textContent = `Av = (${sample.result.join(', ')})`;
    if (view.view === 'graph') {
      graph ??= mountMatrixGraph(host, cell.id); graph.update(view.extent, sample.input, sample.result);
      legend.textContent += ` · ○ v / ● Av · range ±${view.extent}`;
      if ([...sample.input, ...sample.result].some(n => Math.abs(n) > view.extent)) legend.textContent += ' · A vector extends beyond this view; zoom out.';
    }
  };
  dom.addEventListener('pointerdown', () => owner.select(cell.id), true); dom.addEventListener('focusin', () => owner.select(cell.id));
  dom.addEventListener('keydown', event => {
    if (editable && (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') { event.preventDefault(); owner.undo(event.shiftKey); }
  });
  const unsubscribe = owner.subscribe(render); render();
  return { dom, update(next) {
    if (next.type !== node.type || next.attrs['id'] !== cell.id || next.attrs['resource'] !== cell.resource || next.attrs['occurrence'] !== cell.occurrence) return false;
    node = next; cell = readMatrixCell(next); render(); return true;
  }, selectNode() { dom.classList.add('ProseMirror-selectednode'); }, deselectNode() { dom.classList.remove('ProseMirror-selectednode'); },
  stopEvent: () => true, ignoreMutation: () => true, destroy() { unsubscribe(); graph?.dispose(); explanation?.dispose(); } };
}
