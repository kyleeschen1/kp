import { assertMomentumEnergyDerivation, momentumEnergyDerivationSteps, momentumEnergyDerivationView, type EnergyDerivationDetail, type CheckedMomentumEnergyDerivation } from "../../domains/public-api.ts";

import { assertScalarCancellation, scalarCancellationView, type CheckedScalarCancellation } from "../../domains/algebra/scalar-cancellation.ts";
import { sha256 } from "../kernel/sha256.ts";
import { newtonianMomentumV1, momentumNormScalingView } from "../../domains/public-api.ts";

export interface DerivationStep { readonly id: string; readonly title: string; readonly cue: string; readonly why: string }
export interface DerivationView {
  readonly states: readonly string[];
  readonly steps: readonly DerivationStep[];
  readonly proof: readonly string[];
  readonly refinement: { readonly parentTransitionId: string; readonly sourceStateId: string; readonly targetStateId: string; readonly childOperationIds: readonly string[] } | undefined;
}
const issuedPlan: unique symbol = Symbol("checked-derivation-plan");
export interface EnergyDerivationPlan {
  readonly model: CheckedMomentumEnergyDerivation | CheckedScalarCancellation;
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
    | { kind: "explanatory"; purpose: "expose-factor-cancellation" }
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
export interface EnergyDerivationMove {
  readonly id: string;
  readonly operationKind: "substitute" | "scale-magnitude" | "extract-norm-scale" | "square-quotient" | "cancel-factor" | "cancel-unit-power" | "expand-square" | "cancel-pair" | "collect-coefficient";
  readonly syntaxOnly?: true;
  readonly persist: readonly string[];
  readonly exits: readonly string[];
  readonly entries: readonly string[];
  readonly split: boolean;
  readonly notice?: readonly string[];
}
const issued = new WeakSet<object>();

/** Endpoint roles belong to the bounded semantic proof. Both build-time
 * governance and runtime paint binding derive from this small authority, so
 * the browser need not load authoring compilers or trust a serialized proof. */
export function createEnergyDerivationPlan(model: CheckedMomentumEnergyDerivation, detail: EnergyDerivationDetail = "coarse"): EnergyDerivationPlan {
  assertMomentumEnergyDerivation(model);
  const roles: Omit<EnergyDerivationMove, "id">[] = [
    { operationKind: "substitute", persist: ["prefix", "half", "mass", "left", "right", "power"], exits: ["velocity"], entries: ["replacement"], split: false },
    { operationKind: "scale-magnitude", persist: ["prefix", "half", "mass", "left", "right", "momentum", "denominator", "rule"], exits: [], entries: [], split: true },
    ...(detail === "coarse" ? [{ operationKind: "cancel-unit-power" as const,
      persist: ["prefix", "norm", "rule", "factor-retain", "two"],
      exits: ["mass", "power", "half", "coefficient-one"], entries: [], split: false,
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
      exits: Object.freeze(["paren-left", "paren-right"]), entries: Object.freeze([]), split: true,
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
function cancellationRoles(detail: EnergyDerivationDetail): readonly Omit<EnergyDerivationMove, "id">[] {
  return detail === "coarse" ? [
    { operationKind: "cancel-factor", persist: ["prefix", "norm"], exits: ["half", "mass", "rule", "scalar-before"], entries: ["rule", "scalar-after"], split: false }
  ] : [
    { operationKind: "expand-square", persist: ["prefix", "half", "mass", "rule", "norm"], exits: ["scalar-before"], entries: ["factor-cancel", "times", "factor-retain"], split: false },
    { operationKind: "cancel-pair", persist: ["prefix", "half", "rule", "norm", "factor-retain"], exits: ["mass", "factor-cancel", "times"], entries: ["identity"], split: false },
    { operationKind: "collect-coefficient", persist: ["prefix", "norm", "factor-retain"], exits: ["half", "identity", "rule"], entries: ["rule", "two"], split: false }
  ];
}
