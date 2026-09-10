import type { CorrespondenceMap } from "./correspondence.ts";

export interface KpFactoringSelectorRoles {
  readonly factorCopies: readonly [string, string];
  readonly commonFactor: string;
  readonly leftTerm: readonly [string, string];
  readonly rightTerm: readonly [string, string];
  readonly plus: readonly [string, string];
  readonly grouping: readonly [string, string];
}

/** Canonical factoring owns lifecycle assignment. Callers bind semantic roles,
 * not relation kinds, motif choices, or independently assembled lineage. */
export function createKpFactoringCorrespondenceMap(id: string, roles: KpFactoringSelectorRoles): CorrespondenceMap {
  const identity = (id: string, pair: readonly [string, string], summary: string) => ({
    id, relation: "identity" as const, sourceSelectorIds: [pair[0]], targetSelectorIds: [pair[1]], summary
  });
  return { id, records: [
    { id: "factors-merge", relation: "fan-in", sourceSelectorIds: [...roles.factorCopies], targetSelectorIds: [roles.commonFactor],
      summary: "The repeated factors merge into one shared factor." },
    identity("left-term-persists", roles.leftTerm, "The left term persists."),
    identity("right-term-persists", roles.rightTerm, "The right term persists."),
    identity("plus-persists", roles.plus, "Addition persists."),
    { id: "grouping-enters", relation: "introduction", sourceSelectorIds: [], targetSelectorIds: [...roles.grouping],
      summary: "Grouping delimiters enter around the sum." }
  ] };
}
