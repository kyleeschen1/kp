import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpPlaceValueAdditionPresentationPlan,
  isKpPlaceValueAdditionPresentationPlan,
  isKpPlaceValuePresentationProgram,
  resolveKpPlaceValueAdditionPresentation,
  type KpPlaceValueAdditionPresentationBeat,
  type KpPlaceValueAdditionPresentationPlan,
  type KpPlaceValuePresentationProgram
} from "../src/animation/place-value-addition-presentation-plan.ts";
import {
  kpIdentityFissionExecutableProgram
} from "../src/animation/motifs/identity-fission-executable-program.ts";
import {
  kpOperationEvaluationExecutableProgramCompiler
} from "../src/animation/operation-evaluation-presentation-registry.ts";
import {
  kpPlaceValueAdditionTrace
} from "../src/semantic/place-value-addition-trace.ts";

test("every trace beat receives one exhaustive nominal presentation", () => {
  const plan = createKpPlaceValueAdditionPresentationPlan();
  assert.deepEqual(
    plan.beats.map(({ beatId }) => beatId),
    kpPlaceValueAdditionTrace.beats.map(({ id }) => id)
  );
  assert.deepEqual(
    plan.beats.map(({ kind }) => kind),
    [
      "establish",
      "evaluate",
      "exchange-and-carry",
      "evaluate",
      "exchange-and-carry",
      "evaluate",
      "settle"
    ]
  );
  assert.deepEqual(plan.programVocabulary, [
    "operation-evaluation",
    "adjacent-place-exchange",
    "carry-split",
    "persistent-translation",
    "native-settlement"
  ]);
  assert.equal(plan.fallbackPolicy, "reject-animation");
  assert.ok(isKpPlaceValueAdditionPresentationPlan(plan));
  assert.ok(
    allPrograms(plan)
      .every(isKpPlaceValuePresentationProgram)
  );
});

test("column evaluation reuses the canonical executable program and plus catalyst", () => {
  const evaluations = allPrograms(
    createKpPlaceValueAdditionPresentationPlan()
  ).filter(
    (program): program is Extract<
      KpPlaceValuePresentationProgram,
      { readonly kind: "operation-evaluation" }
    > => program.kind === "operation-evaluation"
  );
  assert.deepEqual(
    evaluations.map(({ expression }) => expression),
    ["8 + 6 = 14", "1 + 7 + 5 = 13", "1 + 2 + 1 = 4"]
  );
  assert.deepEqual(
    evaluations.map(({ contributorIds }) => contributorIds),
    [
      ["digit.first.ones", "digit.second.ones"],
      ["carry.tens", "digit.first.tens", "digit.second.tens"],
      ["carry.hundreds", "digit.first.hundreds", "digit.second.hundreds"]
    ]
  );
  assert.ok(evaluations.every(
    ({ catalystId }) => catalystId === "operator.add"
  ));
  assert.ok(evaluations.every(
    ({ executableProgram }) =>
      executableProgram ===
        kpOperationEvaluationExecutableProgramCompiler.program
  ));
});

test("exchange presentation requires proof plus an opaque fission carry split", () => {
  const exchanges = createKpPlaceValueAdditionPresentationPlan().beats.filter(
    (beat): beat is Extract<
      KpPlaceValueAdditionPresentationBeat,
      { readonly kind: "exchange-and-carry" }
    > => beat.kind === "exchange-and-carry"
  );
  assert.equal(exchanges.length, 2);
  for (const beat of exchanges) {
    const [exchange, split, persistence] = beat.programs;
    assert.equal(exchange.kind, "adjacent-place-exchange");
    assert.equal(exchange.role, "conservation-proof");
    assert.equal(split.kind, "carry-split");
    assert.equal(split.executableProgram, kpIdentityFissionExecutableProgram);
    assert.equal(split.opacityPolicy, "opaque");
    assert.equal(persistence.kind, "persistent-translation");
    assert.equal(persistence.identityPolicy, "same-entity-continuous");
  }
  assert.deepEqual(
    exchanges.map(({ programs }) => {
      const split = programs[1];
      return [split.sourceEvaluationId, split.remainderId, split.carryId];
    }),
    [
      ["evaluation.ones.total", "result.ones", "carry.tens"],
      ["evaluation.tens.total", "result.tens", "carry.hundreds"]
    ]
  );
  assert.ok(exchanges.every(
    ({ programs }) => programs[2].entityIds.includes("operator.add")
  ));
});

test("native settlement retains native endpoint ownership and no first-frame handoff", () => {
  const settlement = createKpPlaceValueAdditionPresentationPlan().beats[6];
  if (settlement?.kind !== "settle") {
    throw new Error("Expected final settlement presentation.");
  }
  const [native, persistence] = settlement.programs;
  assert.equal(native.kind, "native-settlement");
  assert.deepEqual(native.sourceEntityIds, [
    "result.hundreds",
    "result.tens",
    "result.ones"
  ]);
  assert.equal(native.targetEntityId, "result");
  assert.equal(native.endpointOwner, "native-katex");
  assert.equal(native.handoffPolicy, "same-paint-root-no-first-frame");
  assert.equal(persistence.kind, "persistent-translation");
});

test("unverified traces become explicit static checkpoints, never animation fallback", () => {
  const copiedTrace = { ...kpPlaceValueAdditionTrace };
  const resolution = resolveKpPlaceValueAdditionPresentation(copiedTrace);
  assert.equal(resolution.kind, "explicit-static");
  if (resolution.kind !== "explicit-static") {
    return;
  }
  assert.equal(resolution.checkpoint.kind, "explicit-static-checkpoint");
  assert.equal(resolution.checkpoint.reason, "missing-verified-plan");
  assert.throws(
    () => createKpPlaceValueAdditionPresentationPlan(
      copiedTrace as typeof kpPlaceValueAdditionTrace
    ),
    /compiler-owned trace/
  );
  const serialized = JSON.stringify(resolution);
  assert.equal(serialized.includes("fallback"), false);
  assert.equal(serialized.includes("opacity"), false);
});

test("presentation authority cannot be copied and contains no geometry or fade path", () => {
  const plan = createKpPlaceValueAdditionPresentationPlan();
  assert.equal(
    isKpPlaceValueAdditionPresentationPlan({ ...plan }),
    false
  );
  const program = plan.beats[1]!.programs[0];
  assert.equal(isKpPlaceValuePresentationProgram({ ...program }), false);
  const serialized = JSON.stringify(
    plan,
    (_key, value) => typeof value === "bigint" ? value.toString() : value
  );
  for (const forbidden of [
    "leftPx",
    "topPx",
    "translateX",
    "translateY",
    "durationMs",
    "fade",
    "generic-fallback",
    "whole-expression"
  ]) {
    assert.equal(serialized.includes(forbidden), false, forbidden);
  }
  assert.ok(
    allPrograms(plan)
      .every(({ scheduler, opacityPolicy }) =>
        scheduler === "shared-canonical-beat" &&
        opacityPolicy === "opaque"
      )
  );
});

function allPrograms(
  plan: KpPlaceValueAdditionPresentationPlan
): readonly KpPlaceValuePresentationProgram[] {
  const programs: KpPlaceValuePresentationProgram[] = [];
  for (const beat of plan.beats) {
    programs.push(...beat.programs);
  }
  return programs;
}
