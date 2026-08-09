import {
  createKpArticleStageActivationController
} from "../../article/kp-article-stage-activation.ts";
import {
  kpFractionCompositionArticleRuntimeManifest
} from "./fraction-composition-runtime-manifest.ts";
import type {
  KpFractionCompositionArticleRuntimeSession
} from "./fraction-composition-runtime-capability.ts";

export function mountKpFractionCompositionArticleEnhancement(
  ownerWindow: Window = window
): () => void {
  const host = ownerWindow.document.querySelector<HTMLElement>(
    "[data-kp-algebra-stage-host]"
  );
  if (host === null) return () => undefined;
  let runtimeSession: KpFractionCompositionArticleRuntimeSession | undefined;
  const activation = createKpArticleStageActivationController({
    manifests: [kpFractionCompositionArticleRuntimeManifest],
    load: async (manifest) => {
      const capability = await import("./fraction-composition-runtime-capability.ts");
      runtimeSession = await capability.mountKpFractionCompositionArticleRuntime({
        host,
        manifest
      });
      return runtimeSession;
    },
    onChange: ({ state }) => {
      host.dataset["kpAlgebraStageActivation"] = state;
    }
  });
  const activateNearViewport = (): void => {
    void activation.activateStage("solve", "near-viewport").catch(() => {
      // The complete static projection remains visible when enhancement fails.
    });
  };
  const observer = new IntersectionObserver((entries) => {
    if (!entries.some(({ isIntersecting }) => isIntersecting)) return;
    observer.disconnect();
    activateNearViewport();
  }, { rootMargin: "50% 0px" });
  observer.observe(host);
  if (ownerWindow.location.hash !== "") {
    void activation.activateAddress(ownerWindow.location.hash).catch(() => {
      // Direct addressing is an enhancement; static anchors still navigate.
    });
  }
  return () => {
    observer.disconnect();
    runtimeSession?.dispose();
  };
}
