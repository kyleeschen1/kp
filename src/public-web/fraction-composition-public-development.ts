import type { KpReaderDevReviewFrame } from
  "../dev-review/reader-capture-provider.ts";
import { createKpReaderDevReviewFramePublisher } from
  "../dev-review/reader-frame-publisher.ts";
import { mountKpReaderDevReview } from
  "../dev-review/reader-review-bootstrap.ts";
import { mountKpDevelopmentToolbar } from
  "../dev-toolbar/development-toolbar-bootstrap.ts";
import { kpDevToolbarProtocolSchema } from
  "../dev-toolbar/dev-toolbar-protocol.ts";
import type { KpFractionCompositionArticleCanonicalSample } from
  "../tutorial/algebra-fraction-composition/fraction-composition-article-transport.ts";
import { mountKpFractionCompositionArticleEnhancement } from
  "../tutorial/algebra-fraction-composition/fraction-composition-progressive-entry.ts";
import { kpFractionCompositionArticleRuntimeManifest } from
  "../tutorial/algebra-fraction-composition/fraction-composition-runtime-manifest.ts";

export function mountKpFractionCompositionPublicDevelopment(
  ownerWindow: Window = window
): () => void {
  const publisher = createKpReaderDevReviewFramePublisher(ownerWindow);
  let previousAtMs: number | undefined;
  const publish = (
    sample: KpFractionCompositionArticleCanonicalSample
  ): void => {
    const atMs = performance.now();
    const frame: KpReaderDevReviewFrame = {
      atMs,
      documentId: kpFractionCompositionArticleRuntimeManifest.documentId,
      documentVersion:
        kpFractionCompositionArticleRuntimeManifest.release.version,
      assetId: kpFractionCompositionArticleRuntimeManifest.release.animationId,
      checkpointId:
        sample.clock.checkpointId ?? sample.snapshot.accessibleEquationState,
      progressPermille: sample.snapshot.progressPermille,
      projectionId: "kp.public-web.fraction-composition",
      activeTransformationIds: [...sample.snapshot.activeTransformationIds],
      activePhase: sample.snapshot.activePhase,
      focusSource: sample.focus.activeSource,
      focusRefs: [...sample.focus.objectRefs],
      motionPreference: sample.motionPreference,
      motionMode: "scrub-player",
      playbackDirection: sample.clock.direction,
      rendererId: "reader.equation.material-layer",
      motionAuthority: sample.snapshot.motionAuthority,
      fitStatus: sample.snapshot.fitStatus,
      fitScale: sample.snapshot.fitScale,
      layoutRevision: sample.snapshot.layoutRevision,
      layoutReadCount: sample.snapshot.layoutReadCount,
      fontRevision: sample.snapshot.fontRevision,
      fontReady: sample.snapshot.fontReady,
      ownerIds: [...sample.snapshot.ownerIds],
      ...(previousAtMs === undefined
        ? {}
        : { frameIntervalMs: atMs - previousAtMs })
    };
    publisher.publish(frame);
    previousAtMs = atMs;
  };
  const disposeEnhancement = mountKpFractionCompositionArticleEnhancement(
    ownerWindow,
    publish,
    { attentionStageRequested: true }
  );
  const disposeReview = mountKpReaderDevReview(ownerWindow);
  const toolbar = mountKpDevelopmentToolbar(ownerWindow);
  toolbar.setRoute({
    schemaVersion: kpDevToolbarProtocolSchema,
    routeId: "tutorial.public-fraction-composition",
    controls: []
  });

  return () => {
    disposeEnhancement();
    toolbar.clearRoute("tutorial.public-fraction-composition");
    toolbar.dispose();
    disposeReview();
    publisher.dispose();
  };
}
