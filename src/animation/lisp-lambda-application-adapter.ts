import { createSemanticTransformationRef } from "../semantic/animation.ts";
import type { KpSemanticTransformation } from "../semantic/asset-transformation.ts";
import { createKpLispLambdaApplicationAsset } from "../semantic/lisp-lambda-application-asset.ts";
import {
  createEditableSemanticTransformationTree,
  createSemanticTransformationLeaf,
  createSemanticTransformationSequence
} from "../semantic/transformation-composition.ts";
import { createKpAnimationAsset, type KpAnimationAsset } from "./asset.ts";

export const kpLispLambdaApplicationAnimationId =
  "animation.programming.lisp-lambda-application";

export function createKpLispLambdaApplicationAnimationAsset(): KpAnimationAsset {
  const source = createKpLispLambdaApplicationAsset();
  const timelineId = "timeline.programming.lisp-lambda-application";
  const renderTargetId = "render.programming.lisp-lambda-application";
  const root = createSemanticTransformationSequence({
    id: "sequence.programming.lisp-lambda-application",
    label: "Lisp function application",
    children: source.transformations.map((transformation) =>
      createSemanticTransformationLeaf(ref(transformation))
    ),
    summary: "Bind four, reconstruct the lambda body, and evaluate the exact result."
  });

  return createKpAnimationAsset({
    id: kpLispLambdaApplicationAnimationId,
    title: "Lisp function application",
    bundle: source.bundle,
    transformations: source.transformations,
    transformationTree: createEditableSemanticTransformationTree({
      root,
      annotations: source.checkpoints.slice(1).map((checkpoint, index) => ({
        id: `focus.lisp.${checkpoint.id}`,
        kind: "focus" as const,
        targetNodeId: source.transformations[index]?.id ?? root.id,
        placement: "during" as const,
        selectorIds: checkpoint.focusSelectorIds,
        summary: checkpoint.label
      }))
    }),
    timeline: {
      id: timelineId,
      durationMs: 14_000,
      beatCount: 100,
      markerIds: source.checkpoints.map(({ id }) => `checkpoint.lisp.${id}`)
    },
    layout: {
      id: "layout.programming.lisp-lambda-application",
      kind: "single",
      targetId: renderTargetId
    },
    renderTargets: [{
      id: renderTargetId,
      kind: "programming",
      objectIds: source.bundle.objects.map(({ id }) => id),
      selectorIds: source.bundle.objects.flatMap(({ selectors }) =>
        selectors.map(({ id }) => id)
      ),
      transformationIds: source.transformations.map(({ id }) => id),
      timelineId,
      summary: "Native Lisp code with one experimental S-expression material projection.",
      metadata: {
        rendererKind: "lisp-s-expression-material-v0",
        presentationStatus: "experimental-local",
        settledAuthority: "native-code"
      }
    }],
    checks: [{
      id: "check.programming.lisp-lambda-application.identity",
      lawId: "kp.lisp.binding-provenance",
      level: "strict",
      targetId: kpLispLambdaApplicationAnimationId,
      summary: "Binding and substitution are certified independently of visible glyphs."
    }, {
      id: "check.programming.lisp-lambda-application.seek-rewind",
      lawId: "animation.seek-rewind",
      level: "strict",
      targetId: root.id
    }],
    exportTargets: [{
      id: "export.programming.lisp-lambda-application.frames",
      kind: "frame-sequence",
      artifactId: "artifact.programming.lisp-lambda-application.frames"
    }, {
      id: "export.programming.lisp-lambda-application.static",
      kind: "static-step",
      artifactId: "artifact.programming.lisp-lambda-application.static"
    }],
    dashboard: {
      rowId: "animation-programming-lisp-lambda-application",
      tags: ["animation", "programming", "lisp", "lambda", "binding", "s-expression"],
      sampleTargetIds: [renderTargetId],
      sourceRefIds: [source.fixture.id]
    },
    metadata: {
      domain: "programming",
      sourceFixtureId: source.fixture.id,
      rendererKind: "lisp-s-expression-material-v0",
      presentationStatus: "experimental-local"
    }
  });
}

function ref(transformation: KpSemanticTransformation) {
  return createSemanticTransformationRef({
    id: transformation.id,
    kind: transformation.transformType,
    sourceObjectIds: transformation.sourceObjectIds,
    targetObjectIds: transformation.targetObjectIds,
    preserves: transformation.preserves,
    summary: transformation.title
  });
}
