import type { KpArticleSemanticCompletion } from
  "./kp-article-language-service.ts";

export const kpArticleSourceAuthoringSchema =
  "kp.article-source-authoring.v1" as const;

/**
 * Pure route metadata for one whole-file Article editor. Keeping this record
 * free of DOM and framework callbacks lets any projection request the same
 * authoring capability without becoming its lifecycle owner.
 */
export interface KpArticleSourceAuthoringDescriptor {
  readonly schemaVersion: typeof kpArticleSourceAuthoringSchema;
  readonly sourceId: string;
  readonly sourceFilename: string;
  readonly persistedText: string;
  readonly storageKey: string;
  readonly semantic: readonly KpArticleSemanticCompletion[];
  readonly defaultRevealText?: string | undefined;
}

export function createKpArticleSourceAuthoringDescriptor(input: {
  readonly sourceId: string;
  readonly sourceFilename: string;
  readonly persistedText: string;
  readonly storageKey: string;
  readonly semantic: readonly KpArticleSemanticCompletion[];
  readonly defaultRevealText?: string | undefined;
}): KpArticleSourceAuthoringDescriptor {
  for (const [field, value] of [
    ["sourceId", input.sourceId],
    ["sourceFilename", input.sourceFilename],
    ["persistedText", input.persistedText],
    ["storageKey", input.storageKey]
  ] as const) {
    if (value.trim() === "") {
      throw new Error(`Article authoring ${field} must be non-empty.`);
    }
  }
  return Object.freeze({
    schemaVersion: kpArticleSourceAuthoringSchema,
    sourceId: input.sourceId,
    sourceFilename: input.sourceFilename,
    persistedText: input.persistedText,
    storageKey: input.storageKey,
    semantic: Object.freeze(input.semantic.map((completion) =>
      Object.freeze({ ...completion })
    )),
    ...(input.defaultRevealText === undefined
      ? {}
      : { defaultRevealText: input.defaultRevealText })
  });
}
