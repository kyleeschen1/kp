import {
  createKpAnimationAsset,
  type KpAnimationAsset
} from "./asset.ts";
import { createSemanticTransformationRef } from "../semantic/animation.ts";
import type {
  KpSemanticTransformation
} from "../semantic/asset-transformation.ts";
import {
  createAdditionProgramTraceKpAsset
} from "../semantic/program-trace-asset.ts";
import {
  createEditableSemanticTransformationTree,
  createSemanticTransformationLeaf,
  createSemanticTransformationSequence
} from "../semantic/transformation-composition.ts";
import {
  createKpLispLambdaApplicationAnimationAsset
} from "./lisp-lambda-application-adapter.ts";
import {
  createKpTypeScriptFreeShippingAnimationAsset
} from "../semantic/typescript-free-shipping-animation-asset.ts";
import {
  createKpPythonFreeShippingAnimationAsset
} from "../semantic/python-free-shipping-animation-asset.ts";

const programTraceAnimationId = "animation.programming.add.execution-trace";
const programTraceTimelineId = "timeline.programming.add.execution-trace";
const programTraceRenderTargetId = "render.programming.add.execution-trace";

export function createProgrammingAnimationAssets(): readonly KpAnimationAsset[] {
  return [
    createProgramTraceAnimationAsset(),
    createKpLispLambdaApplicationAnimationAsset(),
    createKpTypeScriptFreeShippingAnimationAsset().animation,
    createKpPythonFreeShippingAnimationAsset().animation
  ];
}

export function createProgramTraceAnimationAsset(): KpAnimationAsset {
  const source = createAdditionProgramTraceKpAsset();
  const transformationIds = source.transformations.map(
    (transformation) => transformation.id
  );
  const objectIds = source.bundle.objects.map((object) => object.id);
  const sourceSelectors = source.bundle.objects[0]?.selectors.map(
    (selector) => selector.id
  ) ?? [];
  const treeRoot = createSemanticTransformationSequence({
    id: "diagram.programming.add.execution-trace.animation",
    label: "Addition program trace animation",
    children: source.transformations.map((transformation) =>
      createSemanticTransformationLeaf(semanticTransformationRef(transformation))
    ),
    summary:
      "Execution trace steps become seekable animation phases on the shared clock."
  });

  return createKpAnimationAsset({
    id: programTraceAnimationId,
    title: "Addition execution trace",
    bundle: source.bundle,
    transformations: source.transformations,
    transformationTree: createEditableSemanticTransformationTree({
      root: treeRoot,
      annotations: [
        {
          id: "focus.programming.add.return-expression",
          kind: "focus",
          targetNodeId: "transform.programming.add.evaluate-return",
          placement: "during",
          selectorIds: ["selector.programming.add.return"],
          summary: "Highlight the return expression while it is evaluated."
        }
      ]
    }),
    timeline: {
      id: programTraceTimelineId,
      durationMs: source.behavior.durationMs,
      beatCount: 40,
      markerIds: ["behavior.programming.add.execution-trace"]
    },
    layout: {
      id: "layout.programming.add.execution-trace.animation",
      kind: "single",
      targetId: programTraceRenderTargetId
    },
    renderTargets: [
      {
        id: programTraceRenderTargetId,
        kind: "programming",
        objectIds,
        selectorIds: sourceSelectors,
        transformationIds,
        timelineId: programTraceTimelineId,
        summary:
          "Renderer-neutral SourceFile and execution-trace animation target.",
        metadata: {
          behaviorId: source.behavior.id,
          sourceFixtureId: source.sourceFixtureId,
          traceKind: "deterministic-execution-trace"
        }
      }
    ],
    checks: [
      {
        id: "check.programming.add.execution-trace.reference-closure",
        lawId: "animation.reference-closure",
        level: "strict",
        targetId: programTraceAnimationId
      },
      {
        id: "check.programming.add.execution-trace.seek-rewind",
        lawId: "animation.seek-rewind",
        level: "strict",
        targetId: treeRoot.id
      }
    ],
    exportTargets: [
      {
        id: "export.programming.add.execution-trace.frames",
        kind: "frame-sequence",
        artifactId: "artifact.programming.add.execution-trace.frames"
      }
    ],
    dashboard: {
      rowId: "animation-programming-add-execution-trace",
      tags: ["animation", "programming", "source-file", "execution-trace"],
      sampleTargetIds: [programTraceRenderTargetId],
      sourceRefIds: [source.sourceFixtureId]
    },
    metadata: {
      domain: "programming",
      placeholderContract: false,
      sourceFixtureId: source.sourceFixtureId,
      behaviorId: source.behavior.id
    }
  });
}

function semanticTransformationRef(transformation: KpSemanticTransformation) {
  return createSemanticTransformationRef({
    id: transformation.id,
    kind: transformation.transformType,
    sourceObjectIds: transformation.sourceObjectIds,
    targetObjectIds: transformation.targetObjectIds,
    preserves: transformation.preserves,
    summary: transformation.title
  });
}
