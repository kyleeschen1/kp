import assert from "node:assert/strict";
import test from "node:test";

import { defineKpSemanticStateDerivation } from
  "../src/semantic-state/authoring-derived-definition.ts";
import { compileKpSemanticStateSchema } from
  "../src/semantic-state/authoring-schema-compiler.ts";
import {
  kpStateDerived,
  kpStateGroup,
  kpStateValue
} from "../src/semantic-state/authoring-schema.ts";
import { createKpSemanticStateHandleSet } from
  "../src/semantic-state/authoring-state-handles.ts";
import { materializeKpSemanticStateInitialSnapshot } from
  "../src/semantic-state/authoring-state-materializer.ts";
import {
  createKpSemanticStateSampleView,
  evaluateKpSemanticDerivedValue,
  KpSemanticDerivedEvaluationError
} from "../src/semantic-state/derived-evaluator.ts";
import {
  compileKpSemanticDerivedGraph,
  normalizeKpSemanticDerivedGraphInput
} from "../src/semantic-state/derived-graph.ts";
import { createKpSemanticProgress } from
  "../src/semantic-state/semantic-progress.ts";
import { createKpSemanticStateFamilyEvaluator } from
  "../src/semantic-state/state-family-evaluator.ts";
import {
  defineKpSemanticStateFamily,
  kpStateFamilyParameters
} from "../src/semantic-state/state-family-definition.ts";
import { declareKpSemanticStateInterpolation } from
  "../src/semantic-state/state-family-transition.ts";

test("one requested sample derivation evaluates only its closure", () => {
  const fixture = createFixture();
  const result = evaluateKpSemanticDerivedValue({
    graph: fixture.graph,
    source: interiorSource(fixture),
    target: fixture.handles.refs.shared
  });

  assert.equal(result, 8);
  assert.deepEqual(fixture.calls, {
    shared: 1,
    left: 0,
    right: 0,
    total: 0,
    independent: 0,
    invalid: 0
  });
});

test("sample evaluation shares a diamond and skips unrelated work", () => {
  const fixture = createFixture();
  const result = evaluateKpSemanticDerivedValue({
    graph: fixture.graph,
    source: interiorSource(fixture),
    target: fixture.handles.refs.total
  });

  assert.equal(result, 20);
  assert.deepEqual(fixture.calls, {
    shared: 1,
    left: 1,
    right: 1,
    total: 1,
    independent: 0,
    invalid: 0
  });
});

test("an unaffected derived branch matches persistent evaluation", () => {
  const fixture = createFixture();
  const persistent = evaluateKpSemanticDerivedValue({
    graph: fixture.graph,
    snapshot: fixture.initial,
    target: fixture.handles.refs.independent
  });
  const sampled = evaluateKpSemanticDerivedValue({
    graph: fixture.graph,
    source: interiorSource(fixture),
    target: fixture.handles.refs.independent
  });

  assert.equal(persistent, 50);
  assert.equal(sampled, persistent);
  assert.equal(fixture.calls.independent, 2);
  assert.equal(fixture.calls.shared, 0);
});

test("a sample view is typed frozen and has no durable identity", () => {
  const fixture = createFixture();
  const view = createKpSemanticStateSampleView({
    graph: fixture.graph,
    source: interiorSource(fixture),
    target: fixture.handles.refs.total
  });
  const result: number = view.read();

  assert.equal(result, 20);
  assert.equal(view.read(), result);
  assert.equal(view.reference, fixture.handles.refs.total);
  assert.equal(Object.isFrozen(view), true);
  assert.equal("snapshotId" in view, false);
  assert.equal("entityId" in view, false);
  assert.equal("versionId" in view, false);
  assert.deepEqual(fixture.calls, {
    shared: 1,
    left: 1,
    right: 1,
    total: 1,
    independent: 0,
    invalid: 0
  });
});

test("persistent base authority rejects a stale sample graph", () => {
  const fixture = createFixture();
  const staleShared = defineKpSemanticStateDerivation({
    compiled: fixture.compiled,
    target: fixture.handles.refs.shared,
    dependencies: [fixture.handles.refs.stable],
    compute: ([stable]) => stable * 2
  });
  const staleGraph = compileKpSemanticDerivedGraph(
    normalizeKpSemanticDerivedGraphInput(fixture.compiled, [
      ...fixture.definitions.filter(({ target }) =>
        target.slotId !== staleShared.target.slotId
      ),
      staleShared
    ])
  );

  assert.throws(() => evaluateKpSemanticDerivedValue({
    graph: staleGraph,
    source: interiorSource(fixture),
    target: fixture.handles.refs.total
  }), (error) => error instanceof KpSemanticDerivedEvaluationError &&
    error.code === "stale-derived-definition" &&
    error.slotId === fixture.handles.refs.shared.slotId
  );
});

test("an invalid derived result cannot expose a partial sample view", () => {
  const fixture = createFixture();
  let viewEscaped = false;

  assert.throws(() => {
    createKpSemanticStateSampleView({
      graph: fixture.graph,
      source: interiorSource(fixture),
      target: fixture.handles.refs.invalid
    });
    viewEscaped = true;
  }, (error) => error instanceof KpSemanticDerivedEvaluationError &&
    error.code === "invalid-derived-result" &&
    error.slotId === fixture.handles.refs.invalid.slotId
  );
  assert.equal(viewEscaped, false);
  assert.equal(fixture.calls.invalid, 1);
  assert.equal(fixture.calls.shared, 0);
});

function createFixture() {
  const compiled = compileKpSemanticStateSchema(
    "lesson.family-derived-evaluation",
    kpStateGroup({
      amount: kpStateValue<number>(2),
      stable: kpStateValue<number>(5),
      shared: kpStateDerived<number>(),
      left: kpStateDerived<number>(),
      right: kpStateDerived<number>(),
      total: kpStateDerived<number>(),
      independent: kpStateDerived<number>(),
      invalid: kpStateDerived<unknown>()
    })
  );
  const handles = createKpSemanticStateHandleSet(compiled);
  const calls = {
    shared: 0,
    left: 0,
    right: 0,
    total: 0,
    independent: 0,
    invalid: 0
  };
  const shared = defineKpSemanticStateDerivation({
    compiled,
    target: handles.refs.shared,
    dependencies: [handles.refs.amount],
    compute: ([amount]) => {
      calls.shared += 1;
      return amount * 2;
    }
  });
  const left = defineKpSemanticStateDerivation({
    compiled,
    target: handles.refs.left,
    dependencies: [handles.refs.shared],
    compute: ([value]) => {
      calls.left += 1;
      return value + 1;
    }
  });
  const right = defineKpSemanticStateDerivation({
    compiled,
    target: handles.refs.right,
    dependencies: [handles.refs.shared],
    compute: ([value]) => {
      calls.right += 1;
      return value + 3;
    }
  });
  const total = defineKpSemanticStateDerivation({
    compiled,
    target: handles.refs.total,
    dependencies: [handles.refs.left, handles.refs.right],
    compute: ([leftValue, rightValue]) => {
      calls.total += 1;
      return leftValue + rightValue;
    }
  });
  const independent = defineKpSemanticStateDerivation({
    compiled,
    target: handles.refs.independent,
    dependencies: [handles.refs.stable],
    compute: ([stable]) => {
      calls.independent += 1;
      return stable * 10;
    }
  });
  const invalid = defineKpSemanticStateDerivation({
    compiled,
    target: handles.refs.invalid,
    dependencies: [handles.refs.amount],
    compute: ([amount]) => {
      calls.invalid += 1;
      return () => amount;
    }
  });
  const definitions = [total, right, independent, invalid, left, shared];
  const initial = materializeKpSemanticStateInitialSnapshot(compiled, {
    derivations: definitions
  });
  const graph = compileKpSemanticDerivedGraph(
    normalizeKpSemanticDerivedGraphInput(compiled, definitions)
  );
  const transition = declareKpSemanticStateInterpolation({
    id: "amount-interpolation",
    sourceId: "lesson.family-derived-evaluation.amount",
    target: handles.refs.amount
  });
  const definition = defineKpSemanticStateFamily({
    compiled,
    handles,
    id: "raise-amount",
    sourceId: "lesson.family-derived-evaluation.raise-amount",
    parameters: kpStateFamilyParameters<{ readonly target: number }>(),
    transitions: builder => [builder.interpolate(
      transition,
      ({ before, after }) => (before + after) / 2
    )] as const,
    author(parameters, state) {
      state.amount.update(() => parameters.target);
    }
  });
  const application = definition.apply(initial, {
    applicationId: "first",
    parameters: { target: 6 },
    sourceId: "lesson.family-derived-evaluation.application.first"
  });
  return {
    application,
    calls,
    compiled,
    definition,
    definitions,
    graph,
    handles,
    initial
  };
}

function interiorSource(fixture: ReturnType<typeof createFixture>) {
  const sample = createKpSemanticStateFamilyEvaluator(fixture).at(
    createKpSemanticProgress(1n, 2n)
  );
  if (sample.kind !== "ephemeral-interior") {
    throw new Error("Expected an interior sample source.");
  }
  return sample.source;
}
