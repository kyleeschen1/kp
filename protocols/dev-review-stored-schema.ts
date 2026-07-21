import type { ProtocolSchema } from "./runtime-schema.ts";
import { kpDevReviewEventSchema } from "./dev-review-schema.ts";
import type { KpDevReviewStoredEvent } from "./dev-review-stored.ts";
import { KP_DEV_REVIEW_SCHEMA_VERSION } from "./dev-review-v1.ts";
import { kpDevReviewEventV2Schema } from "./dev-review-v2-schema.ts";
import { KP_DEV_REVIEW_SCHEMA_VERSION_V2 } from "./dev-review-v2.ts";

export const kpDevReviewStoredEventSchema: ProtocolSchema<KpDevReviewStoredEvent> = {
  parse(input) {
    if (typeof input !== "object" || input === null || Array.isArray(input)) {
      return kpDevReviewEventSchema.parse(input);
    }
    const version = (input as Record<string, unknown>)["schemaVersion"];
    if (version === KP_DEV_REVIEW_SCHEMA_VERSION) {
      return kpDevReviewEventSchema.parse(input);
    }
    if (version === KP_DEV_REVIEW_SCHEMA_VERSION_V2) {
      return kpDevReviewEventV2Schema.parse(input);
    }
    return kpDevReviewEventSchema.parse(input);
  },
  safeParse(input) {
    try {
      return { success: true, value: this.parse(input) };
    } catch (error) {
      if (error instanceof Error && "issues" in error) {
        return {
          success: false,
          issues: (error as { issues: readonly { path: string; message: string }[] }).issues
        };
      }
      throw error;
    }
  }
};
