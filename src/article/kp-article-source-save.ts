export const kpArticleSourceSaveSchema = "kp.article-source-save.v1" as const;
export const kpArticleSourceSaveResultSchema =
  "kp.article-source-save-result.v1" as const;

export interface KpArticleSourceSaveRequest {
  readonly schemaVersion: typeof kpArticleSourceSaveSchema;
  readonly sourceId: string;
  readonly text: string;
  readonly revision: number;
}

export interface KpArticleSourceSaveResult {
  readonly schemaVersion: typeof kpArticleSourceSaveResultSchema;
  readonly sourcePath: string;
  readonly changed: boolean;
}

export function parseKpArticleSourceSaveRequest(
  value: unknown
): KpArticleSourceSaveRequest {
  if (typeof value !== "object" || value === null) {
    throw new TypeError("A KP article save request must be an object.");
  }
  const request = value as Partial<KpArticleSourceSaveRequest>;
  if (request.schemaVersion !== kpArticleSourceSaveSchema ||
      typeof request.sourceId !== "string" || request.sourceId === "" ||
      typeof request.text !== "string" ||
      typeof request.revision !== "number" ||
      !Number.isSafeInteger(request.revision) || request.revision < 0) {
    throw new TypeError("Invalid KP article source-save request.");
  }
  return Object.freeze({
    schemaVersion: kpArticleSourceSaveSchema,
    sourceId: request.sourceId,
    text: request.text,
    revision: request.revision
  });
}

export function isKpArticleSourceSaveResult(
  value: unknown
): value is KpArticleSourceSaveResult {
  if (typeof value !== "object" || value === null) return false;
  const result = value as Partial<KpArticleSourceSaveResult>;
  return result.schemaVersion === kpArticleSourceSaveResultSchema &&
    typeof result.sourcePath === "string" &&
    typeof result.changed === "boolean";
}
