type KpNormalMatrixStageCapability = typeof import(
  "../tutorial/normal-matrix-proof/normal-matrix-proof-stage-capability.ts"
);
import { resolveKpNormalMatrixProofEvidenceMode } from
  "./normal-matrix-proof-evidence-mode.ts";

const evidenceMode = resolveKpNormalMatrixProofEvidenceMode(
  window.location.search
);
document.documentElement.dataset["kpNormalProofEvidence"] = evidenceMode;

const fallback = document.querySelector<HTMLElement>(
  "[data-kp-normal-proof-stage-fallback]"
);

if (fallback !== null && evidenceMode === "motion") {
  let requested = false;
  const requestCapability = (): void => {
    if (requested) return;
    requested = true;
    void import(
      "../tutorial/normal-matrix-proof/normal-matrix-proof-stage-capability.ts"
    ).then((capability: KpNormalMatrixStageCapability) => {
      capability.mountKpNormalMatrixProofStageCapability(document);
    });
  };

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver((entries) => {
      if (!entries.some(({ isIntersecting }) => isIntersecting)) return;
      observer.disconnect();
      requestCapability();
    }, { rootMargin: "480px 0px" });
    observer.observe(fallback);
  } else {
    requestCapability();
  }
}
