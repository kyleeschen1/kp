import { KP_DEV_REVIEW_SCHEMA_VERSION, type KpDevReviewCaptureV1 } from "../../protocols/dev-review-v1.ts";
import { browserKpDevReviewEnvironmentSource, captureKpDevReviewEnvironment } from "./build-environment.ts";
import { KpDevReviewCaptureProviderRegistry } from "./capture-provider.ts";
import { KpDevReviewClient } from "./client.ts";
import {
  createKpReaderDevReviewCaptureProvider,
  KP_READER_DEV_REVIEW_FRAME_EVENT,
  KP_READER_DEV_REVIEW_REQUEST_FRAME_EVENT,
  KpReaderDevReviewFrameStore,
  type KpReaderDevReviewFrame
} from "./reader-capture-provider.ts";
import { mountKpDevReviewComposer } from "./review-composer.ts";
import { getOrCreateKpDevReviewSessionId, type KpDevReviewSessionStorage } from "./review-session.ts";
import { mountKpDevReviewShell } from "./review-shell.ts";
import type { KpDevReviewPointerGeometry } from "./semantic-target.ts";

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

  const registry = new KpDevReviewCaptureProviderRegistry();
  const unregisterReader = registry.register(createKpReaderDevReviewCaptureProvider(frames));
  const shell = mountKpDevReviewShell(ownerDocument);
  const client = new KpDevReviewClient();
  const sessionId = getOrCreateKpDevReviewSessionId({
    buildFingerprint: __KP_DEV_REVIEW_BUILD__.fingerprint,
    storage: safeSessionStorage(ownerWindow)
  });
  let pointer: { target: EventTarget | null; geometry: KpDevReviewPointerGeometry } | undefined;
  const onPointerMove = (event: PointerEvent): void => {
    if (event.target === shell.host || (event.target instanceof Node && shell.host.contains(event.target))) return;
    pointer = {
      target: event.target,
      geometry: {
        clientX: event.clientX,
        clientY: event.clientY,
        pageX: event.pageX,
        pageY: event.pageY
      }
    };
  };
  ownerDocument.addEventListener("pointermove", onPointerMove, { passive: true });

  const composer = mountKpDevReviewComposer({
    shell,
    capture: async () => {
      await firstFrame;
      const capturedAtMs = ownerWindow.performance.now();
      const capture = await registry.capture({
        route: new URL(ownerWindow.location.href),
        capturedAtMs,
        eventTarget: pointer?.target ?? null,
        pointer: pointer?.geometry
      });
      if (capture === undefined) throw new Error("No visual review capture provider is ready");
      const result: KpDevReviewCaptureV1 = {
        route: ownerWindow.location.href,
        capturedAt: new Date().toISOString(),
        environment: captureKpDevReviewEnvironment(
          browserKpDevReviewEnvironmentSource(ownerWindow, ownerWindow.navigator),
          __KP_DEV_REVIEW_BUILD__
        ),
        ...capture.evidence
      };
      return result;
    },
    submit: ({ comment, capture }) => client.create({
      schemaVersion: KP_DEV_REVIEW_SCHEMA_VERSION,
      sessionId,
      comment,
      capture
    })
  });

  ownerDocument.body.dataset["kpDevReviewReady"] = "true";
  ownerWindow.dispatchEvent(new Event(KP_READER_DEV_REVIEW_REQUEST_FRAME_EVENT));
  const dispose = (): void => {
    delete ownerDocument.body.dataset["kpDevReviewReady"];
    ownerDocument.removeEventListener("pointermove", onPointerMove);
    ownerWindow.removeEventListener(KP_READER_DEV_REVIEW_FRAME_EVENT, onReaderFrame);
    unregisterReader();
    composer.dispose();
    shell.dispose();
  };
  ownerWindow.addEventListener("pagehide", dispose, { once: true });
  return dispose;
}

function safeSessionStorage(ownerWindow: Window): KpDevReviewSessionStorage {
  try {
    const storage = ownerWindow.sessionStorage;
    const probe = "kp.dev-review.storage-probe";
    storage.setItem(probe, "1");
    storage.removeItem(probe);
    return storage;
  } catch {
    const values = new Map<string, string>();
    return {
      getItem: (key) => values.get(key) ?? null,
      setItem: (key, value) => { values.set(key, value); }
    };
  }
}
