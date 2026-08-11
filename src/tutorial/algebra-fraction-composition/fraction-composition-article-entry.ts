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

let disposeEnhancement = mountKpFractionCompositionArticleEnhancement(window);

if (import.meta.env.DEV) {
  void Promise.all([
    import("../../dev-review/reader-review-bootstrap.ts"),
    import("../../dev-toolbar/development-toolbar-bootstrap.ts"),
    import("./fraction-composition-dev-toolbar-contribution.ts")
  ]).then(([review, toolbar, contribution]) => {
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
                  mountKpFractionCompositionArticleEnhancement(window);
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
    }, { once: true });
  });
} else {
  window.addEventListener("pagehide", disposeEnhancement, { once: true });
}
