import type { KpAuthoredMarketSourceData } from "../../tutorial/authoring-market/authoring-market-source-data.ts";

export const kpAuthoringMarketPreviewEndpoint = "/__kp/authoring-market/revision";
export const kpAuthoringMarketPreviewEvent = "kp:authoring-market-revision";
export type KpAuthoringMarketPreviewData = KpAuthoredMarketSourceData;
export interface KpAuthoringMarketBuildDiagnostic {
  readonly code: "kp.authoring.market-build-gap";
  readonly message: string;
  readonly file?: string;
  readonly line?: number;
  readonly column?: number;
  readonly sourceCode?: string;
  readonly path?: string;
}

/** Preserve supplied locations, never guess a file or derive authority from text. */
export function createKpAuthoringMarketBuildDiagnostic(error: unknown): KpAuthoringMarketBuildDiagnostic {
  const detail = typeof error === "object" && error !== null
    ? error as Record<string, unknown> : {};
  const loc = typeof detail["loc"] === "object" && detail["loc"] !== null
    ? detail["loc"] as Record<string, unknown> : {};
  const file = typeof loc["file"] === "string" ? loc["file"] : detail["id"];
  const line = loc["line"];
  const column = loc["column"];
  return Object.freeze({
    code: "kp.authoring.market-build-gap",
    message: error instanceof Error ? error.message : String(error),
    ...(typeof file === "string" ? { file } : {}),
    ...(typeof line === "number" && Number.isSafeInteger(line) && line > 0 ? { line } : {}),
    ...(typeof column === "number" && Number.isSafeInteger(column) && column >= 0 ? { column } : {}),
    ...(typeof detail["code"] === "string" ? { sourceCode: detail["code"] } : {}),
    ...(typeof detail["path"] === "string" ? { path: detail["path"] } : {})
  });
}
export interface KpAuthoringMarketBuildRevision {
  readonly schemaVersion: "kp.authoring-market-build.v1";
  readonly sequence: number;
  readonly sourceRevision: string;
  readonly sourcePaths: readonly string[];
  readonly status: "building" | "valid" | "invalid";
  readonly diagnostic?: KpAuthoringMarketBuildDiagnostic;
  readonly preview?: KpAuthoringMarketPreviewData;
}

/** Only the newest source revision may replace a preview, even if preparation
 * finishes out of order. This is build state, never a second semantic clock.
 */
export function createKpAuthoringMarketRevisionReceiver<T>(input: {
  readonly prepare: (preview: KpAuthoringMarketPreviewData) => T | Promise<T>;
  readonly commit: (prepared: T, revision: KpAuthoringMarketBuildRevision) => void;
  readonly report: (revision: KpAuthoringMarketBuildRevision) => void;
}) {
  let latest: KpAuthoringMarketBuildRevision | undefined;
  let disposed = false;
  let acceptedSequence = -1;
  let generation = 0;
  let retained: readonly KpAuthoringMarketBuildRevision[] = [];
  return Object.freeze({
    retainedRevisions() { return Object.freeze([...retained]); },
    async inspectRevision(sourceRevision: string) {
      const revision = retained.find(item => item.sourceRevision === sourceRevision);
      if (disposed || revision?.preview === undefined) return { status: "unavailable" as const,
        message: "This revision is no longer retained in this preview tab." };
      const ticket = ++generation;
      try {
        const prepared = await input.prepare(revision.preview);
        if (disposed || ticket !== generation) return { status: "superseded" as const };
        input.commit(prepared, revision);
        if (latest !== undefined) input.report(latest);
        return { status: "displayed" as const };
      } catch (error) {
        if (disposed || ticket !== generation) return { status: "superseded" as const };
        return { status: "unavailable" as const,
          message: error instanceof Error ? error.message : String(error) };
      }
    },
    async receive(revision: KpAuthoringMarketBuildRevision) {
      if (disposed || revision.schemaVersion !== "kp.authoring-market-build.v1" ||
          !Number.isSafeInteger(revision.sequence) || revision.sequence < 0 ||
          revision.sequence <= acceptedSequence ||
          (latest !== undefined && (revision.sequence < latest.sequence ||
            (revision.sequence === latest.sequence && latest.status !== "building")))) return;
      latest = revision;
      const ticket = ++generation;
      input.report(revision);
      if (revision.status !== "valid" || revision.preview === undefined) return;
      try {
        const prepared = await input.prepare(revision.preview);
        if (disposed || latest !== revision || ticket !== generation) return;
        const snapshot = freezeRevision(structuredClone(revision));
        input.commit(prepared, revision);
        acceptedSequence = revision.sequence;
        // Disposable verified-build cache, not source history or a semantic store.
        // Clone before retaining so later caller mutation cannot rewrite a snapshot.
        retained = Object.freeze([...retained.filter(item => item.sourceRevision !== revision.sourceRevision),
          snapshot].slice(-4));
      } catch (error) {
        if (disposed || latest !== revision || ticket !== generation) return;
        input.report({ ...revision, status: "invalid",
          diagnostic: createKpAuthoringMarketBuildDiagnostic(error) });
      }
    },
    dispose() { disposed = true; latest = undefined; retained = []; ++generation; }
  });
}

function freezeRevision<T>(value: T): T {
  if (typeof value !== "object" || value === null || Object.isFrozen(value)) return value;
  Object.values(value).forEach(freezeRevision);
  return Object.freeze(value);
}
