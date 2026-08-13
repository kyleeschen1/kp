import {
  checkKpAnimationAssetReferenceClosure,
  createKpAnimationAsset,
  type KpAnimationAsset
} from "../animation/asset.ts";
import { readKpSchemeFactorialFullEvaluationArtifact } from
  "../animation/scheme-factorial-full-evaluation-artifact.ts";
import type {
  KpSchemeFactorialFullEvaluation,
  KpSchemeFullEvaluationState
} from "../animation/scheme-factorial-full-evaluation.ts";
import { createSemanticTransformationRef } from "./animation.ts";
import {
  createKpAssetBundle,
  createKpSemanticAssetObject
} from "./asset.ts";
import {
  createKpSemanticTransformation,
  type KpSemanticTransformation
} from "./asset-transformation.ts";
import {
  createEditableSemanticTransformationTree,
  createSemanticTransformationLeaf,
  createSemanticTransformationSequence
} from "./transformation-composition.ts";

export interface KpSchemeFactorialAnimationAsset {
  readonly id: "animation.programming.scheme-factorial";
  readonly animation: KpAnimationAsset;
  readonly evaluation: KpSchemeFactorialFullEvaluation;
  readonly accessibility: {
    readonly title: string;
    readonly description: string;
    readonly settledCode: string;
  };
}

/** Hosts the compiled pedagogical score without importing its build authorities. */
export function createKpSchemeFactorialAnimationAsset():
  KpSchemeFactorialAnimationAsset {
  const evaluation = readKpSchemeFactorialFullEvaluationArtifact();
  const bundle = createKpAssetBundle({
    id: "asset.scheme-factorial.full-evaluation",
    title: "Evaluate factorial of three",
    objects: evaluation.states.map((state, index) =>
      createKpSemanticAssetObject({
        id: objectId(state),
        objectType: "scheme-evaluation-state",
        title: stateTitle(state),
        value: state,
        selectors: [{
          id: selectorId(state),
          kind: `scheme-${state.kind}-state`,
          label: state.nativeCode,
          metadata: { stateIndex: index, stateKind: state.kind }
        }],
        provenance: index === 0
          ? {
              kind: "authored",
              sourceIds: [evaluation.id],
              summary: "The source call is the exact native opening endpoint."
            }
          : {
              kind: "transformed",
              sourceIds: [objectId(evaluation.states[index - 1]!)],
              transformationId: evaluation.transitions[index - 1]!.id,
              summary: "The evaluator-certified score determines semantic succession."
            }
      }))
  });
  const transformations = evaluation.transitions.map((transition) =>
    createKpSemanticTransformation({
      id: transition.id,
      definitionId: `definition.scheme-factorial.${actionKind(
        evaluation, transition.actionIds.at(-1)!)}`,
      transformType: actionKind(evaluation, transition.actionIds.at(-1)!),
      title: transition.caption,
      sourceObjectIds: [objectIdById(transition.fromStateId)],
      targetObjectIds: [objectIdById(transition.toStateId)],
      preserves: ["value", "role"],
      lawRefs: [{
        id: "kp.scheme-factorial.trace-certified-transition",
        level: "strict"
      }]
    }));
  const root = createSemanticTransformationSequence({
    id: "sequence.scheme-factorial.full-evaluation",
    label: "Open recursive calls and return their values",
    children: transformations.map((transformation) =>
      createSemanticTransformationLeaf(transformationRef(transformation))),
    summary:
      "Pedagogical score order is compiled from, but not dictated at runtime by, the evaluator trace."
  });
  const animation = createKpAnimationAsset({
    id: "animation.programming.scheme-factorial",
    title: "Evaluate (factorial 3)",
    bundle,
    transformations,
    transformationTree: createEditableSemanticTransformationTree({
      root,
      annotations: transformations.map((transformation, index) => ({
        id: `annotation.scheme-factorial.${index + 1}`,
        kind: "focus",
        targetNodeId: transformation.id,
        placement: "during",
        selectorIds: [selectorId(evaluation.states[index + 1]!)],
        summary: transformation.title
      }))
    }),
    timeline: {
      id: "timeline.scheme-factorial.full-evaluation",
      durationMs: 30_000,
      beatCount: evaluation.transitions.length,
      markerIds: evaluation.transitions.map(({ id }) => id)
    },
    layout: {
      id: "layout.scheme-factorial.full-evaluation",
      kind: "single",
      targetId: "render.scheme-factorial.full-evaluation"
    },
    renderTargets: [{
      id: "render.scheme-factorial.full-evaluation",
      kind: "programming",
      objectIds: bundle.objects.map(({ id }) => id),
      selectorIds: bundle.objects.flatMap(({ selectors }) =>
        selectors.map(({ id }) => id)),
      transformationIds: transformations.map(({ id }) => id),
      timelineId: "timeline.scheme-factorial.full-evaluation",
      summary: "Approved native Scheme code-material evaluation surface.",
      metadata: {
        rendererKind: "scheme-factorial-full-evaluation-v1",
        nativePaintOwner: "native.scheme.semantic-dom"
      }
    }],
    checks: [
      {
        id: "check.scheme-factorial.reference-closure",
        lawId: "animation.reference-closure",
        level: "strict"
      },
      {
        id: "check.scheme-factorial.seek-rewind",
        lawId: "animation.seek-rewind",
        level: "strict",
        targetId: root.id
      },
      {
        id: "check.scheme-factorial.trace-certified",
        lawId: "kp.scheme-factorial.trace-certified-transition",
        level: "strict"
      }
    ],
    exportTargets: [
      {
        id: "export.scheme-factorial.static-step",
        kind: "static-step",
        artifactId: evaluation.targetStateId,
        summary: "Exact native source and result remain available without motion."
      },
      {
        id: "export.scheme-factorial.frame-sequence",
        kind: "frame-sequence",
        artifactId: evaluation.id
      }
    ],
    dashboard: {
      rowId: "animation-programming-scheme-factorial",
      tags: [
        "animation",
        "programming",
        "scheme",
        "recursion",
        "factorial",
        "evaluation"
      ],
      sampleTargetIds: ["render.scheme-factorial.full-evaluation"],
      sourceRefIds: [evaluation.id]
    },
    metadata: {
      domain: "programming",
      language: "scheme",
      summary: "Recursive calls open toward the base case, then values return through waiting multiplication.",
      semanticAuthority: "build-time-generated-evaluator-trace",
      presentationStatus: "approved-exemplar"
    }
  });
  const closure = checkKpAnimationAssetReferenceClosure(animation);
  if (!closure.passed) throw new Error(closure.failures[0]!.message);

  return Object.freeze({
    id: "animation.programming.scheme-factorial",
    animation,
    evaluation,
    accessibility: Object.freeze({
      title: "Evaluate factorial of three",
      description: evaluation.accessibleDescription,
      settledCode: evaluation.states.at(-1)!.nativeCode
    })
  });
}

function objectId(state: KpSchemeFullEvaluationState): string {
  return objectIdById(state.id);
}

function objectIdById(stateId: string): string {
  return `object.${stateId}`;
}

function selectorId(state: KpSchemeFullEvaluationState): string {
  return `selector.${state.id}`;
}

function stateTitle(state: KpSchemeFullEvaluationState): string {
  return `${state.kind} state: ${state.nativeCode.replaceAll("\n", " ")}`;
}

function actionKind(
  evaluation: KpSchemeFactorialFullEvaluation,
  actionId: string
): string {
  const action = evaluation.actions.find(({ id }) => id === actionId);
  if (action === undefined) throw new Error(`Missing factorial action ${actionId}.`);
  return action.kind;
}

function transformationRef(transformation: KpSemanticTransformation) {
  return createSemanticTransformationRef({
    id: transformation.id,
    kind: transformation.transformType,
    sourceObjectIds: transformation.sourceObjectIds,
    targetObjectIds: transformation.targetObjectIds,
    preserves: transformation.preserves,
    summary: transformation.title
  });
}
