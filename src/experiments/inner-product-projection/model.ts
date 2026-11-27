import { compileKpVectorDotProjectionSemanticModel } from '../../animation/vector-dot-projection-semantic-model.ts';
import { kpVectorDotProjectionExemplarContract } from '../../animation/vector-dot-projection-exemplar-contract.ts';
import type { KpVector2 } from '../../animation/vector-dot-projection-exemplar-contract.ts';

export const cues = {
  'source-pose': 'How much of a lies along b?',
  'component-pair-x': 'Multiply the two x components.',
  'component-pair-y': 'Multiply the two y components.',
  'dot-settlement': 'Add those products: the dot product is a scalar.',
  'projection-scale': 'Divide by b · b to find the multiple of b.',
  'projection-drop': 'Drop from the tip of a to the line through b.',
  'orthogonal-decomposition': 'The remainder runs perpendicular to b.',
  'native-settlement': 'The parallel part and the remainder add back to a.'
} as const;
export type ProjectionBeat = keyof typeof cues;
const isProjectionBeat = (value: string): value is ProjectionBeat => Object.hasOwn(cues, value);
export const beatIds = kpVectorDotProjectionExemplarContract.beatIds.map(id => {
  if (!isProjectionBeat(id)) throw new Error(`Missing projection explanation for ${id}.`);
  return id;
});
export const examples = [
  { id: 'positive', title: 'Positive', a: [4, 2], b: [1, 1] },
  { id: 'negative', title: 'Negative', a: [-4, 2], b: [1, 1] },
  { id: 'orthogonal', title: 'Perpendicular', a: [2, -2], b: [1, 1] },
  { id: 'zero-source', title: 'Zero a', a: [0, 0], b: [1, 1] },
  { id: 'zero-target', title: 'Zero b', a: [4, 2], b: [0, 0] }
] as const satisfies readonly { id: string; title: string; a: KpVector2; b: KpVector2 }[];

export type ProjectionDraft = readonly [string, string, string, string];
const coordinate = (text: string) => /^[+-]?\d+$/.test(text.trim()) && Math.abs(Number(text)) <= 1000;
export function prepareProjection(draft: ProjectionDraft) {
  const bad = draft.findIndex(value => !coordinate(value));
  if (bad !== -1) return { status: 'invalid' as const, index: bad,
    message: 'Use integer coordinates from −1000 to 1000. The last valid view is retained.' };
  const a: KpVector2 = [Number(draft[0]), Number(draft[1])], b: KpVector2 = [Number(draft[2]), Number(draft[3])];
  const result = compileKpVectorDotProjectionSemanticModel({ id: 'projection.editable',
    sourceVectorId: 'projection.a', targetVectorId: 'projection.b',
    projectionVectorId: 'projection.parallel', residualVectorId: 'projection.residual', sourceVector: a, targetVector: b });
  if (result.status === 'rejected') return { status: 'undefined' as const, a, b,
    diagnostics: result.diagnostics, message: result.diagnostics.map(item => item.message).join(' ') };
  return { status: 'ready' as const, model: result.model, a, b };
}
export function readProjectionUrl(params: URLSearchParams) {
  const a = params.get('a'), b = params.get('b'), beat = params.get('beat') ?? 'source-pose';
  const values = a === null && b === null ? ['4', '2', '1', '1'] : [...(a ?? '').split(','), ...(b ?? '').split(',')];
  if ((a !== null || b !== null) && (a?.split(',').length !== 2 || b?.split(',').length !== 2)
    || values.length !== 4 || values.some(value => !coordinate(value)) || !beatIds.some(id => id === beat)
    || ['a', 'b', 'beat'].some(key => params.getAll(key).length > 1))
    return { status: 'invalid' as const, message: 'This link has unsupported coordinates or a step. Showing the initial example.' };
  const draft: ProjectionDraft = [values[0]!, values[1]!, values[2]!, values[3]!];
  return { status: 'ready' as const, draft, progress: beatIds.indexOf(beatIds.find(id => id === beat)!) / 8 };
}
export const numberText = (value: number) => String(Number(value.toPrecision(6)));
export const vectorLatex = (value: KpVector2) => `(${value.map(numberText).join(',')})`;
