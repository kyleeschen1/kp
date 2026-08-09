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
