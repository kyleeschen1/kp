import assert from "node:assert/strict";
import test from "node:test";

import {
  kpOpaqueIdentityTransferOwnershipProgress
} from "../src/animation/successor-synthesis.ts";
import {
  createKpPlaceValueAdditionRuntimeSession
} from "../src/rendering/place-value-addition-runtime.ts";
import {
  isKpNativeKatexIdentityTransferIntent
} from "../src/rendering/native-katex-successor-synthesis.ts";
import {
  compileKpPlaceValueOnesExchange,
  isKpPlaceValueOnesExchange
} from "../src/rendering/place-value-addition-ones-exchange.ts";

test("ones exchange reuses exact carry proof and identity-fission program", () => {
  const session = createKpPlaceValueAdditionRuntimeSession();
  const exchange = session.onesExchange;
  assert.equal(
    exchange.intent.binding.layoutTopology,
    "separate-source-result-bands"
  );
  const beat = session.foundation.presentation.beats.find(
    ({ beatId }) => beatId === exchange.beatId
  );
  const carrySplit = beat?.programs.find(
    ({ kind }) => kind === "carry-split"
  );

  assert.equal(isKpPlaceValueOnesExchange(exchange), true);
  assert.equal(carrySplit?.kind, "carry-split");
  assert.equal(exchange.forward.programId, carrySplit?.executableProgram.id);
  assert.equal(exchange.rewind.programId, carrySplit?.executableProgram.id);
  assert.equal(exchange.forward.route.primitiveRoute, "fission-fusion:fission");
  assert.equal(exchange.opacityPolicy, "opaque");
  assert.equal(
    exchange.transferProgress,
    kpOpaqueIdentityTransferOwnershipProgress
  );
});

test("one evaluated identity splits into exact remainder and carry", () => {
  const { onesExchange: exchange } =
    createKpPlaceValueAdditionRuntimeSession();
  const binding = exchange.intent.binding;
  const material = binding.sourceAnnotations.filter(
    ({ contribution }) => contribution === "material-input"
  );

  assert.deepEqual(exchange.fissionPlan.sourceEntityIds, [
    "evaluation.ones.total"
  ]);
  assert.deepEqual(exchange.fissionPlan.targetEntityIds, [
    "result.ones",
    "carry.tens"
  ]);
  assert.equal(material.length, 1);
  assert.deepEqual(material[0]?.selectorIds, ["evaluation.ones.total"]);
  assert.deepEqual(
    binding.targetAnnotations.flatMap(({ selectorIds }) => selectorIds),
    ["result.ones", "carry.tens"]
  );
  assert.deepEqual(binding.lineages[0]?.sourceAnnotationIds, [
    "annotation.ones.evaluated-total"
  ]);
  assert.deepEqual(binding.lineages[0]?.targetAnnotationIds, [
    "annotation.ones.remainder",
    "annotation.ones.carry"
  ]);
});

test("native identity-transfer authority is nominal and copy-resistant", () => {
  const { intent } = createKpPlaceValueAdditionRuntimeSession().onesExchange;
  const copied = { ...intent };

  assert.equal(isKpNativeKatexIdentityTransferIntent(intent), true);
  assert.equal(isKpNativeKatexIdentityTransferIntent(copied), false);
});

test("forward and rewind expose inverse identity-fission phases", () => {
  const exchange = compileKpPlaceValueOnesExchange(
    createKpPlaceValueAdditionRuntimeSession().foundation.presentation
  );
  const forward = exchange.forward.samplePhaseTelemetry(0.5);
  const rewind = exchange.rewind.samplePhaseTelemetry(0.5);

  assert.deepEqual(
    exchange.rewind.phaseOrder,
    [...exchange.forward.phaseOrder].reverse()
  );
  assert.equal(forward.progress, rewind.progress);
  assert.equal(forward.direction, "forward");
  assert.equal(rewind.direction, "rewind");
});
