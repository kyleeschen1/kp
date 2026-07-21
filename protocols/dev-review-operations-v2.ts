import type { KpDevReviewCaptureV1, KpDevReviewStatusV1 } from "./dev-review-v1.ts";
import type { KpDevReviewRoundBaselineV2, KpDevReviewRoundV2 } from "./dev-review-v2.ts";

export type KpDevReviewQueryScope = "current" | "historical" | "all";

export interface KpDevReviewQueryInput {
  readonly scope?: KpDevReviewQueryScope | undefined;
  readonly roundId?: string | undefined;
  readonly statuses?: readonly KpDevReviewStatusV1[] | undefined;
  readonly routePrefix?: string | undefined;
  readonly afterSequence?: number | undefined;
  readonly unreadBy?: string | undefined;
  readonly limit?: number | undefined;
  readonly detail?: "summary" | "full" | undefined;
}

export interface KpDevReviewNormalizedQuery {
  readonly scope: KpDevReviewQueryScope;
  readonly roundId?: string | undefined;
  readonly statuses?: readonly KpDevReviewStatusV1[] | undefined;
  readonly routePrefix?: string | undefined;
  readonly afterSequence?: number | undefined;
  readonly unreadBy?: string | undefined;
  readonly limit: number;
  readonly detail: "summary" | "full";
}

export interface KpDevReviewCompactNoteEvidence {
  readonly id: string;
  readonly sequence: number;
  readonly roundId: string;
  readonly status: KpDevReviewStatusV1;
  readonly comment: string;
  readonly sessionId: string;
  readonly capturedAt: string;
  readonly route: string;
  readonly build: KpDevReviewCaptureV1["environment"]["build"];
  readonly checkpointId?: string | undefined;
  readonly progressPermille?: number | undefined;
  readonly activePhase?: string | undefined;
  readonly capture?: KpDevReviewCaptureV1 | undefined;
}

export interface KpDevReviewRoundQuerySummary {
  readonly id: string;
  readonly sequence: number;
  readonly label: string;
  readonly status: KpDevReviewRoundV2["status"];
  readonly synthetic: boolean;
  readonly noteCount: number;
  readonly newCount: number;
}

export interface KpDevReviewQueryResult {
  readonly query: KpDevReviewNormalizedQuery;
  readonly counts: {
    readonly lifetime: number;
    readonly current: number;
    readonly currentNew: number;
    readonly historical: number;
    readonly matching: number;
    readonly byStatus: Readonly<Record<KpDevReviewStatusV1, number>>;
  };
  readonly rounds: readonly KpDevReviewRoundQuerySummary[];
  readonly page: {
    readonly notes: readonly KpDevReviewCompactNoteEvidence[];
    readonly hasMore: boolean;
    readonly nextAfterSequence?: number | undefined;
  };
}

export interface KpDevReviewOpenRoundOperationV2 {
  readonly label: string;
  readonly baseline: KpDevReviewRoundBaselineV2;
}

export interface KpDevReviewCloseRoundOperationV2 {
  readonly roundId?: string | undefined;
  readonly reason?: string | undefined;
}

export interface KpDevReviewSetStatusOperationV2 {
  readonly noteId: string;
  readonly status: KpDevReviewStatusV1;
  readonly reason?: string | undefined;
}

export interface KpDevReviewAdvanceCursorOperationV2 {
  readonly consumerId: string;
  readonly roundId: string;
  readonly throughSequence: number;
}

export interface KpDevReviewOperationSuccessV2 {
  readonly ok: true;
}
