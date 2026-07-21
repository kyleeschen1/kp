import type { KpDevReviewEventV1 } from "./dev-review-v1.ts";
import type { KpDevReviewEventV2 } from "./dev-review-v2.ts";

export type KpDevReviewStoredEvent = KpDevReviewEventV1 | KpDevReviewEventV2;
