/** Scoped relation, not a universal definition of momentum. Published versions
 * are immutable: a changed claim is a new release, never an in-place upgrade. */
export const newtonianMomentumV1 = Object.freeze({
  id: "physics.newtonian-momentum",
  version: "1.0.0",
  premise: String.raw`\mathbf p=m\mathbf v`,
  resultId: "physics.velocity-from-momentum",
  result: String.raw`\mathbf v=\frac{\mathbf p}{m}`,
  assumption: "m>0",
  operation: "divide-by-nonzero-scalar",
} as const);
