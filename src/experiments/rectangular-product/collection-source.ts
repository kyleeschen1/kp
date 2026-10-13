import { constant, expressionToLatex, type MathExpression } from '../../math/expression.ts';
import { createKpScalarExpression, createKpTypedMatrixFromRows, type KpScalarExpression } from '../../math/typed-semantic-math.ts';
import { matrixProduct } from '../../math/matrix-product.ts';

export const collectionBeatIds = ['polynomials', 'align', 'notice', 'collect', 'pivot', 'matrix', 'rows', 'columns', 'hold'] as const;
export type CollectionBeatId = typeof collectionBeatIds[number];
type Domain =
  | { readonly kind: 'polynomials'; readonly names: readonly string[] }
  | { readonly kind: 'linear-system'; readonly rhs: readonly number[] };
export interface CollectionSource {
  readonly id: string;
  readonly coefficients: readonly (readonly number[])[];
  readonly inputs: readonly MathExpression[];
  readonly domain: Domain;
  readonly annotations: Readonly<Record<CollectionBeatId, string>>;
  readonly focus?: { readonly row: number; readonly column: number };
  // Presentation pacing is separate from the mathematical objects and motif geometry.
  readonly pacing?: Partial<Readonly<Record<Exclude<CollectionBeatId, 'polynomials'>, number>>>;
}
export interface CollectionRepair {
  readonly status: 'repair-required';
  readonly code: 'source' | 'presentation';
  readonly path: string;
  readonly message: string;
}
// A constraint RHS can be derived by a checked operation. Its identity belongs
// to that referent, not necessarily the initial source's naming convention.
export type CollectionOutput =
  | { readonly kind: 'derived-expression'; readonly id: string; readonly latex: string }
  | { readonly kind: 'constraint-rhs'; readonly id: string; readonly latex: string; readonly value: KpScalarExpression };
const scalar = (id: string, expression: MathExpression) => createKpScalarExpression({ id, expression });
const gap = (code: CollectionRepair['code'], path: string, message: string): CollectionRepair => ({ status: 'repair-required', code, path, message });
const symbol = (e: MathExpression) => e.kind === 'variable' && /^[a-zA-Z]$/.test(e.name);
const inputSupported = (e: MathExpression) => symbol(e) || e.kind === 'constant' && e.value === 1 ||
  e.kind === 'power' && symbol(e.base) && Number.isInteger(e.exponent) && e.exponent >= 2 && e.exponent <= 4;
const matrix = (rows: readonly (readonly string[])[]) => `\\begin{bmatrix}${rows.map(row => row.join('&')).join('\\\\')}\\end{bmatrix}`;

/** Bounded typed-source compiler, not a parser or a general polynomial checker. */
export function compileCollectionSource(source: CollectionSource) {
  if (!/^[a-zA-Z][\w.-]*$/.test(source.id)) return gap('source', 'id', 'Use a nonempty stable identifier.');
  const rows = source.coefficients.length, columns = source.inputs.length;
  if (!rows || !columns || source.coefficients.some(row => row.length !== columns))
    return gap('source', 'coefficients', 'Provide a nonempty rectangular coefficient grid matching the ordered inputs.');
  if (source.coefficients.some(row => row.some(n => !Number.isFinite(n))))
    return gap('source', 'coefficients', 'Coefficients must be finite real numbers.');
  if (rows !== 2 || columns < 2 || columns > 4 || source.coefficients.some(row => row.some(n => !Number.isInteger(n) || Math.abs(n) > 9)))
    return gap('presentation', 'coefficients', 'This adapter supports two rows, two to four inputs, and single-digit integer coefficients.');
  if (source.coefficients.some(row => row.every(n => n === 0)))
    return gap('presentation', 'coefficients', 'An entirely zero row needs an explicit zero-expression presentation, not an empty opening.');
  if (source.inputs.some(e => !inputSupported(e)))
    return gap('presentation', 'inputs', 'Use single-letter inputs, their powers 2–4, or the constant 1.');
  if (new Set(source.inputs.map(expressionToLatex)).size !== columns)
    return gap('source', 'inputs', 'Each declared input must be distinct; repeated columns need an explicit separate contract.');
  if (source.domain.kind === 'polynomials') {
    if (source.domain.names.length !== rows || source.domain.names.some(name => !/^[A-Za-z](\([A-Za-z]\))?$/.test(name)))
      return gap('presentation', 'domain.names', 'Supply one short output label per row, such as p(t).');
    const variables = source.inputs.flatMap(e => e.kind === 'variable' ? [e.name] : e.kind === 'power' && e.base.kind === 'variable' ? [e.base.name] : []);
    if (new Set(variables).size !== 1) return gap('source', 'inputs', 'The polynomial caller requires powers of one declared variable.');
  } else if (source.domain.rhs.length !== rows || source.domain.rhs.some(n => !Number.isInteger(n) || Math.abs(n) > 99)) {
    return gap('presentation', 'domain.rhs', 'Supply one integer right-hand side per row, from -99 to 99.');
  } else if (source.inputs.some(e => !symbol(e))) {
    return gap('source', 'inputs', 'Linear-system inputs must be distinct unknown variables, not powers or constants.');
  }
  const focus = source.focus ?? { row: 0, column: 0 };
  if (!Number.isInteger(focus.row) || focus.row < 0 || focus.row >= rows || !Number.isInteger(focus.column) || focus.column < 0 || focus.column >= columns)
    return gap('source', 'focus', 'Select a row and column present in this source.');
  if (collectionBeatIds.some(id => !source.annotations[id]?.trim()))
    return gap('source', 'annotations', 'Every named beat requires a plain-language annotation.');
  const durations = collectionBeatIds.filter(id => id !== 'polynomials').map(id => source.pacing?.[id] ?? 3500);
  if (durations.some(ms => !Number.isFinite(ms) || ms < 250 || ms > 30000))
    return gap('presentation', 'pacing', 'Beat transitions must be between 250 and 30000 milliseconds.');
  const coefficients = Object.freeze(source.coefficients.map(row => Object.freeze([...row])));
  const inputs = Object.freeze(source.inputs.map((expression, c) => scalar(`${source.id}.basis.${c}`, expression)));
  const product = matrixProduct({ id: `${source.id}.factorization`,
    left: createKpTypedMatrixFromRows({ id: `${source.id}.coefficients`, rows: coefficients.map((row, r) => row.map((n, c) => scalar(`${source.id}.coefficient.${r}.${c}`, constant(n)))) }),
    right: createKpTypedMatrixFromRows({ id: `${source.id}.basis`, rows: inputs.map(value => [value]) }),
  });
  // A system RHS is supplied independently. It must never inherit the identity
  // of the computed left-hand expression, even when the printed values match.
  const outputs: readonly CollectionOutput[] = Object.freeze(coefficients.map((_, r) => source.domain.kind === 'polynomials'
    ? Object.freeze({ kind: 'derived-expression' as const, id: product.result.rows[r]![0]!.id, latex: source.domain.names[r]! })
    : Object.freeze({ kind: 'constraint-rhs' as const, id: `${source.id}.rhs.${r}`, latex: String(source.domain.rhs[r]), value: scalar(`${source.id}.rhs.${r}`, constant(source.domain.rhs[r]!)) })));
  const durationMs = durations.reduce((a, b) => a + b, 0);
  const starts = [0]; durations.forEach(ms => starts.push(starts.at(-1)! + ms));
  const stops = Object.freeze(starts.map(ms => ms / durationMs));
  const beats = Object.freeze(collectionBeatIds.map(id => Object.freeze({ id, cue: source.annotations[id] })));
  const equation = `${matrix(outputs.map(o => [o.latex]))}=${matrix(coefficients.map(row => row.map(String)))}${matrix(inputs.map(input => [expressionToLatex(input.expression)]))}`;
  // Preserve the authored order and familiar signed/unit notation in the static
  // opening too; the semantic product above remains the arithmetic authority.
  const expanded = outputs.map((output, r) => {
    const terms = coefficients[r]!.flatMap((value, c) => {
      if (value === 0) return [];
      const expression = inputs[c]!.expression, magnitude = Math.abs(value);
      const body = expression.kind === 'constant' ? String(magnitude)
        : `${magnitude === 1 ? '' : magnitude}${expressionToLatex(expression)}`;
      return [{ negative: value < 0, body }];
    });
    return `${output.latex}=${terms.map((term, i) => `${term.negative ? '-' : i ? '+' : ''}${term.body}`).join('')}`;
  }).join('\\\\');
  return Object.freeze({ status: 'compiled' as const, id: source.id, kind: source.domain.kind,
    coefficients, inputs, product, outputs, focus: Object.freeze({ ...focus }), beats, stops, durationMs, equation,
    expandedEquation: `\\begin{gathered}${expanded}\\end{gathered}`,
  });
}
export type CollectionModel = Exclude<ReturnType<typeof compileCollectionSource>, CollectionRepair>;
export function requireCollectionSource(source: CollectionSource): CollectionModel {
  const result = compileCollectionSource(source);
  if (result.status === 'repair-required') throw new Error(`${result.code}: ${result.path}: ${result.message}`);
  return result;
}
export function sampleCollection(model: CollectionModel, progress: number) {
  if (!Number.isFinite(progress)) throw new Error('Collection progress must be finite.');
  const p = Math.max(0, Math.min(1, progress));
  const index = model.stops.findIndex(stop => stop >= p);
  const phase = index <= 0 ? 0 : index - 1 + (p - model.stops[index - 1]!) / (model.stops[index]! - model.stops[index - 1]!);
  return { progress: p, phase, index, beat: model.beats[index]! };
}
