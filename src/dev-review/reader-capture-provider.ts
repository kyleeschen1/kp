import type {
  KpDevReviewRenderContextV1,
  KpDevReviewSemanticContextV1
} from "../../protocols/dev-review-v1.ts";
import type {
  KpDevReviewCaptureContext,
  KpDevReviewCaptureProvider,
  KpDevReviewProviderEvidence
} from "./capture-provider.ts";
import { captureKpDevReviewSemanticTarget } from "./semantic-target.ts";
import { KpDevReviewTemporalTrace } from "./temporal-trace.ts";

export const KP_READER_DEV_REVIEW_FRAME_EVENT = "kp:reader-dev-review-frame";
export const KP_READER_DEV_REVIEW_REQUEST_FRAME_EVENT = "kp:reader-dev-review-request-frame";

export interface KpReaderDevReviewFrame {
  readonly atMs: number;
  readonly documentId: string;
  readonly documentVersion: string;
  readonly assetId: string;
  readonly checkpointId?: string | undefined;
  readonly progressPermille: number;
  readonly projectionId: string;
  readonly activeTransformationIds: readonly string[];
  readonly activePhase?: string | undefined;
  readonly focusSource?: string | undefined;
  readonly focusRefs: readonly string[];
  readonly motionPreference: string;
  readonly motionMode: string;
  readonly playbackDirection: "forward" | "rewind";
  readonly rendererId: string;
  readonly motionAuthority: string;
  readonly fitStatus: string;
  readonly fitScale: number;
  readonly layoutRevision: number;
  readonly layoutReadCount: number;
  readonly fontRevision: number;
  readonly fontReady: boolean;
  readonly ownerIds: readonly string[];
  readonly frameIntervalMs?: number | undefined;
  readonly scrollDeltaY?: number | undefined;
}

export class KpReaderDevReviewFrameStore {
  readonly #trace = new KpDevReviewTemporalTrace();
  #latest: KpReaderDevReviewFrame | undefined;

  record(frame: KpReaderDevReviewFrame): void {
    this.#latest = structuredClone(frame);
    this.#trace.push({
      atMs: frame.atMs,
      progressPermille: frame.progressPermille,
      frameIntervalMs: frame.frameIntervalMs,
      scrollDeltaY: frame.scrollDeltaY,
      transitionId: frame.activeTransformationIds[0],
      phase: frame.activePhase,
      layoutRevision: frame.layoutRevision
    });
  }

  hasFrame(): boolean {
    return this.#latest !== undefined;
  }

  capture(capturedAtMs: number): KpDevReviewProviderEvidence {
    const frame = this.#latest;
    if (frame === undefined) throw new Error("Reader review frame is not ready");
    const semantic: KpDevReviewSemanticContextV1 = {
      documentId: frame.documentId,
      documentVersion: frame.documentVersion,
      assetId: frame.assetId,
      checkpointId: frame.checkpointId,
      progressPermille: frame.progressPermille,
      projectionId: frame.projectionId,
      activeTransformationIds: [...frame.activeTransformationIds],
      activePhase: frame.activePhase,
      focusSource: frame.focusSource,
      focusRefs: [...frame.focusRefs],
      motionPreference: frame.motionPreference,
      motionMode: frame.motionMode,
      playbackDirection: frame.playbackDirection
    };
    const render: KpDevReviewRenderContextV1 = {
      rendererId: frame.rendererId,
      motionAuthority: frame.motionAuthority,
      fitStatus: frame.fitStatus,
      fitScale: frame.fitScale,
      layoutRevision: frame.layoutRevision,
      layoutReadCount: frame.layoutReadCount,
      fontRevision: frame.fontRevision,
      fontReady: frame.fontReady,
      ownerIds: [...frame.ownerIds]
    };
    return { semantic, render, temporalTrace: this.#trace.snapshot(capturedAtMs) };
  }
}

export function createKpReaderDevReviewCaptureProvider(
  frames: KpReaderDevReviewFrameStore
): KpDevReviewCaptureProvider {
  return {
    id: "reader.semantic-document",
    priority: 100,
    matches: () => frames.hasFrame(),
    capture(context: KpDevReviewCaptureContext) {
      const evidence = frames.capture(context.capturedAtMs);
      const target = context.pointer === undefined
        ? undefined
        : captureKpDevReviewSemanticTarget(context.eventTarget, context.pointer);
      return {
        ...evidence,
        semantic: {
          ...evidence.semantic,
          ...(target === undefined ? {} : { target })
        }
      };
    }
  };
}
