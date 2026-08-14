export type KpNormalMatrixProofEvidenceMode = "motion" | "static";

export function resolveKpNormalMatrixProofEvidenceMode(
  search: string
): KpNormalMatrixProofEvidenceMode {
  return new URLSearchParams(search).get("evidence") === "static"
    ? "static"
    : "motion";
}
