import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  projectKpFractionCompositionSalience,
  projectKpFractionCompositionSalienceScene
} from "../src/reader/app/fraction-composition-salience-adapter.ts";

test("fraction KaTeX projection resolves the whole endpoint scene", () => {
  const baseline = projectKpFractionCompositionSalience({
    stateId: "fraction-solve.state.factored",
    theme: "dark"
  });
  assert.ok(Object.keys(baseline.objects).length > 0);
  assert.ok(Object.values(baseline.objects).every(
    ({ salience }) => salience.state.level === "normal"
  ));

  const focused = projectKpFractionCompositionSalience({
    stateId: "fraction-solve.state.factored",
    theme: "dark",
    focusTargetIds: ["fraction-fan-out.source.factor.numerator"]
  });
  assert.equal(
    focused.objects["fraction-fan-out.source.factor.numerator"]?.salience.state.level,
    "focus"
  );
  assert.ok(Object.values(focused.objects).some(
    ({ salience }) => salience.state.level === "context"
  ));
});

test("envelopes and operations compile to native selector targets", () => {
  const envelope = projectKpFractionCompositionSalience({
    stateId: "fraction-solve.state.normalized",
    theme: "light",
    focusTargetIds: ["fraction-solve.state.normalized.left-side"]
  });
  assert.ok(Object.values(envelope.objects).some(
    ({ salience }) => salience.state.level === "focus"
  ));

  const operation = projectKpFractionCompositionSalience({
    stateId: "fraction-solve.state.normalized",
    theme: "light",
    focusTargetIds: ["fraction-solve.step.normalize"]
  });
  assert.equal(
    operation.objects["fraction-normalization.target.x.factor"]?.salience.state.level,
    "focus"
  );
  assert.throws(() => projectKpFractionCompositionSalience({
    stateId: "fraction-solve.state.normalized",
    theme: "light",
    focusTargetIds: ["not.a.semantic.target"]
  }), /not addressable/);
});

test("the DOM adapter binds authored wrappers without recompiling KaTeX", () => {
  const source = readFileSync(
    new URL(
      "../src/reader/app/fraction-composition-salience-adapter.ts",
      import.meta.url
    ),
    "utf8"
  );
  for (const forbidden of [
    "innerHTML", "outerHTML", "renderToString", "katex.render", "getBoundingClientRect"
  ]) {
    assert.equal(source.includes(forbidden), false, forbidden);
  }
  assert.match(source, /data-kp-reader-selector-id/);
  assert.match(source, /--kp-semantic-salience-color/);
});

test("scene projection hands focus from source to target deterministically", () => {
  const input = {
    theme: "light" as const,
    sourceStateId: "fraction-solve.state.distributed",
    targetStateId: "fraction-solve.state.normalized",
    operationIds: ["fraction-solve.step.normalize"]
  };
  const before = projectKpFractionCompositionSalienceScene({
    ...input,
    phaseProgress: 0.25
  });
  const after = projectKpFractionCompositionSalienceScene({
    ...input,
    phaseProgress: 0.75
  });
  const replay = projectKpFractionCompositionSalienceScene({
    ...input,
    phaseProgress: 0.75
  });

  assert.ok(Object.values(before.endpoints[0]!.objects).some(
    ({ salience }) => salience.state.level === "focus"
  ));
  assert.ok(Object.values(after.endpoints[1]!.objects).some(
    ({ salience }) => salience.state.level === "focus"
  ));
  assert.deepEqual(after, replay);
  const crossSurface = projectKpFractionCompositionSalienceScene({
    ...input,
    phaseProgress: 0.5,
    focusTargetIds: ["unknown.target"]
  });
  assert.deepEqual(crossSurface.focusTargetIds, input.operationIds);
});
