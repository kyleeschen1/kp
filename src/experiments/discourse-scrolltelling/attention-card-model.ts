import { projectKpTutorialCorridorTravel, type KpTutorialMotionCorridor } from '../../tutorial/kp-tutorial-motion.ts';
import type { KpScalarValue } from '../../math/typed-semantic-math.ts';
import { passage } from '../dot-product-passage/source.ts';
import { valueOf } from '../dot-product-passage/model.ts';

type Annotation = { id: string; text: string; refs: readonly KpScalarValue[] } & (
  { kind: 'comment' | 'focus'; at: number } | { kind: 'transform'; from: number; to: number });
const products = passage.dot.pairs.map(pair => pair.product);
export const attentionComments: readonly Annotation[] = [
  { id: 'contributions', text: 'Each pair makes one contribution.', kind: 'comment', at: .25, refs: passage.dot.pairs.flatMap(pair => [pair.left, pair.right]) },
  { id: 'multiply', text: 'First, they multiply.', kind: 'transform', from: .25, to: .5, refs: products },
  { id: 'signs', text: 'Keep the negative signs.', kind: 'focus', at: .5, refs: products.filter(ref => valueOf(ref) < 0) },
  { id: 'add', text: 'Then the products are added.', kind: 'transform', from: .5, to: 1, refs: products },
  { id: 'result', text: 'One row and one column give one entry.', kind: 'comment', at: 1, refs: [passage.dot.result] },
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
