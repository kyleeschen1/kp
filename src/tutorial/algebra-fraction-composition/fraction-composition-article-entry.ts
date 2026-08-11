import {
  mountKpFractionCompositionArticleEnhancement
} from "./fraction-composition-progressive-entry.ts";
import type { KpArticleSourceEditorSession } from
  "../../article/kp-article-source-editor.ts";
import {
  isKpFractionCompositionAttentionStageRequested
} from "./fraction-composition-attention-stage.ts";
import {
  readKpFractionCompositionAttentionTempo
} from "./fraction-composition-attention-pacing.ts";
import {
  kpFractionCompositionArticleRuntimeManifest
} from "./fraction-composition-runtime-manifest.ts";
import type {
  KpFractionCompositionArticleCanonicalSample
} from "./fraction-composition-article-transport.ts";
import type { KpReaderDevReviewFrame } from
  "../../dev-review/reader-capture-provider.ts";

let disposeEnhancement = (): void => undefined;

if (import.meta.env.DEV) {
  void Promise.all([
    import("../../dev-review/reader-review-bootstrap.ts"),
    import("../../dev-review/reader-frame-publisher.ts"),
    import("../../dev-toolbar/development-toolbar-bootstrap.ts"),
    import("./fraction-composition-dev-toolbar-contribution.ts")
  ]).then(([review, frameBridge, toolbar, contribution]) => {
    const publisher = frameBridge.createKpReaderDevReviewFramePublisher(window);
    let previousAtMs: number | undefined;
    let previousScrollY = window.scrollY;
    const publishCanonicalSample = (
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
        projectionId: "article.equation.symbolic",
        activeTransformationIds: [
          ...sample.snapshot.activeTransformationIds
        ],
        activePhase: sample.snapshot.activePhase,
        focusSource: sample.focus.activeSource,
        focusRefs: [...sample.focus.objectRefs],
        motionPreference: sample.motionPreference,
        motionMode: "continuous",
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
          : { frameIntervalMs: atMs - previousAtMs }),
        scrollDeltaY: window.scrollY - previousScrollY
      };
      publisher.publish(frame);
      previousAtMs = atMs;
      previousScrollY = window.scrollY;
    };
    disposeEnhancement = mountKpFractionCompositionArticleEnhancement(
      window,
      publishCanonicalSample
    );
    const disposeReview = review.mountKpReaderDevReview(window);
    const toolbarSession = toolbar.mountKpDevelopmentToolbar(window);
    let editor: KpArticleSourceEditorSession | undefined;
    const attentionTempo = isKpFractionCompositionAttentionStageRequested(
      window.location.search
    )
      ? readKpFractionCompositionAttentionTempo(window.location.search)
      : undefined;
    const updateToolbar = (): void => toolbarSession.setRoute(
      contribution.createKpFractionCompositionDevToolbarContribution(
        editor !== undefined,
        attentionTempo
      ),
      (command) => {
        if (command.controlId ===
            contribution.kpFractionCompositionAttentionTempoControlId &&
            typeof command.value === "string") {
          const next = new URL(window.location.href);
          if (command.value === "deliberate") {
            next.searchParams.delete("attentionTempo");
          } else {
            next.searchParams.set("attentionTempo", command.value);
          }
          window.location.assign(next);
          return;
        }
        if (command.controlId !==
            contribution.kpFractionCompositionEditArticleControlId ||
            editor !== undefined) return;
        void import("./fraction-composition-article-authoring.ts").then(
          ({ mountKpFractionCompositionArticleEditor }) => {
            editor = mountKpFractionCompositionArticleEditor({
              ownerDocument: document,
              preview: (publicationHtml) => {
                const app = document.querySelector<HTMLElement>("#app");
                if (app === null) return;
                disposeEnhancement();
                app.innerHTML = publicationHtml;
                disposeEnhancement =
                  mountKpFractionCompositionArticleEnhancement(
                    window,
                    publishCanonicalSample
                  );
              },
              onClose: () => {
                editor = undefined;
                updateToolbar();
              }
            });
            updateToolbar();
          }
        );
      }
    );
    updateToolbar();
    window.addEventListener("pagehide", () => {
      void editor?.close(true);
      disposeEnhancement();
      toolbarSession.clearRoute("tutorial.algebra-fraction-composition");
      toolbarSession.dispose();
      disposeReview();
      publisher.dispose();
    }, { once: true });
  });
} else {
  disposeEnhancement = mountKpFractionCompositionArticleEnhancement(window);
  window.addEventListener("pagehide", disposeEnhancement, { once: true });
}
