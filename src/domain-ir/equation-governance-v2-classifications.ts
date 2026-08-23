export interface KpEquationGovernanceV2Classification {
  readonly assetId: string;
  readonly disposition: "diagnostic-authority-rejected";
  readonly rationale: string;
}

/** Invalid teaching fixtures remain loadable diagnostics, never semantic authority. */
export const kpEquationGovernanceV2Classifications:
readonly KpEquationGovernanceV2Classification[] = Object.freeze([
  Object.freeze({
    assetId: "animation.generated.substitute-three.provisional-incorrect",
    disposition: "diagnostic-authority-rejected" as const,
    rationale:
      "The fixture intentionally demonstrates a rejected correspondence and must not compile as governed motion."
  })
]);

export function findKpEquationGovernanceV2Classification(
  assetId: string
): KpEquationGovernanceV2Classification | undefined {
  return kpEquationGovernanceV2Classifications.find(
    (classification) => classification.assetId === assetId
  );
}
