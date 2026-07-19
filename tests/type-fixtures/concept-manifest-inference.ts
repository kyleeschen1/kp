import {
  createConceptDraft,
  publishedConceptManifestSchema,
  type KpPublishedConceptManifest
} from "../../src/authoring/public-api.ts";

declare const draftInput: Parameters<typeof createConceptDraft>[0];
export const mutableDraft = createConceptDraft(draftInput);
mutableDraft.title = "Drafts remain mutable";

declare const publishedInput: unknown;
export const published = publishedConceptManifestSchema.parse(publishedInput);
// @ts-expect-error published manifests are deeply readonly.
published.checkpoints[0]!.title = "Cannot mutate";

export type PublishedStatusIsLiteral = KpPublishedConceptManifest["publicationStatus"] extends
  "published" ? true : never;

