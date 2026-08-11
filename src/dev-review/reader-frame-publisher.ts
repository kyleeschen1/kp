import {
  KP_READER_DEV_REVIEW_FRAME_EVENT,
  KP_READER_DEV_REVIEW_REQUEST_FRAME_EVENT,
  type KpReaderDevReviewFrame
} from "./reader-capture-provider.ts";

export interface KpReaderDevReviewFramePublisher {
  publish(frame: KpReaderDevReviewFrame): void;
  dispose(): void;
}

/**
 * Review frames are replayable state, not transient notifications. A review
 * shell often loads after the first render and must still capture that frame.
 */
export function createKpReaderDevReviewFramePublisher(
  ownerWindow: Window = window
): KpReaderDevReviewFramePublisher {
  let latest: KpReaderDevReviewFrame | undefined;
  let disposed = false;
  const FrameEvent = (ownerWindow as unknown as {
    readonly CustomEvent: typeof CustomEvent;
  }).CustomEvent;
  const dispatchLatest = (): void => {
    if (disposed || latest === undefined) return;
    ownerWindow.dispatchEvent(new FrameEvent(
      KP_READER_DEV_REVIEW_FRAME_EVENT,
      { detail: structuredClone(latest) }
    ));
  };
  const onRequest = (): void => dispatchLatest();
  ownerWindow.addEventListener(
    KP_READER_DEV_REVIEW_REQUEST_FRAME_EVENT,
    onRequest
  );
  return Object.freeze({
    publish(frame: KpReaderDevReviewFrame) {
      if (disposed) {
        throw new Error("Reader review frame publisher is disposed.");
      }
      latest = structuredClone(frame);
      dispatchLatest();
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      latest = undefined;
      ownerWindow.removeEventListener(
        KP_READER_DEV_REVIEW_REQUEST_FRAME_EVENT,
        onRequest
      );
    }
  });
}
