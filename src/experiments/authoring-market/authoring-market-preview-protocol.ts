import type { createKpAuthoredMarketSource } from "../typed-linear-supply-demand/authoring-market-source.ts";
import type { authorKpMarketArticle } from "./authoring-market-article-source.ts";

export const kpAuthoringMarketPreviewEndpoint = "/__kp/authoring-market/revision";
export const kpAuthoringMarketPreviewEvent = "kp:authoring-market-revision";
export interface KpAuthoringMarketPreviewData {
  readonly parameters: NonNullable<Parameters<typeof createKpAuthoredMarketSource>[0]["parameters"]>;
  readonly article: Omit<ReturnType<typeof authorKpMarketArticle>, "facts">;
}
export interface KpAuthoringMarketBuildRevision {
  readonly schemaVersion: "kp.authoring-market-build.v1";
  readonly sequence: number;
  readonly sourceRevision: string;
  readonly sourcePaths: readonly string[];
  readonly status: "building" | "valid" | "invalid";
  readonly diagnostic?: { readonly code: "kp.authoring.market-build-gap"; readonly message: string; readonly file?: string };
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
  return Object.freeze({
    async receive(revision: KpAuthoringMarketBuildRevision) {
      if (disposed || revision.schemaVersion !== "kp.authoring-market-build.v1" ||
          !Number.isSafeInteger(revision.sequence) || revision.sequence < 0 ||
          revision.sequence <= acceptedSequence ||
          (latest !== undefined && (revision.sequence < latest.sequence ||
            (revision.sequence === latest.sequence && latest.status !== "building")))) return;
      latest = revision;
      input.report(revision);
      if (revision.status !== "valid" || revision.preview === undefined) return;
      try {
        const prepared = await input.prepare(revision.preview);
        if (disposed || latest !== revision) return;
        input.commit(prepared, revision);
        acceptedSequence = revision.sequence;
      } catch (error) {
        if (disposed || latest !== revision) return;
        input.report({ ...revision, status: "invalid", diagnostic: {
          code: "kp.authoring.market-build-gap", message: error instanceof Error ? error.message : String(error)
        } });
      }
    },
    dispose() { disposed = true; latest = undefined; }
  });
}
