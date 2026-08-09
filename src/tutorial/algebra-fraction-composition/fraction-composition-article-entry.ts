import {
  mountKpFractionCompositionArticleEnhancement
} from "./fraction-composition-progressive-entry.ts";

const disposeEnhancement = mountKpFractionCompositionArticleEnhancement(window);
window.addEventListener("pagehide", disposeEnhancement, { once: true });

if (import.meta.env.DEV) {
  void Promise.all([
    import("../../dev-review/reader-review-bootstrap.ts"),
    import("../../dev-toolbar/development-toolbar-bootstrap.ts")
  ]).then(([review, toolbar]) => {
    const disposeReview = review.mountKpReaderDevReview(window);
    const toolbarSession = toolbar.mountKpDevelopmentToolbar(window);
    window.addEventListener("pagehide", () => {
      toolbarSession.dispose();
      disposeReview();
    }, { once: true });
  });
}
