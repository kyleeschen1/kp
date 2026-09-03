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
  createKpSemanticSnapshotRecoveryIndex,
  pinKpAggregateSemanticSnapshot,
  recoverKpPinnedSnapshot
} from "../src/semantic-state/pinned-recovery.ts";
import { createKpSemanticProgress } from
  "../src/semantic-state/semantic-progress.ts";
import {
  createKpSemanticStateFamilyEvaluator,
  KpSemanticStateFamilyEvaluatorError
} from "../src/semantic-state/state-family-evaluator.ts";
import {
  defineKpSemanticStateFamily,
  kpStateFamilyParameters
} from "../src/semantic-state/state-family-definition.ts";
import { declareKpSemanticStateInterpolation } from
  "../src/semantic-state/state-family-transition.ts";

test("exact zero returns the committed before source and pinned view", () => {
  const fixture = createFixture();
  const evaluator = createKpSemanticStateFamilyEvaluator(fixture);
  const sample = evaluator.at(createKpSemanticProgress(0n, 9n));

  assert.equal(sample.kind, "persistent-endpoint");
  assert.equal(sample.endpoint, "before");
  assert.equal(sample.source.snapshot, fixture.application.commit.before);
  assert.equal(sample.source.snapshot, fixture.initial);
  assert.equal(sample.view, fixture.application.before);
  assert.equal(sample.view.amount.read(), 2);
  assert.equal(evaluator.at(createKpSemanticProgress(0n)), sample);
  assert.equal(fixture.counters.interpolate, 0);
  assert.equal(fixture.counters.compute, 0);
  assert.equal("cache" in evaluator, false);
});

test("exact one returns the committed after source and pinned view", () => {
  const fixture = createFixture();
  const evaluator = createKpSemanticStateFamilyEvaluator(fixture);
  const sample = evaluator.at(createKpSemanticProgress(11n, 11n));

  assert.equal(sample.kind, "persistent-endpoint");
  assert.equal(sample.endpoint, "after");
  assert.equal(sample.source.snapshot, fixture.application.commit.after);
  assert.equal(sample.view, fixture.application.after);
  assert.equal(sample.view.amount.read(), 5);
  assert.equal(evaluator.at(createKpSemanticProgress(1n)), sample);
  assert.equal(fixture.counters.interpolate, 0);
  assert.equal(fixture.counters.compute, 0);
});

test("interior progress fails before interpolation or overlay allocation", () => {
  const fixture = createFixture();
  const evaluator = createKpSemanticStateFamilyEvaluator(fixture);
  const history = captureHistory(fixture);

  assert.throws(() => evaluator.at(createKpSemanticProgress(1n, 2n)),
    (error) => error instanceof KpSemanticStateFamilyEvaluatorError &&
      error.code === "interior-sampling-unsupported"
  );
  assert.deepEqual(captureHistory(fixture), history);
  assert.equal(fixture.counters.interpolate, 0);
  assert.equal(fixture.counters.compute, 0);
});

test("endpoint sources recover through existing snapshot authority", () => {
  const fixture = createFixture();
  const evaluator = createKpSemanticStateFamilyEvaluator(fixture);
  const recovery = createKpSemanticSnapshotRecoveryIndex([
    fixture.application.commit.before,
    fixture.application.commit.after
  ]);

  for (const progress of [
    createKpSemanticProgress(0n),
    createKpSemanticProgress(1n)
  ]) {
    const source = evaluator.at(progress).source;
    assert.equal(recoverKpPinnedSnapshot(
      recovery,
      pinKpAggregateSemanticSnapshot(source.snapshot)
    ), source.snapshot);
  }
});

test("a different definition cannot supply application capabilities", () => {
  const fixture = createFixture();
  const foreign = createFixture("lesson.family-endpoint-sampling.foreign");

  assert.throws(() => createKpSemanticStateFamilyEvaluator({
    definition: foreign.definition,
    application: fixture.application
  }), (error) => error instanceof KpSemanticStateFamilyEvaluatorError &&
    error.code === "definition-application-mismatch"
  );
});

test("equivalent declarations do not make callback identity authoritative", () => {
  const fixture = createFixture();
  const equivalent = createFixture();
  const evaluator = createKpSemanticStateFamilyEvaluator({
    definition: equivalent.definition,
    application: fixture.application
  });

  assert.equal(
    evaluator.at(createKpSemanticProgress(1n)).source.snapshot,
    fixture.application.commit.after
  );
  assert.equal(equivalent.counters.interpolate, 0);
});

function createFixture(
  namespace = "lesson.family-endpoint-sampling"
) {
  const compiled = compileKpSemanticStateSchema(namespace, kpStateGroup({
    amount: kpStateValue<number>(2),
    total: kpStateDerived<number>()
  }));
  const handles = createKpSemanticStateHandleSet(compiled);
  const counters = { interpolate: 0, compute: 0 };
  const total = defineKpSemanticStateDerivation({
    compiled,
    target: handles.refs.total,
    dependencies: [handles.refs.amount],
    compute: ([amount]) => {
      counters.compute += 1;
      return amount * 2;
    }
  });
  const initial = materializeKpSemanticStateInitialSnapshot(compiled, {
    derivations: [total]
  });
  const transition = declareKpSemanticStateInterpolation({
    id: "amount-interpolation",
    sourceId: `${namespace}.amount`,
    target: handles.refs.amount
  });
  const definition = defineKpSemanticStateFamily({
    compiled,
    handles,
    id: "raise-amount",
    sourceId: `${namespace}.raise-amount`,
    parameters: kpStateFamilyParameters<{ readonly delta: number }>(),
    transitions: builder => [builder.interpolate(
      transition,
      ({ before }) => {
        counters.interpolate += 1;
        return before;
      }
    )] as const,
    author(parameters, state) {
      state.amount.update(previous => previous + parameters.delta);
    }
  });
  const application = definition.apply(initial, {
    applicationId: "first",
    parameters: { delta: 3 },
    sourceId: `${namespace}.application.first`
  });
  return { definition, application, counters, initial };
}

function captureHistory(fixture: ReturnType<typeof createFixture>) {
  return {
    before: fixture.application.commit.before,
    after: fixture.application.commit.after,
    journal: fixture.application.commit.journal,
    versionIds: [
      ...fixture.application.commit.before.entityStores,
      ...fixture.application.commit.after.entityStores
    ].flatMap((store) => store.versions.map(({ id }) => id))
  };
}
