import {
  checkKpAnimationAssetReferenceClosure,
  checkKpAnimationAssetSeekRewindLaw,
  createKpAnimationAsset,
  type KpAnimationAsset
} from "./asset.ts";
import {
  createKpSampledFrameEnvelope,
  type KpSampledFrameEnvelope
} from "./sampled-frame-envelope.ts";
import { createKpSampledFrameDomainPayload } from "./sampled-frame-payload.ts";
import {
  createKpAssetBundle,
  createKpSemanticAssetObject
} from "../semantic/asset.ts";
import { createKpSemanticTransformation } from "../semantic/asset-transformation.ts";
import { createSemanticTransformationRef } from "../semantic/animation.ts";
import { createCanonicalKpQuadraticSemanticFixture } from "../semantic/quadratic-branching-fixture.ts";
import { createCanonicalKpCompletingSquareAuthority } from "../semantic/quadratic-completing-square-authority.ts";
import { createCanonicalKpQuadraticFormulaAuthority } from "../semantic/quadratic-formula-authority.ts";
import {
  createCanonicalKpQuadraticLifecycle,
  sampleKpQuadraticLifecycle,
  type KpQuadraticLifecycleContract
} from "../semantic/quadratic-lifecycle.ts";
import { compileKpQuadraticMethodConvergence } from "../semantic/quadratic-method-convergence.ts";
import { createCanonicalKpQuadraticPlusMinusBranches } from "../semantic/quadratic-plus-minus-branches.ts";
import {
  createCanonicalKpQuadraticSolutionMethodGraph,
  type KpQuadraticMethodId
} from "../semantic/quadratic-solution-method-graph.ts";
import { createKpQuadraticSolutionSetFromFixture } from "../semantic/quadratic-solution-set.ts";
import {
  createEditableSemanticTransformationTree,
  createSemanticTransformationLeaf,
  createSemanticTransformationParallel,
  createSemanticTransformationSequence
} from "../semantic/transformation-composition.ts";

export const kpQuadraticBranchingAnimationId =
  "animation.algebra.quadratic.solution-branching";
export const kpQuadraticBranchingTimelineId =
  "timeline.quadratic.solution-branching.shared";
export const kpQuadraticBranchingDurationMs = 7200;
export const kpQuadraticBranchingBeatCount = 72;

export interface KpCanonicalQuadraticAnimation {
  readonly animation: KpAnimationAsset;
  readonly lifecycle: KpQuadraticLifecycleContract;
  readonly inspection: {
    readonly rendererNeutral: true;
    readonly concreteRendererDependencies: readonly [];
    readonly methodIds: readonly KpQuadraticMethodId[];
    readonly checkpointIds: readonly string[];
    readonly semanticEntityCount: number;
    readonly sharedClockId: typeof kpQuadraticBranchingTimelineId;
  };
}

export function createCanonicalKpQuadraticAnimation():
  KpCanonicalQuadraticAnimation {
  const fixture = createCanonicalKpQuadraticSemanticFixture();
  const solutionSet = createKpQuadraticSolutionSetFromFixture(fixture);
  const graph = createCanonicalKpQuadraticSolutionMethodGraph({
    completingSquare: createCanonicalKpCompletingSquareAuthority(fixture),
    formula: createCanonicalKpQuadraticFormulaAuthority(fixture)
  });
  const branchSets = createCanonicalKpQuadraticPlusMinusBranches({
    graph,
    solutionSet
  });
  const convergence = compileKpQuadraticMethodConvergence({
    fixture,
    solutionSet,
    branchSets
  });
  const lifecycle = createCanonicalKpQuadraticLifecycle({
    graph,
    branchSets,
    convergence
  });
  const objects = lifecycle.lifecycles.map((entity) =>
    createKpSemanticAssetObject({
      id: entity.entityId,
      objectType: "quadratic-semantic-entity",
      title: entity.entityId,
      value: {
        authorityRef: entity.authorityRef,
        scope: entity.scope
      },
      provenance: {
        kind: "derived",
        sourceIds: [entity.authorityRef],
        summary: "Renderer-neutral semantic entity compiled from verified quadratic authority."
      }
    })
  );
  const transformations = lifecycle.paths.flatMap((path) =>
    path.frames.slice(1).map((frame, index) =>
      createKpSemanticTransformation({
        id: transformationId(path.methodId, index + 1),
        transformType: quadraticOperationRef({
          graph,
          methodId: path.methodId,
          transitionIndex: index
        }),
        title: frame.checkpointId,
        sourceObjectIds: path.frames[index]!.visibleEntityIds,
        targetObjectIds: frame.visibleEntityIds,
        preserves: ["value"],
        lawRefs: [
          {
            id: frame.checkpointId.startsWith("reunion.")
              ? "law.quadratic.complete-solution-set"
              : "law.quadratic.same-solution-set",
            level: "strict"
          }
        ]
      })
    )
  );
  const transformationById = new Map(
    transformations.map((transformation) => [transformation.id, transformation])
  );
  const methodTrees = lifecycle.paths.map((path) =>
    createSemanticTransformationSequence({
      id: `sequence.${path.methodId}`,
      label: path.methodId,
      children: path.frames.slice(1).map((_frame, index) => {
        const transformation = transformationById.get(
          transformationId(path.methodId, index + 1)
        )!;
        return createSemanticTransformationLeaf(
          createSemanticTransformationRef({
            id: transformation.id,
            kind: transformation.transformType,
            sourceObjectIds: transformation.sourceObjectIds,
            targetObjectIds: transformation.targetObjectIds,
            preserves: transformation.preserves
          })
        );
      })
    })
  );
  const root = createSemanticTransformationParallel({
    id: "parallel.quadratic.solution-methods",
    label: "Equivalent quadratic solution methods",
    children: methodTrees
  });
  const animation = createKpAnimationAsset({
    id: kpQuadraticBranchingAnimationId,
    title: "Solve x² − 5x + 6 = 0",
    bundle: createKpAssetBundle({
      id: "asset.quadratic.solution-branching",
      title: "Quadratic solution branching",
      objects
    }),
    transformations,
    transformationTree: createEditableSemanticTransformationTree({ root }),
    timeline: {
      id: kpQuadraticBranchingTimelineId,
      durationMs: kpQuadraticBranchingDurationMs,
      beatCount: kpQuadraticBranchingBeatCount,
      markerIds: lifecycle.paths.flatMap(({ frames }) =>
        frames.map(({ checkpointId }) => checkpointId)
      )
    },
    checks: [
      {
        id: "check.quadratic.reference-closure",
        lawId: "animation.reference-closure",
        level: "strict",
        targetId: kpQuadraticBranchingAnimationId
      },
      {
        id: "check.quadratic.seek-rewind",
        lawId: "animation.seek-rewind",
        level: "strict",
        targetId: root.id
      }
    ],
    metadata: {
      rendererNeutral: true,
      sharedClockId: kpQuadraticBranchingTimelineId,
      semanticAuthority: lifecycle.id
    }
  });
  const referenceClosure = checkKpAnimationAssetReferenceClosure(animation);
  const seekRewind = checkKpAnimationAssetSeekRewindLaw(animation);
  if (!referenceClosure.passed || !seekRewind.passed) {
    throw new Error("Canonical quadratic animation failed asset closure laws.");
  }
  return Object.freeze({
    animation,
    lifecycle,
    inspection: Object.freeze({
      rendererNeutral: true as const,
      concreteRendererDependencies: Object.freeze([]) as readonly [],
      methodIds: Object.freeze(lifecycle.paths.map(({ methodId }) => methodId)),
      checkpointIds: Object.freeze(lifecycle.paths.flatMap(({ frames }) =>
        frames.map(({ checkpointId }) => checkpointId)
      )),
      semanticEntityCount: lifecycle.lifecycles.length,
      sharedClockId: kpQuadraticBranchingTimelineId
    })
  });
}

function quadraticOperationRef(input: {
  readonly graph: ReturnType<
    typeof createCanonicalKpQuadraticSolutionMethodGraph
  >;
  readonly methodId: KpQuadraticMethodId;
  readonly transitionIndex: number;
}): string {
  const path = input.graph.paths.find(({ id }) => id === input.methodId)!;
  const edgeId = path.edgeIds[input.transitionIndex];
  if (edgeId !== undefined) {
    return input.graph.edges.find(({ id }) => id === edgeId)!.operationRef;
  }
  return input.transitionIndex === path.edgeIds.length
    ? "operation.quadratic.branch-plus-minus"
    : "operation.quadratic.reunite-solution-set";
}

export function sampleKpCanonicalQuadraticAnimation(input: {
  readonly asset: KpCanonicalQuadraticAnimation;
  readonly methodId: KpQuadraticMethodId;
  readonly progress: number;
  readonly direction?: "forward" | "rewind";
}): KpSampledFrameEnvelope {
  const direction = input.direction ?? "forward";
  const sample = sampleKpQuadraticLifecycle({
    contract: input.asset.lifecycle,
    methodId: input.methodId,
    progress: input.progress,
    direction
  });
  const transformationIds =
    sample.frameIndex === 0
      ? []
      : [transformationId(input.methodId, sample.frameIndex)];
  const payload = createKpSampledFrameDomainPayload({
    domain: "equation",
    schemaVersion: "kp.sampled-frame-payload.equation.v1",
    kind: "equation-frame-payload",
    frameId: `frame.${input.methodId}.${sample.frameIndex}`,
    assetId: input.asset.animation.id,
    surface: "custom",
    objects: sample.visibleEntityIds.map((objectId) => ({
      objectId,
      role: "current" as const
    })),
    selectors: [],
    correspondences: []
  });
  return createKpSampledFrameEnvelope({
    schemaVersion: "kp.sampled-frame-envelope.v1",
    id: `envelope.${input.methodId}.${direction}.${input.progress.toFixed(4)}`,
    kind: "sampled-frame-envelope",
    source: {
      animationId: input.asset.animation.id,
      planId: input.asset.lifecycle.id,
      timelineId: kpQuadraticBranchingTimelineId
    },
    clock: {
      direction,
      progress: input.progress,
      durationMs: kpQuadraticBranchingDurationMs,
      elapsedMs: Math.round(input.progress * kpQuadraticBranchingDurationMs),
      beatCount: kpQuadraticBranchingBeatCount,
      beat: Math.round(input.progress * kpQuadraticBranchingBeatCount * 1000) / 1000
    },
    activity: {
      phaseId: sample.checkpointId,
      phaseIndex: sample.frameIndex,
      semanticObjectIds: sample.visibleEntityIds,
      transformationIds,
      annotationIds: [],
      focusSelectorIds: [],
      childFrameIds: []
    },
    diagnostics: [],
    payload
  });
}

function transformationId(
  methodId: KpQuadraticMethodId,
  index: number
): string {
  return `transform.${methodId}.${index}`;
}
