import {
  createKpReaderDevReviewCaptureProvider,
  KP_READER_DEV_REVIEW_FRAME_EVENT,
  KP_READER_DEV_REVIEW_REQUEST_FRAME_EVENT,
  KpReaderDevReviewFrameStore,
  type KpReaderDevReviewFrame
} from "./reader-capture-provider.ts";
import { resolveKpDevReviewPlacement } from "./review-placement.ts";
import { mountKpDevReview } from "./review-bootstrap.ts";

export function mountKpReaderDevReview(ownerWindow: Window = window): () => void {
  const ownerDocument = ownerWindow.document;
  if (ownerDocument.querySelector("[data-kp-dev-review-shell]") !== null) return () => undefined;

  const frames = new KpReaderDevReviewFrameStore();
  let resolveFirstFrame: (() => void) | undefined;
  const firstFrame = new Promise<void>((resolve) => { resolveFirstFrame = resolve; });
  const onReaderFrame = (event: Event): void => {
    if (!(event instanceof CustomEvent)) return;
    frames.record(event.detail as KpReaderDevReviewFrame);
    resolveFirstFrame?.();
    resolveFirstFrame = undefined;
  };
  ownerWindow.addEventListener(KP_READER_DEV_REVIEW_FRAME_EVENT, onReaderFrame);

  const dispose = mountKpDevReview({
    ownerWindow,
    provider: createKpReaderDevReviewCaptureProvider(frames),
    placement: (viewportWidth) =>
      resolveKpDevReviewPlacement({
        surface: "semantic-reader",
        viewportWidth
      }),
    beforeCapture: () => firstFrame,
    onDispose: () => {
      ownerWindow.removeEventListener(
        KP_READER_DEV_REVIEW_FRAME_EVENT,
        onReaderFrame
      );
    }
  });

  ownerWindow.dispatchEvent(new Event(KP_READER_DEV_REVIEW_REQUEST_FRAME_EVENT));
  return dispose;
}
