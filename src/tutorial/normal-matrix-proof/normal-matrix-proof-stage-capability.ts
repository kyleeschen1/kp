/**
 * This lazy boundary deliberately owns no clock or paint yet. Later slices can
 * replace its readiness marker without pulling interaction into static HTML.
 */
export function mountKpNormalMatrixProofStageCapability(
  document: Document
): () => void {
  const publication = document.querySelector<HTMLElement>(
    "[data-kp-normal-proof-publication]"
  );
  if (publication === null) return () => undefined;
  publication.dataset["kpNormalProofCapability"] = "ready";
  const stage = publication.querySelector<HTMLElement>(
    "[data-kp-normal-proof-stage]"
  );
  stage?.setAttribute("data-kp-normal-proof-native-owner", "settled-katex");
  return () => {
    delete publication.dataset["kpNormalProofCapability"];
    stage?.removeAttribute("data-kp-normal-proof-native-owner");
  };
}
