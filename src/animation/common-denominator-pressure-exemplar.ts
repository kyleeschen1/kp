import {
  createKpAnimationAsset,
  type KpAnimationAsset
} from "./asset.ts";
import {
  createKpCanonicalBalancedSolveEquationPresentationProfileV1
} from "./equation-presentation-profile.ts";
import {
  kpCanonicalCommonDenominatorPressurePresentationPlan
} from "./common-denominator-pressure-presentation-plan.ts";
import {
  createKpAssetBundle,
  createKpSemanticAssetObject
} from "../semantic/asset.ts";
import { createKpSemanticTransformation } from
  "../semantic/asset-transformation.ts";
import { createSemanticTransformationRef } from
  "../semantic/animation.ts";
import {
  createEditableSemanticTransformationTree,
  createSemanticTransformationLeaf,
  createSemanticTransformationSequence
} from "../semantic/transformation-composition.ts";

export const kpCommonDenominatorPressureAnimationId =
  "animation.equation.fraction-equivalence.common-denominator-pressure.v1" as const;

const segmentWeights = Object.freeze([0.18, 0.52, 0.30] as const);

export const kpCommonDenominatorPressureTimeline = Object.freeze({
  durationMs: 8_400,
  segmentWeights,
  stageUnitFactorEnd: segmentWeights[0],
  joinEquivalentFractionEnd: segmentWeights[0] + segmentWeights[1]
});

export type KpCommonDenominatorPressureTimelineSegment =
  | "stage-unit-factor"
  | "join-equivalent-fraction"
  | "evaluate-products";

export function sampleKpCommonDenominatorPressureTimeline(
  progress: number
): Readonly<{
  readonly segment: KpCommonDenominatorPressureTimelineSegment;
  readonly localProgress: number;
}> {
  const bounded = boundedProgress(progress);
  if (bounded < kpCommonDenominatorPressureTimeline.stageUnitFactorEnd) {
    return frame(
      "stage-unit-factor",
      bounded / kpCommonDenominatorPressureTimeline.stageUnitFactorEnd
    );
  }
  if (
    bounded <
      kpCommonDenominatorPressureTimeline.joinEquivalentFractionEnd
  ) {
    const start =
      kpCommonDenominatorPressureTimeline.stageUnitFactorEnd;
    const end =
      kpCommonDenominatorPressureTimeline.joinEquivalentFractionEnd;
    return frame("join-equivalent-fraction",
      (bounded - start) / (end - start));
  }
  const start =
    kpCommonDenominatorPressureTimeline.joinEquivalentFractionEnd;
  return frame("evaluate-products", (bounded - start) / (1 - start));
}

export function createKpCommonDenominatorPressureAnimationAsset():
KpAnimationAsset {
  const plan = kpCanonicalCommonDenominatorPressurePresentationPlan;
  const objects = plan.endpoints.map((entry) =>
    createKpSemanticAssetObject({
      id: entry.stateId,
      objectType: "equation",
      title: endpointTitle(entry.kind),
      value: Object.freeze({
        latex: entry.latex,
        endpointKind: entry.kind
      }),
      selectors: selectorsFor(entry.kind),
      metadata: {
        latex: entry.latex,
        settledEndpointAuthority: "native-katex"
      }
    })
  );
  const byKind = new Map(plan.endpoints.map((endpoint, index) => [
    endpoint.kind,
    objects[index]!
  ]));
  const transformations = [
    transformation({
      id: `${plan.id}.stage-unit-factor`,
      type: "introduceUnitFactor",
      title: "Introduce two over two beside one third",
      sourceId: requiredObject(byKind, "problem").id,
      targetId: requiredObject(byKind, "equivalence-source").id,
      preserves: ["identity", "value", "structure"]
    }),
    transformation({
      id: `${plan.id}.join-equivalent-fraction`,
      type: "alignCommonDenominator",
      title: "Join the unit factor with the first fraction",
      sourceId: requiredObject(byKind, "equivalence-source").id,
      targetId: requiredObject(byKind, "product").id,
      preserves: ["identity", "value", "role", "structure"]
    }),
    transformation({
      id: plan.evaluation.transformationId,
      type: "simplifyConstantProduct",
      title: "Evaluate both products together",
      sourceId: requiredObject(byKind, "product").id,
      targetId: requiredObject(byKind, "evaluated").id,
      preserves: ["identity", "value", "role", "structure"]
    })
  ];
  const root = createSemanticTransformationSequence({
    id: `animation-tree.${kpCommonDenominatorPressureAnimationId}`,
    label: "Give one third a denominator of six",
    children: transformations.map((entry) =>
      createSemanticTransformationLeaf(createSemanticTransformationRef({
        id: entry.id,
        kind: entry.transformType,
        sourceObjectIds: entry.sourceObjectIds,
        targetObjectIds: entry.targetObjectIds,
        preserves: entry.preserves,
        summary: entry.title
      }))
    )
  });
  const timelineId = `timeline.${kpCommonDenominatorPressureAnimationId}`;
  const renderTargetId =
    "render.fraction-equivalence.common-denominator-pressure";
  return createKpAnimationAsset({
    id: kpCommonDenominatorPressureAnimationId,
    title: "Give one third a denominator of six",
    bundle: createKpAssetBundle({
      id: "bundle.fraction.common-denominator-pressure",
      title: "Common denominator pressure caller",
      objects
    }),
    transformations,
    transformationTree: createEditableSemanticTransformationTree({ root }),
    timeline: {
      id: timelineId,
      durationMs: kpCommonDenominatorPressureTimeline.durationMs,
      beatCount: 120,
      markerIds: [...plan.stepOrder]
    },
    layout: {
      id: "layout.fraction.common-denominator-pressure",
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
        "One native KaTeX stage composes unit-factor introduction, " +
        "fraction joining, and explicit product evaluation."
    }],
    checks: [{
      id: "check.fraction.common-denominator-pressure.reference-closure",
      lawId: "animation.reference-closure",
      level: "strict",
      targetId: kpCommonDenominatorPressureAnimationId
    }, {
      id: "check.fraction.common-denominator-pressure.seek-rewind",
      lawId: "animation.seek-rewind",
      level: "strict",
      targetId: root.id
    }],
    exportTargets: [{
      id: "export.fraction.common-denominator-pressure.frames",
      kind: "frame-sequence",
      artifactId: "artifact.fraction.common-denominator-pressure.frames"
    }],
    dashboard: {
      rowId: "exemplar-fraction-common-denominator-pressure-v1",
      tags: [
        "algebra",
        "animation",
        "equation",
        "fraction",
        "katex",
        "pressure-caller"
      ],
      sourceRefIds: [
        plan.equivalence.semanticContractId,
        plan.equivalence.focus.presentation.recipeId
      ]
    },
    presentationProfile:
      createKpCanonicalBalancedSolveEquationPresentationProfileV1(),
    metadata: {
      sourceFamilyId: "family.algebra.fraction-common-denominator",
      presentationPlanId: plan.id,
      settledEndpointAuthority: "native-katex",
      summary:
        "A conservative larger-expression caller for the approved fraction " +
        "equivalence and product-evaluation motifs."
    }
  });
}

function selectorsFor(
  kind: typeof kpCanonicalCommonDenominatorPressurePresentationPlan
    .endpoints[number]["kind"]
) {
  const plan = kpCanonicalCommonDenominatorPressurePresentationPlan;
  const ids = kind === "problem"
    ? [
        ...plan.equivalence.focus.presentation.sourceSelectorIds,
        ...plan.equivalence.contextTransfers.map(({ sourceEntityId }) =>
          sourceEntityId
        )
      ]
    : kind === "equivalence-source"
      ? [
          ...plan.equivalence.focus.presentation.sourceSelectorIds,
          ...plan.equivalence.focus.presentation.operationMaterialSelectorIds,
          ...plan.equivalence.contextTransfers.map(({ sourceEntityId }) =>
            sourceEntityId
          )
        ]
      : kind === "product"
        ? [
            ...plan.equivalence.focus.presentation.targetSelectorIds,
            ...plan.equivalence.contextTransfers.map(({ targetEntityId }) =>
              targetEntityId
            )
          ]
        : [
            ...plan.evaluation.bindings.flatMap((binding) =>
              binding.targetAnnotations.flatMap(({ selectorIds }) =>
                selectorIds
              )
            ),
            ...plan.evaluation.persistentEntityIds
          ];
  return [...new Set(ids)].map((id) => ({
    id: `selector.${kind}.${id}`,
    kind: selectorKind(id),
    label: id,
    metadata: { semanticEntityId: id }
  }));
}

function selectorKind(id: string): string {
  if (id.includes("division")) return "fraction-bar";
  if (id.includes("factor") || id.includes("multiplier")) return "factor";
  if (id.includes("operator") || id.includes("plus")) return "operator";
  if (id.includes("numerator")) return "numerator";
  if (id.includes("denominator")) return "denominator";
  return "expression";
}

function transformation(input: {
  readonly id: string;
  readonly type: string;
  readonly title: string;
  readonly sourceId: string;
  readonly targetId: string;
  readonly preserves: readonly ("identity" | "value" | "role" | "structure")[];
}) {
  return createKpSemanticTransformation({
    id: input.id,
    transformType: input.type,
    title: input.title,
    sourceObjectIds: [input.sourceId],
    targetObjectIds: [input.targetId],
    preserves: [...input.preserves]
  });
}

function requiredObject(
  objects: ReadonlyMap<string, ReturnType<typeof createKpSemanticAssetObject>>,
  kind: string
) {
  const result = objects.get(kind);
  if (result === undefined) {
    throw new Error(`Missing common-denominator endpoint ${kind}.`);
  }
  return result;
}

function endpointTitle(kind: string): string {
  switch (kind) {
    case "problem": return "One third plus one sixth";
    case "equivalence-source": return "Multiply one third by two over two";
    case "product": return "Equivalent products over a common denominator";
    case "evaluated": return "Two sixths plus one sixth";
    default: throw new Error(`Unknown pressure endpoint ${kind}.`);
  }
}

function frame(
  segment: KpCommonDenominatorPressureTimelineSegment,
  localProgress: number
) {
  return Object.freeze({ segment, localProgress });
}

function boundedProgress(progress: number): number {
  if (!Number.isFinite(progress)) {
    throw new Error("Common-denominator pressure progress must be finite.");
  }
  return Math.max(0, Math.min(1, progress));
}
