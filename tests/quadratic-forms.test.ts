import assert from 'node:assert/strict';
import test from 'node:test';
import { compileExpression, type MathExpression } from '../src/math/expression.ts';
import { quadraticExpression, type QuadraticCoefficients } from '../src/math/authoring/quadratic.ts';
import { prepareQuadraticForms, type QuadraticForms } from '../src/math/authoring/quadratic-forms.ts';

test('one validated coefficient source prepares expanded, vertex, and real factored forms', () => {
  const input = { a: 1, b: -5, c: 6 };
  const result = prepareQuadraticForms(input);
  assert.equal(result.degree, 2);
  assert.deepEqual(result.expanded.expression, quadraticExpression(input));
  assert.equal(result.expanded.latex, 'x^{2} - 5 \\,x + 6');
  assert.equal(result.vertex.kind, 'available');
  assert.equal(result.factored.kind, 'available');
  if (result.vertex.kind !== 'available' || result.factored.kind !== 'available') assert.fail();
  assert.deepEqual(result.vertex.parameters, { a: 1, h: 2.5, k: -0.25 });
  assert.deepEqual(result.factored.parameters, { leading: 1, roots: [2, 3], multiplicity: 'distinct' });
  assert.equal(result.vertex.accuracy, 'approximate');
  assert.equal(result.factored.accuracy, 'approximate');
  assert.equal(result.vertex.latex, '\\left(x - 2.5\\right)^{2} - 0.25');
  assert.equal(result.factored.latex, '\\left(x - 2\\right)\\left(x - 3\\right)');
  input.a = 9;
  assert.equal(result.coefficients.a, 1);
  assert.ok(Object.isFrozen(result.coefficients));
  assert.ok(Object.isFrozen(result.factored.parameters.roots));
});

test('degree reduction is explicit, including the zero polynomial', () => {
  const linear = prepareQuadraticForms({ a: -0, b: 2, c: -6 });
  assert.equal(linear.degree, 1);
  assert.equal(linear.vertex.kind, 'unavailable');
  assert.equal(linear.factored.kind, 'available');
  if (linear.factored.kind !== 'available') assert.fail();
  assert.deepEqual(linear.factored.parameters, { leading: 2, roots: [3], multiplicity: 'linear' });
  assert.equal(linear.factored.latex, '\\left(2\\right)\\left(x - 3\\right)');
  for (const c of [-4, 0, 7]) {
    const constant = prepareQuadraticForms({ a: 0, b: 0, c });
    assert.equal(constant.degree, c === 0 ? 'zero' : 0);
    assert.equal(constant.expanded.latex, String(c));
    assert.deepEqual([constant.vertex.kind, constant.factored.kind], ['unavailable', 'unavailable']);
    if (constant.factored.kind === 'unavailable') assert.equal(constant.factored.reason, 'degree-reduced');
  }
});

test('negative discriminants expose a typed real-factor gap, not complex or fake roots', () => {
  for (const input of [{ a: 1, b: 0, c: 1 }, { a: -2, b: 3, c: -4 }, { a: 1, b: 2, c: 1 + Number.EPSILON }]) {
    const result = prepareQuadraticForms(input);
    assert.equal(result.factored.kind, 'unavailable');
    if (result.factored.kind !== 'unavailable') assert.fail();
    assert.equal(result.factored.reason, 'no-real-factors');
    assert.equal('expression' in result.factored, false);
    assert.equal(result.vertex.kind, 'available');
  }
});

test('repeated roots retain square presentation even when expression simplification erases it', () => {
  for (const input of [{ a: 1, b: -4, c: 4 }, { a: 0.1, b: 0.2, c: 0.1 }, { a: Number.MIN_VALUE, b: 0, c: 0 }]) {
    const result = prepareQuadraticForms(input);
    if (result.factored.kind !== 'available') assert.fail(result.factored.message);
    assert.equal(result.factored.parameters.multiplicity, 'repeated');
    assert.match(result.factored.latex, /\^\{2\}/);
    assert.equal(result.factored.parameters.roots[0], result.factored.parameters.roots[1]);
    assert.ok(!Object.is(result.factored.parameters.roots[0], -0));
  }
  const collapsed = prepareQuadraticForms({ a: 1, b: 0, c: 0 });
  if (collapsed.vertex.kind !== 'available') assert.fail();
  assert.equal(collapsed.vertex.latex, '\\left(x\\right)^{2}');
});

test('uncertain positive discriminants do not round into invented repeated roots', () => {
  const result = prepareQuadraticForms({ a: 1, b: 2, c: 1 - Number.EPSILON / 2 });
  assert.equal(result.factored.kind, 'unavailable');
  if (result.factored.kind !== 'unavailable') assert.fail();
  assert.equal(result.factored.reason, 'numerical-limit');
  // Binary inputs need not have the decimal relationship their spelling
  // suggests. The exact sign of those inputs controls the real-factor gap.
  const rounded = { a: 0.1, b: 0.6, c: 0.9 };
  assert.equal(rounded.b * rounded.b - 4 * rounded.a * rounded.c, -Number.EPSILON / 4);
  assert.equal(prepareQuadraticForms(rounded).factored.kind, 'unavailable');
  const falseRepeat = { a: 0.1, b: 0.1, c: 0.025000000000000005 };
  assert.equal(falseRepeat.b ** 2 - 4 * falseRepeat.a * falseRepeat.c, 0);
  const gap = prepareQuadraticForms(falseRepeat).factored;
  if (gap.kind !== 'unavailable') assert.fail('Rounded-zero discriminant invented a repeated root.');
  assert.equal(gap.reason, 'no-real-factors');
});

test('stable factor calculation retains the small root lost by the textbook subtraction', () => {
  const result = prepareQuadraticForms({ a: 1, b: -1, c: 1e-20 });
  if (result.factored.kind !== 'available') assert.fail(result.factored.message);
  assert.deepEqual(result.factored.parameters.roots, [1e-20, 1]);
  assert.match(result.factored.latex, /10\^\{-20\}/);
  assert.equal((1 - Math.sqrt(1 - 4e-20)) / 2, 0);
});

test('small a stays quadratic; unusable vertex translations do not block stable factors', () => {
  const result = prepareQuadraticForms({ a: 1e-20, b: 1, c: 1 });
  assert.equal(result.degree, 2);
  assert.equal(result.vertex.kind, 'unavailable');
  if (result.vertex.kind !== 'unavailable') assert.fail();
  assert.equal(result.vertex.reason, 'numerical-limit');
  assert.equal(result.factored.kind, 'available');
  assert.match(result.expanded.latex, /10\^\{-20\}/);
  assert.match(result.expanded.latex, /x\^\{2\}/);
  const huge = prepareQuadraticForms({ a: Number.MIN_VALUE, b: 1, c: 1 });
  assert.deepEqual([huge.vertex.kind, huge.factored.kind], ['unavailable', 'unavailable']);
  const linear = prepareQuadraticForms({ a: 0, b: Number.MIN_VALUE, c: 1 });
  assert.equal(linear.factored.kind, 'unavailable');
});

test('normalizing coefficients permits uniformly tiny polynomials without false degree reduction', () => {
  for (const scale of [1e-150, 1e-300, 2 ** -1022]) {
    const result = prepareQuadraticForms({ a: scale, b: -5 * scale, c: 6 * scale });
    assert.equal(result.degree, 2);
    assert.equal(result.factored.kind, 'available');
    assert.equal(result.vertex.kind, 'available');
    assertEquivalent(result);
  }
});

test('integer coefficient grid and deterministic fractional cohort preserve source values', () => {
  let available = 0;
  for (let a = -3; a <= 3; a++) for (let b = -5; b <= 5; b++) for (let c = -5; c <= 5; c++) {
    const result = prepareQuadraticForms({ a, b, c });
    assertEquivalent(result);
    if (result.factored.kind === 'available') available++;
    if (a !== 0 && b * b - 4 * a * c < 0) {
      assert.equal(result.factored.kind, 'unavailable');
      if (result.factored.kind === 'unavailable') assert.equal(result.factored.reason, 'no-real-factors');
    }
  }
  assert.ok(available > 300);
  let seed = 12345;
  const next = () => { seed = (1664525 * seed + 1013904223) >>> 0; return 20 * seed / 2 ** 32 - 10; };
  for (let i = 0; i < 250; i++) assertEquivalent(prepareQuadraticForms({ a: next(), b: next(), c: next() }));
});

test('invalid source coefficients fail at the existing owner boundary', () => {
  for (const value of [NaN, Infinity, -Infinity, 10.0001, -10.0001]) for (const key of ['a', 'b', 'c'] as const) {
    const input = { a: 1, b: 2, c: 3, [key]: value };
    assert.throws(() => prepareQuadraticForms(input), /Coefficients must be finite/);
  }
});

test('extreme coefficient combinations never return nonfinite parameters or expression constants', () => {
  const values = [0, Number.MIN_VALUE, -Number.MIN_VALUE, 1e-300, -1e-200, 1e-20, -1e-10, 0.1, -1, 10];
  for (const a of values) for (const b of values) for (const c of values) {
    const result = prepareQuadraticForms({ a, b, c });
    assertEquivalent(result);
    for (const form of [result.expanded, result.vertex, result.factored]) {
      if (form.kind !== 'available') continue;
      assertFiniteExpression(form.expression);
      assert.doesNotMatch(form.latex, /NaN|Infinity/);
      if ('parameters' in form) for (const value of Object.values(form.parameters)) {
        if (typeof value === 'number') assert.ok(Number.isFinite(value));
        if (Array.isArray(value)) for (const root of value) assert.ok(Number.isFinite(root));
      }
    }
  }
});

function assertEquivalent(result: QuadraticForms): void {
  const source = compileExpression(result.expanded.expression);
  const scale = Math.max(Math.abs(result.coefficients.a), Math.abs(result.coefficients.b), Math.abs(result.coefficients.c));
  for (const form of [result.vertex, result.factored]) {
    if (form.kind !== 'available') continue;
    const evaluate = compileExpression(form.expression);
    // Values at 0, ±1 determine a degree-two polynomial; the larger cohort
    // pressures ordinary floating-point evaluation across the graph vicinity.
    for (const x of [-100, -10, -4, -1, -0.125, 0, 0.375, 1, 4, 10, 100]) {
      const expected = source({ x }), actual = evaluate({ x });
      const tolerance = Math.max(Number.MIN_VALUE * 16, 1e-10 * scale * (1 + Math.abs(x) + x * x));
      assert.ok(Number.isFinite(actual));
      assert.ok(Math.abs(actual - expected) <= tolerance, `${JSON.stringify(result.coefficients)} at ${x}: ${actual} vs ${expected}`);
    }
  }
}

function assertFiniteExpression(expression: MathExpression): void {
  switch (expression.kind) {
    case 'constant': assert.ok(Number.isFinite(expression.value)); break;
    case 'variable': break;
    case 'add': expression.terms.forEach(assertFiniteExpression); break;
    case 'multiply': expression.factors.forEach(assertFiniteExpression); break;
    case 'divide': assertFiniteExpression(expression.numerator); assertFiniteExpression(expression.denominator); break;
    case 'power': assert.ok(Number.isFinite(expression.exponent)); assertFiniteExpression(expression.base); break;
    default: assertFiniteExpression(expression.value);
  }
}
