/** Bounded authored theorem, not an arbitrary differentiation service. The
 * Euclidean metric and mass are constant; changing either adds derivative terms. */
export const forceEnergySource = Object.freeze({ schema: "kp.physics.force-energy.v1",
  mass: "constant-positive-real", momentum: "differentiable-euclidean-vector",
  frame: "inertial-cartesian", force: "net-force-is-momentum-derivative" } as const);
declare const checked: unique symbol;
export type CheckedForceEnergy = Readonly<{ source: typeof forceEnergySource; readonly [checked]: true }>;
const issued = new WeakSet<object>();
export function checkForceEnergy(value: unknown):
  | { status: "checked"; model: CheckedForceEnergy }
  | { status: "repair-required"; code: "physics.power.unsupported-source"; path: string } {
  const gap = (path: string) => ({ status: "repair-required", code: "physics.power.unsupported-source", path } as const);
  if (!value || typeof value !== "object") return gap("$");
  const descriptors = Object.getOwnPropertyDescriptors(value);
  if (Reflect.ownKeys(value).length !== Object.keys(forceEnergySource).length) return gap("$");
  for (const key of Object.keys(forceEnergySource) as (keyof typeof forceEnergySource)[])
    if (descriptors[key]?.get || descriptors[key]?.value !== forceEnergySource[key]) return gap(`$.${key}`);
  // Component product rule yields p_i' p_i + p_i p_i'. Commutativity gives
  // 2 p_i p_i'; multiplying by 1/(2m) yields p_i p_i'/m for every component.
  const model = Object.freeze({ source: forceEnergySource }) as CheckedForceEnergy;
  issued.add(model);
  return { status: "checked", model };
}
export function assertForceEnergy(model: CheckedForceEnergy) {
  if (!issued.has(model)) throw new Error("Power inspection requires original fixed-mass calculus authority");
}
const r = String.raw;
export const forceEnergyStates = Object.freeze([
  r`\frac{dK}{dt}=\frac{1}{2m}\frac{d}{dt}(\mathbf p\cdot\mathbf p)`,
  r`\frac{dK}{dt}=\frac{1}{2m}(\dot{\mathbf p}\cdot\mathbf p+\mathbf p\cdot\dot{\mathbf p})`,
  r`\frac{dK}{dt}=\frac{1}{2m}(\mathbf p\cdot\dot{\mathbf p}+\mathbf p\cdot\dot{\mathbf p})`,
  r`\frac{dK}{dt}=\frac{1}{2m}2\mathbf p\cdot\dot{\mathbf p}`,
  r`\frac{dK}{dt}=\frac{1}{m}\mathbf p\cdot\dot{\mathbf p}`,
  r`\frac{dK}{dt}=\frac{\mathbf p}{m}\cdot\dot{\mathbf p}`
]);
export const forceEnergySteps = Object.freeze([
  { id: "product-rule", title: "Differentiate each factor once",
    cue: r`Both copies of $\mathbf p$ change with time. The product rule gives two contributions: change the first factor while holding the second fixed, then change the second while holding the first fixed.`,
    why: r`Apply $(ab)'=a'b+ab'$ to each component in $\mathbf p\cdot\mathbf p=\sum_i p_i^2$, then add. A dot over $\mathbf p$ means $d\mathbf p/dt$; the centered dot means a dot product.` },
  { id: "dot-symmetry", title: "Recognize the same contribution twice",
    cue: r`Reverse the order of the first dot product. Now the two contributions read identically.`,
    why: r`For real Euclidean vectors, $\mathbf a\cdot\mathbf b=\mathbf b\cdot\mathbf a$. This is not a rule for arbitrary products such as matrix multiplication.` },
  { id: "collect-terms", title: "Two equal contributions",
    cue: r`The sum is twice $\mathbf p\cdot\dot{\mathbf p}$. The factor $2$ comes from differentiating both factors, not from an extra force.`,
    why: r`Each dot product is a scalar. Adding that scalar to itself gives twice the scalar.` },
  { id: "cancel-two", title: "Cancel the matched factors of two",
    cue: r`The product rule's $2$ cancels the denominator's $2$. The mass and the dot product remain; only the matched factors cancel.`,
    why: r`Since $2\ne0$ and $m>0$, $(1/(2m))2=1/m$. Cancellation consumes one numerator/denominator pair, not the whole coefficient.` },
  { id: "absorb-scalar", title: "Put the remaining scalar with momentum",
    cue: r`Now write the factor $1/m$ with $\mathbf p$: momentum divided by mass, dotted with its rate of change.`,
    why: r`Bilinearity allows $(1/m)(\mathbf p\cdot\dot{\mathbf p})=(\mathbf p/m)\cdot\dot{\mathbf p}$. This is reassociation after cancellation, not another canceled factor.` }
].map(step => Object.freeze(step)));
export const forceEnergyMajorSteps = Object.freeze([Object.freeze({ id: "differentiate-energy", title: "Differentiate the squared momentum",
  cue: r`Differentiating $\mathbf p\cdot\mathbf p$ gives two equal contributions. They cancel the $2$ in $1/(2m)$, leaving momentum divided by mass, dotted with its rate of change.`,
  why: r`Use the componentwise product rule, symmetry and bilinearity of the Euclidean dot product. Constant mass lets $1/(2m)$ stay outside the derivative. Open the smaller steps to inspect each reason.` })]);
export function forceEnergyView(model: CheckedForceEnergy, fine: boolean) {
  assertForceEnergy(model);
  return Object.freeze({ states: fine ? forceEnergyStates : Object.freeze([forceEnergyStates[0]!, forceEnergyStates.at(-1)!]),
    steps: fine ? forceEnergySteps : forceEnergyMajorSteps,
    proof: Object.freeze(fine ? ["component-product-rule", "euclidean-dot-symmetry", "scalar-like-term-addition", "nonzero-scalar-cancellation", "dot-product-bilinearity"] : ["fixed-mass-quadratic-derivative"]),
    refinement: fine ? Object.freeze({ parentTransitionId: "physics.power.differentiate-energy", sourceStateId: "power.differentiate-energy.0", targetStateId: "power.differentiate-energy.1",
      childOperationIds: Object.freeze(forceEnergySteps.map(step => `physics.power.${step.id}`)) }) : undefined });
}
