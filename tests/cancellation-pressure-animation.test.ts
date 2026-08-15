import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpCanonicalCancellationPressureAnimationAsset,
  kpCanonicalCancellationPressureBinding
} from "../src/animation/cancellation-pressure-animation.ts";
import {
  createKpWitnessedAnnihilationPlan,
  kpWitnessedAnnihilationMotionProfileV1,
  sampleKpWitnessedAnnihilation
} from "../src/animation/witnessed-annihilation.ts";
import { kpAnimationCatalogPackId } from
  "../src/animation/catalog-loader.ts";
import {
  kpCanonicalCancellationPressureContract
} from "../src/semantic/cancellation-pressure-contract.ts";
import {
  isKpCompilerGeneratedAlgebraTransformation
} from "../src/semantic/generated-algebra-transformation-authority.ts";
import {
  createKpGeneratedLinearSolveSelectorAnnotatedLatex
} from "../src/rendering/generated-linear-solve-selector-annotated-latex.ts";

const cancellationTestGeometry = Object.freeze({
  cancellationSource: {
    initialLeftPx: 120,
    inlineGapPx: 64,
    topPx: 80,
    widthPx: 36,
    heightPx: 40
  },
  survivorSource: {
    initialLeftPx: 20,
    inlineGapPx: 45,
    topPx: 80,
    widthPx: 30,
    heightPx: 40
  },
  survivorTarget: {
    initialLeftPx: 20,
    inlineGapPx: 37,
    topPx: 80,
    widthPx: 30,
    heightPx: 40
  }
});

test("the cancellation animation binds the exact inverse pair and zero witness", () => {
  const binding = kpCanonicalCancellationPressureBinding;
  const contract = kpCanonicalCancellationPressureContract;

  assert.equal(binding.relationRecordId, contract.inversePair.correspondenceRecordId);
  assert.deepEqual(
    binding.sources.map(({ id }) => id),
    contract.inversePair.sourceSelectorIds
  );
  assert.equal(binding.witness.id, contract.witness.id);
  assert.equal(binding.witness.semanticValue.latex, "0");
  assert.deepEqual(
    binding.survivorRecordIds,
    ["continuant-1", "continuant-2", "continuant-3", "continuant-4"]
  );
});

test("the isolated asset preserves compiler authority and native endpoints", () => {
  const asset = createKpCanonicalCancellationPressureAnimationAsset();
  const contract = kpCanonicalCancellationPressureContract;

  assert.equal(asset.id, contract.animationId);
  assert.equal(kpAnimationCatalogPackId(asset.id), "algebra");
  assert.equal(asset.transformations.length, 1);
  assert.ok(isKpCompilerGeneratedAlgebraTransformation(asset.transformations[0]));
  assert.deepEqual(asset.renderTargets[0]?.objectIds, [
    contract.source.objectId,
    contract.target.objectId
  ]);
  assert.equal(
    asset.presentationProfile?.payload.cancellation,
    "witnessed-annihilation-v1"
  );
  assert.equal(asset.presentationProfile?.payload.zeroWitness, "embedded-v1");
});

test("additive-only generated endpoints select their own KaTeX grammar", () => {
  const asset = createKpCanonicalCancellationPressureAnimationAsset();
  const contract = kpCanonicalCancellationPressureContract;
  const source = asset.bundle.objects.find(
    ({ id }) => id === contract.source.objectId
  );
  const target = asset.bundle.objects.find(
    ({ id }) => id === contract.target.objectId
  );
  assert.ok(source);
  assert.ok(target);

  const sourceLatex = createKpGeneratedLinearSolveSelectorAnnotatedLatex({
    objectId: source.id,
    selectors: source.selectors
  });
  const targetLatex = createKpGeneratedLinearSolveSelectorAnnotatedLatex({
    objectId: target.id,
    selectors: target.selectors
  });
  assert.ok(sourceLatex);
  assert.ok(targetLatex);
  assert.deepEqual(
    sourceLatex.annotations.map(({ selectorId }) => selectorId),
    contract.source.selectorIds
  );
  assert.deepEqual(
    targetLatex.annotations.map(({ selectorId }) => selectorId),
    contract.target.selectorIds
  );
});

test("witnessed cancellation seeks deterministically through causal retirement", () => {
  const binding = kpCanonicalCancellationPressureBinding;
  const sourceGeometry = cancellationTestGeometry.cancellationSource;
  const sourceMeasurements = Object.fromEntries(
    binding.sources.map(({ id }, index) => [id, {
      left: sourceGeometry.initialLeftPx + index * sourceGeometry.inlineGapPx,
      top: sourceGeometry.topPx,
      width: sourceGeometry.widthPx,
      height: sourceGeometry.heightPx
    }])
  );
  const plan = createKpWitnessedAnnihilationPlan({
    id: `${binding.id}.pressure-plan`,
    witness: binding.witness,
    sources: binding.sources,
    measurements: sourceMeasurements,
    survivors: binding.survivorRecordIds.map((id, index) => ({
      id,
      sourceSelectorIds: [`source.${index}`],
      targetSelectorIds: [`target.${index}`],
      sourceRect: {
        left: cancellationTestGeometry.survivorSource.initialLeftPx +
          index * cancellationTestGeometry.survivorSource.inlineGapPx,
        top: cancellationTestGeometry.survivorSource.topPx,
        width: cancellationTestGeometry.survivorSource.widthPx,
        height: cancellationTestGeometry.survivorSource.heightPx
      },
      targetRect: {
        left: cancellationTestGeometry.survivorTarget.initialLeftPx +
          index * cancellationTestGeometry.survivorTarget.inlineGapPx,
        top: cancellationTestGeometry.survivorTarget.topPx,
        width: cancellationTestGeometry.survivorTarget.widthPx,
        height: cancellationTestGeometry.survivorTarget.heightPx
      }
    }))
  });

  const timing = kpWitnessedAnnihilationMotionProfileV1.timing;
  const deterministicCheckpoints = [
    0,
    timing.contactStart,
    timing.contactEnd,
    timing.witnessReadableAt,
    timing.witnessDwellEnd,
    timing.witnessAbsorptionEnd,
    1
  ];
  for (const progress of deterministicCheckpoints) {
    assert.deepEqual(
      sampleKpWitnessedAnnihilation({ plan, progress }),
      sampleKpWitnessedAnnihilation({ plan, progress })
    );
  }

  const contact = sampleKpWitnessedAnnihilation({
    plan,
    progress: timing.contactEnd
  });
  assert.ok(contact.sources.every(({ pose }) => pose.opacity === 1));
  assert.equal(contact.witnessReadable, false);

  const readable = sampleKpWitnessedAnnihilation({
    plan,
    progress: midpoint(timing.witnessReadableAt, timing.witnessDwellEnd)
  });
  assert.equal(readable.phase, "witness-dwell");
  assert.equal(readable.witnessReadable, true);
  assert.ok(readable.witness.pose.opacity > 0);

  const settled = sampleKpWitnessedAnnihilation({ plan, progress: 1 });
  assert.equal(settled.phase, "settled");
  assert.ok(settled.sources.every(({ pose }) => pose.opacity === 0));
  assert.equal(settled.witness.pose.opacity, 0);
  assert.ok(settled.survivors.every(({ nativeOpacity }) => nativeOpacity === 1));
});

function midpoint(start: number, end: number): number {
  return start + (end - start) / 2;
}
