import type { matrixProduct } from '../math/matrix-product.ts';
import { MatrixColumnGap } from '../experiments/matrix-column-product/environment.ts';
import { columnExampleFromVectorProduct, numberOf, sample, type ColumnExample } from '../experiments/matrix-column-combinations/model.ts';

export type ColumnPoint = readonly [number, number];
export interface ColumnGeometryTerm {
  readonly index: number;
  readonly columnId: string;
  readonly coefficientId: string;
  readonly columnEntryIds: readonly [string, string];
  readonly productEntryIds: readonly [string, string];
  readonly column: ColumnPoint;
  readonly weight: number;
  readonly contribution: ColumnPoint;
}
export interface PreparedColumnGeometry {
  readonly scene: ColumnExample;
  readonly productId: string;
  readonly combinationId: string;
  readonly matrixId: string;
  readonly inputId: string;
  readonly terms: readonly [ColumnGeometryTerm, ColumnGeometryTerm];
  readonly result: Readonly<{ id: string; matrixId: string; entryIds: readonly [string, string]; value: ColumnPoint }>;
  /** Both axes use this same source-fixed domain, including every transit endpoint. */
  readonly domain: readonly [number, number];
}
export interface ColumnGeometrySample {
  readonly progress: number;
  readonly index: number;
  readonly local: number;
  readonly beatId: ColumnExample['beats'][number]['id'];
  readonly terms: readonly Readonly<ColumnGeometryTerm & {
    readonly start: ColumnPoint;
    readonly end: ColumnPoint;
    readonly role: 'column' | 'contribution';
  }>[];
  readonly result: PreparedColumnGeometry['result'] & Readonly<{
    start: ColumnPoint; end: ColumnPoint; visible: boolean;
  }>;
}

const point = (x: number, y: number): ColumnPoint => Object.freeze([x, y]);
const origin = point(0, 0);
const pair = <T>(values: readonly T[]): readonly [T, T] => {
  if (values.length !== 2 || values[0] === undefined || values[1] === undefined)
    throw new MatrixColumnGap('Column geometry requires exactly two entries.');
  return Object.freeze([values[0], values[1]]);
};

/** Read the existing interpretation's numbers and identities once. The graph
 * projects its contribution entries and result; it never multiplies or sums
 * source operands to invent another mathematical answer. */
export function prepareColumnGeometry(product: ReturnType<typeof matrixProduct>): PreparedColumnGeometry {
  const scene = columnExampleFromVectorProduct(product), combination = scene.combination;
  const terms = pair(combination.terms.map(term => Object.freeze({
    index: term.index, columnId: term.vector.id, coefficientId: term.coefficient.id,
    columnEntryIds: pair(term.vector.entries.map(entry => entry.id)),
    productEntryIds: pair(term.entries.map(entry => entry.id)),
    column: pair(term.vector.entries.map(numberOf)), weight: numberOf(term.coefficient),
    contribution: pair(term.entries.map(numberOf)),
  })));
  const result = Object.freeze({ id: combination.result.id, matrixId: product.result.id,
    entryIds: pair(combination.result.entries.map(entry => entry.id)),
    value: pair(combination.result.entries.map(numberOf)) });
  // All motion is linear interpolation between these endpoints. Cancellation
  // must not shrink the view to the result and crop its larger contributions.
  const extent = Math.max(1, ...terms.flatMap(term => [...term.column, ...term.contribution]).map(Math.abs), ...result.value.map(Math.abs)) * 1.2;
  if (!Number.isFinite(extent)) throw new MatrixColumnGap('Column geometry requires a finite graph extent.');
  return Object.freeze({ scene, productId: product.id, combinationId: combination.id,
    matrixId: product.left.id, inputId: product.right.id, terms, result,
    domain: Object.freeze([-extent, extent] as const) });
}

const interpolate = (from: ColumnPoint, to: ColumnPoint, amount: number): ColumnPoint => {
  // Native endpoints stay exact, including negative zero and cancellation.
  if (amount === 0) return from;
  if (amount === 1) return to;
  return point(from[0] + (to[0] - from[0]) * amount, from[1] + (to[1] - from[1]) * amount);
};

/** Same seven semantic phases as the symbolic player. This bounded geometric
 * treatment stays local until visual review; it owns no clock or opacity. */
export function sampleColumnGeometry(prepared: PreparedColumnGeometry, progress: number): ColumnGeometrySample {
  const frame = sample(progress, prepared.scene.beats);
  const scale = frame.index < 4 ? 0 : frame.index === 4 ? frame.local : 1;
  const translate = frame.index < 5 ? 0 : frame.index === 5 ? frame.local : 1;
  const terms = Object.freeze(prepared.terms.map(term => {
    const scaled = interpolate(term.column, term.contribution, scale);
    return Object.freeze({ ...term,
      start: term.index === 0 ? origin : interpolate(origin, prepared.terms[0].contribution, translate),
      end: term.index === 0 ? scaled : interpolate(scaled, prepared.result.value, translate),
      role: scale === 0 ? 'column' as const : 'contribution' as const,
    });
  }));
  return Object.freeze({ progress: frame.progress, index: frame.index, local: frame.local, beatId: frame.beat.id, terms,
    result: Object.freeze({ ...prepared.result, start: origin, end: prepared.result.value,
      visible: frame.index > 5 || (frame.index === 5 && frame.local === 1) }) });
}
