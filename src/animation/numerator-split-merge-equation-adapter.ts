import { createKpAnimationAsset, type KpAnimationAsset } from "./asset.ts";
import { createSemanticTransformationRef } from "../semantic/animation.ts";
import {
  createNumeratorSplitMergeEquationKpAsset,
  createVerifiedIntegerNumeratorMergeAsset,
  type NumeratorSplitMergeEquationKpAsset
} from "../semantic/numerator-split-merge-equation-asset.ts";
import {
  createEditableSemanticTransformationTree,
  createSemanticTransformationLeaf,
  createSemanticTransformationSequence
} from "../semantic/transformation-composition.ts";
import {
  createKpContinuityEquationPresentationProfileV1
} from "./equation-presentation-profile.ts";
import type { KpVerifiedLikeDenominatorCombination } from "../semantic/fraction-like-denominator-combination.ts";

export function createVerifiedIntegerNumeratorMergeAnimation(proof: KpVerifiedLikeDenominatorCombination): KpAnimationAsset {
  return createNumeratorSplitMergeAnimationAsset({ includeMerge: true, mergeOnly: true, source: createVerifiedIntegerNumeratorMergeAsset(proof) });
}

/** Forward-only until the exact inverse merge clears its own motion slice. */
export function createNumeratorSplitEquationAnimationAsset(): KpAnimationAsset {
  return createNumeratorSplitMergeAnimationAsset({
    includeMerge: false,
    source: createNumeratorSplitMergeEquationKpAsset()
  });
}

export function createNumeratorSplitMergeEquationAnimationAsset(
  source: NumeratorSplitMergeEquationKpAsset =
    createNumeratorSplitMergeEquationKpAsset()
): KpAnimationAsset {
  return createNumeratorSplitMergeAnimationAsset({
    includeMerge: true,
    source
  });
}

function createNumeratorSplitMergeAnimationAsset(input: {
  readonly includeMerge: boolean;
  readonly mergeOnly?: boolean;
  readonly source: NumeratorSplitMergeEquationKpAsset;
}): KpAnimationAsset {
  const { includeMerge, source } = input;
  const ids = source.ids;
  const stem = ids.combined
    .replace(/^equation\./, "")
    .replace(/\.combined$/, "");
  const transformations = input.mergeOnly ? source.transformations.filter(transformation => transformation.id === ids.mergeTransform) : includeMerge
    ? source.transformations
    : source.transformations.filter(
        (transformation) => transformation.id === ids.splitTransform
      );
  const animationId = includeMerge
    ? `animation.${stem}.round-trip`
    : `animation.${stem}.split-sum`;
  const timelineId = includeMerge
    ? `timeline.${stem}.round-trip`
    : `timeline.${stem}.split-sum`;
  const renderTargetId = `render.${stem}.equation`;
  const root = createSemanticTransformationSequence({
    id: includeMerge
      ? `diagram.${stem}.round-trip-sequence`
      : `diagram.${stem}.forward-sequence`,
    label: includeMerge
      ? "Split and merge a fraction over a numerator sum"
      : "Split a fraction over a numerator sum",
    children: transformations.map((transformation) =>
      createSemanticTransformationLeaf(createSemanticTransformationRef({
        id: transformation.id,
        kind: transformation.transformType,
        sourceObjectIds: transformation.sourceObjectIds,
        targetObjectIds: transformation.targetObjectIds,
        preserves: transformation.preserves,
        summary: transformation.title
      }))
    )
  });

  return createKpAnimationAsset({
    id: animationId,
    title: includeMerge
      ? "Split and merge a fraction across its numerator sum"
      : "Split a fraction across its numerator sum",
    bundle: source.bundle,
    transformations,
    transformationTree: createEditableSemanticTransformationTree({
      root,
      annotations: [
        ...(input.mergeOnly ? [] : [{
          id: `focus.${stem}.shared-structure`,
          kind: "focus" as const,
          targetNodeId: ids.splitTransform,
          placement: "during" as const,
          selectorIds: [
            selectorByRole(source, ids.combined, "numerator-operator"),
            selectorByRole(source, ids.combined, "fraction-rule"),
            selectorByRole(source, ids.combined, "denominator")
          ]
        }]),
        ...(includeMerge
          ? [{
              id: `focus.${stem}.compatible-structures`,
              kind: "focus" as const,
              targetNodeId: ids.mergeTransform,
              placement: "during" as const,
              selectorIds: [
                selectorByRole(source, ids.split, "sum-operator"),
                ...selectorsByRolesInObjectOrder(
                  source,
                  ids.split,
                  ["fraction-rule", "denominator"]
                )
              ]
            }]
          : [])
      ]
    }),
    timeline: {
      id: timelineId,
      durationMs: includeMerge ? 2_700 : 1_350,
      beatCount: includeMerge ? 54 : 27
    },
    layout: {
      id: `layout.${stem}.animation`,
      kind: "single",
      targetId: renderTargetId
    },
    renderTargets: [{
      id: renderTargetId,
      kind: "equation",
      objectIds: source.bundle.objects.map((object) => object.id),
      transformationIds: transformations.map((transformation) => transformation.id),
      timelineId
    }],
    checks: [
      {
        id: `check.${stem}.reference-closure`,
        lawId: "animation.reference-closure",
        level: "strict",
        targetId: animationId
      },
      {
        id: `check.${stem}.seek-rewind`,
        lawId: "animation.seek-rewind",
        level: "strict",
        targetId: root.id
      }
    ],
    exportTargets: [{
      id: `export.${stem}.frames`,
      kind: "frame-sequence",
      artifactId: `artifact.${stem}.frames`
    }],
    dashboard: {
      rowId: `animation-${stem}`,
      tags: ["animation", "equation", "fraction", "split", ...(includeMerge ? ["merge"] : []), "exemplar"],
      sourceRefIds: [source.sourceTraceId]
    },
    presentationProfile: createKpContinuityEquationPresentationProfileV1({
      nativeHandoff: "atomic-v1",
      depth: "semantic-depth-v1",
      continuants: "transit-then-reflow-v1"
    }),
    metadata: { sourceTraceId: source.sourceTraceId }
  });
}

function selectorByRole(
  source: NumeratorSplitMergeEquationKpAsset,
  objectId: string,
  role: string
): string {
  const matches = selectorsByRole(source, objectId, role);
  if (matches.length !== 1) {
    throw new Error(
      `Numerator split/merge ${objectId} requires one ${role} selector.`
    );
  }
  return matches[0]!;
}

function selectorsByRole(
  source: NumeratorSplitMergeEquationKpAsset,
  objectId: string,
  role: string
): readonly string[] {
  const object = source.bundle.objects.find(({ id }) => id === objectId);
  if (object === undefined) {
    throw new Error(`Numerator split/merge is missing object ${objectId}.`);
  }
  return object.selectors
    .filter(({ metadata }) => metadata?.["equationStructureRole"] === role)
    .map(({ id }) => id);
}

function selectorsByRolesInObjectOrder(
  source: NumeratorSplitMergeEquationKpAsset,
  objectId: string,
  roles: readonly string[]
): readonly string[] {
  const object = source.bundle.objects.find(({ id }) => id === objectId);
  if (object === undefined) {
    throw new Error(`Numerator split/merge is missing object ${objectId}.`);
  }
  return object.selectors
    .filter(({ metadata }) => {
      const role = metadata?.["equationStructureRole"];
      return typeof role === "string" && roles.includes(role);
    })
    .map(({ id }) => id);
}
