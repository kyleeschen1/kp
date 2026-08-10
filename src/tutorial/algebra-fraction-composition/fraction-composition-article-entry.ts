import {
  mountKpFractionCompositionArticleEnhancement
} from "./fraction-composition-progressive-entry.ts";
import type { KpArticleSourceEditorSession } from
  "../../article/kp-article-source-editor.ts";

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
    const updateToolbar = (): void => toolbarSession.setRoute(
      contribution.createKpFractionCompositionDevToolbarContribution(
        editor !== undefined
      ),
      (command) => {
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
