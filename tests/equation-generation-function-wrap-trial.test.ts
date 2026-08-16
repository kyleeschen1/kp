import assert from "node:assert/strict";
import test from "node:test";

import {
  checkKpAnimationAssetReferenceClosure,
  checkKpAnimationAssetSeekRewindLaw
} from "../src/animation/asset.ts";
import { createFunctionWrapAnimationAsset } from
  "../src/animation/function-wrap-adapter.ts";
import { requireKpFunctionWrapAssetBinding } from
  "../src/animation/function-wrap-asset-binding.ts";
import {
  kpEquationGenerationPressureFixtures
} from "../src/authoring/equation-generation-pressure-contract.ts";
import {
  validateKpEquationLlmEntityClosure,
  validateKpEquationLlmAuthoringRequest,
  type KpEquationLlmAuthoringRequest
} from "../src/authoring/equation-llm-authoring-catalogue.ts";
import { isKpCompiledMotifPlan } from
  "../src/domain-ir/equation-motif-invocation.ts";

const fixture = kpEquationGenerationPressureFixtures.find(
  ({ scenario }) => scenario === "function-wrap"
)!;
const animation = createFunctionWrapAnimationAsset();
const binding = requireKpFunctionWrapAssetBinding(animation);

test("function-wrap first pass exposes unresolved entity ids before compilation", () => {
  assert.equal(
    validateKpEquationLlmAuthoringRequest(fixture.request).status,
    "accepted"
  );
  assert.deepEqual(validateKpEquationLlmEntityClosure({
    request: fixture.request,
    availableEntityIds: animation.bundle.objects.flatMap(
      ({ selectors }) => selectors.map(({ id }) => id)
    )
  }).map(({ entityId }) => entityId),
    [
      "source.argument.x",
      "target.argument.x",
      "target.function.f",
      "target.enclosure.open",
      "target.enclosure.close"
    ]
  );
});

test("one semantic-id repair reaches the existing compiler authority", () => {
  const repairedRequest = functionWrapRequestWithCanonicalEntityIds();

  assert.equal(
    validateKpEquationLlmAuthoringRequest(repairedRequest).status,
    "accepted"
  );
  assert.deepEqual(validateKpEquationLlmEntityClosure({
    request: repairedRequest,
    availableEntityIds: animation.bundle.objects.flatMap(({ selectors }) =>
      selectors.map(({ id }) => id)
    )
  }), []);
  assert.deepEqual(repairedRequest.operation.roleBindings, {
    "content-before": binding.sourceArgumentEntityIds,
    "content-after": binding.targetArgumentEntityIds,
    wrapper: binding.wrapperEntityIds
  });
  assert.equal(isKpCompiledMotifPlan(binding.compiledMotifPlan), true);
  assert.equal(binding.assetId, fixture.request.animationId);
});

test("the repaired request preserves native endpoints and deterministic seek", () => {
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

function functionWrapRequestWithCanonicalEntityIds():
  KpEquationLlmAuthoringRequest {
  return {
    ...fixture.request,
    operation: {
      ...fixture.request.operation,
      roleBindings: {
        "content-before": binding.sourceArgumentEntityIds,
        "content-after": binding.targetArgumentEntityIds,
        wrapper: binding.wrapperEntityIds
      }
    }
  };
}
