import { createKpReaderSemanticFocusService } from '../../reader/runtime/semantic-focus.ts';
import { renderLatexToHtml } from '../../rendering/katex-adapter.ts';
import type { LinearSystem } from '../../math/linear-system-row-operation.ts';
import type { CompiledRowWorkbench } from './row-workbench-source.ts';
import { projectRowEquations, rowEquationFocus } from './row-equations.ts';

/** Local adapter: one semantic focus owner resolves both representations.
 * The session supplies committed state; this panel never samples arithmetic. */
export function mountRowEquationPanel(root: HTMLElement, model: CompiledRowWorkbench) {
  const panel = root.querySelector<HTMLElement>('[data-equations]')!;
  const heading = root.querySelector<HTMLElement>('[data-equation-status]')!;
  let projection = projectRowEquations(model.initial, model.unknowns, model.id), busy = false;
  const focus = createKpReaderSemanticFocusService(projection.rows.map(row => row.slotId));
  const matrixButtons = [...root.querySelectorAll<HTMLButtonElement>('[data-matrix-row]')];
  const equationButtons = projection.rows.map(row => {
    const button = document.createElement('button'); button.type = 'button'; button.className = 'row-wb-equation';
    button.dataset['equationRow'] = String(row.row); panel.append(button); return button;
  });
  const paint = () => {
    // Moving rows are not settled constraints at these positions. Retain the
    // selection intent, but withdraw its paint until the atomic endpoint.
    const selectors = rowEquationFocus(projection, busy ? [] : focus.getSnapshot().objectRefs);
    projection.rows.forEach((row, index) => {
      for (const [button, selector] of [[matrixButtons[index]!, row.matrixSelector], [equationButtons[index]!, row.equationSelector]] as const) {
        button.setAttribute('aria-pressed', String(selectors.has(selector)));
        button.dataset['selectorId'] = selector;
        button.disabled = busy;
      }
    });
  };
  const stop = focus.subscribe(paint);
  projection.rows.forEach((row, index) => {
    for (const button of [matrixButtons[index]!, equationButtons[index]!]) button.onclick = event => {
      if (busy) return;
      const selected = focus.getSnapshot().objectRefs.includes(row.slotId);
      focus.clear('keyboard'); focus.clear('pointer');
      focus.set(event.detail === 0 ? 'keyboard' : 'pointer', selected ? [] : [row.slotId]);
    };
  });
  const update = (system: LinearSystem) => {
    projection = projectRowEquations(system, model.unknowns, model.id);
    projection.rows.forEach((row, index) => {
      const button = equationButtons[index]!;
      button.innerHTML = `<span>Row ${index + 1}</span>${renderLatexToHtml(row.latex, { displayMode: false, output: 'htmlAndMathml' })}`;
      button.dataset['sourceIds'] = row.sourceIds.join(' ');
      button.dataset['latex'] = row.latex;
      matrixButtons[index]!.dataset['sourceIds'] = row.sourceIds.join(' ');
    });
    paint();
  };
  return {
    update,
    preview(pending: boolean) {
      busy = pending;
      heading.textContent = pending ? 'Equations before completion — preview in progress' : 'The same system as equations — select a row';
      paint();
    },
    reset() { focus.clear('keyboard'); focus.clear('pointer'); },
    dispose() { stop(); focus.dispose(); for (const button of [...matrixButtons, ...equationButtons]) button.onclick = null; },
  };
}
