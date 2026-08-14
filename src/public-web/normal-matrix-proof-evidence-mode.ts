export type KpNormalMatrixProofEvidenceMode = "motion" | "static";

export function resolveKpNormalMatrixProofEvidenceMode(
  search: string
): KpNormalMatrixProofEvidenceMode {
  return readKpNormalMatrixProofEvidenceMode(new URLSearchParams(search));
}

export function readKpNormalMatrixProofEvidenceMode(
  parameters: URLSearchParams
): KpNormalMatrixProofEvidenceMode {
  return parameters.get("evidence") === "static"
    ? "static"
    : "motion";
}

export function writeKpNormalMatrixProofEvidenceMode(
  parameters: URLSearchParams,
  mode: KpNormalMatrixProofEvidenceMode
): void {
  if (mode === "static") parameters.set("evidence", mode);
}
