import assert from "node:assert/strict";
import test from "node:test";

import {
  addExactRationals,
  createExactRational,
  multiplyExactRationals,
  subtractExactRationals,
  type NormalizedExactRational
} from "../protocols/exact-rational.ts";
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
import { evaluateKpSemanticDerivedValue } from
  "../src/semantic-state/derived-evaluator.ts";
import {
  compileKpSemanticDerivedGraph,
  normalizeKpSemanticDerivedGraphInput
} from "../src/semantic-state/derived-graph.ts";
import {
  createKpSemanticProgress,
  encodeKpSemanticProgress,
  type KpSemanticProgress
} from "../src/semantic-state/semantic-progress.ts";
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

test("bounded seek permutations equal isolated direct evaluation", () => {
  const fixture = createFixture("lesson.family-evaluator-laws.seek");
  const points = [
    createKpSemanticProgress(0n),
    createKpSemanticProgress(1n, 4n),
    createKpSemanticProgress(1n, 2n),
    createKpSemanticProgress(3n, 4n),
    createKpSemanticProgress(1n)
  ] as const;
  const expected = new Map(points.map((progress) => [
    encodeKpSemanticProgress(progress),
    evaluateAt(fixture.createEvaluator(0), fixture, progress)
  ]));
  const orders = [
    points,
    [...points].reverse(),
    [points[0], points[4], points[2], points[1], points[3]],
    [points[2], points[3], points[1], points[4], points[0]],
    [points[4], points[1], points[3], points[0], points[2]],
    [points[1], points[0], points[3], points[2], points[4]]
  ];
  const history = captureHistory(fixture);

  for (const order of orders) {
    const evaluator = fixture.createEvaluator(2);
    for (const progress of order) {
      assert.deepEqual(
        evaluateAt(evaluator, fixture, progress),
        expected.get(encodeKpSemanticProgress(progress))
      );
    }
  }
  assert.deepEqual(captureHistory(fixture), history);
});

test("forward and rewind sampling return the same exact derived values", () => {
  const fixture = createFixture("lesson.family-evaluator-laws.rewind");
  const evaluator = fixture.createEvaluator(3);
  const points = [
    createKpSemanticProgress(0n),
    createKpSemanticProgress(1n, 5n),
    createKpSemanticProgress(2n, 5n),
    createKpSemanticProgress(3n, 5n),
    createKpSemanticProgress(4n, 5n),
    createKpSemanticProgress(1n)
  ];
  const forward = points.map((progress) =>
    evaluateAt(evaluator, fixture, progress)
  );
  const rewind = [...points].reverse().map((progress) =>
    evaluateAt(evaluator, fixture, progress)
  ).reverse();

  assert.deepEqual(rewind, forward);
});

test("equivalent progress repeats one cached semantic sample", () => {
  const fixture = createFixture("lesson.family-evaluator-laws.repeat");
  const evaluator = fixture.createEvaluator(1);
  const first = evaluator.at(createKpSemanticProgress(1n, 2n));
  const repeated = evaluator.at(createKpSemanticProgress(9n, 18n));

  assert.equal(repeated, first);
  assert.deepEqual(
    evaluateAt(evaluator, fixture, createKpSemanticProgress(3n, 6n)),
    createExactRational(8n)
  );
  assert.deepEqual(evaluator.inspect(), {
    schemaVersion: "kp.semantic-state-family-evaluator-stats.v1",
    kind: "semantic-state-family-evaluator-stats",
    status: "active",
    capacity: 1,
    entries: 1,
    hits: 2,
    misses: 1
  });
});

test("reset disposal and recreation do not change sample values", () => {
  const fixture = createFixture("lesson.family-evaluator-laws.lifecycle");
  const progress = createKpSemanticProgress(3n, 8n);
  const evaluator = fixture.createEvaluator(2);
  const beforeReset = evaluateAt(evaluator, fixture, progress);
  evaluator.reset();
  const afterReset = evaluateAt(evaluator, fixture, progress);
  evaluator.dispose();
  const afterRecreation = evaluateAt(
    fixture.createEvaluator(2),
    fixture,
    progress
  );

  assert.deepEqual(afterReset, beforeReset);
  assert.deepEqual(afterRecreation, beforeReset);
});

test("a failed progress never poisons a later sample or retry", () => {
  const fixture = createFixture(
    "lesson.family-evaluator-laws.retry",
    "1/3"
  );
  const evaluator = fixture.createEvaluator(2);
  const rejected = createKpSemanticProgress(1n, 3n);

  for (let attempt = 0; attempt < 2; attempt += 1) {
    assert.throws(
      () => evaluator.at(rejected),
      (error) => error instanceof KpSemanticStateFamilyEvaluatorError &&
        error.code === "invalid-interpolation-result"
    );
  }
  assert.deepEqual(evaluator.inspect(), {
    schemaVersion: "kp.semantic-state-family-evaluator-stats.v1",
    kind: "semantic-state-family-evaluator-stats",
    status: "active",
    capacity: 2,
    entries: 0,
    hits: 0,
    misses: 2
  });
  assert.deepEqual(
    evaluateAt(evaluator, fixture, createKpSemanticProgress(1n, 2n)),
    createExactRational(8n)
  );
  assert.equal(evaluator.inspect().entries, 1);
  assert.equal(evaluator.inspect().misses, 3);
});

function createFixture(namespace: string, rejectProgress?: string) {
  const compiled = compileKpSemanticStateSchema(namespace, kpStateGroup({
    amount: kpStateValue<NormalizedExactRational>(createExactRational(0n)),
    double: kpStateDerived<NormalizedExactRational>()
  }));
  const handles = createKpSemanticStateHandleSet(compiled);
  const double = defineKpSemanticStateDerivation({
    compiled,
    target: handles.refs.double,
    dependencies: [handles.refs.amount],
    compute: ([amount]) => multiplyExactRationals(
      amount,
      createExactRational(2n)
    )
  });
  const initial = materializeKpSemanticStateInitialSnapshot(compiled, {
    derivations: [double]
  });
  const graph = compileKpSemanticDerivedGraph(
    normalizeKpSemanticDerivedGraphInput(compiled, [double])
  );
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
    parameters: kpStateFamilyParameters<{
      readonly target: NormalizedExactRational;
    }>(),
    transitions: builder => [builder.interpolate(
      transition,
      ({ before, after, progress }) => {
        if (encodeKpSemanticProgress(progress) === rejectProgress) {
          return Number.NaN as unknown as NormalizedExactRational;
        }
        return addExactRationals(
          before,
          multiplyExactRationals(
            subtractExactRationals(after, before),
            progress
          )
        );
      }
    )] as const,
    author(parameters, state) {
      state.amount.update(() => parameters.target);
    }
  });
  const application = definition.apply(initial, {
    applicationId: "first",
    parameters: { target: createExactRational(8n) },
    sourceId: `${namespace}.application.first`
  });
  return {
    application,
    definition,
    graph,
    handles,
    createEvaluator(sampleCacheCapacity: number) {
      return createKpSemanticStateFamilyEvaluator({
        definition,
        application,
        sampleCacheCapacity
      });
    }
  };
}

function evaluateAt(
  evaluator: ReturnType<
    ReturnType<typeof createFixture>["createEvaluator"]
  >,
  fixture: ReturnType<typeof createFixture>,
  progress: KpSemanticProgress
): NormalizedExactRational {
  const sample = evaluator.at(progress);
  return sample.kind === "persistent-endpoint"
    ? evaluateKpSemanticDerivedValue({
        graph: fixture.graph,
        snapshot: sample.source.snapshot,
        target: fixture.handles.refs.double
      })
    : evaluateKpSemanticDerivedValue({
        graph: fixture.graph,
        source: sample.source,
        target: fixture.handles.refs.double
      });
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
