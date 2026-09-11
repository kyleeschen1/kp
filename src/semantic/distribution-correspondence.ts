import type { CorrespondenceMap } from "./correspondence.ts";
import type { KpFactoringSelectorRoles } from "./factoring-correspondence.ts";

/** The canonical distribution owner assigns lineage. Additional multiplication
 * punctuation is a structural artifact, never copied factor material. */
export function createKpDistributionCorrespondenceMap(id: string, roles: KpFactoringSelectorRoles & {
  readonly productArtifacts?: readonly string[];
}): CorrespondenceMap {
  const identity = (id: string, pair: readonly [string, string], summary: string) => ({ id, relation: "identity" as const,
    sourceSelectorIds: [pair[0]], targetSelectorIds: [pair[1]], summary });
  return { id, records: [
    { id: "factor-distributes", relation: "fan-out", sourceSelectorIds: [roles.commonFactor], targetSelectorIds: [...roles.factorCopies],
      summary: "The shared factor distributes to both terms." },
    identity("left-term-persists", roles.leftTerm, "The left term persists."),
    identity("right-term-persists", roles.rightTerm, "The right term persists."),
    identity("plus-persists", roles.plus, "Addition persists."),
    { id: "grouping-exits", relation: "removal", sourceSelectorIds: [...roles.grouping], targetSelectorIds: [],
      summary: "The grouping delimiters exit after distribution." },
    ...(roles.productArtifacts?.length ? [{ id: "product-punctuation-enters", relation: "introduction" as const,
      sourceSelectorIds: [], targetSelectorIds: [...roles.productArtifacts], summary: "Make the distributed numeric multiplication explicit." }] : [])
  ] };
}
