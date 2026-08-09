import {
  compileKpArticleAccessibilityManifest,
  type KpArticleAccessibleStage
} from "./kp-article-accessibility.ts";
import type { KpArticleDocument, KpArticleStageBlock } from "./kp-article-document.ts";

export const kpArticleStageManifestSchema = "kp.article-stage-manifest.v1" as const;

export interface KpArticleStageManifest {
  readonly kind: "kp-article-stage-manifest";
  readonly schemaVersion: typeof kpArticleStageManifestSchema;
  readonly documentId: string;
  readonly stageId: string;
  readonly fullId: string;
  readonly release: Readonly<{
    vignetteId: string;
    version: string;
    integrity: `sha256:${string}`;
    moduleSpecifier: string;
    animationId: string;
  }>;
  readonly semantic: Readonly<{
    objectPaths: readonly string[];
    transitionPaths: readonly string[];
    checkpointPaths: readonly string[];
  }>;
  readonly accessibility: KpArticleAccessibleStage;
  readonly activation: Readonly<{
    policy: "on-demand";
    triggers: readonly ["direct-address", "near-viewport"];
    initialCheckpointId: string;
  }>;
}

export function compileKpArticleStageManifests(
  document: KpArticleDocument
): readonly KpArticleStageManifest[] {
  const accessibility = new Map(
    compileKpArticleAccessibilityManifest(document).stages.map((stage) => [stage.stageId, stage])
  );
  return Object.freeze(document.blocks.flatMap((block) => (
    block.kind === "stage" ? [compileStage(document, block, accessibility.get(block.id)!)] : []
  )));
}

function compileStage(
  document: KpArticleDocument,
  stage: KpArticleStageBlock,
  accessibility: KpArticleAccessibleStage
): KpArticleStageManifest {
  const projection = stage.vignette.staticProjection!;
  const initialCheckpointId = projection.transitions[0]?.from ?? projection.checkpoints[0]!.id;
  return Object.freeze({
    kind: "kp-article-stage-manifest" as const,
    schemaVersion: kpArticleStageManifestSchema,
    documentId: document.id,
    stageId: stage.id,
    fullId: stage.fullId,
    release: Object.freeze({
      vignetteId: stage.vignette.id,
      version: stage.vignette.version,
      integrity: stage.vignette.integrity,
      moduleSpecifier: stage.vignette.moduleSpecifier,
      animationId: stage.vignette.animationId
    }),
    semantic: Object.freeze({
      objectPaths: stage.vignette.objectPaths,
      transitionPaths: stage.vignette.transitionPaths,
      checkpointPaths: stage.vignette.checkpointPaths
    }),
    accessibility,
    activation: Object.freeze({
      policy: "on-demand" as const,
      triggers: Object.freeze(["direct-address", "near-viewport"] as const),
      initialCheckpointId: `${document.id}#${stage.id}/${initialCheckpointId}`
    })
  });
}
