/** One scalar cancellation family, not an arbitrary LaTeX solver. Symbols are
 * source notation; the checker, not the author, supplies all intermediate states. */
export interface ScalarCancellationSource {
  readonly schema: "kp.algebra.scalar-cancellation.v1";
  readonly result: string;
  readonly factor: string;
  readonly numerator: string;
  readonly factorDomain: "positive-real";
  readonly numeratorDomain: "real";
}
export const scalarCancellationSource: ScalarCancellationSource = Object.freeze({
  schema: "kp.algebra.scalar-cancellation.v1", result: "Q", factor: "x", numerator: "y",
  factorDomain: "positive-real", numeratorDomain: "real"
});
declare const checked: unique symbol;
export interface CheckedScalarCancellation { readonly source: ScalarCancellationSource; readonly [checked]: true }
const issued = new WeakSet<object>();
export function checkScalarCancellation(value: unknown):
  | { status: "checked"; model: CheckedScalarCancellation }
  | { status: "repair-required"; code: "algebra.scalar-cancellation.unsupported-source"; path: string; expected: string } {
  const gap = (path: string, expected: string) => ({ status: "repair-required" as const,
    code: "algebra.scalar-cancellation.unsupported-source" as const, path, expected });
  if (!value || typeof value !== "object") return gap("$", "A bounded scalar-cancellation source");
  const fields = Object.getOwnPropertyDescriptors(value);
  const keys = Object.keys(scalarCancellationSource);
  if (Reflect.ownKeys(value).length !== keys.length || keys.some(key => !fields[key] || fields[key]!.get || fields[key]!.set))
    return gap("$", "Exactly the six scalar-cancellation data fields");
  for (const key of ["schema", "factorDomain", "numeratorDomain"] as const)
    if (fields[key]!.value !== scalarCancellationSource[key]) return gap(`$.${key}`, scalarCancellationSource[key]);
  const symbols = ["result", "factor", "numerator"] as const;
  for (const key of symbols) if (typeof fields[key]!.value !== "string" || !/^[A-Za-z]$/.test(fields[key]!.value))
    return gap(`$.${key}`, "A single Latin-letter symbol");
  if (new Set(symbols.map(key => fields[key]!.value)).size !== 3) return gap("$", "Three distinct symbols");
  const source = Object.freeze(Object.fromEntries(keys.map(key => [key, fields[key]!.value]))) as unknown as ScalarCancellationSource;
  const model = Object.freeze({ source }) as CheckedScalarCancellation;
  issued.add(model);
  return { status: "checked", model };
}
export function assertScalarCancellation(model: CheckedScalarCancellation) {
  if (!issued.has(model)) throw new Error("Scalar cancellation requires original checked algebra authority");
}
export function scalarCancellationView(model: CheckedScalarCancellation, refined = false) {
  assertScalarCancellation(model);
  const { result: q, factor: x, numerator: y } = model.source;
  const coefficients = [
    { half: true, outside: true, identity: false, denominator: "square" },
    { half: true, outside: true, identity: false, denominator: "product" },
    { half: true, outside: false, identity: true, denominator: "factor" },
    { half: false, outside: false, identity: false, denominator: "twice-factor" }
  ] as const;
  const denominators = { square: { latex: x + "^2", power: 2, divisor: 1 },
    product: { latex: String.raw`${x}\cdot ${x}`, power: 2, divisor: 1 },
    factor: { latex: x, power: 1, divisor: 1 }, "twice-factor": { latex: "2" + x, power: 1, divisor: 2 } };
  // The same descriptors drive notation and exact monomial normalization:
  // coefficient 1/2 and factor power -1. Positivity licenses the inverse;
  // the real numerator's square is unchanged throughout.
  const states = coefficients.map(c => {
    const denominator = denominators[c.denominator];
    if (Number(c.outside) - denominator.power !== -1 || (c.half ? 2 : 1) * denominator.divisor !== 2)
      throw new Error("Invalid scalar cancellation proof");
    return q + "=" + (c.half ? String.raw`\frac{1}{2}` : "") + (c.outside ? x : "") +
      (c.identity ? String.raw`\cdot1` : "") + String.raw`\frac{${y}^2}{${denominator.latex}}`;
  });
  const major = Object.freeze({ id: "cancel-factor", title: "Cancel one factor, not both",
    cue: `Expose the two denominator factors, cancel one matching pair, then collect the fractions. One denominator $${x}$ remains; the $2$ comes from $1/2$.`,
    why: `Since $${x}>0$, division by $${x}$ is allowed. Write its square as two factors and cancel just one matching pair.` });
  const children = [
    { id: "expand-square", title: "Expose the two denominator factors", cue: `Write $${x}^2=${x}\\cdot ${x}$. A square contains two copies of the factor.`, why: "This is the definition of squaring. The numerator is unchanged." },
    { id: "cancel-pair", title: "Cancel one nonzero pair", cue: `The outside $${x}$ and one denominator $${x}$ give $1$. The second denominator $${x}$ remains.`, why: `Because $${x}>0$, the ratio $${x}/${x}$ is defined and equals $1$.` },
    { id: "collect-coefficient", title: "Collect the remaining denominator", cue: `The factor $1/2$ puts $2$ beside the remaining $${x}$ in the denominator.`, why: `Multiplication by $1$ changes no value; $(1/2)(1/${x})=1/(2${x})$.` }
  ].map(step => Object.freeze(step));
  return Object.freeze({ states: Object.freeze(refined ? states : [states[0]!, states[3]!]),
    steps: Object.freeze(refined ? children : [major]), majorSteps: Object.freeze([major]),
    proof: Object.freeze(refined ? ["square-definition", "nonzero-inverse-cancellation", "scalar-product-association"] : ["nonzero-scalar-cancellation"]),
    refinement: refined ? Object.freeze({ parentTransitionId: "algebra.scalar.cancel-factor", sourceStateId: "scalar.cancel-factor.0", targetStateId: "scalar.cancel-factor.1",
      childOperationIds: Object.freeze(children.map(step => `algebra.scalar.${step.id}`)) }) : undefined });
}
