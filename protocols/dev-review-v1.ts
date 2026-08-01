export const KP_DEV_REVIEW_SCHEMA_VERSION = "kp.dev-review.v1" as const;
export const KP_DEV_REVIEW_SCREENSHOT_SCHEMA_VERSION =
  "kp.dev-review-screenshot.v1" as const;
export const KP_DEV_REVIEW_SCREENSHOT_REQUEST_SCHEMA_VERSION =
  "kp.dev-review-screenshot-request.v1" as const;

export type KpDevReviewStatusV1 =
  | "new"
  | "discussed"
  | "grouped"
  | "accepted"
  | "fixed"
  | "verified"
  | "dismissed";

export interface KpDevReviewViewportV1 {
  readonly width: number;
  readonly height: number;
  readonly devicePixelRatio: number;
  readonly scrollX: number;
  readonly scrollY: number;
}

export interface KpDevReviewEnvironmentV1 {
  readonly browserName: string;
  readonly browserVersion?: string | undefined;
  readonly platform?: string | undefined;
  readonly language: string;
  readonly viewport: KpDevReviewViewportV1;
  readonly reducedMotion: boolean;
  readonly forcedColors: boolean;
  readonly colorScheme: "light" | "dark";
  readonly build: {
    readonly commit: string;
    readonly fingerprint: string;
    readonly dirty: boolean;
  };
}

export interface KpDevReviewSemanticTargetV1 {
  readonly selectorId?: string | undefined;
  readonly objectId?: string | undefined;
  readonly transformationId?: string | undefined;
  readonly materialOwnerId?: string | undefined;
  readonly normalizedPoint?: { readonly x: number; readonly y: number } | undefined;
  readonly viewportRect?: {
    readonly left: number;
    readonly top: number;
    readonly width: number;
    readonly height: number;
  } | undefined;
  readonly pagePoint?: { readonly x: number; readonly y: number } | undefined;
}

export interface KpDevReviewSemanticContextV1 {
  readonly documentId?: string | undefined;
  readonly documentVersion?: string | undefined;
  readonly assetId?: string | undefined;
  readonly checkpointId?: string | undefined;
  readonly progressPermille?: number | undefined;
  readonly animationProgressPermille?: number | undefined;
  readonly phaseProgressPermille?: number | undefined;
  readonly projectionId?: string | undefined;
  readonly activeNodeId?: string | undefined;
  readonly activeTransformationIds: readonly string[];
  readonly activePhase?: string | undefined;
  readonly foldMode?: string | undefined;
  readonly foldDetail?: string | undefined;
  readonly layoutPolicy?: string | undefined;
  readonly focusSource?: string | undefined;
  readonly focusRefs: readonly string[];
  readonly motionPreference?: string | undefined;
  readonly motionMode?: string | undefined;
  readonly playbackDirection?: "forward" | "rewind" | undefined;
  readonly parameters?: Readonly<Record<string, string>> | undefined;
  readonly tuning?: Readonly<Record<string, string>> | undefined;
  readonly target?: KpDevReviewSemanticTargetV1 | undefined;
}

export interface KpDevReviewRenderContextV1 {
  readonly rendererId?: string | undefined;
  readonly motionAuthority?: string | undefined;
  readonly fitStatus?: string | undefined;
  readonly fitScale?: number | undefined;
  readonly layoutRevision?: number | undefined;
  readonly layoutReadCount?: number | undefined;
  readonly fontRevision?: number | undefined;
  readonly fontReady?: boolean | undefined;
  readonly surface?: {
    readonly profile?: string | undefined;
    readonly shellViewport: {
      readonly width: number;
      readonly height: number;
    };
    readonly contentViewport: {
      readonly width: number;
      readonly height: number;
      readonly devicePixelRatio: number;
    };
    readonly stageViewport?: {
      readonly left: number;
      readonly top: number;
      readonly width: number;
      readonly height: number;
    } | undefined;
  } | undefined;
  readonly ownerIds: readonly string[];
}

export interface KpDevReviewTemporalSampleV1 {
  readonly offsetMs: number;
  readonly progressPermille?: number | undefined;
  readonly frameIntervalMs?: number | undefined;
  readonly scrollDeltaY?: number | undefined;
  readonly transitionId?: string | undefined;
  readonly phase?: string | undefined;
  readonly layoutRevision?: number | undefined;
}

export interface KpDevReviewScreenshotV1 {
  readonly schemaVersion: typeof KP_DEV_REVIEW_SCREENSHOT_SCHEMA_VERSION;
  readonly kind: "bitmap-data-url";
  readonly scope: "selected-stage";
  readonly mediaType: "image/jpeg";
  readonly dataUrl: string;
  readonly pixelWidth: number;
  readonly pixelHeight: number;
  readonly sourceViewport: {
    readonly left: number;
    readonly top: number;
    readonly width: number;
    readonly height: number;
  };
}

export interface KpDevReviewScreenshotRequestV1 {
  readonly schemaVersion:
    typeof KP_DEV_REVIEW_SCREENSHOT_REQUEST_SCHEMA_VERSION;
  readonly surface: "animation-catalogue";
  readonly capture: KpDevReviewCaptureV1;
}

export interface KpDevReviewCaptureV1 {
  readonly route: string;
  readonly capturedAt: string;
  readonly environment: KpDevReviewEnvironmentV1;
  readonly semantic: KpDevReviewSemanticContextV1;
  readonly render: KpDevReviewRenderContextV1;
  readonly temporalTrace: readonly KpDevReviewTemporalSampleV1[];
  readonly screenshot?: KpDevReviewScreenshotV1 | undefined;
}

export interface KpDevReviewCreateRequestV1 {
  readonly schemaVersion: typeof KP_DEV_REVIEW_SCHEMA_VERSION;
  readonly sessionId: string;
  readonly comment: string;
  readonly capture: KpDevReviewCaptureV1;
}

export interface KpDevReviewNoteV1 extends KpDevReviewCreateRequestV1 {
  readonly id: string;
  readonly sequence: number;
  readonly status: KpDevReviewStatusV1;
}

export type KpDevReviewEventV1 =
  | {
      readonly schemaVersion: typeof KP_DEV_REVIEW_SCHEMA_VERSION;
      readonly kind: "note-created";
      readonly occurredAt: string;
      readonly note: KpDevReviewNoteV1;
    }
  | {
      readonly schemaVersion: typeof KP_DEV_REVIEW_SCHEMA_VERSION;
      readonly kind: "status-changed";
      readonly occurredAt: string;
      readonly noteId: string;
      readonly status: KpDevReviewStatusV1;
      readonly reason?: string | undefined;
    }
  | {
      readonly schemaVersion: typeof KP_DEV_REVIEW_SCHEMA_VERSION;
      readonly kind: "cursor-advanced";
      readonly occurredAt: string;
      readonly consumerId: string;
      readonly throughSequence: number;
    };

export interface KpDevReviewInboxV1 {
  readonly schemaVersion: typeof KP_DEV_REVIEW_SCHEMA_VERSION;
  readonly notes: readonly KpDevReviewNoteV1[];
  readonly cursors: Readonly<Record<string, number>>;
}
