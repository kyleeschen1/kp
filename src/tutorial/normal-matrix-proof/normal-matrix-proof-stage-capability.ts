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
  let disposed = false;
  if (stage !== null) {
    void observeSettledFragments(stage).then((count) => {
      if (disposed) return;
      stage.dataset["kpNormalProofFragmentCount"] = String(count);
      stage.dataset["kpNormalProofGeometry"] = "settled";
    }).catch((error: unknown) => {
      if (disposed) return;
      stage.dataset["kpNormalProofGeometry"] = "failed";
      stage.dataset["kpNormalProofGeometryError"] = error instanceof Error
        ? error.message
        : String(error);
    });
  }
  return () => {
    disposed = true;
    delete publication.dataset["kpNormalProofCapability"];
    stage?.removeAttribute("data-kp-normal-proof-native-owner");
    delete stage?.dataset["kpNormalProofFragmentCount"];
    delete stage?.dataset["kpNormalProofGeometry"];
    delete stage?.dataset["kpNormalProofGeometryError"];
  };
}

async function observeSettledFragments(stage: HTMLElement): Promise<number> {
  await (stage.ownerDocument.fonts?.ready ?? Promise.resolve());
  await new Promise<void>((resolve) => {
    (stage.ownerDocument.defaultView?.requestAnimationFrame ?? requestAnimationFrame)(
      () => resolve()
    );
  });
  const nodes = [
    ...stage.querySelectorAll<HTMLElement>(
      "[data-kp-normal-proof-settled-scene]:not([hidden]) [data-kp-motion-id][data-kp-normal-proof-path]"
    )
  ];
  const observation = observeKpNativeKatexFragments({
    stage,
    fontRevision: 0,
    bindings: nodes.map((node, index) => ({
      id: `normal-proof.active-fragment.${index}`,
      semanticEntityId: node.dataset["kpNormalProofPath"]!,
      motionId: node.dataset["kpMotionId"]!,
      glyphKey: node.dataset["kpNormalProofGlyphKey"]!
    }))
  });
  return observation.fragments.length;
}
import { observeKpNativeKatexFragments } from
  "../../rendering/native-katex-fragment-observer.ts";
