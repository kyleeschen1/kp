import type { KpAnimationAsset } from "./asset.ts";
import {
  createKpMaterialContinuityPlan,
  type KpMaterialContinuityPlan,
  type KpMaterialFragment
} from "./material-continuity.ts";
import { resolveKpRadicalFragmentSemantics } from "../semantic/radical-fragment-semantics.ts";

export interface KpRadicalMaterialContinuity {
  readonly plan: KpMaterialContinuityPlan;
  readonly baseContinuantId: string;
  readonly notationContinuantId: string;
  readonly bundleId: string;
}

export function createKpRadicalMaterialContinuity(
  animation: KpAnimationAsset
): KpRadicalMaterialContinuity {
  const transformation = animation.transformations.find(
    (candidate) => candidate.transformType === "rewritePowerAsRoot"
  );
  const base = transformation?.correspondenceMap?.records.find(
    (record) => record.id === "base-becomes-radicand"
  );
  if (transformation === undefined || base === undefined) {
    throw new Error(`Animation ${animation.id} lacks radical material correspondence.`);
  }
  const semantics = resolveKpRadicalFragmentSemantics(transformation);
  const sourceNotationIds = semantics.notationRecords.flatMap(
    (record) => record.sourceSelectorIds
  );
  const targetNotationIds = semantics.notationRecords.flatMap(
    (record) => record.targetSelectorIds
  );
  const baseContinuantId = `material.${transformation.id}.base`;
  const notationContinuantId = `material.${transformation.id}.root-notation`;
  const fragments: readonly KpMaterialFragment[] = [
    fragment(
      `${notationContinuantId}.numerator`,
      notationContinuantId,
      "numerator",
      semantics.source.numeratorSelectorId,
      0
    ),
    fragment(
      `${notationContinuantId}.fraction-rule`,
      notationContinuantId,
      "fraction-rule",
      semantics.source.fractionRuleSelectorId,
      1
    ),
    fragment(
      `${notationContinuantId}.denominator`,
      notationContinuantId,
      "denominator",
      semantics.source.denominatorSelectorId,
      2
    ),
    {
      id: `${notationContinuantId}.radical-hook`,
      materialContinuantId: notationContinuantId,
      role: "radical-hook",
      sourceMotionIds: [],
      targetMotionIds: [semantics.target.hookSelectorId],
      normalizedRegion: { x: 0, y: 0, width: 0.42, height: 1 },
      propagationRank: 0,
      semanticAuthority: false
    },
    {
      id: `${notationContinuantId}.radical-overbar`,
      materialContinuantId: notationContinuantId,
      role: "radical-overbar",
      sourceMotionIds: [],
      targetMotionIds: [semantics.target.overbarSelectorId],
      normalizedRegion: { x: 0.28, y: 0, width: 0.72, height: 0.34 },
      propagationRank: 1,
      semanticAuthority: false
    }
  ];
  const bundleId = `bundle.${transformation.id}.root-notation`;
  return {
    baseContinuantId,
    notationContinuantId,
    bundleId,
    plan: createKpMaterialContinuityPlan({
      id: `material-continuity.${transformation.id}`,
      materialContinuants: [
        {
          id: baseContinuantId,
          authority: {
            kind: "semantic-continuant",
            continuantId: `${transformation.id}.base-continuant`
          },
          semanticEntityIds: [
            ...base.sourceSelectorIds,
            ...base.targetSelectorIds
          ],
          sourceMotionIds: [...base.sourceSelectorIds],
          targetMotionIds: [...base.targetSelectorIds],
          ownership: "stable-owner",
          preserveThrough: [
            "movement",
            "seek",
            "rewind",
            "renderer-handoff"
          ]
        },
        {
          id: notationContinuantId,
          authority: {
            kind: "representational-lineage",
            lineageId: `${transformation.id}.root-notation-lineage`
          },
          semanticEntityIds: [
            ...sourceNotationIds,
            ...targetNotationIds
          ],
          sourceMotionIds: [...sourceNotationIds],
          targetMotionIds: [...targetNotationIds],
          ownership: "shared-reconciliation",
          preserveThrough: ["movement", "seek", "rewind", "renderer-handoff"]
        }
      ],
      fragments,
      bundles: [{
        id: bundleId,
        materialContinuantId: notationContinuantId,
        sourceFragmentIds: fragments
          .filter((candidate) => candidate.sourceMotionIds.length > 0)
          .map((candidate) => candidate.id),
        targetFragmentIds: fragments
          .filter((candidate) => candidate.targetMotionIds.length > 0)
          .map((candidate) => candidate.id),
        reconciliation: "shared-region",
        nativeSettlementRequired: true
      }],
      envelopeBridges: []
    })
  };
}

function fragment(
  id: string,
  materialContinuantId: string,
  role: "numerator" | "fraction-rule" | "denominator",
  sourceMotionId: string,
  propagationRank: number
): KpMaterialFragment {
  return {
    id,
    materialContinuantId,
    role,
    sourceMotionIds: [sourceMotionId],
    targetMotionIds: [],
    propagationRank,
    semanticAuthority: false
  };
}
