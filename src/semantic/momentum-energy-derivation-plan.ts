import { assertMomentumEnergyDerivation, momentumEnergyDerivationSteps, momentumEnergyDerivationView, type EnergyDerivationDetail, type CheckedMomentumEnergyDerivation } from "../../domains/public-api.ts";

import { assertScalarCancellation, scalarCancellationView, type CheckedScalarCancellation } from "../../domains/algebra/scalar-cancellation.ts";
import { sha256 } from "../kernel/sha256.ts";

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
  readonly view: DerivationView;
  readonly majorSteps: readonly DerivationStep[];
  readonly moves: readonly EnergyDerivationMove[];
  readonly [issuedPlan]: true;
}
export interface EnergyDerivationMove {
  readonly id: string;
  readonly operationKind: "substitute" | "scale-magnitude" | "cancel-factor" | "expand-square" | "cancel-pair" | "collect-coefficient";
  readonly persist: readonly string[];
  readonly exits: readonly string[];
  readonly entries: readonly string[];
  readonly split: boolean;
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
    ...cancellationRoles(detail)
  ];
  const view = momentumEnergyDerivationView(model, detail);
  const moves = roles.map((role, i) => Object.freeze({ ...role, id: view.steps[i]!.id,
    persist: Object.freeze(role.persist), exits: Object.freeze(role.exits), entries: Object.freeze(role.entries) }));
  const plan: EnergyDerivationPlan = Object.freeze({ [issuedPlan]: true as const, model, moves: Object.freeze(moves), namespace: "energy", artifactId: "physics.energy-derivation", packId: detail === "coarse" ? "project.physics.energy-derivation" : "project.physics.energy-refinement", operationPrefix: "physics.energy",
    title: "Energy in terms of momentum", assumptions: Object.freeze(["m is a positive real scalar; p=m v; Euclidean vectors"]),
    notation: Object.freeze({ result: "K", factor: "m", numerator: String.raw`|\mathbf p|^2` }),
    sourceRevision: sha256(JSON.stringify(model.source)), view, majorSteps: momentumEnergyDerivationSteps });
  issued.add(plan);
  return plan;
}
export function assertEnergyDerivationPlan(plan: EnergyDerivationPlan) {
  if (!issued.has(plan)) throw new Error("Energy derivation paint requires an original proof-derived plan");
}

/** Separate issuer: scalar input never acquires the physics proof. The renderer
 * consumes identical role topology, not a relabelled vector model. */
export function createScalarCancellationPlan(model: CheckedScalarCancellation, detail: EnergyDerivationDetail = "coarse"): EnergyDerivationPlan {
  assertScalarCancellation(model);
  if (detail !== "coarse" && detail !== "mass-refinement") throw new Error("Unsupported scalar derivation detail");
  const view = scalarCancellationView(model, detail !== "coarse");
  const roles = cancellationRoles(detail);
  const moves = roles.map((role, i) => Object.freeze({ ...role, id: view.steps[i]!.id,
    persist: Object.freeze(role.persist), exits: Object.freeze(role.exits), entries: Object.freeze(role.entries) }));
  const plan: EnergyDerivationPlan = Object.freeze({ [issuedPlan]: true as const, model, namespace: "scalar", artifactId: "algebra.scalar-cancellation", packId: `project.algebra.scalar-cancellation.${detail}`, operationPrefix: "algebra.scalar",
    title: "Why does one denominator factor remain?", assumptions: Object.freeze([`${model.source.factor}>0; ${model.source.numerator} is real`]),
    notation: Object.freeze({ result: model.source.result, factor: model.source.factor, numerator: `${model.source.numerator}^2` }),
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
