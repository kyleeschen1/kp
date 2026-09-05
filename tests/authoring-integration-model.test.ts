import assert from "node:assert/strict";
import test from "node:test";
import { assembleKpSemanticStateModel } from
  "../src/semantic-state/authoring-model-assembly.ts";
import { kpStateDerived, kpStateGroup, kpStateValue } from
  "../src/semantic-state/authoring-schema.ts";
import { compileKpSemanticStateSchema } from
  "../src/semantic-state/authoring-schema-compiler.ts";
import { createKpSemanticStateHandleSet } from
  "../src/semantic-state/authoring-state-handles.ts";
import { defineKpSemanticStateDerivation } from
  "../src/semantic-state/authoring-derived-definition.ts";
import { materializeKpSemanticStateInitialSnapshot } from
  "../src/semantic-state/authoring-state-materializer.ts";
import { KpSemanticDerivedGraphValidationError } from
  "../src/semantic-state/derived-graph.ts";
import { evaluateKpSemanticDerivedValue } from
  "../src/semantic-state/derived-evaluator.ts";

test("model assembly preserves the existing immutable aggregate and inference", () => {
  const schema = kpStateGroup({
    input: kpStateGroup({ amount: kpStateValue(3), label: kpStateValue("units") }),
    doubled: kpStateDerived<number>(),
    summary: kpStateDerived<{ amount: number; label: string }>()
  });
  let calls = 0;
  const model = assembleKpSemanticStateModel({
    namespace: "lesson.assembly", schema,
    derive: ({ refs, derive }) => [
      derive({ target: refs.doubled, dependencies: [refs.input.amount],
        compute: ([amount]) => { calls++; return amount * 2; } }),
      derive({ target: refs.summary,
        dependencies: [refs.doubled, refs.input.label],
        compute: ([amount, label]) => ({ amount, label }) })
    ]
  });
  assert.equal(calls, 0);
  const compiled = compileKpSemanticStateSchema("lesson.assembly", schema);
  const refs = createKpSemanticStateHandleSet(compiled).refs;
  const derivations = [
    defineKpSemanticStateDerivation({ compiled, target: refs.doubled,
      dependencies: [refs.input.amount], compute: ([amount]) => amount * 2 }),
    defineKpSemanticStateDerivation({ compiled, target: refs.summary,
      dependencies: [refs.doubled, refs.input.label],
      compute: ([amount, label]) => ({ amount, label }) })
  ];
  assert.deepEqual(model.initial,
    materializeKpSemanticStateInitialSnapshot(compiled, { derivations }));
  assert.equal(model.handles.pin(model.initial).input.amount.read(), 3);
  const value = evaluateKpSemanticDerivedValue({
    graph: model.graph, snapshot: model.initial, target: model.handles.refs.summary
  });
  const inferred: Readonly<{ amount: number; label: string }> = value;
  assert.deepEqual(inferred, { amount: 6, label: "units" });
  assert.equal(calls, 1);
  assert.ok(Object.isFrozen(model));
  assert.ok(Object.isFrozen(model.initial));
  assert.ok(Object.isFrozen(value));
});

test("assembly retains missing-definition paths and empty-dependency rejection", () => {
  const schema = kpStateGroup({ source: kpStateValue(1), output: kpStateDerived<number>() });
  assert.throws(() => assembleKpSemanticStateModel({ namespace: "lesson.missing", schema }),
    error => error instanceof KpSemanticDerivedGraphValidationError &&
      error.diagnostics.some(item => item.code === "missing-derived-definition" &&
        item.targetPath?.[0] === "output"));
  assert.throws(() => assembleKpSemanticStateModel({
    namespace: "lesson.missing-edge", schema,
    derive: ({ refs, derive }) => [derive({ target: refs.output,
      dependencies: [], compute: () => 1 })]
  }), /semantic derived binding requires at least one dependency/);
});

test("assembly rejects cycles before any compute capability runs", () => {
  let calls = 0;
  assert.throws(() => assembleKpSemanticStateModel({
    namespace: "lesson.cycle",
    schema: kpStateGroup({ a: kpStateDerived<number>(), b: kpStateDerived<number>() }),
    derive: ({ refs, derive }) => [
      derive({ target: refs.a, dependencies: [refs.b], compute: ([b]) => { calls++; return b; } }),
      derive({ target: refs.b, dependencies: [refs.a], compute: ([a]) => a })
    ]
  }), error => error instanceof KpSemanticDerivedGraphValidationError &&
    error.diagnostics.some(item => item.code === "cyclic-derived-dependency"));
  assert.equal(calls, 0);
});

test("concrete-only assembly needs no placeholder derivation callback", () => {
  const model = assembleKpSemanticStateModel({ namespace: "lesson.concrete",
    schema: kpStateGroup({ value: kpStateValue({ amount: 2 }) }) });
  assert.equal(model.graph.evaluationOrder.length, 0);
  assert.deepEqual(model.handles.pin(model.initial).value.read(), { amount: 2 });
});

// These bodies are compile-only pressure: invalid compute shapes cannot widen
// the target's declared value type to make the assembly appear well typed.
function checkRejectedInference(): void {
  assembleKpSemanticStateModel({ namespace: "lesson.invalid-type",
    schema: kpStateGroup({ source: kpStateValue(1), output: kpStateDerived<number>() }),
    derive: ({ refs, derive }) => [derive({ target: refs.output,
      dependencies: [refs.source],
      // @ts-expect-error a numeric derived leaf cannot compute a string
      compute: ([source]) => String(source)
    })]
  });
}
void checkRejectedInference;
