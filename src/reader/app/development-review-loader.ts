export type KpReaderDevelopmentReviewMount = (ownerWindow: Window) => void;

// Keep the DEV branch at module scope so Vite can erase the dynamic import and
// its dependency graph instead of merely making it unreachable at runtime.
export const mountKpReaderDevelopmentReview: KpReaderDevelopmentReviewMount | undefined =
  import.meta.env.DEV
    ? (ownerWindow) => {
        // The Animation Library owns one persistent capture shell around its
        // selected host; a nested reader shell would duplicate the control.
        if (
          ownerWindow.frameElement?.hasAttribute(
            "data-animation-library-frame"
          ) === true
        ) {
          return;
        }
        void Promise.all([
          import("../../dev-review/reader-review-bootstrap.ts"),
          import("../../dev-toolbar/development-toolbar-bootstrap.ts")
        ]).then(([review, toolbar]) => {
          review.mountKpReaderDevReview(ownerWindow);
          // The toolbar observes the just-mounted shell and replaces its
          // duplicate launcher without taking ownership of review capture.
          toolbar.mountKpDevelopmentToolbar(ownerWindow);
          // The document theater supplies a chrome slot. Move the existing
          // launcher toolbar, preserving review capture and its lifetime.
          const slot = ownerWindow.document.querySelector('[data-kp-reader-options-development]');
          const controls = ownerWindow.document.querySelector('[data-kp-dev-toolbar]');
          if (slot && controls) {
            slot.append(controls);
            const menu = slot.closest('details');
            const shell = ownerWindow.document.querySelector('[data-kp-dev-review-shell]');
            shell?.addEventListener('kp:dev-review-shell-open', () => { if (menu) menu.open = false; });
            shell?.addEventListener('kp:dev-review-shell-close', () => {
              if (menu) menu.open = true;
              controls.querySelector<HTMLElement>('.kp-dev-toolbar__review')?.focus();
            });
          }
        });
      }
    : undefined;
