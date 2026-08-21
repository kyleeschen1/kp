import {
  createKpAnimationAsset,
  type KpAnimationAsset
} from "./asset.ts";
import {
  createKpCanonicalBalancedSolveEquationPresentationProfileV1
} from "./equation-presentation-profile.ts";
import {
  createKpAnimationPresentationConstraintsV1
} from "./presentation-constraints.ts";
import {
  createKpAssetBundle,
  createKpSemanticAssetObject
} from "../semantic/asset.ts";
import { createKpSemanticTransformation } from
  "../semantic/asset-transformation.ts";
import { createSemanticTransformationRef } from "../semantic/animation.ts";
import {
  createEditableSemanticTransformationTree,
  createSemanticTransformationLeaf,
  createSemanticTransformationSequence
} from "../semantic/transformation-composition.ts";
import {
  createKpEvenRootSolveExemplar,
  type KpEvenRootSolveState
} from "../semantic/even-root-solve-exemplar.ts";

export const kpEvenRootSolveAnimationId =
  "animation.algebra.radical.solve-x-squared-nine" as const;

const DURATION_MS = 6_400;
const BEAT_COUNT = 128;

export function createKpEvenRootSolveAnimationAsset(): KpAnimationAsset {
  const exemplar = createKpEvenRootSolveExemplar();
  const objects = exemplar.states.map(stateObject);
  const [source, radical, evaluated] = exemplar.states;
  const transformations = [
    createKpSemanticTransformation({
      id: exemplar.operations[0].id,
      transformType: exemplar.operations[0].operationAuthority,
      title: "Apply the inverse square operation over the reals",
      sourceObjectIds: [source.id],
      targetObjectIds: [radical.id],
      preserves: ["identity", "structure", "value", "role"],
      correspondence: [
        correspondence(source.subjectEntityId, radical.subjectEntityId,
          ["identity", "role"]),
        correspondence(source.relationEntityId, radical.relationEntityId,
          ["identity", "role"]),
        correspondence(source.rightEntityId, radical.radicandEntityId,
          ["identity", "role"]),
        correspondence(source.exponentEntityId, radical.rootIndexEntityId,
          ["structure", "role"])
      ],
      lawRefs: [{
        id: exemplar.operations[0].lawAuthority.id,
        level: "strict",
        summary: "An even inverse power introduces both real branches."
      }]
    }),
    createKpSemanticTransformation({
      id: exemplar.operations[1].id,
      transformType: exemplar.operations[1].operationAuthority,
      title: "Evaluate the real square root",
      sourceObjectIds: [radical.id],
      targetObjectIds: [evaluated.id],
      preserves: ["identity", "value", "role"],
      correspondence: [
        correspondence(radical.subjectEntityId, evaluated.subjectEntityId,
          ["identity", "role"]),
        correspondence(radical.relationEntityId, evaluated.relationEntityId,
          ["identity", "role"]),
        correspondence(radical.plusMinusEntityId,
          evaluated.plusMinusEntityId, ["identity", "role"]),
        correspondence(radical.rootExpressionEntityId,
          evaluated.valueEntityId, ["value", "role"])
      ],
      lawRefs: [{
        id: exemplar.operations[1].lawAuthority.id,
        level: "strict",
        summary: "The principal square root of nine evaluates to three."
      }]
    })
  ] as const;
  const leaves = transformations.map((transformation) =>
    createSemanticTransformationLeaf(createSemanticTransformationRef({
      id: transformation.id,
      kind: transformation.transformType,
      sourceObjectIds: transformation.sourceObjectIds,
      targetObjectIds: transformation.targetObjectIds,
      preserves: transformation.preserves,
      summary: transformation.title
    }))
  );
  const root = createSemanticTransformationSequence({
    id: "sequence.even-root.solve-x-squared-nine",
    label: "Solve x squared equals nine over the reals",
    children: leaves
  });
  const timelineId = `timeline.${kpEvenRootSolveAnimationId}`;
  const renderTargetId = "render.even-root.solve-x-squared-nine.equation";

  return createKpAnimationAsset({
    id: kpEvenRootSolveAnimationId,
    title: "Solve x² = 9 over the reals",
    bundle: createKpAssetBundle({
      id: "asset.even-root.solve-x-squared-nine",
      title: "Even inverse-power branch exemplar",
      objects
    }),
    transformations,
    transformationTree: createEditableSemanticTransformationTree({ root }),
    timeline: {
      id: timelineId,
      durationMs: DURATION_MS,
      beatCount: BEAT_COUNT,
      markerIds: transformations.map(({ id }) => id)
    },
    layout: {
      id: "layout.even-root.solve-x-squared-nine",
      kind: "single",
      targetId: renderTargetId
    },
    renderTargets: [{
      id: renderTargetId,
      kind: "equation",
      objectIds: objects.map(({ id }) => id),
      selectorIds: objects.flatMap(({ selectors }) =>
        selectors.map(({ id }) => id)
      ),
      transformationIds: transformations.map(({ id }) => id),
      timelineId,
      summary:
        "Transfer the visible exponent into an implicit root index, expose " +
        "both real branches, then evaluate the root separately."
    }],
    checks: [{
      id: "check.even-root.reference-closure",
      lawId: "animation.reference-closure",
      level: "strict",
      targetId: kpEvenRootSolveAnimationId
    }, {
      id: "check.even-root.seek-rewind",
      lawId: "animation.seek-rewind",
      level: "strict",
      targetId: root.id
    }],
    exportTargets: [{
      id: "export.even-root.frames",
      kind: "frame-sequence",
      artifactId: "artifact.even-root.solve-x-squared-nine.frames"
    }, {
      id: "export.even-root.static-step",
      kind: "static-step",
      artifactId: "artifact.even-root.solve-x-squared-nine.static"
    }],
    dashboard: {
      rowId: "animation-algebra-radical-solve-x-squared-nine",
      tags: [
        "algebra", "animation", "branch", "equation", "katex", "radical",
        "root"
      ],
      sourceRefIds: exemplar.operations.map(({ lawAuthority }) =>
        lawAuthority.id
      )
    },
    presentationProfile:
      createKpCanonicalBalancedSolveEquationPresentationProfileV1(),
    presentationConstraints: createKpAnimationPresentationConstraintsV1({
      requiredCapabilities: [
        "accessibility", "direct-seek", "responsive", "rewind"
      ]
    }),
    metadata: {
      semanticExemplarId: exemplar.id,
      settledEndpointAuthority: "native-katex",
      fallbackEndpoint: source.latex,
      branchAuthority: exemplar.operations[0].operationAuthority,
      reviewStatus: "visual-checkpoint-candidate",
      summary:
        "A verified even-root sequence with explicit real branches and " +
        "separate arithmetic evaluation."
    }
  });
}

function stateObject(state: KpEvenRootSolveState) {
  return createKpSemanticAssetObject({
    id: state.id,
    objectType: "equation",
    title: stateTitle(state),
    value: Object.freeze({ latex: state.latex, stateKind: state.kind }),
    selectors: stateSelectors(state),
    metadata: {
      latex: state.latex,
      semanticStateId: state.id,
      settledEndpointAuthority: "native-katex"
    }
  });
}

function stateSelectors(state: KpEvenRootSolveState) {
  if (state.kind === "powered-equality") {
    return [
      selector(state.subjectEntityId, "subject", "x", "semantic.variable.x"),
      selector(state.exponentEntityId, "exponent", "2", "semantic.index.two"),
      selector(state.relationEntityId, "relation", "=",
        "semantic.relation.equality"),
      selector(state.rightEntityId, "value", "9", "semantic.value.nine")
    ];
  }
  if (state.kind === "branched-radical-equality") {
    return [
      selector(state.subjectEntityId, "subject", "x", "semantic.variable.x"),
      selector(state.relationEntityId, "relation", "=",
        "semantic.relation.equality"),
      selector(state.plusMinusEntityId, "operator", "\\pm",
        "semantic.operator.plus-minus"),
      selector(state.rootExpressionEntityId, "root-expression", "\\sqrt{9}",
        "semantic.expression.sqrt-nine"),
      selector(state.radicalOperatorEntityId, "radical-operator", "\\sqrt{}",
        "semantic.operator.square-root"),
      selector(state.rootIndexEntityId, "root-index", "2",
        "semantic.index.two"),
      selector(state.radicandEntityId, "radicand", "9", "semantic.value.nine")
    ];
  }
  return [
    selector(state.subjectEntityId, "subject", "x", "semantic.variable.x"),
    selector(state.relationEntityId, "relation", "=",
      "semantic.relation.equality"),
    selector(state.plusMinusEntityId, "operator", "\\pm",
      "semantic.operator.plus-minus"),
    selector(state.valueEntityId, "value", "3", "semantic.value.three")
  ];
}

function selector(id: string, kind: string, label: string, semanticId: string) {
  return Object.freeze({
    id,
    kind,
    label,
    metadata: Object.freeze({ semanticId, representation: "native-katex" })
  });
}

function correspondence(
  sourceSelectorId: string,
  targetSelectorId: string,
  preserves: readonly ("identity" | "structure" | "value" | "role")[]
) {
  return Object.freeze({ sourceSelectorId, targetSelectorId, preserves });
}

function stateTitle(state: KpEvenRootSolveState): string {
  if (state.kind === "powered-equality") return "Powered equation";
  if (state.kind === "branched-radical-equality") {
    return "Explicit even-root branches";
  }
  return "Evaluated real branches";
}
