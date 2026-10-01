import { projectKpTutorialCorridorTravel, type KpTutorialMotionCorridor } from '../../tutorial/kp-tutorial-motion.ts';
import type { KpScalarValue } from '../../math/typed-semantic-math.ts';
import { passage } from '../dot-product-passage/source.ts';
import { valueOf } from '../dot-product-passage/model.ts';

type Annotation = { id: string; text: string; paragraphs?: readonly string[]; refs: readonly KpScalarValue[] } & (
  { kind: 'comment' | 'focus'; at: number } | { kind: 'transform'; from: number; to: number });
const products = passage.dot.pairs.map(pair => pair.product);
export const attentionComments: readonly Annotation[] = [
  { id: 'inputs', text: 'Take a row and a column.', paragraphs: ['The row is [2, −1, 3]. The column is [4; 5; −2]. Each has three entries.', 'In matrix multiplication, this row and this column supply one entry of the answer.'], kind: 'comment', at: 0, refs: passage.dot.pairs.flatMap(pair => [pair.left, pair.right]) },
  { id: 'pair', text: 'Match corresponding entries.', paragraphs: ['First with first, second with second, third with third: 2 with 4, −1 with 5, and 3 with −2.', 'The column turns into position. These are the same entries, arranged so we can read each contribution.'], kind: 'transform', from: 0, to: .25, refs: passage.dot.pairs.flatMap(pair => [pair.left, pair.right]) },
  { id: 'contributions', text: 'Each pair makes one contribution.', paragraphs: ['A row covector assigns a weight to each coordinate. The column supplies a value for each coordinate in the matching basis. Corresponding positions refer to the same coordinate.', 'Multiplication happens within each pair; addition combines the contributions across all three positions.'], kind: 'comment', at: .25, refs: passage.dot.pairs.flatMap(pair => [pair.left, pair.right]) },
  { id: 'multiply', text: 'First, they multiply.', kind: 'transform', from: .25, to: .5, refs: products },
  { id: 'signs', text: 'Keep the negative signs.', kind: 'focus', at: .5, refs: products.filter(ref => valueOf(ref) < 0) },
  { id: 'add', text: 'Then the products are added.', kind: 'transform', from: .5, to: 1, refs: products },
  { id: 'result', text: 'One row and one column give one entry.', paragraphs: ['8 − 5 − 6 = −3.', 'In a matrix product, −3 belongs at the intersection of the selected row and column. Other entries repeat the same rule with different rows or columns.'], kind: 'comment', at: 1, refs: [passage.dot.result] },
];
const weights = attentionComments.map(comment => comment.kind === 'transform' ? 1 : .3);
const total = weights.reduce((a, b) => a + b, 0);
const intervals = weights.map((weight, index) => ({ start: weights.slice(0, index).reduce((a, b) => a + b, 0) / total, span: weight / total }));
export const attentionCorridor: KpTutorialMotionCorridor = {
  startViewportRatio: 0, endViewportRatio: -3,
  keyframes: [{ travel: 0, progress: 0 }, { travel: 1, progress: 1 }],
};
export function attentionFrame(travel: number, reduced = false) {
  if (!Number.isFinite(travel)) throw new Error('Attention travel must be finite.');
  const t = Math.max(0, Math.min(1, travel));
  let index = 0;
  intervals.forEach((interval, i) => { if (t >= interval.start) index = i; });
  const comment = attentionComments[index]!;
  const interval = intervals[index]!;
  const local = (t - interval.start) / interval.span;
  if (comment.kind !== 'transform') return { index, comment, phase: 'read', progress: comment.at, motion: 0 };
  const motion = reduced ? (local < .8 ? 0 : 1) : projectKpTutorialCorridorTravel({
    ...attentionCorridor, keyframes: [{ travel: 0, progress: 0 }, { travel: .2, progress: 0 }, { travel: .8, progress: 1 }, { travel: 1, progress: 1 }],
  }, local);
  return { index, comment, phase: local < .2 ? 'read' : local < .8 ? 'watch' : 'inspect', progress: comment.from + (comment.to - comment.from) * motion, motion };
}
export function attentionTravel(index: number, motion?: number) {
  const comment = attentionComments[index], interval = intervals[index];
  if (!Number.isInteger(index) || !comment || !interval) throw new Error('Unknown attention comment.');
  if (motion !== undefined && (comment.kind !== 'transform' || !Number.isFinite(motion) || motion < 0 || motion > 1)) throw new Error('Only transformations accept motion in [0, 1].');
  return interval.start + interval.span * (motion === undefined ? .1 : .2 + .6 * motion);
}

/** Measured paragraph landings, rather than text length guesses, own scrolling. */
export function attentionAtPosition(landings: readonly number[], y: number) {
  if (landings.length !== attentionComments.length + 1 || !Number.isFinite(y) || landings.some((v, i) => !Number.isFinite(v) || (i > 0 && v <= landings[i - 1]!))) throw new Error('Attention needs ordered finite reading boundaries.');
  let index = 0;
  landings.slice(0, -1).forEach((start, i) => { if (y >= start) index = i; });
  const local = Math.max(0, Math.min(1, (y - landings[index]!) / (landings[index + 1]! - landings[index]!)));
  return intervals[index]!.start + intervals[index]!.span * local;
}
export function attentionPosition(landings: readonly number[], index: number, motion?: number) {
  attentionAtPosition(landings, 0); attentionTravel(index, motion);
  return landings[index]! + (landings[index + 1]! - landings[index]!) * (motion === undefined ? .1 : .2 + .6 * motion);
}

export type RevealBoundary = { start: number; clear: number; end: number };
export function revealFrame(boundaries: readonly RevealBoundary[], y: number, reduced = false) {
  if (boundaries.length !== attentionComments.length || !Number.isFinite(y) || boundaries.some((b, i) =>
    ![b.start, b.clear, b.end].every(Number.isFinite) || b.clear <= b.start || b.end <= b.clear ||
    (i > 0 && b.start <= boundaries[i - 1]!.end))) throw new Error('Reveal boundaries must be finite, ordered and leave room for inspection.');
  let index = 0;
  boundaries.forEach((b, i) => { if (y >= b.start) index = i; });
  const boundary = boundaries[index]!, comment = attentionComments[index]!;
  const cleared = y >= boundary.clear;
  const rawMotion = Math.max(0, Math.min(1, (y - boundary.clear) / (boundary.end - boundary.clear)));
  const motion = reduced ? (rawMotion >= 1 ? 1 : 0) : rawMotion;
  const progress = comment.kind === 'transform' ? comment.from + (comment.to - comment.from) * motion : comment.at;
  return { index, comment, progress, motion, cleared, phase: !cleared ? 'read' : rawMotion < 1 ? 'watch' : 'inspect' };
}
