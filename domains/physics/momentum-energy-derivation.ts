/** Bounded Euclidean-vector derivation. This frontend does not parse arbitrary
 * LaTeX or give scalar rewrite rules authority over vector-valued expressions. */
export const momentumEnergyDerivationSource = Object.freeze({
  schema: "kp.physics.momentum-energy-derivation.v1",
  mass: "positive-real", velocity: "euclidean-vector", momentum: "mass-times-velocity"
} as const);

type Source = typeof momentumEnergyDerivationSource;
declare const checked: unique symbol;
export type CheckedMomentumEnergyDerivation = Readonly<{
  source: Source;
  proof: readonly ["substitution-under-congruence", "squared-norm-homogeneity", "nonzero-scalar-cancellation"];
  readonly [checked]: true;
}>;
const issued = new WeakSet<object>();

export function checkMomentumEnergyDerivation(value: unknown):
  | { status: "checked"; model: CheckedMomentumEnergyDerivation }
  | { status: "repair-required"; code: "physics.derivation.unsupported-source"; path: string } {
  if (typeof value !== "object" || value === null) return gap("$");
  const descriptors = Object.getOwnPropertyDescriptors(value);
  const keys = Object.keys(momentumEnergyDerivationSource) as (keyof Source)[];
  if (Reflect.ownKeys(value).length !== keys.length) return gap("$");
  for (const key of keys) {
    if (descriptors[key]?.value !== momentumEnergyDerivationSource[key] || descriptors[key]?.get)
      return gap(`$.${key}`);
  }
  // Exact proof by components: substituting p_i=m*v_i in each summand of
  // (p_1²+...+p_n²)/(2m) gives m*(v_1²+...+v_n²)/2. Positive m licenses division.
  // The three licensed rewrites preserve that expression; no numerical sample
  // or caller-supplied proof label is used to establish the identity.
  const model = Object.freeze({ source: momentumEnergyDerivationSource,
    proof: Object.freeze(["substitution-under-congruence", "squared-norm-homogeneity", "nonzero-scalar-cancellation"])
  }) as unknown as CheckedMomentumEnergyDerivation;
  issued.add(model);
  return { status: "checked", model };
}
function gap(path: string) { return { status: "repair-required" as const, code: "physics.derivation.unsupported-source" as const, path }; }
export function assertMomentumEnergyDerivation(model: CheckedMomentumEnergyDerivation) {
  if (!issued.has(model)) throw new Error("Derivation requires original checked vector/mass authority");
}

export const momentumEnergyDerivationStates = Object.freeze([
  String.raw`K=\frac{1}{2}m|\mathbf v|^2`,
  String.raw`K=\frac{1}{2}m\left|\frac{\mathbf p}{m}\right|^2`,
  String.raw`K=\frac{1}{2}m\frac{|\mathbf p|^2}{m^2}`,
  String.raw`K=\frac{|\mathbf p|^2}{2m}`
] as const);

export const momentumEnergyDerivationSteps = Object.freeze([
  { id: "substitute", title: "Substitute velocity", cue: String.raw`Since $\mathbf p=m\mathbf v$, replace $\mathbf v$ with $\mathbf p/m$.`,
    why: "Rearrange the momentum definition. Since mass is positive, division by mass is allowed. Substitution preserves the surrounding squared magnitude." },
  { id: "scale-magnitude", title: "Square the denominator too", cue: String.raw`Scaling a vector by $1/m$ scales its squared magnitude by $1/m^2$.`,
    why: String.raw`Component by component, $(p_i/m)^2=p_i^2/m^2$. Summing gives $|\mathbf p/m|^2=|\mathbf p|^2/m^2$. This is a vector-norm identity, not division of vectors.` },
  { id: "cancel-mass", title: "Cancel one mass factor", cue: String.raw`For positive mass, $m/m^2=1/m$. Both forms have the same scalar factor; the squared momentum magnitude is unchanged.`,
    why: String.raw`Write $m^2=m\cdot m$. Then $m/(m\cdot m)=1/m$, because $m>0$. The squared momentum magnitude is unchanged.` }
] as const);

export type EnergyDerivationDetail = "coarse" | "mass-refinement";
// The squared vector norm is an unchanged subtree. Only its real scalar
// coefficient is normalized; no scalar rule acquires authority over vectors.
const coefficients = [
  { half: true, numeratorMass: true, identity: false, denominator: "square" },
  { half: true, numeratorMass: true, identity: false, denominator: "product" },
  { half: true, numeratorMass: false, identity: true, denominator: "mass" },
  { half: false, numeratorMass: false, identity: false, denominator: "twice-mass" }
] as const;
const denominator = { square: "m^2", product: String.raw`m\cdot m`, mass: "m", "twice-mass": "2m" } as const;
const refinedStates = Object.freeze(coefficients.map(c => `K=${c.half ? String.raw`\frac{1}{2}` : ""}${c.numeratorMass ? "m" : ""}${c.identity ? String.raw`\cdot1` : ""}`
  + String.raw`\frac{|\mathbf p|^2}{${denominator[c.denominator]}}`));
const refinementSteps = Object.freeze([
  { id: "expand-mass-square", title: "Expose the two mass factors", cue: String.raw`Write $m^2=m\cdot m$. Now the denominator's two factors are explicit.`,
    why: "A square means multiplying the same scalar by itself. Nothing about the squared momentum magnitude changes." },
  { id: "cancel-mass-pair", title: "Cancel one nonzero mass factor", cue: String.raw`One numerator $m$ and one denominator $m$ give $1$. The other denominator $m$ remains.`,
    why: String.raw`Because $m>0$, the pair $m/m$ is defined and equals $1$. Cancellation removes one pair, not both denominator factors.` },
  { id: "collect-energy-coefficient", title: "Collect the remaining denominator", cue: String.raw`Multiplying by $1/2$ puts the factor $2$ beside the remaining $m$ in the denominator.`,
    why: String.raw`The scalar identity $(1/2)(1/m)=1/(2m)$ changes notation, not value. The numerator $|\mathbf p|^2$ persists.` }
] as const);

/** Exact bounded proof over positive scalar monomials, not numerical samples.
 * A checked parent is required before any fine transition can be issued. */
export function momentumEnergyDerivationView(model: CheckedMomentumEnergyDerivation, detail: EnergyDerivationDetail = "coarse") {
  assertMomentumEnergyDerivation(model);
  if (detail === "coarse") return Object.freeze({ states: momentumEnergyDerivationStates, steps: momentumEnergyDerivationSteps, proof: model.proof, refinement: undefined });
  if (detail !== "mass-refinement") throw new Error("Unsupported energy derivation detail");
  for (const c of coefficients) {
    const power = Number(c.numeratorMass) - (c.denominator === "square" || c.denominator === "product" ? 2 : 1);
    const divisor = (c.half ? 2 : 1) * (c.denominator === "twice-mass" ? 2 : 1);
    if (power !== -1 || divisor !== 2) throw new Error("Invalid scalar cancellation refinement");
  }
  if (refinedStates[0] !== momentumEnergyDerivationStates[2] || refinedStates.at(-1) !== momentumEnergyDerivationStates[3])
    throw new Error("Cancellation refinement changed its outer endpoints");
  return Object.freeze({ states: Object.freeze([...momentumEnergyDerivationStates.slice(0, 2), ...refinedStates]),
    steps: Object.freeze([...momentumEnergyDerivationSteps.slice(0, 2), ...refinementSteps].map(step => Object.freeze({ ...step }))),
    proof: Object.freeze([...model.proof.slice(0, 2), "square-definition", "nonzero-inverse-cancellation", "scalar-product-association"]),
    refinement: Object.freeze({ parentTransitionId: "physics.energy.cancel-mass", sourceStateId: "energy.cancel-mass.0", targetStateId: "energy.cancel-mass.1",
      childOperationIds: Object.freeze(refinementSteps.map(step => `physics.energy.${step.id}`)) }) });
}
