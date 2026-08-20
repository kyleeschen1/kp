import assert from "node:assert/strict";
import test from "node:test";
import katex from "katex";

import {
  kpNativeKatexContextMutationCanaryManifest,
  kpNativeKatexContextMutationCanaryPlan,
  kpNativeKatexContextMutationRegistry,
  kpNativeKatexContextMutations
} from "./fixtures/native-katex-compositor-conformance-context-mutations.ts";
import {
  kpNativeKatexCompositorConformanceBudget
} from "./support/native-katex-compositor-conformance-budget.ts";
import {
  createKpNativeKatexContextMutationDescriptor,
  createKpNativeKatexContextMutationRegistry
} from "./support/native-katex-compositor-context-mutation.ts";

const expectedMutations = Object.freeze([
  ["context.sibling.shorter", "sibling-length"],
  ["context.sibling.longer", "sibling-length"],
  ["context.sibling.taller", "sibling-height"],
  ["context.grouping.parenthesized", "grouping"],
  ["context.math-style.display-to-script", "math-style"]
] as const);

test("describes context changes while preserving one carrier", () => {
  assert.deepEqual(
    kpNativeKatexContextMutations.map(({ id, mutationClass }) => [
      id,
      mutationClass
    ]),
    expectedMutations
  );
  assert.equal(kpNativeKatexContextMutationRegistry.descriptors.length, 5);

  for (const descriptor of kpNativeKatexContextMutations) {
    assert.equal(
      kpNativeKatexContextMutationRegistry.byId.get(descriptor.id),
      descriptor
    );
    assert.notEqual(descriptor.sourceLatex, descriptor.targetLatex);
    assert.ok(descriptor.sourceLatex.includes(descriptor.persistentCarrierLatex));
    assert.ok(descriptor.targetLatex.includes(descriptor.persistentCarrierLatex));
    assert.doesNotThrow(() => katex.renderToString(descriptor.sourceLatex, {
      throwOnError: true
    }));
    assert.doesNotThrow(() => katex.renderToString(descriptor.targetLatex, {
      throwOnError: true
    }));
  }
});

test("routes every mutation through one bounded pairwise canary", () => {
  assert.ok(
    kpNativeKatexContextMutationCanaryPlan.scenarios.length <=
      kpNativeKatexCompositorConformanceBudget.hard
        .fastCanaryMaximumScenarios
  );
  assert.equal(kpNativeKatexContextMutationCanaryManifest.coverageComplete, true);
  assert.equal(
    kpNativeKatexContextMutationCanaryManifest.counts.scenarios,
    kpNativeKatexContextMutationCanaryPlan.scenarios.length
  );

  const selectedMutationIds = new Set(
    kpNativeKatexContextMutationCanaryPlan.scenarios.map(
      ({ assignments }) => assignments["contextMutation"]
    )
  );
  assert.deepEqual(
    [...selectedMutationIds].sort(),
    kpNativeKatexContextMutations.map(({ id }) => id).sort()
  );
});

test("keeps the script-style compound risk explicit in the manifest", () => {
  const riskScenario = kpNativeKatexContextMutationCanaryManifest.scenarios
    .find(({ overrideIds }) =>
      overrideIds.includes("risk.script-math-style-compound")
    );

  assert.ok(riskScenario);
  assert.equal(riskScenario.inclusionKind, "three-way-override");
  assert.deepEqual(riskScenario.assignments, {
    shapeRisk: "script",
    contextMutation: "context.math-style.display-to-script",
    topology: "compound-owner",
    lifecycle: "direct-seek",
    renderingMode: "dark"
  });
});

test("rejects mutations that lose their carrier or duplicate identity", () => {
  const valid = createKpNativeKatexContextMutationDescriptor({
    id: "context.test.valid",
    label: "valid test mutation",
    mutationClass: "grouping",
    sourceLatex: "x+y",
    targetLatex: "x+(y)",
    persistentCarrierLatex: "x"
  });

  assert.throws(() => createKpNativeKatexContextMutationDescriptor({
    ...valid,
    id: "context.test.lost-carrier",
    targetLatex: "z+(y)"
  }), /must preserve its named carrier/u);
  assert.throws(() => createKpNativeKatexContextMutationDescriptor({
    ...valid,
    id: "context.test.unchanged",
    targetLatex: valid.sourceLatex
  }), /must change its surrounding context/u);
  assert.throws(() => createKpNativeKatexContextMutationRegistry([
    valid,
    valid
  ]), /IDs must be unique/u);
});
