import assert from "node:assert/strict";
import test from "node:test";

import {
  checkKpAnimationAssetReferenceClosure,
  checkKpAnimationAssetSeekRewindLaw
} from "../src/animation/asset.ts";
import {
  createKpCanonicalCancellationPressureAnimationAsset
} from "../src/animation/cancellation-pressure-animation.ts";
import {
  compileKpEquationCancellationPresentationPlan
} from "../src/animation/equation-cancellation-presentation.ts";
import {
  kpEquationGenerationPressureFixtures
} from "../src/authoring/equation-generation-pressure-contract.ts";
import {
  validateKpEquationLlmEntityClosure,
  validateKpEquationLlmAuthoringRequest,
  type KpEquationLlmAuthoringRequest
} from "../src/authoring/equation-llm-authoring-catalogue.ts";
import {
  kpCanonicalCancellationPressureContract
} from "../src/semantic/cancellation-pressure-contract.ts";
import {
  kpCanonicalCompiledCancellationPressureSemanticMotion
} from "../src/semantic/cancellation-pressure-semantic-motion.ts";
import {
  isKpCompilerGeneratedAlgebraTransformation
} from "../src/semantic/generated-algebra-transformation-authority.ts";

const fixture = kpEquationGenerationPressureFixtures.find(
  ({ scenario }) => scenario === "cancellation"
)!;
const contract = kpCanonicalCancellationPressureContract;
const animation = createKpCanonicalCancellationPressureAnimationAsset();

test("cancellation first pass exposes unresolved semantic aliases", () => {
  assert.equal(
    validateKpEquationLlmAuthoringRequest(fixture.request).status,
    "accepted"
  );
  assert.deepEqual(validateKpEquationLlmEntityClosure({
    request: fixture.request,
    availableEntityIds: canonicalEntityIds()
  }).map(({ entityId }) => entityId), [
    "source.context.equation",
    "source.term.positive-three",
    "source.term.negative-three",
    "target.context.equation"
  ]);
});

test("one semantic-id repair binds only the authored inverse pair", () => {
  const repaired = cancellationRequestWithCanonicalEntityIds();

  assert.equal(validateKpEquationLlmAuthoringRequest(repaired).status, "accepted");
  assert.deepEqual(validateKpEquationLlmEntityClosure({
    request: repaired,
    availableEntityIds: canonicalEntityIds()
  }), []);
  assert.deepEqual(repaired.operation.roleBindings, {
    "context-before": [contract.source.objectId],
    "inverse-terms": contract.inversePair.sourceSelectorIds,
    "context-after": [contract.target.objectId]
  });
  const protectedRightInverse = contract.continuants.find(
    ({ role }) => role === "right-inverse"
  )!;
  assert.equal(
    repaired.operation.roleBindings["inverse-terms"]?.includes(
      protectedRightInverse.sourceSelectorId
    ),
    false
  );
});

test("the repaired request reaches witnessed annihilation without a fallback", () => {
  const transformation = animation.transformations[0]!;
  const presentation = compileKpEquationCancellationPresentationPlan(
    transformation
  );

  assert.equal(isKpCompilerGeneratedAlgebraTransformation(transformation), true);
  assert.equal(presentation?.planKind, "inverse-cancellation");
  assert.equal(
    kpCanonicalCompiledCancellationPressureSemanticMotion.recipeId,
    "recipe.semantic-motion.inverse-cancellation.v1"
  );
  assert.deepEqual(
    kpCanonicalCompiledCancellationPressureSemanticMotion.tracks.map(
      ({ eventKind }) => eventKind
    ),
    ["orient", "contact", "retirement", "settlement", "native-target-ready"]
  );
});

test("cancellation preserves native endpoints and deterministic seek", () => {
  assert.deepEqual(checkKpAnimationAssetReferenceClosure(animation), {
    lawId: "animation.reference-closure",
    passed: true,
    failures: []
  });
  assert.deepEqual(checkKpAnimationAssetSeekRewindLaw(animation), {
    lawId: "animation.seek-rewind",
    passed: true,
    failures: []
  });
});

function cancellationRequestWithCanonicalEntityIds():
  KpEquationLlmAuthoringRequest {
  return {
    ...fixture.request,
    operation: {
      ...fixture.request.operation,
      roleBindings: {
        "context-before": [contract.source.objectId],
        "inverse-terms": contract.inversePair.sourceSelectorIds,
        "context-after": [contract.target.objectId]
      }
    }
  };
}

function canonicalEntityIds(): readonly string[] {
  return animation.bundle.objects.flatMap((object) => [
    object.id,
    ...object.selectors.map(({ id }) => id)
  ]);
}
