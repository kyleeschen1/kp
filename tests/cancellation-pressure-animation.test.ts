import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpCanonicalCancellationPressureAnimationAsset,
  kpCanonicalCancellationPressurePresentation
} from "../src/animation/cancellation-pressure-animation.ts";
import {
  kpAlgebraChoreographyCapabilities
} from "../src/animation/algebra-choreography-capabilities.ts";
import {
  compileKpEquationCancellationPresentationPlan
} from "../src/animation/equation-cancellation-presentation.ts";
import { kpAnimationCatalogPackId } from
  "../src/animation/catalog-loader.ts";
import {
  kpCanonicalCancellationPressureContract
} from "../src/semantic/cancellation-pressure-contract.ts";
import {
  kpCanonicalCompiledCancellationPressureSemanticMotion,
  kpCanonicalCancellationPressureSemanticMotionSource
} from "../src/semantic/cancellation-pressure-semantic-motion.ts";
import {
  isKpCompilerGeneratedAlgebraTransformation
} from "../src/semantic/generated-algebra-transformation-authority.ts";
import {
  createKpGeneratedLinearSolveSelectorAnnotatedLatex
} from "../src/rendering/generated-linear-solve-selector-annotated-latex.ts";
import {
  resolveKpCancellationPresentation
} from "../src/rendering/cancellation-presentation-resolver.ts";

test("the cancellation animation resolves preserve-flow intent to counter orbit", () => {
  const contract = kpCanonicalCancellationPressureContract;

  assert.equal(contract.presentation.intent.approach, "opposing-arcs");
  assert.equal(contract.presentation.intent.identityBeat, "implicit");
  assert.deepEqual(kpCanonicalCancellationPressurePresentation, {
    recipe: "counter-orbit-v1",
    topology: { sourceCount: 2, sourceBaselines: "shared" }
  });
  assert.deepEqual(resolveKpCancellationPresentation({
    intent: contract.presentation.intent,
    topology: kpCanonicalCancellationPressurePresentation.topology
  }), {
    kind: "resolved",
    recipe: kpCanonicalCancellationPressurePresentation.recipe
  });
});

test("the cancellation animation enters through compiler-minted semantic motion", () => {
  const choreography =
    kpCanonicalCompiledCancellationPressureSemanticMotion;
  const sample = kpAlgebraChoreographyCapabilities.semanticMotion
    .sampleForAnimationId({
      animationId: kpCanonicalCancellationPressureContract.animationId,
      progress: 0.68,
      direction: "forward"
    });

  assert.equal(
    choreography.recipeId,
    "recipe.semantic-motion.inverse-cancellation.v1"
  );
  assert.equal(choreography.clockCoupling, "external-shared-progress");
  assert.deepEqual(
    choreography.tracks.map(({ eventKind }) => eventKind),
    ["orient", "contact", "retirement", "settlement", "native-target-ready"]
  );
  assert.equal(sample?.choreographyId, choreography.id);
  assert.equal(sample?.semanticProgress, 0.68);
  assert.deepEqual(
    kpCanonicalCancellationPressureSemanticMotionSource.assetIds,
    [kpCanonicalCancellationPressureContract.animationId]
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
    "counter-orbit-v1"
  );
  assert.equal(asset.presentationProfile?.payload.zeroWitness, "none");
  assert.equal(
    compileKpEquationCancellationPresentationPlan(asset.transformations[0]!)
      ?.planKind,
    "inverse-cancellation"
  );
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
