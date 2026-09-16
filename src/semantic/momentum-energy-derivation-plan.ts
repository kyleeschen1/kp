import { assertMomentumEnergyDerivation, momentumEnergyDerivationSteps, momentumEnergyDerivationView, type EnergyDerivationDetail, type CheckedMomentumEnergyDerivation } from "../../domains/public-api.ts";

import { assertScalarCancellation, scalarCancellationView, type CheckedScalarCancellation } from "../../domains/algebra/scalar-cancellation.ts";
import { sha256 } from "../kernel/sha256.ts";
import { newtonianMomentumV1, momentumNormScalingView } from "../../domains/public-api.ts";
import { assertForceEnergy, forceEnergyView, forceEnergyMajorSteps, type CheckedForceEnergy } from "../../domains/physics/force-energy-derivation.ts";
import { assertDerivationLocalRewrite, type DerivationLocalRewrite } from "./derivation-local-rewrite.ts";

export interface DerivationStep { readonly id: string; readonly title: string; readonly cue: string; readonly why: string }
export interface DerivationView {
  readonly states: readonly string[];
  readonly steps: readonly DerivationStep[];
  readonly proof: readonly string[];
  readonly refinement: { readonly parentTransitionId: string; readonly sourceStateId: string; readonly targetStateId: string; readonly childOperationIds: readonly string[] } | undefined;
}
const issuedPlan: unique symbol = Symbol("checked-derivation-plan");
export interface EnergyDerivationPlan {
  readonly model: CheckedMomentumEnergyDerivation | CheckedScalarCancellation | CheckedForceEnergy;
  readonly refinementLabel?: string;
  readonly refinementDefault?: true;
  readonly namespace: string;
  readonly sourceRevision: string;
  readonly artifactId: string;
  readonly packId: string;
  readonly operationPrefix: string;
  readonly title: string;
  readonly assumptions: readonly string[];
  readonly notation: { readonly result: string; readonly factor: string; readonly numerator: string };
  readonly coefficientGranularity: "fraction" | "factors";
  readonly compactInspection: "atomic" | "refinement";
  readonly inspections?: Readonly<Record<string, EnergyDerivationPlan>>;
  readonly cancellationScore: Readonly<
    | { kind: "explanatory"; purpose: "expose-factor-cancellation" | "expose-product-rule" }
    | { kind: "fluent"; purpose: "relate-energy-and-momentum";
        prerequisites: readonly ["nonzero-scalar-cancellation", "unit-exponent-notation"];
        expansion: "mass-refinement" }>;
  readonly view: DerivationView;
  readonly majorSteps: readonly DerivationStep[];
  readonly moves: readonly EnergyDerivationMove[];
  readonly recall?: Readonly<{
    id: string; passageId: string; premise: string; result: string; assumption: string;
    conceptId: typeof newtonianMomentumV1.id; conceptVersion: typeof newtonianMomentumV1.version;
    transitionId: string; sourceEntityId: string; targetEntityId: string;
  }>;
  readonly [issuedPlan]: true;
}
export type EnergyDerivationMove = {
  readonly id: string;
  readonly copies?: readonly { readonly source: string; readonly targets: readonly string[] }[];
  readonly syntaxOnly?: true;
  readonly persist: readonly string[];
  readonly exits: readonly string[];
  readonly entries: readonly string[];
  readonly notice?: readonly string[];
} & (
  | { readonly operationKind: "collect-terms"; readonly rewrite: Extract<DerivationLocalRewrite, { kind: "equal-term-collection" }> }
  | { readonly operationKind: "cancel-two"; readonly rewrite: Extract<DerivationLocalRewrite, { kind: "matched-factor-cancellation" }> }
  | { readonly operationKind: "absorb-scalar"; readonly rewrite: Extract<DerivationLocalRewrite, { kind: "scalar-reassociation" }> }
  | { readonly operationKind: "substitute" | "scale-magnitude" | "extract-norm-scale" | "square-quotient" | "cancel-factor" | "cancel-unit-power" | "expand-square" | "cancel-pair" | "collect-coefficient" | "differentiate-energy" | "product-rule" | "dot-symmetry"; readonly rewrite?: never }
) & ({ readonly split: false } | {
  readonly split: true;
  // Lineage alone cannot select choreography: scope propagation is not
  // operand distribution, even when both produce two descendants.
  readonly branching: "scope-propagation" | "operand-distribution";
});
type DerivationMoveRoles = EnergyDerivationMove extends infer Move
  ? Move extends EnergyDerivationMove ? Omit<Move, "id"> : never : never;
const issued = new WeakSet<object>();

/** Endpoint roles belong to the bounded semantic proof. Both build-time
 * governance and runtime paint binding derive from this small authority, so
 * the browser need not load authoring compilers or trust a serialized proof. */
export function createEnergyDerivationPlan(model: CheckedMomentumEnergyDerivation, detail: EnergyDerivationDetail = "coarse"): EnergyDerivationPlan {
  assertMomentumEnergyDerivation(model);
  const roles: DerivationMoveRoles[] = [
    { operationKind: "substitute", persist: ["prefix", "half", "mass", "left", "right", "power"], exits: ["velocity"], entries: ["replacement"], split: false },
    { operationKind: "scale-magnitude", persist: ["prefix", "half", "mass", "left", "right", "momentum", "denominator", "rule"], exits: [], entries: [], split: true, branching: "scope-propagation" },
    ...(detail === "coarse" ? [{ operationKind: "cancel-unit-power" as const,
      persist: ["prefix", "norm", "rule", "factor-retain", "two"],
      exits: ["mass", "power", "half", "coefficient-one"], entries: [], split: false as const,
      notice: Object.freeze(["factor-retain", "two"]) }] : cancellationRoles(detail))
  ];
  const view = momentumEnergyDerivationView(model, detail);
  const moves = roles.map((role, i) => Object.freeze({ ...role, id: view.steps[i]!.id,
    persist: Object.freeze(role.persist), exits: Object.freeze(role.exits), entries: Object.freeze(role.entries) }));
  const plan: EnergyDerivationPlan = Object.freeze({ [issuedPlan]: true as const, model, moves: Object.freeze(moves), namespace: "energy", artifactId: "physics.energy-derivation", packId: detail === "coarse" ? "project.physics.energy-derivation" : "project.physics.energy-refinement", operationPrefix: "physics.energy",
    title: "Energy in terms of momentum", assumptions: Object.freeze(["m is a positive real scalar; p=m v; Euclidean vectors"]),
    notation: Object.freeze({ result: "K", factor: "m", numerator: String.raw`\lVert\mathbf p\rVert^2` }), coefficientGranularity: "fraction", compactInspection: "atomic",
    cancellationScore: detail === "coarse" ? Object.freeze({ kind: "fluent", purpose: "relate-energy-and-momentum",
      prerequisites: Object.freeze(["nonzero-scalar-cancellation", "unit-exponent-notation"] as const), expansion: "mass-refinement" })
      : Object.freeze({ kind: "explanatory", purpose: "expose-factor-cancellation" }),
    sourceRevision: sha256(JSON.stringify(model.source)), view, majorSteps: momentumEnergyDerivationSteps,
    // This bounded reference is issued from the same checked p=m v authority
    // as substitution; a matching fragment of display text is not provenance.
    recall: Object.freeze({ id: newtonianMomentumV1.resultId, passageId: "momentum-definition",
      conceptId: newtonianMomentumV1.id, conceptVersion: newtonianMomentumV1.version,
      premise: newtonianMomentumV1.premise, result: newtonianMomentumV1.result,
      assumption: newtonianMomentumV1.assumption, transitionId: "substitute",
      sourceEntityId: "energy.substitute.0.velocity", targetEntityId: "energy.substitute.1.replacement" }) });
  issued.add(plan);
  const childView = momentumNormScalingView(model);
  const childMoves: readonly EnergyDerivationMove[] = Object.freeze([
    Object.freeze({ id: "extract-norm-scale", operationKind: "extract-norm-scale", syntaxOnly: true,
      persist: Object.freeze(["prefix", "half", "mass", "left", "right", "momentum", "denominator", "rule", "power"]),
      exits: Object.freeze([]), entries: Object.freeze(["paren-left", "paren-right"]), split: false,
      notice: Object.freeze(["left", "right", "denominator"]) }),
    Object.freeze({ id: "square-quotient", operationKind: "square-quotient", syntaxOnly: true,
      persist: Object.freeze(["prefix", "half", "mass", "norm", "denominator", "rule"]),
      exits: Object.freeze(["paren-left", "paren-right"]), entries: Object.freeze([]), split: true, branching: "scope-propagation",
      notice: Object.freeze(["norm", "denominator"]) })
  ]);
  const children: EnergyDerivationPlan = Object.freeze({ ...plan, view: childView, moves: childMoves,
    packId: "project.physics.norm-scaling-refinement", artifactId: "physics.norm-scaling-refinement" });
  issued.add(children);
  const composed: EnergyDerivationPlan = Object.freeze({ ...plan, inspections: Object.freeze({ "scale-magnitude": children }) });
  issued.add(composed);
  return composed;
}
export function assertEnergyDerivationPlan(plan: EnergyDerivationPlan) {
  if (!issued.has(plan)) throw new Error("Energy derivation paint requires an original proof-derived plan");
  for (const move of plan.moves) if (move.rewrite) assertDerivationLocalRewrite(move.rewrite, move);
}

/** Calculus has its own checked issuer. Static energy identities alone do not
 * license differentiation or Newton's law. The existing reader owns access. */
export function createForceEnergyPlan(model: CheckedForceEnergy, detail: EnergyDerivationDetail = "coarse"): EnergyDerivationPlan {
  assertForceEnergy(model);
  if (detail !== "coarse" && detail !== "mass-refinement") throw new Error("Unsupported power detail");
  const fine = detail !== "coarse", view = forceEnergyView(model, fine);
  const roles: DerivationMoveRoles[] = fine ? [
    { operationKind: "product-rule", syntaxOnly: true, split: false,
      persist: ["prefix", "half", "left", "right", "dot"], exits: ["derivative"],
      entries: ["derivative-first", "derivative-second", "plus", "dot-second"],
      copies: [{ source: "p-first", targets: ["p-first", "p-first-copy"] }, { source: "p-second", targets: ["p-second", "p-second-copy"] }],
      notice: [] },
    { operationKind: "dot-symmetry", split: false,
      persist: ["prefix", "half", "left", "right", "first-rate", "first-momentum", "dot", "plus", "second-term"], exits: [], entries: [],
      notice: ["first-rate", "first-momentum"] },
    { operationKind: "collect-terms", split: false,
      persist: ["prefix", "half", "first-term"], exits: ["second-term", "plus", "left", "right"], entries: ["two"],
      rewrite: Object.freeze({ kind: "equal-term-collection", anchor: "first-term", duplicate: "second-term", coefficient: "two", removedSyntax: Object.freeze(["plus", "left", "right"]) }),
      notice: ["first-term"] },
    { operationKind: "cancel-two", split: false,
      persist: ["prefix", "one", "rule", "mass", "term"], exits: ["denominator-two", "two"], entries: [],
      rewrite: Object.freeze({ kind: "matched-factor-cancellation", pair: Object.freeze(["denominator-two", "two"] as const), survivors: Object.freeze(["mass", "term", "rule", "one"]) }), notice: ["mass"] },
    { operationKind: "absorb-scalar", split: false,
      persist: ["prefix", "mass", "rule", "momentum", "dot", "rate"], exits: ["one"], entries: [],
      rewrite: Object.freeze({ kind: "scalar-reassociation", carrier: "momentum", unit: "one", fractionRule: "rule", survivors: Object.freeze(["mass", "rule", "dot", "rate"]) }), notice: ["momentum", "mass"] }
  ] : [{ operationKind: "differentiate-energy", split: false, persist: ["prefix"], exits: ["before"], entries: ["after"] }];
  const moves = Object.freeze(roles.map((role, i) => Object.freeze({ ...role, id: view.steps[i]!.id,
    persist: Object.freeze(role.persist), exits: Object.freeze(role.exits), entries: Object.freeze(role.entries),
    ...(role.copies ? { copies: Object.freeze(role.copies.map(copy => Object.freeze({ source: copy.source, targets: Object.freeze(copy.targets) }))) } : {}) })));
  const plan: EnergyDerivationPlan = Object.freeze({ [issuedPlan]: true as const, model, moves,
    namespace: "power", artifactId: `physics.force-energy.${detail}`, packId: `project.physics.force-energy.${detail}`, operationPrefix: "physics.power",
    title: "Why does force along motion change energy?", assumptions: Object.freeze(Object.values(model.source).slice(1)),
    notation: Object.freeze({ result: String.raw`\frac{dK}{dt}`, factor: "m", numerator: String.raw`\mathbf p\cdot\mathbf p` }),
    coefficientGranularity: "fraction", compactInspection: fine ? "atomic" : "refinement",
    cancellationScore: Object.freeze({ kind: "explanatory", purpose: "expose-product-rule" }),
    refinementLabel: "Smaller product-rule steps", refinementDefault: true,
    sourceRevision: sha256(JSON.stringify(model.source)), view, majorSteps: forceEnergyMajorSteps });
  issued.add(plan);
  assertEnergyDerivationPlan(plan);
  return plan;
}

export function resolveDerivationRecallUse(plan: EnergyDerivationPlan, resultId: string, sourceRevision: string) {
  assertEnergyDerivationPlan(plan);
  const reference = plan.recall;
  const move = reference ? plan.moves.findIndex(step => step.id === reference.transitionId) : -1;
  if (!reference || reference.id !== resultId || plan.sourceRevision !== sourceRevision || move < 0)
    return { status: "repair-required", code: "derivation.recall.unbound-use" } as const;
  const operation = plan.moves[move]!;
  if (operation.operationKind !== "substitute" ||
      !operation.exits.some(role => `${plan.namespace}.${operation.id}.0.${role}` === reference.sourceEntityId) ||
      !operation.entries.some(role => `${plan.namespace}.${operation.id}.1.${role}` === reference.targetEntityId))
    return { status: "repair-required", code: "derivation.recall.invalid-correspondence" } as const;
  return { status: "ready", move, reference } as const;
}

/** Separate issuer: scalar input never acquires the physics proof. The renderer
 * consumes identical role topology, not a relabelled vector model. */
export function createScalarCancellationPlan(model: CheckedScalarCancellation, detail: EnergyDerivationDetail = "coarse"): EnergyDerivationPlan {
  assertScalarCancellation(model);
  if (detail !== "coarse" && detail !== "mass-refinement") throw new Error("Unsupported scalar derivation detail");
  const view = scalarCancellationView(model, detail !== "coarse");
  const roles = cancellationRoles(detail).map(role => {
    // Tracking the coefficient's denominator is a lineage choice, not a new
    // motion. The same native persistent track carries it during collection.
    const collecting = role.operationKind === "collect-coefficient";
    const coarse = role.operationKind === "cancel-factor";
    return { ...role, persist: [...role.persist, ...(!coarse ? ["two", ...(!collecting ? ["coefficient-one"] : [])] : [])],
      exits: [...role.exits, ...(coarse ? ["coefficient-one", "two"] : collecting ? ["coefficient-one"] : [])],
      entries: role.entries.filter(id => !collecting || id !== "two"), notice: Object.freeze(collecting ? ["two"] : []) };
  });
  const moves = roles.map((role, i) => Object.freeze({ ...role, id: view.steps[i]!.id,
    persist: Object.freeze(role.persist), exits: Object.freeze(role.exits), entries: Object.freeze(role.entries) }));
  const plan: EnergyDerivationPlan = Object.freeze({ [issuedPlan]: true as const, model, namespace: "scalar", artifactId: "algebra.scalar-cancellation", packId: `project.algebra.scalar-cancellation.${detail}`, operationPrefix: "algebra.scalar",
    title: "Why does one denominator factor remain?", assumptions: Object.freeze([`${model.source.factor}>0; ${model.source.numerator} is real`]),
    notation: Object.freeze({ result: model.source.result, factor: model.source.factor, numerator: `${model.source.numerator}^2` }),
    coefficientGranularity: "factors", compactInspection: detail === "coarse" ? "refinement" : "atomic",
    cancellationScore: Object.freeze({ kind: "explanatory", purpose: "expose-factor-cancellation" }),
    sourceRevision: sha256(JSON.stringify(model.source)), view, majorSteps: view.majorSteps, moves: Object.freeze(moves) });
  issued.add(plan);
  return plan;
}

/** Shared topology, licensed independently by each domain. Legacy role names
 * stay stable for physics publications; they do not grant physics authority. */
function cancellationRoles(detail: EnergyDerivationDetail): readonly DerivationMoveRoles[] {
  return detail === "coarse" ? [
    { operationKind: "cancel-factor", persist: ["prefix", "norm"], exits: ["half", "mass", "rule", "scalar-before"], entries: ["rule", "scalar-after"], split: false }
  ] : [
    { operationKind: "expand-square", persist: ["prefix", "half", "mass", "rule", "norm"], exits: ["scalar-before"], entries: ["factor-cancel", "times", "factor-retain"], split: false },
    { operationKind: "cancel-pair", persist: ["prefix", "half", "rule", "norm", "factor-retain"], exits: ["mass", "factor-cancel", "times"], entries: ["identity"], split: false },
    { operationKind: "collect-coefficient", persist: ["prefix", "norm", "factor-retain"], exits: ["half", "identity", "rule"], entries: ["rule", "two"], split: false }
  ];
}
