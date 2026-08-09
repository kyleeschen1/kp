import type { KpArticleDocument, KpArticleStageBlock } from "./kp-article-document.ts";
import type {
  KpVignetteAccessibility,
  KpVignetteStaticCheckpoint
} from "./kp-article-import-lock.ts";

export const kpArticleAccessibilitySchema = "kp.article-accessibility.v1-rc1" as const;

export interface KpArticleAccessibleCheckpoint extends KpVignetteStaticCheckpoint {
  readonly fullId: string;
}

export interface KpArticleReducedMotionSeek {
  readonly transitionId: string;
  readonly fromCheckpointId: string;
  readonly toCheckpointId: string;
  readonly behavior: "direct-checkpoint-seek";
}

export interface KpArticleAccessibleStage {
  readonly stageId: string;
  readonly fullId: string;
  readonly accessibleName: string;
  readonly semanticSummary: string;
  readonly checkpoints: readonly KpArticleAccessibleCheckpoint[];
  readonly reducedMotionSeeks: readonly KpArticleReducedMotionSeek[];
}

export interface KpArticleAccessibilityManifest {
  readonly kind: "kp-article-accessibility-manifest";
  readonly schemaVersion: typeof kpArticleAccessibilitySchema;
  readonly documentId: string;
  readonly stages: readonly KpArticleAccessibleStage[];
}

export class KpArticleAccessibilityError extends Error {
  readonly code:
    | "accessibility-metadata-missing"
    | "accessibility-checkpoints-missing"
    | "accessibility-transition-incomplete";

  constructor(code: KpArticleAccessibilityError["code"], message: string) {
    super(message);
    this.name = "KpArticleAccessibilityError";
    this.code = code;
  }
}

export function compileKpArticleAccessibilityManifest(
  document: KpArticleDocument
): KpArticleAccessibilityManifest {
  const stages = document.blocks.flatMap((block) => (
    block.kind === "stage" ? [compileStage(document.id, block)] : []
  ));
  return Object.freeze({
    kind: "kp-article-accessibility-manifest" as const,
    schemaVersion: kpArticleAccessibilitySchema,
    documentId: document.id,
    stages: Object.freeze(stages)
  });
}

function compileStage(documentId: string, stage: KpArticleStageBlock): KpArticleAccessibleStage {
  const accessibility = requireAccessibility(stage);
  const projection = stage.vignette.staticProjection;
  if (projection === undefined || projection.checkpoints.length === 0) {
    throw new KpArticleAccessibilityError(
      "accessibility-checkpoints-missing",
      `Stage ${stage.id} requires static checkpoints for accessible publication.`
    );
  }
  const checkpoints = projection.checkpoints.map((checkpoint) => Object.freeze({
    ...checkpoint,
    fullId: `${documentId}#${stage.id}/${checkpoint.id}`
  }));
  const reducedMotionSeeks = stage.vignette.transitionPaths.map((transitionId) => {
    const transition = projection.transitions.find(({ id }) => id === transitionId);
    if (transition === undefined) {
      throw new KpArticleAccessibilityError(
        "accessibility-transition-incomplete",
        `Stage ${stage.id} lacks a checkpoint seek for transition ${transitionId}.`
      );
    }
    return Object.freeze({
      transitionId,
      fromCheckpointId: `${documentId}#${stage.id}/${transition.from}`,
      toCheckpointId: `${documentId}#${stage.id}/${transition.to}`,
      behavior: accessibility.reducedMotion
    });
  });
  return Object.freeze({
    stageId: stage.id,
    fullId: stage.fullId,
    accessibleName: stage.label ?? accessibility.accessibleName,
    semanticSummary: accessibility.semanticSummary,
    checkpoints: Object.freeze(checkpoints),
    reducedMotionSeeks: Object.freeze(reducedMotionSeeks)
  });
}

function requireAccessibility(stage: KpArticleStageBlock): KpVignetteAccessibility {
  const accessibility = stage.vignette.accessibility;
  if (accessibility === undefined) {
    throw new KpArticleAccessibilityError(
      "accessibility-metadata-missing",
      `Stage ${stage.id} uses ${stage.vignette.id}@${stage.vignette.version} without accessibility metadata.`
    );
  }
  return accessibility;
}
