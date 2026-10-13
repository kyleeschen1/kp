import { renderLatexToHtml } from '../../rendering/katex-adapter.ts';
import katex from 'katex';
import { renderKpFocusDeckAnnotation } from '../../tutorial/focus-deck-annotation.ts';
import { rowOperationLatex, rowSystemLatex } from './row-workbench-model.ts';
import type { CompiledRowWorkbench } from './row-workbench-source.ts';

/** Same compiled endpoints and prose as playback; this export needs no clock. */
export function rowWorkbenchReading(model: CompiledRowWorkbench, output: 'htmlAndMathml' | 'mathml' = 'htmlAndMathml') {
  const math = (latex: string) => output === 'mathml'
    ? katex.renderToString(latex, { output: 'mathml', displayMode: true, trust: false, throwOnError: true })
    : renderLatexToHtml(latex, { output, displayMode: true });
  const note = (id: string, text: string) => renderKpFocusDeckAnnotation({ entityId: id, text, role: 'support' });
  return `<article class="kp-focus-deck"><p>${note(model.id, model.introduction)}</p>${math(rowSystemLatex(model.initial, model.unknowns))}${model.steps.map(step =>
    `<section data-authored-step="${step.id}"><p>${note(step.id, step.during)}</p>${math(rowOperationLatex(step.operation))}${math(rowSystemLatex(step.checked.after, model.unknowns))}<p>${note(step.id, step.after)}</p><p>Inverse:</p>${math(rowOperationLatex(step.checked.inverse))}<p>${step.checked.witness.residualIdentity}</p></section>`
  ).join('')}</article>`;
}
