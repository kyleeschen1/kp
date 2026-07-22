import type { KpEquationFontReadiness } from "../../rendering/equation-font-readiness.ts";

export interface KpReaderFontReviewLifecycle {
  readonly ready: Promise<void>;
  dispose(): void;
}

/** Coordinates font-stable first render and the development review bridge. */
export function createKpReaderFontReviewLifecycle(input: {
  readonly readiness: KpEquationFontReadiness;
  readonly ownerDocument: Document;
  readonly ownerWindow: Window;
  readonly development: boolean;
  readonly reviewMount: "immediate" | "font-ready";
  readonly reflectFontReadyOnBody?: boolean | undefined;
  readonly renderReviewFrame: () => void;
  readonly onFontInvalidated: () => void;
  readonly onReady: () => void;
}): KpReaderFontReviewLifecycle {
  let disposed = false;
  const reflectReady = (): void => {
    if (input.reflectFontReadyOnBody === true) {
      input.ownerDocument.body.dataset["kpReaderFontReady"] =
        String(input.readiness.status !== "waiting");
    }
  };
  const mountReview = (): void => {
    if (!input.development || disposed) return;
    void import("../../dev-review/reader-review-bootstrap.ts").then(({ mountKpReaderDevReview }) => {
      if (!disposed) mountKpReaderDevReview(input.ownerWindow);
    });
  };

  reflectReady();
  const unsubscribe = input.readiness.subscribe(() => {
    reflectReady();
    input.onFontInvalidated();
  });
  if (input.development) {
    input.ownerWindow.addEventListener(
      "kp:reader-dev-review-request-frame",
      input.renderReviewFrame
    );
  }
  if (input.reviewMount === "immediate") mountReview();

  const ready = input.readiness.whenReady().then(() => {
    if (disposed) return;
    reflectReady();
    input.onReady();
    if (input.reviewMount === "font-ready") mountReview();
  });

  return {
    ready,
    dispose() {
      if (disposed) return;
      disposed = true;
      if (input.development) {
        input.ownerWindow.removeEventListener(
          "kp:reader-dev-review-request-frame",
          input.renderReviewFrame
        );
      }
      unsubscribe();
      input.readiness.dispose();
    }
  };
}
