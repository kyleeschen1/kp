import { add, constant, multiply, power, variable, type MathExpression } from '../expression.ts';
import { quadraticExpression, type QuadraticCoefficients } from './quadratic.ts';

export interface UnavailableQuadraticForm {
  readonly kind: 'unavailable';
  readonly reason: 'degree-reduced' | 'no-real-factors' | 'numerical-limit';
  readonly message: string;
}

interface AvailableForm {
  readonly kind: 'available';
  readonly expression: MathExpression;
  readonly latex: string;
}

export interface ExpandedQuadraticForm extends AvailableForm {
  readonly accuracy: 'source';
}

export interface VertexQuadraticForm extends AvailableForm {
  readonly accuracy: 'approximate';
  readonly parameters: Readonly<{ a: number; h: number; k: number }>;
}

export interface FactoredQuadraticForm extends AvailableForm {
  readonly accuracy: 'approximate';
  readonly parameters: Readonly<{ leading: number } & (
    | { roots: readonly [number]; multiplicity: 'linear' }
    | { roots: readonly [number, number]; multiplicity: 'repeated' | 'distinct' }
  )>;
}

export interface QuadraticForms {
  readonly degree: 'zero' | 0 | 1 | 2;
  readonly coefficients: QuadraticCoefficients;
  readonly expanded: ExpandedQuadraticForm;
  readonly vertex: VertexQuadraticForm | UnavailableQuadraticForm;
  readonly factored: FactoredQuadraticForm | UnavailableQuadraticForm;
}

/** Explanatory numeric rewrites, never a replacement for the source evaluator.
 * Input validation belongs to quadraticExpression. Alternative parameters use
 * binary floating point; finite parameters and coefficient reconstruction are
 * guarded, but arbitrary-x evaluation can still overflow, as can the source.
 * Degree reduction is exact: a small nonzero a is never treated as linear. */
export function prepareQuadraticForms(input: QuadraticCoefficients): QuadraticForms {
  const coefficients = Object.freeze({ a: input.a, b: input.b, c: input.c });
  const expression = quadraticExpression(coefficients);
  const { a, b, c } = coefficients;
  const expanded: ExpandedQuadraticForm = { kind: 'available', accuracy: 'source', expression, latex: expandedLatex(coefficients) };
  const degree = a !== 0 ? 2 : b !== 0 ? 1 : c !== 0 ? 0 : 'zero';
  if (a === 0) return {
    degree, coefficients, expanded,
    vertex: unavailable('degree-reduced', 'A linear or constant polynomial has no quadratic vertex form.'),
    factored: b === 0
      ? unavailable('degree-reduced', c === 0 ? 'The zero polynomial has no distinguished finite list of roots.' : 'A nonzero constant has no linear factors.')
      : linearFactors(coefficients)
  };
  return { degree, coefficients, expanded, vertex: vertexForm(coefficients), factored: quadraticFactors(coefficients) };
}

function vertexForm({ a, b, c }: QuadraticCoefficients): VertexQuadraticForm | UnavailableQuadraticForm {
  const h = cleanZero(-b / (2 * a));
  const k = cleanZero(c + (b / 2) * h);
  const translated = a * h * h;
  // Reconstruction alone misses cancellation when c is zero. Refuse a form
  // whose large opposite constants make ordinary evaluation lose source scale.
  const scale = Math.max(Math.abs(a), Math.abs(b), Math.abs(c));
  if ((scale < 2 ** -1022 && (b !== 0 || c !== 0))
    || !finite(h, k, translated) || (b !== 0 && h === 0) || Math.abs(h) > Math.sqrt(Number.MAX_VALUE) / 2
    || !close(-2 * a * h, b, scale) || !close(translated + k, c, scale)
    || 32 * Number.EPSILON * (Math.abs(translated) + Math.abs(k)) > 1e-10 * scale) return numericalLimit();
  const expression = add(multiply(constant(a), power(shift(h), 2)), constant(k));
  return {
    kind: 'available', accuracy: 'approximate', expression,
    parameters: Object.freeze({ a, h, k }),
    latex: `${leadingLatex(a)}${shiftLatex(h)}^{2}${signedLatex(k)}`
  };
}

function linearFactors({ b, c }: QuadraticCoefficients): FactoredQuadraticForm | UnavailableQuadraticForm {
  const root = cleanZero(-c / b);
  const scale = Math.max(Math.abs(b), Math.abs(c));
  if ((scale < 2 ** -1022 && c !== 0) || !finite(root) || (c !== 0 && root === 0) || !close(-b * root, c, scale)) return numericalLimit();
  return {
    kind: 'available', accuracy: 'approximate',
    expression: multiply(constant(b), shift(root)),
    latex: `${leadingLatex(b)}${shiftLatex(root)}`,
    parameters: Object.freeze({ leading: b, roots: Object.freeze([root] as const), multiplicity: 'linear' })
  };
}

function quadraticFactors(coefficients: QuadraticCoefficients): FactoredQuadraticForm | UnavailableQuadraticForm {
  const { a, b, c } = coefficients;
  const sign = discriminantSign(coefficients);
  if (sign < 0) return unavailable('no-real-factors', 'The discriminant is negative: no factorization into real linear factors.');
  // With only subnormal coefficients, a single underflow can erase a material
  // fraction of the polynomial. Only the trivial ax² form survives unchanged.
  if (Math.max(Math.abs(a), Math.abs(b), Math.abs(c)) < 2 ** -1022 && (b !== 0 || c !== 0)) return numericalLimit();
  let first: number, second: number;
  if (sign === 0) {
    first = second = cleanZero(-b / (2 * a));
  } else {
    // Scaling avoids overflow/underflow from uniformly tiny coefficients. The
    // q formula avoids subtracting two nearly equal numbers for the small root.
    // A power-of-two scale does not introduce division rounding for normal
    // binary values (and preserves simple integer roots such as 2 and 3).
    const scale = 2 ** Math.floor(Math.log2(Math.max(Math.abs(a), Math.abs(b), Math.abs(c))));
    const aa = a / scale, bb = b / scale, cc = c / scale;
    const square = bb * bb, product = 4 * aa * cc;
    const discriminant = square - product;
    const uncertainty = 8 * Number.EPSILON * (square + Math.abs(product)) + 8 * Number.MIN_VALUE;
    if (aa === 0 || (c !== 0 && cc === 0) || discriminant <= uncertainty) return numericalLimit();
    const q = -0.5 * (bb + (bb < 0 ? -1 : 1) * Math.sqrt(discriminant));
    first = cleanZero(q / aa);
    second = cleanZero(cc / q);
  }
  const scale = Math.max(Math.abs(a), Math.abs(b), Math.abs(c));
  if (!finite(first, second) || (c !== 0 && (first === 0 || second === 0))
    || (sign > 0 && first === second)
    || !close(-(a * first + a * second), b, scale)
    || !close((a * first) * second, c, scale)) return numericalLimit();
  const roots: readonly [number, number] = Object.freeze(first <= second ? [first, second] : [second, first]);
  // Multiply the larger root's factor into a first. With tiny a and one small
  // root, the other order can underflow before the large factor restores scale.
  const larger = Math.abs(first) >= Math.abs(second) ? first : second;
  const smaller = larger === first ? second : first;
  const expression = multiply(constant(a), shift(larger), shift(smaller));
  return {
    kind: 'available', accuracy: 'approximate', expression,
    latex: `${leadingLatex(a)}${shiftLatex(roots[0])}${sign === 0 ? '^{2}' : shiftLatex(roots[1])}`,
    parameters: Object.freeze({ leading: a, roots, multiplicity: sign === 0 ? 'repeated' : 'distinct' })
  };
}

/** Exact sign of b²−4ac for the *represented binary inputs*, not a decimal
 * rational interpretation. A rounded-zero discriminant must not invent a
 * repeated root. This bounded predicate does not compute symbolic roots. */
function discriminantSign({ a, b, c }: QuadraticCoefficients): -1 | 0 | 1 {
  const aa = dyadic(a), bb = dyadic(b), cc = dyadic(c);
  const squareExponent = 2 * bb.exponent, productExponent = aa.exponent + cc.exponent + 2;
  const exponent = Math.min(squareExponent, productExponent);
  const difference = (bb.integer * bb.integer << BigInt(squareExponent - exponent))
    - (aa.integer * cc.integer << BigInt(productExponent - exponent));
  return difference < 0n ? -1 : difference > 0n ? 1 : 0;
}

function dyadic(value: number): { integer: bigint; exponent: number } {
  const buffer = new DataView(new ArrayBuffer(8));
  buffer.setFloat64(0, value);
  const bits = buffer.getBigUint64(0);
  const exponent = Number((bits >> 52n) & 2047n);
  const significand = (bits & ((1n << 52n) - 1n)) | (exponent === 0 ? 0n : 1n << 52n);
  return { integer: bits >> 63n ? -significand : significand, exponent: exponent === 0 ? -1074 : exponent - 1075 };
}

function close(actual: number, expected: number, scale: number): boolean {
  return Number.isFinite(actual) && Math.abs(actual - expected) <= 128 * Number.EPSILON * scale;
}
function finite(...values: readonly number[]): boolean { return values.every(Number.isFinite); }
function cleanZero(value: number): number { return value === 0 ? 0 : value; }
function shift(root: number): MathExpression { return add(variable('x'), constant(-root)); }
function unavailable(reason: UnavailableQuadraticForm['reason'], message: string): UnavailableQuadraticForm { return { kind: 'unavailable', reason, message }; }
function numericalLimit(): UnavailableQuadraticForm { return unavailable('numerical-limit', 'This form is outside the reliable floating-point range; keep the expanded coefficients.'); }

// The generic expression printer rounds to six places. Here every coefficient
// must survive display, including small nonzero values and scientific notation.
function numberLatex(value: number): string {
  const [mantissa = '0', exponent] = String(cleanZero(value)).split('e');
  return exponent === undefined ? mantissa : `${mantissa} \\times 10^{${Number(exponent)}}`;
}
function leadingLatex(value: number): string {
  return value === 1 ? '' : value === -1 ? '-' : `\\left(${numberLatex(value)}\\right)`;
}
function signedLatex(value: number): string {
  return value === 0 ? '' : ` ${value < 0 ? '-' : '+'} ${numberLatex(Math.abs(value))}`;
}
function shiftLatex(root: number): string { return `\\left(x${signedLatex(-root)}\\right)`; }
function expandedLatex({ a, b, c }: QuadraticCoefficients): string {
  const terms = [{ value: a, suffix: 'x^{2}' }, { value: b, suffix: 'x' }, { value: c, suffix: '' }].filter(({ value }) => value !== 0);
  return terms.map(({ value, suffix }, index) => {
    const sign = value < 0 ? (index === 0 ? '-' : ' - ') : (index === 0 ? '' : ' + ');
    const magnitude = Math.abs(value);
    const coefficient = suffix !== '' && magnitude === 1 ? '' : numberLatex(magnitude);
    return `${sign}${coefficient}${coefficient && suffix ? ' \\,' : ''}${suffix}`;
  }).join('') || '0';
}
