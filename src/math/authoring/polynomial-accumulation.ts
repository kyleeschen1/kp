import { createKpRational as rational, addKpRationals as addR, subtractKpRationals as subR, multiplyKpRationals as mulR, divideKpRationals as divR, type KpNormalizedRational as Rational } from '../../../domains/math/exact-rational.ts';
import { add, constant, divide, multiply, negate, power, variable, compileExpression, type MathExpression } from '../expression.ts';

export class AccumulationGap extends Error { readonly code = 'kp.accumulation.unsupported'; }
export const intervalTicks = [-300, 300] as const;
export const entities = Object.freeze({ function: 'accumulation.function', primitive: 'accumulation.primitive', total: 'accumulation.total', endpoint: 'accumulation.endpoint', above: 'accumulation.above', below: 'accumulation.below' });

// This catalogue is deliberately finite: known rational zeros make exact
// geometric-area partitioning possible without inventing a general root solver.
function polynomial(id: string, label: string, coefficients: readonly number[], roots: readonly number[]) {
  const cs = Object.freeze(coefficients.map(c => rational(BigInt(c), 1n)));
  const primitive = Object.freeze([rational(0n, 1n), ...cs.map((c, n) => divR(c, rational(BigInt(n + 1), 1n)))]);
  const expression = (values: readonly Rational[]): MathExpression => add(...values.map((c, n) => {
    const term = power(variable('x'), n);
    // Preserve the exact power-rule quotient in the symbolic representation.
    const magnitude = divide(multiply(constant(Math.abs(Number(c.numerator))), term), constant(Number(c.denominator)));
    return c.numerator < 0n ? negate(magnitude) : magnitude;
  }).reverse());
  const f = expression(cs), F = expression(primitive);
  return Object.freeze({ id, label, coefficients: cs, primitive, roots: Object.freeze([...roots]), f, F, evaluate: compileExpression(f), evaluatePrimitive: compileExpression(F) });
}
export const polynomials = Object.freeze([
  polynomial('quadratic', 'x² − 1', [-1, 0, 1], [-100, 100]),
  polynomial('linear', 'x', [0, 1], [0]),
  polynomial('square', 'x²', [0, 0, 1], [0]),
  polynomial('positive', '1', [1], []),
  polynomial('negative', '−1', [-1], []),
  polynomial('zero', '0', [0], [])
]);
export type AccumulationPolynomial = (typeof polynomials)[number];
export function getPolynomial(id: string) {
  const found = polynomials.find(p => p.id === id);
  if (!found) throw new AccumulationGap('Choose one of the six supported polynomials.');
  return found;
}
export function requireTicks(ticks: number) {
  if (!Number.isInteger(ticks) || ticks < intervalTicks[0] || ticks > intervalTicks[1]) throw new AccumulationGap('Bounds must be hundredths between −3 and 3.');
  return ticks;
}
export function readBound(text: string) {
  const trimmed = text.trim();
  if (text.length > 12 || !/^[+-]?(?:\d+(?:\.\d{0,2})?|\.\d{1,2})$/.test(trimmed)) throw new AccumulationGap('Enter a bound between −3 and 3, with at most two decimal places.');
  const value = Number(trimmed);
  if (!Number.isFinite(value) || value < -3 || value > 3) throw new AccumulationGap('Bounds must be between −3 and 3.');
  return requireTicks(Math.round(value * 100));
}
export function exactValue(coefficients: readonly Rational[], ticks: number): Rational {
  requireTicks(ticks);
  const x = rational(BigInt(ticks), 100n);
  return coefficients.reduceRight((total, c) => addR(mulR(total, x), c), rational(0n, 1n));
}
export function exactIntegral(model: AccumulationPolynomial, a: number, b: number) {
  return subR(exactValue(model.primitive, b), exactValue(model.primitive, a));
}
export const numeric = (value: Rational) => Number(value.numerator) / Number(value.denominator);
export const exactText = (value: Rational) => value.denominator === 1n ? String(value.numerator) : `${value.numerator}/${value.denominator}`;
export function sampleAccumulation(model: AccumulationPolynomial, a: number, b: number, progress: number) {
  requireTicks(a); requireTicks(b);
  if (!Number.isFinite(progress) || progress < 0 || progress > 1) throw new AccumulationGap('Progress must be between zero and one.');
  // A shared hundredth grid is the source boundary for entry, playback and URL
  // return. Never present a floating sample as an exact rational endpoint.
  const x = Math.round(a + (b - a) * progress), low = Math.min(a, x), high = Math.max(a, x);
  const cuts = [low, ...model.roots.filter(root => root > low && root < high), high];
  const segments = cuts.slice(0, -1).flatMap((left, i) => {
    const right = cuts[i + 1]!;
    if (left === right) return [];
    const integral = exactIntegral(model, left, right);
    const sign = integral.numerator > 0n ? 'above' : integral.numerator < 0n ? 'below' : 'zero';
    return sign === 'zero' ? [] : [{ left, right, sign, integral }];
  });
  const above = segments.filter(s => s.sign === 'above').reduce((sum, s) => addR(sum, s.integral), rational(0n, 1n));
  const below = segments.filter(s => s.sign === 'below').reduce((sum, s) => subR(sum, s.integral), rational(0n, 1n));
  const signed = exactIntegral(model, a, x), geometric = addR(above, below);
  return Object.freeze({ a, b, x, progress, segments, signed, geometric, above, below,
    value: numeric(exactValue(model.coefficients, x)), total: numeric(signed), area: numeric(geometric), entities });
}
export type AccumulationFrame = ReturnType<typeof sampleAccumulation>;
export function readAccumulationUrl(params: URLSearchParams) {
  const model = getPolynomial(params.get('case') ?? 'quadratic'), a = readBound(params.get('a') ?? '-2'), b = readBound(params.get('b') ?? '2');
  const raw = params.get('p') ?? '1';
  if (raw.length > 24 || !/^(?:0(?:\.\d+)?|1(?:\.0+)?)$/.test(raw)) throw new AccumulationGap('Progress in the link must be from zero to one.');
  const progress = Number(raw); sampleAccumulation(model, a, b, progress);
  return { model, a, b, progress };
}
export const readoutSpecs = Object.freeze({ x: { min: -3, max: 3, decimals: 2, columns: 5 }, value: { min: -3, max: 9, decimals: 3, columns: 6 }, total: { min: -18, max: 18, decimals: 3, columns: 7 }, area: { min: 0, max: 18, decimals: 3, columns: 6 } });
export type Readout = keyof typeof readoutSpecs;
export function formatReadout(id: Readout, value: number) {
  const spec = readoutSpecs[id];
  if (!Number.isFinite(value) || value < spec.min || value > spec.max) throw new AccumulationGap('Readout exceeds its declared range.');
  const text = value.toFixed(spec.decimals);
  return Number(text) === 0 ? (0).toFixed(spec.decimals) : text;
}
