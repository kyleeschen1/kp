import { constant, compileExpression } from '../math/expression.ts';
import { createKpScalarExpression, createKpTypedMatrixFromRows, type KpTypedMatrix } from '../math/typed-semantic-math.ts';
import { matrixProduct } from '../math/matrix-product.ts';
import { createMatrixObject } from '../semantic/matrix.ts';
import { semanticEvaluate } from '../semantic/computation-protocols.ts';
import { coordinate } from './draft.ts';

export class CompositionGap extends Error {
  readonly code = 'kp.composition-area.invalid';
}
export type Point = readonly [number, number];
export type Rows = readonly [Point, Point];
export type Shape = readonly [Point, Point, Point, Point];
export const presets = [
  { id: 'shear-stretch', title: 'Shear and stretch', values: ['1', '1', '0', '1', '2', '0', '0', '1'] },
  { id: 'reflection', title: 'Reflection and shear', values: ['-1', '0', '0', '1', '1', '1', '0', '1'] },
  { id: 'collapse', title: 'Collapse and shear', values: ['1', '0', '0', '0', '1', '0', '1', '1'] },
  { id: 'identity', title: 'Identity and stretch', values: ['1', '0', '0', '1', '2', '0', '0', '1'] },
] as const;
export const checkpoints = [
  { id: 'unit', title: 'Start with the same unit square', progress: 0 },
  { id: 'first', title: 'Apply the first map', progress: .5 },
  { id: 'composed', title: 'Apply the second map', progress: 1 },
] as const;
const point = (x: number, y: number): Point => Object.freeze([x, y]);
const pair = (values: readonly number[]): Point => {
  if (values.length !== 2 || values.some(value => !Number.isFinite(value))) throw new CompositionGap('Expected two finite coordinates.');
  return point(values[0]!, values[1]!);
};
const typed = (id: string, rows: Rows) => createKpTypedMatrixFromRows({ id,
  rows: rows.map((row, i) => row.map((value, j) => createKpScalarExpression({ id: `${id}.${i}.${j}`, expression: constant(value) }))),
});
const numbers = (matrix: KpTypedMatrix): Rows => {
  if (matrix.rowCount !== 2 || matrix.columnCount !== 2) throw new CompositionGap('Expected a 2×2 matrix.');
  const rows = matrix.rows.map(row => pair(row.map(entry => compileExpression(entry.expression)({}))));
  return Object.freeze([rows[0]!, rows[1]!]);
};
function determinant(id: string, rows: Rows): number {
  const result = semanticEvaluate(createMatrixObject({ id, label: id, rows }));
  if (result?.kind !== 'matrix' || result.determinant === undefined || !Number.isFinite(result.determinant))
    throw new CompositionGap('Matrix evaluation did not provide a finite determinant.');
  return result.determinant;
}
export interface Pose {
  readonly id: string;
  readonly matrix: Rows;
  readonly corners: Shape;
  readonly signedArea: number;
}
function pose(id: string, matrix: KpTypedMatrix): Pose {
  const rows = numbers(matrix);
  // Use the product owner for all four images, including the opposite corner.
  const corners = ([point(0, 0), point(1, 0), point(1, 1), point(0, 1)]).map((p, i) => {
    const vector = createKpTypedMatrixFromRows({ id: `${id}.corner.${i}`,
      rows: p.map((v, j) => [createKpScalarExpression({ id: `${id}.corner.${i}.${j}`, expression: constant(v) })]) });
    const result = matrixProduct({ id: `${id}.image.${i}`, left: matrix, right: vector }).result;
    return pair(result.rows.map(row => compileExpression(row[0]!.expression)({})));
  });
  return Object.freeze({ id, matrix: rows, corners: Object.freeze([corners[0]!, corners[1]!, corners[2]!, corners[3]!] as const), signedArea: determinant(id, rows) });
}
export interface CompositionModel {
  readonly a: Pose;
  readonly b: Pose;
  readonly unit: Pose;
  readonly ba: Pose;
  readonly ab: Pose;
  readonly commutes: boolean;
  readonly xDomain: readonly [number, number];
  readonly yDomain: readonly [number, number];
}
export function prepareComposition(draft: readonly string[], namespace = 'composition'): CompositionModel {
  if (!namespace.trim()) throw new CompositionGap('A matrix pair needs a source identity.');
  if (draft.length !== 8) throw new CompositionGap('Enter all eight matrix entries.');
  const values = draft.map((text, index) => {
    if (!coordinate(text))
      throw new CompositionGap(`Entry ${index + 1}: use an integer from −5 to 5. The last valid pair remains visible.`);
    return Number(text);
  });
  const a = typed(`${namespace}.A`, [pair(values.slice(0, 2)), pair(values.slice(2, 4))]);
  const b = typed(`${namespace}.B`, [pair(values.slice(4, 6)), pair(values.slice(6, 8))]);
  const unit = pose(`${namespace}.unit`, typed(`${namespace}.I`, [[1, 0], [0, 1]]));
  const firstA = pose(a.id, a), firstB = pose(b.id, b);
  const ba = pose(`${namespace}.BA`, matrixProduct({ id: `${namespace}.product.BA`, left: b, right: a }).result);
  const ab = pose(`${namespace}.AB`, matrixProduct({ id: `${namespace}.product.AB`, left: a, right: b }).result);
  const corners = [unit, firstA, firstB, ba, ab].flatMap(p => p.corners);
  const xs = corners.map(p => p[0]), ys = corners.map(p => p[1]);
  const xmin = Math.min(...xs), xmax = Math.max(...xs), ymin = Math.min(...ys), ymax = Math.max(...ys);
  // One shared span preserves angles and area comparisons without wasting half
  // the figure on empty negative space. Every linear transit stays in this box.
  const half = Math.max(1, xmax - xmin, ymax - ymin) * .65;
  const domain = (min: number, max: number): readonly [number, number] => Object.freeze([(min + max) / 2 - half, (min + max) / 2 + half]);
  return Object.freeze({ a: firstA, b: firstB, unit, ba, ab,
    commutes: ba.matrix.flat().every((value, i) => value === ab.matrix.flat()[i]),
    xDomain: domain(xmin, xmax), yDomain: domain(ymin, ymax) });
}
export function sampleComposition(model: CompositionModel, progress: number) {
  if (!Number.isFinite(progress) || progress < 0 || progress > 1) throw new CompositionGap('Progress must be between zero and one.');
  const leg = progress <= .5 ? 0 : 1, t = leg === 0 ? progress * 2 : (progress - .5) * 2;
  const interpolate = (from: Pose, to: Pose) => {
    if (t === 0) return from.corners;
    if (t === 1) return to.corners;
    return from.corners.map((p, i) => point(p[0] + (to.corners[i]![0] - p[0]) * t, p[1] + (to.corners[i]![1] - p[1]) * t));
  };
  return Object.freeze({ progress, leg, moving: t !== 0 && t !== 1,
    beat: progress === 0 ? 'unit' : progress <= .5 ? 'first' : 'composed',
    left: interpolate(leg === 0 ? model.unit : model.a, leg === 0 ? model.a : model.ba),
    right: interpolate(leg === 0 ? model.unit : model.b, leg === 0 ? model.b : model.ab),
    leftPose: progress === 0 ? model.unit : leg === 0 ? model.a : model.ba,
    rightPose: progress === 0 ? model.unit : leg === 0 ? model.b : model.ab,
  });
}
export function readCompositionUrl(params: URLSearchParams): { draft: readonly string[]; progress: number } {
  const raw = params.get('m'), beat = params.get('beat') ?? 'unit';
  const checkpoint = checkpoints.find(value => value.id === beat)?.progress;
  if (checkpoint === undefined) throw new CompositionGap('Unknown checkpoint in link.');
  const rawProgress = params.get('p');
  const progress = rawProgress === null ? checkpoint : Number(rawProgress);
  if (rawProgress === '' || !Number.isFinite(progress) || progress < 0 || progress > 1) throw new CompositionGap('Invalid progress in link.');
  const draft = raw === null ? presets[0].values : raw.split(',');
  prepareComposition(draft);
  return { draft, progress };
}
