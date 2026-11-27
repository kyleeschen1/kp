import katex from 'katex';
import { prepareQuadraticForms } from '../math/authoring/quadratic-forms.ts';
import type { QuadraticCoefficients } from '../math/authoring/quadratic-contract.ts';
import './quadratic-forms.css';

/** The curve continues to use the source expression. These numerical readings
 * explain useful forms without making rounded display values new authority. */
export function mountQuadraticForms(host: HTMLElement) {
  const doc = host.ownerDocument;
  const title = doc.createElement('p'); title.className = 'fn-forms-title';
  title.textContent = 'One curve, three ways to read it';
  const list = doc.createElement('dl');
  const rows = (['expanded', 'vertex', 'factored'] as const).map(kind => {
    const row = doc.createElement('div'); row.dataset['form'] = kind;
    const name = doc.createElement('dt'); name.textContent = kind[0]!.toUpperCase() + kind.slice(1);
    const value = doc.createElement('dd'), formula = doc.createElement('div'), note = doc.createElement('p');
    formula.className = 'fn-form-equation'; note.className = 'fn-form-note';
    value.append(formula, note); row.append(name, value); list.append(row);
    return { kind, row, formula, note };
  });
  const caveat = doc.createElement('p'); caveat.className = 'fn-form-note';
  caveat.textContent = 'Vertex and factored values are numerical approximations.';
  host.replaceChildren(title, list, caveat);
  let previous = '', disposed = false;
  return {
    update(coefficients: QuadraticCoefficients) {
      if (disposed) return;
      const key = JSON.stringify(coefficients); if (key === previous) return;
      const forms = prepareQuadraticForms(coefficients);
      host.dataset['degree'] = String(forms.degree);
      for (const row of rows) {
        const form = forms[row.kind]; row.row.dataset['state'] = form.kind;
        if (form.kind === 'available') {
          katex.render(form.latex, row.formula, { throwOnError: true, trust: false, output: 'htmlAndMathml' });
          row.note.textContent = row.kind === 'expanded' ? 'Read the coefficients of each power.'
            : row.kind === 'vertex' ? 'Read the turning point and direction of opening.'
            : 'Read the real zeros from the factors.';
        } else { row.formula.replaceChildren(); row.note.textContent = form.message; }
      }
      previous = key;
    },
    dispose() { disposed = true; host.replaceChildren(); }
  };
}
