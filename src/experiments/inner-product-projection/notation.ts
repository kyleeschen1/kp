import { renderLatexToHtml } from '../../rendering/katex-adapter.ts';
import type { KpVectorDotProjectionSemanticModel } from '../../animation/vector-dot-projection-semantic-model.ts';
import { vectorLatex, numberText, type ProjectionBeat } from './model.ts';

const number = (n: number) => n < 0 ? `(${numberText(n)})` : numberText(n);
export const mathHtml = (latex: string) => renderLatexToHtml(latex, { output: 'htmlAndMathml' });
/** Format the admitted values; do not reevaluate dot products in a view. */
export function notation(model: KpVectorDotProjectionSemanticModel, beat: ProjectionBeat) {
  const scale = `\\frac{${model.dotProduct}}{${model.targetNormSquared}}`;
  const p = vectorLatex(model.projectionVector), r = vectorLatex(model.residualVector);
  switch (beat) {
    case 'source-pose': return [`\\mathbf a=${vectorLatex(model.sourceVector)}`, `\\mathbf b=${vectorLatex(model.targetVector)}`];
    case 'component-pair-x': case 'component-pair-y': {
      const term = model.componentLineage[beat === 'component-pair-x' ? 0 : 1]!;
      return [`a_${term.axis}b_${term.axis}=${number(term.sourceComponent)}\\cdot${number(term.targetComponent)}=${term.product}`];
    }
    case 'dot-settlement': return [
      '\\mathbf a\\cdot\\mathbf b=a_xb_x+a_yb_y',
      `=${model.componentLineage.map(term => number(term.product)).join('+')}=${model.dotProduct}`
    ];
    case 'projection-scale': return ['\\alpha=\\frac{\\mathbf a\\cdot\\mathbf b}{\\mathbf b\\cdot\\mathbf b}', `=${scale}\\approx ${numberText(model.projectionScale.value)}`];
    case 'projection-drop': return ['\\mathbf p=\\alpha\\mathbf b', `=${scale}\\mathbf b\\approx ${p}`];
    case 'orthogonal-decomposition': return ['\\mathbf r=\\mathbf a-\\mathbf p', `\\mathbf r\\approx ${r}`];
    case 'native-settlement': return ['\\mathbf a=\\mathbf p+\\mathbf r', `\\mathbf p\\approx ${p}`, `\\mathbf r\\approx ${r}`];
  }
}
export function interpretation(model: KpVectorDotProjectionSemanticModel) {
  if (model.sourceNormSquared === 0) return 'Zero a projects to zero. Its direction and angle are undefined.';
  if (model.dotProduct === 0) return 'Perpendicular: the dot product and projected vector are zero.';
  return model.dotProduct > 0 ? 'Positive: the projection points along b.' : 'Negative: the projection points opposite b.';
}
