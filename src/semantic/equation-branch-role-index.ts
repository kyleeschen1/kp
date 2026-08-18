import type { KpAssetBundle } from "./asset.ts";

export type KpEquationBranchRole = "lhs" | "rhs";
export type KpEquationBranchRoleIndex = Readonly<
  Record<string, KpEquationBranchRole>
>;

/**
 * New equation schemas carry lhs/rhs in semantic IDs. Older hand-authored
 * assets preserve mathematical reading order instead, so the equality
 * selector is the stable compatibility boundary for recovering branch role.
 */
export function createKpEquationBranchRoleIndex(
  bundle: KpAssetBundle
): KpEquationBranchRoleIndex {
  const entries: [string, KpEquationBranchRole][] = [];
  for (const object of bundle.objects) {
    if (object.objectType !== "equation") continue;
    const relationIndexes = object.selectors.flatMap((selector, index) =>
      isEqualitySelector(selector.id, selector.kind, selector.label ?? "")
        ? [index]
        : []
    );
    // Equation-like expression objects without a relation are legal; they
    // simply contribute no both-sides branch authority.
    if (relationIndexes.length === 0) continue;
    if (relationIndexes.length > 1) {
      throw new Error(
        `Equation ${object.id} has ambiguous equality selectors.`
      );
    }
    const relationIndex = relationIndexes[0]!;
    object.selectors.forEach((selector, index) => {
      if (index === relationIndex) return;
      entries.push([selector.id, index < relationIndex ? "lhs" : "rhs"]);
    });
  }
  return Object.freeze(Object.fromEntries(entries));
}

function isEqualitySelector(
  id: string,
  kind: string,
  label: string
): boolean {
  return kind === "relation" && (
    label.trim() === "=" ||
    id.split(".").some((segment) =>
      segment === "equals" || segment === "equality"
    )
  );
}
