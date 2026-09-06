import assert from "node:assert/strict";
import test from "node:test";
import { createKpAuthoredDistributionModel } from "../src/experiments/authoring-structural/distribution-model.ts";
import { createKpLawfulFractionSolveMacro } from "../src/semantic/fraction-solve-macro.ts";
import { listKpStructuredExpressionSubtrees } from "../src/semantic/structured-expression.ts";
import { kpStateValue } from "../src/semantic-state/authoring-schema.ts";

test("distribution stores existing structured equation values without rebuilding identity", () => {
  const authored = createKpAuthoredDistributionModel("lesson.structural.storage");
  const current = authored.model.handles.pin(authored.model.initial).equation.read();
  const canonical = createKpLawfulFractionSolveMacro().states[0]!;
  assert.deepEqual(current, canonical);
  assert.deepEqual(listKpStructuredExpressionSubtrees(current.left).map(node => node.id),
    listKpStructuredExpressionSubtrees(canonical.left).map(node => node.id));
  assert.ok(Object.isFrozen(current));
  assert.ok(Object.isFrozen(current.left.root));
  assert.equal(authored.macro.verification.stateCount, 14);
  assert.equal(authored.macro.verification.stepCount, 13);
});

test("equation data survives JSON round-trip but does not become operation authority", () => {
  const authored = createKpAuthoredDistributionModel("lesson.structural.roundtrip");
  const current = authored.model.handles.pin(authored.model.initial).equation.read();
  const restored = kpStateValue(JSON.parse(JSON.stringify(current)));
  assert.deepEqual(restored.initialValue, current);
  assert.equal(Object.getOwnPropertySymbols(current).length, 0);
  assert.equal("verification" in current, false);
  assert.equal("latex" in current, false);
  assert.throws(() => kpStateValue({ ...current, accidentalCapability: () => current } as never));
});

test("two author models retain local aggregate identity without rewriting canonical equation IDs", () => {
  const first = createKpAuthoredDistributionModel("lesson.structural.first");
  const second = createKpAuthoredDistributionModel("lesson.structural.second");
  assert.notEqual(first.model.initial.id, second.model.initial.id);
  assert.deepEqual(first.model.handles.pin(first.model.initial).equation.read(),
    second.model.handles.pin(second.model.initial).equation.read());
});
