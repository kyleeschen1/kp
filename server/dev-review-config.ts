import { isAbsolute } from "node:path";

import { KpDevReviewInboxService } from "./dev-review-inbox.ts";
import { KpDevReviewRoundInboxService } from "./dev-review-round-inbox.ts";
import { KpDevReviewEventStore } from "./dev-review-store.ts";

export const KP_DEV_REVIEW_ENABLE_ENV = "KP_DEV_REVIEW";
export const KP_DEV_REVIEW_ROOT_ENV = "KP_DEV_REVIEW_ROOT";

export interface KpDevReviewServices {
  readonly legacy: KpDevReviewInboxService;
  readonly rounds: KpDevReviewRoundInboxService;
}

export async function createKpDevReviewServicesFromEnvironment(
  environment: Readonly<Record<string, string | undefined>>
): Promise<KpDevReviewServices | undefined> {
  if (environment[KP_DEV_REVIEW_ENABLE_ENV] !== "1") return undefined;
  const root = environment[KP_DEV_REVIEW_ROOT_ENV];
  if (root === undefined || !isAbsolute(root)) {
    throw new Error(`${KP_DEV_REVIEW_ROOT_ENV} must be an absolute path when dev review is enabled`);
  }
  const store = await KpDevReviewEventStore.open(root);
  return {
    legacy: new KpDevReviewInboxService(store),
    rounds: new KpDevReviewRoundInboxService(store)
  };
}

export async function createKpDevReviewServiceFromEnvironment(
  environment: Readonly<Record<string, string | undefined>>
): Promise<KpDevReviewInboxService | undefined> {
  return (await createKpDevReviewServicesFromEnvironment(environment))?.legacy;
}
