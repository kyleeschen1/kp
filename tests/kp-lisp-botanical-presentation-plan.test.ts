import assert from "node:assert/strict";
import test from "node:test";

import { createKpLispBotanicalPresentationPlan } from "../src/animation/lisp-botanical-presentation-plan.ts";
import { createKpLispLambdaApplicationAsset } from "../src/semantic/lisp-lambda-application-asset.ts";

test("botanical roles project exact semantic selectors", () => {
  const asset = createKpLispLambdaApplicationAsset();
  const plan = createKpLispBotanicalPresentationPlan(asset);
  const selectors = new Set(asset.bundle.objects.flatMap(({ selectors }) =>
    selectors.map(({ id }) => id)
  ));

  assert.equal(plan.status, "experimental-local");
  assert.ok(plan.nodes.every(({ selectorId }) => selectors.has(selectorId)));
  assert.deepEqual(plan.nodes.map(({ role }) => role), [
    "enclosure", "branch", "bud", "leaf", "bud", "root", "branch", "fruit"
  ]);
});

test("presentation paths account for every semantic material reason", () => {
  const asset = createKpLispLambdaApplicationAsset();
  const plan = createKpLispBotanicalPresentationPlan(asset);

  assert.deepEqual(
    new Set(plan.paths.flatMap(({ materialIds }) => materialIds)),
    new Set(asset.materialLedger.map(({ id }) => id))
  );
  assert.ok(plan.paths.every(({ semanticReason }) => semanticReason.length > 30));
});

test("plan keeps native code and reduced motion authoritative", () => {
  const plan = createKpLispBotanicalPresentationPlan(
    createKpLispLambdaApplicationAsset()
  );

  assert.equal(plan.settledAuthority, "native-code");
  assert.equal(plan.reducedMotion, "checkpoint-crossfade");
  assert.ok(Object.isFrozen(plan));
  assert.ok(Object.isFrozen(plan.paths));
});
