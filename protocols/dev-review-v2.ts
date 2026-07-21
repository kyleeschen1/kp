import type {
  KpDevReviewCaptureV1,
  KpDevReviewStatusV1
} from "./dev-review-v1.ts";

export const KP_DEV_REVIEW_SCHEMA_VERSION_V2 = "kp.dev-review.v2" as const;

export interface KpDevReviewRoundBaselineV2 {
  readonly commit: string;
  readonly fingerprint: string;
  readonly dirty: boolean;
}

export interface KpDevReviewRoundV2 {
  readonly id: string;
  readonly sequence: number;
  readonly label: string;
  readonly status: "open" | "closed";
  readonly openedAt: string;
  readonly closedAt?: string | undefined;
  readonly baseline: KpDevReviewRoundBaselineV2;
  readonly synthetic: boolean;
}

export interface KpDevReviewCreateRequestV2 {
  readonly schemaVersion: typeof KP_DEV_REVIEW_SCHEMA_VERSION_V2;
  readonly roundId: string;
  readonly sessionId: string;
  readonly comment: string;
  readonly capture: KpDevReviewCaptureV1;
}

export interface KpDevReviewNoteV2 extends KpDevReviewCreateRequestV2 {
  readonly id: string;
  readonly sequence: number;
  readonly status: KpDevReviewStatusV1;
}

export type KpDevReviewEventV2 =
  | {
      readonly schemaVersion: typeof KP_DEV_REVIEW_SCHEMA_VERSION_V2;
      readonly kind: "round-opened";
      readonly occurredAt: string;
      readonly round: KpDevReviewRoundV2;
    }
  | {
      readonly schemaVersion: typeof KP_DEV_REVIEW_SCHEMA_VERSION_V2;
      readonly kind: "round-closed";
      readonly occurredAt: string;
      readonly roundId: string;
      readonly reason?: string | undefined;
    }
  | {
      readonly schemaVersion: typeof KP_DEV_REVIEW_SCHEMA_VERSION_V2;
      readonly kind: "note-created";
      readonly occurredAt: string;
      readonly note: KpDevReviewNoteV2;
    }
  | {
      readonly schemaVersion: typeof KP_DEV_REVIEW_SCHEMA_VERSION_V2;
      readonly kind: "status-changed";
      readonly occurredAt: string;
      readonly noteId: string;
      readonly status: KpDevReviewStatusV1;
      readonly reason?: string | undefined;
    }
  | {
      readonly schemaVersion: typeof KP_DEV_REVIEW_SCHEMA_VERSION_V2;
      readonly kind: "cursor-advanced";
      readonly occurredAt: string;
      readonly consumerId: string;
      readonly roundId: string;
      readonly throughSequence: number;
    };

export interface KpDevReviewInboxV2 {
  readonly schemaVersion: typeof KP_DEV_REVIEW_SCHEMA_VERSION_V2;
  readonly currentRoundId?: string | undefined;
  readonly rounds: readonly KpDevReviewRoundV2[];
  readonly notes: readonly KpDevReviewNoteV2[];
  readonly cursors: Readonly<Record<string, Readonly<Record<string, number>>>>;
}
