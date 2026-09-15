import { assertMomentumEnergyDerivation, momentumEnergyDerivationView, type EnergyDerivationDetail, type CheckedMomentumEnergyDerivation } from "../../domains/public-api.ts";

declare const issuedPlan: unique symbol;
export interface EnergyDerivationPlan {
  readonly model: CheckedMomentumEnergyDerivation;
  readonly moves: readonly EnergyDerivationMove[];
  readonly [issuedPlan]: true;
}
export interface EnergyDerivationMove {
  readonly id: "substitute" | "scale-magnitude" | "cancel-mass" | "expand-mass-square" | "cancel-mass-pair" | "collect-energy-coefficient";
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
  const roles = [
    { persist: ["prefix", "half", "mass", "left", "right", "power"], exits: ["velocity"], entries: ["replacement"], split: false },
    { persist: ["prefix", "half", "mass", "left", "right", "momentum", "denominator", "rule"], exits: [], entries: [], split: true },
    { persist: ["prefix", "norm"], exits: ["half", "mass", "rule", "scalar-before"], entries: ["rule", "scalar-after"], split: false }
  ];
  if (detail === "mass-refinement") roles.splice(2, 1,
    { persist: ["prefix", "half", "mass", "rule", "norm"], exits: ["scalar-before"], entries: ["factor-cancel", "times", "factor-retain"], split: false },
    { persist: ["prefix", "half", "rule", "norm", "factor-retain"], exits: ["mass", "factor-cancel", "times"], entries: ["identity"], split: false },
    { persist: ["prefix", "norm", "factor-retain"], exits: ["half", "identity", "rule"], entries: ["rule", "two"], split: false });
  const view = momentumEnergyDerivationView(model, detail);
  const moves = roles.map((role, i) => Object.freeze({ ...role, id: view.steps[i]!.id,
    persist: Object.freeze(role.persist), exits: Object.freeze(role.exits), entries: Object.freeze(role.entries) }));
  const plan = Object.freeze({ model, moves: Object.freeze(moves) }) as EnergyDerivationPlan;
  issued.add(plan);
  return plan;
}
export function assertEnergyDerivationPlan(plan: EnergyDerivationPlan) {
  if (!issued.has(plan)) throw new Error("Energy derivation paint requires an original proof-derived plan");
}
