import {
  createKpAnimationAsset,
  type KpAnimationAsset
} from "./asset.ts";
import {
  createKpSemanticMaterialEquationPresentationProfileV1
} from "./equation-presentation-profile.ts";
import {
  createKpWitnessedAnnihilationBinding
} from "./witnessed-annihilation.ts";
import { createSemanticTransformationRef } from "../semantic/animation.ts";
import {
  kpCanonicalCancellationPressureContract
} from "../semantic/cancellation-pressure-contract.ts";
import {
  getGeneratedLinearSolveTutorialFixtureSpec
} from "../semantic/generated-algebra-fixture-registry.ts";
import {
  createGeneratedLinearSolveTutorialFixture
} from "../semantic/generated-algebra-tutorial-fixture.ts";
import {
  createEditableSemanticTransformationTree,
  createSemanticTransformationLeaf
} from "../semantic/transformation-composition.ts";

const contract = kpCanonicalCancellationPressureContract;
export interface KpCancellationPressureTimelinePolicy {
  readonly durationMs: number;
  readonly beatCount: number;
}

export const kpCanonicalCancellationPressureTimelinePolicy = Object.freeze({
  durationMs: 4_800,
  beatCount: 96
} satisfies KpCancellationPressureTimelinePolicy);
const fixtureSpec = getGeneratedLinearSolveTutorialFixtureSpec(
  contract.fixtureId
);
if (fixtureSpec === undefined) {
  throw new Error(`Missing cancellation pressure fixture ${contract.fixtureId}.`);
}
const fixture = createGeneratedLinearSolveTutorialFixture(fixtureSpec);
const transformation = requiredCancellationTransformation();

/**
 * The pressure binding adds no motion vocabulary. It proves that the existing
 * witnessed-annihilation runtime is consuming the exact typed cancellation
 * relation and zero-witness slot selected by the semantic contract.
 */
export const kpCanonicalCancellationPressureBinding = Object.freeze(
  createKpWitnessedAnnihilationBinding({
    operationId: contract.operationId,
    transformation,
    bundle: fixture.bundle,
    cancellationRecordId: contract.inversePair.correspondenceRecordId,
    slotId: contract.witness.slot.id
  })
);

export function createKpCanonicalCancellationPressureAnimationAsset():
KpAnimationAsset {
  const root = createSemanticTransformationLeaf(
    createSemanticTransformationRef({
      id: transformation.id,
      kind: transformation.transformType,
      sourceObjectIds: transformation.sourceObjectIds,
      targetObjectIds: transformation.targetObjectIds,
      preserves: transformation.preserves,
      summary: transformation.title
    })
  );
  const timelineId = `timeline.${contract.animationId}`;
  const renderTargetId = "render.generated.cancellation.additive-inverses.equation";
  const selectorIds = [...contract.source.selectorIds, ...contract.target.selectorIds];

  return createKpAnimationAsset({
    id: contract.animationId,
    title: "Cancel an additive inverse pair",
    bundle: fixture.bundle,
    transformations: [transformation],
    transformationTree: createEditableSemanticTransformationTree({ root }),
    timeline: {
      id: timelineId,
      ...kpCanonicalCancellationPressureTimelinePolicy,
      markerIds: [transformation.id]
    },
    layout: {
      id: "layout.generated.cancellation.additive-inverses",
      kind: "single",
      targetId: renderTargetId
    },
    renderTargets: [{
      id: renderTargetId,
      kind: "equation",
      objectIds: [contract.source.objectId, contract.target.objectId],
      selectorIds,
      transformationIds: [transformation.id],
      timelineId,
      summary:
        "Compress the authored inverse pair into zero, then compact only its semantic survivors."
    }],
    checks: [{
      id: "check.generated.cancellation.additive-inverses.reference-closure",
      lawId: "animation.reference-closure",
      level: "strict",
      targetId: contract.animationId
    }, {
      id: "check.generated.cancellation.additive-inverses.seek-rewind",
      lawId: "animation.seek-rewind",
      level: "strict",
      targetId: root.id
    }],
    exportTargets: [{
      id: "export.generated.cancellation.additive-inverses.frames",
      kind: "frame-sequence",
      artifactId: "artifact.generated.cancellation.additive-inverses.frames"
    }],
    dashboard: {
      rowId: "animation-generated-cancellation-additive-inverses",
      tags: [
        "algebra",
        "animation",
        "cancellation",
        "equation",
        "generated",
        "katex"
      ],
      sourceRefIds: [contract.fixtureId, fixture.trace.id]
    },
    presentationProfile:
      createKpSemanticMaterialEquationPresentationProfileV1(),
    metadata: {
      sourceFixtureId: contract.fixtureId,
      sourceFixtureFamilyId: fixture.familyId,
      sourceTraceId: fixture.trace.id,
      operationId: contract.operationId,
      cancellationPressureContractId: contract.id,
      settledEndpointAuthority: "native-katex"
    }
  });
}

function requiredCancellationTransformation() {
  const candidate = fixture.transformations.find(
    ({ id }) => id === contract.transformationId
  );
  if (candidate === undefined) {
    throw new Error(
      `Missing cancellation transformation ${contract.transformationId}.`
    );
  }
  return candidate;
}
