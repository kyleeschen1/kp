import { prepareKpAuthoringMarketPreview } from "./authoring-market-preview-prepare.ts";
import type { KpAuthoringMarketBuildRevision, KpAuthoringMarketPreviewData } from "./authoring-market-preview-protocol.ts";

/** An editable source packet, not a publication artifact or durable history engine. */
export interface KpAuthoringMarketSourceBranch {
  readonly schemaVersion: "kp.authoring-market-source-branch.v1";
  readonly name: string;
  readonly parentSourceRevision: string;
  readonly data: KpAuthoringMarketPreviewData;
}

export function createKpAuthoringMarketSourceBranch(revision: KpAuthoringMarketBuildRevision, name: string): KpAuthoringMarketSourceBranch {
  if (!/^[a-z][a-z0-9-]{0,47}$/.test(name)) throw new Error("Use a branch name starting with a lowercase letter, followed by lowercase letters, digits or hyphens (48 characters maximum).");
  if (revision.status !== "valid" || revision.preview === undefined || revision.sourceRevision.length === 0) {
    throw new Error("A source branch requires an explicitly selected valid retained build.");
  }
  prepareKpAuthoringMarketPreview(revision.preview);
  const data = structuredClone(revision.preview);
  return Object.freeze({ schemaVersion: "kp.authoring-market-source-branch.v1", name,
    parentSourceRevision: revision.sourceRevision,
    data: { ...data, article: { ...data.article,
      sourceId: `projection.authoring-market.branch.${name}`,
      authoredSourcePath: `${name}.market.json` } }
  });
}

export function readKpAuthoringMarketSourceBranch(value: unknown): KpAuthoringMarketSourceBranch {
  if (typeof value !== "object" || value === null) throw new Error("Expected an explicit market source branch.");
  const branch = value as KpAuthoringMarketSourceBranch;
  if (branch.schemaVersion !== "kp.authoring-market-source-branch.v1" ||
      typeof branch.name !== "string" || !/^[a-z][a-z0-9-]{0,47}$/.test(branch.name) ||
      typeof branch.parentSourceRevision !== "string" || branch.parentSourceRevision.length === 0 ||
      branch.data?.article?.sourceId !== `projection.authoring-market.branch.${branch.name}` ||
      branch.data.article.authoredSourcePath !== `${branch.name}.market.json`) {
    throw new Error("Invalid market source branch identity or predecessor.");
  }
  prepareKpAuthoringMarketPreview(branch.data);
  return branch;
}
