type KpNormalMatrixStageCapability = typeof import(
  "../tutorial/normal-matrix-proof/normal-matrix-proof-stage-capability.ts"
);
import { kpNormalMatrixProofCheckpointTimeMs } from
  "../semantic/normal-matrix-proof-checkpoints.ts";
import { selectKpNormalMatrixProofSettledCheckpoint } from
  "../tutorial/normal-matrix-proof/normal-matrix-proof-settled-stage-state.ts";
import {
  decodeKpNormalMatrixProofSemanticLocation,
  paintKpNormalMatrixProofSemanticFocus
} from "../tutorial/normal-matrix-proof/normal-matrix-proof-semantic-focus.ts";
import {
  decodeKpNormalMatrixProofUrl,
  encodeKpNormalMatrixProofUrl,
  type KpNormalMatrixProofUrlState
} from "./normal-matrix-proof-url-codec.ts";

let routeState = decodeKpNormalMatrixProofUrl(window.location.href);
let semanticAddress = decodeKpNormalMatrixProofSemanticLocation(
  window.location.hash
);
document.documentElement.dataset["kpNormalProofEvidence"] = routeState.evidence;

const fallback = document.querySelector<HTMLElement>(
  "[data-kp-normal-proof-stage-fallback]"
);
if (fallback !== null) {
  selectKpNormalMatrixProofSettledCheckpoint(fallback, routeState.checkpoint);
  paintKpNormalMatrixProofSemanticFocus(fallback, semanticAddress);
}
replaceCanonicalHistory(routeState);

let capabilityHandle: ReturnType<
  KpNormalMatrixStageCapability["mountKpNormalMatrixProofStageCapability"]
> | undefined;
let requestCapability = (): void => undefined;

const restoreLocation = (): void => {
  const next = decodeKpNormalMatrixProofUrl(window.location.href);
  const nextAddress = decodeKpNormalMatrixProofSemanticLocation(
    window.location.hash
  );
  if (next.evidence !== routeState.evidence) {
    window.location.reload();
    return;
  }
  if (
    next.checkpoint === routeState.checkpoint &&
    nextAddress === semanticAddress
  ) return;
  routeState = next;
  semanticAddress = nextAddress;
  if (fallback !== null) {
    selectKpNormalMatrixProofSettledCheckpoint(fallback, next.checkpoint);
  }
  capabilityHandle?.seek(kpNormalMatrixProofCheckpointTimeMs(next.checkpoint));
  if (fallback !== null) {
    paintKpNormalMatrixProofSemanticFocus(fallback, semanticAddress);
  }
  if (semanticAddress !== undefined) requestCapability();
};

window.addEventListener("popstate", restoreLocation);
window.addEventListener("hashchange", restoreLocation);

if (fallback !== null && routeState.evidence === "motion") {
  let requested = false;
  requestCapability = (): void => {
    if (requested) return;
    requested = true;
    void import(
      "../tutorial/normal-matrix-proof/normal-matrix-proof-stage-capability.ts"
    ).then((capability: KpNormalMatrixStageCapability) => {
      capabilityHandle = capability.mountKpNormalMatrixProofStageCapability(
        document,
        {
          initialTimeMs: kpNormalMatrixProofCheckpointTimeMs(routeState.checkpoint),
          onCheckpointChange(checkpoint) {
            if (checkpoint === routeState.checkpoint) return;
            routeState = { ...routeState, checkpoint };
            replaceCanonicalHistory(routeState);
          }
        }
      );
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

if (semanticAddress !== undefined) requestCapability();

function replaceCanonicalHistory(state: KpNormalMatrixProofUrlState): void {
  const canonical = encodeKpNormalMatrixProofUrl(window.location.href, state);
  if (canonical !== window.location.href) {
    window.history.replaceState(null, "", canonical);
  }
}
