import primary from "../../src/authoring/examples/composed-algebra-primary.json" with { type: "json" };

/** Source variations only: no proof, geometry, timing or renderer overrides. */
export const composedAlgebraPressureCases = [
  { name: "zero", left: 0, right: 0, factor: "(x+3)" },
  { name: "repeated", left: 0, right: 3, factor: "(x+x)" },
  { name: "wide", left: 12, right: 34, factor: "(x*x)" }
].flatMap(spec => (["left", "right"] as const).map(orientation => {
  const product = (coefficient: string) => orientation === "left" ? `${spec.factor}*${coefficient}` : `${coefficient}*${spec.factor}`;
  const latex = [`${product(String(spec.left))}+${product(String(spec.right))}`,
    product(`(${spec.left}+${spec.right})`), product(String(spec.left + spec.right))];
  return { name: `${spec.name}-${orientation}`, orientation, result: spec.left + spec.right,
    source: { ...primary, id: `lesson.pressure.${spec.name}.${orientation}`,
      states: primary.states.map((state, index) => ({ ...state, latex: latex[index]! })) } };
}));
