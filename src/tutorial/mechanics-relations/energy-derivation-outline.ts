import { momentumEnergyDerivationSteps, type momentumEnergyDerivationView } from "../../../domains/public-api.ts";

import type { DerivationStep, DerivationView } from "../../semantic/momentum-energy-derivation-plan.ts";

type OutlineStep =
  | { readonly label: string; readonly depth: 0 }
  | { readonly label: string; readonly depth: 1; readonly parent: { readonly label: string; readonly title: string }; readonly first: boolean; readonly last: boolean };

/** Labels belong to operations, not visible row offsets. Refinement membership
 * comes from the checked source; expanding a parent cannot renumber siblings. */
export function createEnergyDerivationOutline(view: ReturnType<typeof momentumEnergyDerivationView>): readonly OutlineStep[] {
  return createDerivationOutline(view, momentumEnergyDerivationSteps, "physics.energy");
}

export function createDerivationOutline(view: DerivationView, majors: readonly DerivationStep[], operationPrefix: string): readonly OutlineStep[] {
  return Object.freeze(view.steps.map((step): OutlineStep => {
    const major = majors.findIndex(candidate => candidate.id === step.id);
    if (major >= 0) return Object.freeze({ label: String(major + 1), depth: 0 });
    const refinement = view.refinement;
    const child = refinement?.childOperationIds.indexOf(`${operationPrefix}.${step.id}`) ?? -1;
    const parent = majors.findIndex(candidate => `${operationPrefix}.${candidate.id}` === refinement?.parentTransitionId);
    if (!refinement || child < 0 || parent < 0) throw new Error("Missing checked transition outline membership");
    return Object.freeze({ label: `${parent + 1}.${child + 1}`, depth: 1,
      parent: Object.freeze({ label: String(parent + 1), title: majors[parent]!.title }),
      first: child === 0, last: child === refinement.childOperationIds.length - 1 });
  }));
}
