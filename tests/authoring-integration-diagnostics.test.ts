import assert from "node:assert/strict";
import test from "node:test";
import { captureKpSemanticStateAuthoring } from "../src/semantic-state/authoring-diagnostics.ts";
import { assembleKpSemanticStateModel } from "../src/semantic-state/authoring-model-assembly.ts";
import { defineKpSemanticStateModelFamily } from "../src/semantic-state/authoring-explanation-assembly.ts";
import { kpStateDerived, kpStateGroup, kpStateValue } from "../src/semantic-state/authoring-schema.ts";
import { evaluateKpSemanticDerivedValue } from "../src/semantic-state/derived-evaluator.ts";
import { kpStateFamilyParameters } from "../src/semantic-state/state-family-definition.ts";
import { declareKpSemanticStateInterpolation } from "../src/semantic-state/state-family-transition.ts";
import { KpSemanticStateFamilyApplicationValidationError } from
  "../src/semantic-state/state-family-application-validation.ts";

const sourcePath = "tests/authoring-integration-diagnostics.test.ts";
function model(namespace = "lesson.diagnostic", dependency: "a" | "b" = "a") {
  return assembleKpSemanticStateModel({ namespace,
    schema: kpStateGroup({ a: kpStateValue<number>(1), b: kpStateValue<number>(2), total: kpStateDerived<number>() }),
    derive: ({ refs, derive }) => [derive({ target: refs.total,
      dependencies: [refs[dependency]], compute: ([value]) => value })]
  });
}

test("missing declarations retain an exact author source and semantic target path", () => {
  const result = captureKpSemanticStateAuthoring({ sourcePath, declarationPath: ["model"] }, () =>
    assembleKpSemanticStateModel({ namespace: "lesson.missing-diagnostic",
      schema: kpStateGroup({ total: kpStateDerived<number>() }) }));
  assert.equal(result.kind, "repair-gap");
  if (result.kind !== "repair-gap") return;
  assert.equal(result.diagnostics[0]?.category, "missing");
  assert.equal(result.diagnostics[0]?.code, "missing-derived-definition");
  assert.equal(result.diagnostics[0]?.sourcePath, sourcePath);
  assert.deepEqual(result.diagnostics[0]?.targetPath, ["total"]);
  assert.deepEqual(result.diagnostics[0]?.declarationPath, ["model"]);
  assert.ok(result.diagnostics[0]?.sourceId);
  assert.equal("value" in result, false);
});

test("stale graph authority and foreign targets produce distinct typed repair categories", () => {
  const current = model();
  const changed = model("lesson.diagnostic", "b");
  const foreign = model("lesson.foreign-diagnostic");
  for (const [graph, target, category] of [
    [changed.graph, changed.handles.refs.total, "stale"],
    [current.graph, foreign.handles.refs.total, "foreign"]
  ] as const) {
    const result = captureKpSemanticStateAuthoring({ sourcePath, compiled: current.compiled,
      declarationPath: ["query", "total"] }, () => evaluateKpSemanticDerivedValue({
        graph, target, snapshot: current.initial
      }));
    assert.equal(result.kind, "repair-gap");
    if (result.kind !== "repair-gap") continue;
    assert.equal(result.diagnostics[0]?.category, category);
    assert.equal(result.diagnostics[0]?.sourcePath, sourcePath);
    assert.ok(result.cause instanceof Error);
  }
});

test("invalid operations map actual journal target slots without publishing partial state", () => {
  const current = model();
  const family = defineKpSemanticStateModelFamily(current, {
    id: "bad-write", sourceId: "test.bad-write", parameters: kpStateFamilyParameters<{ value: number }>(),
    transitions: builder => [builder.interpolate(declareKpSemanticStateInterpolation({
      id: "a", sourceId: "test.a", target: current.handles.refs.a
    }), ({ before }) => before)],
    author(parameters, state) { state.b.update(() => parameters.value); }
  });
  const result = captureKpSemanticStateAuthoring({ sourcePath, sourceId: "test.bad-write",
    declarationPath: ["families", "bad-write"], compiled: current.compiled }, () =>
    family.apply(current.initial, { applicationId: "bad", sourceId: "test.bad", parameters: { value: 9 } }));
  assert.equal(result.kind, "repair-gap");
  if (result.kind !== "repair-gap") return;
  assert.ok(result.cause instanceof KpSemanticStateFamilyApplicationValidationError);
  const undeclared = result.diagnostics.find(item => item.code === "undeclared-driver-write");
  assert.equal(undeclared?.category, "invalid-operation");
  assert.deepEqual(undeclared?.targetPath, ["b"]);
  assert.equal(undeclared?.sourceId, "test.bad-write");
  assert.deepEqual(undeclared?.declarationPath, ["families", "bad-write"]);
  assert.equal(current.handles.pin(current.initial).b.read(), 2);
  assert.equal("value" in result, false);
});

test("unknown failures preserve the primary cause instead of inventing repair authority", () => {
  const cause = new Error("unclassified author failure");
  const result = captureKpSemanticStateAuthoring({ sourcePath }, () => { throw cause; });
  assert.equal(result.kind, "repair-gap");
  if (result.kind !== "repair-gap") return;
  assert.equal(result.cause, cause);
  assert.equal(result.diagnostics[0]?.category, "unclassified");
  assert.equal(result.diagnostics[0]?.code, null);
  assert.equal(result.diagnostics[0]?.targetPath, null);
  const authored = captureKpSemanticStateAuthoring({ sourcePath }, () => 7);
  assert.deepEqual(authored, { kind: "authored", value: 7 });
});
