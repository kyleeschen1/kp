import { isAbsolute } from "node:path";

import { KpDevReviewInboxService } from "./dev-review-inbox.ts";
import { KpDevReviewEventStore } from "./dev-review-store.ts";

export const KP_DEV_REVIEW_ENABLE_ENV = "KP_DEV_REVIEW";
export const KP_DEV_REVIEW_ROOT_ENV = "KP_DEV_REVIEW_ROOT";

export async function createKpDevReviewServiceFromEnvironment(
  environment: Readonly<Record<string, string | undefined>>
): Promise<KpDevReviewInboxService | undefined> {
  if (environment[KP_DEV_REVIEW_ENABLE_ENV] !== "1") return undefined;
  const root = environment[KP_DEV_REVIEW_ROOT_ENV];
  if (root === undefined || !isAbsolute(root)) {
    throw new Error(`${KP_DEV_REVIEW_ROOT_ENV} must be an absolute path when dev review is enabled`);
  }
  return new KpDevReviewInboxService(await KpDevReviewEventStore.open(root));
}
