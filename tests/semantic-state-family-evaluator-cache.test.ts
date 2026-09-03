import assert from "node:assert/strict";
import test from "node:test";

import { compileKpSemanticStateSchema } from
  "../src/semantic-state/authoring-schema-compiler.ts";
import {
  kpStateGroup,
  kpStateValue,
  type KpSemanticStateGroupDescriptor,
  type KpSemanticStateMemberMap
} from
  "../src/semantic-state/authoring-schema.ts";
import { createKpSemanticStateHandleSet } from
  "../src/semantic-state/authoring-state-handles.ts";
import { materializeKpSemanticStateInitialSnapshot } from
  "../src/semantic-state/authoring-state-materializer.ts";
import {
  createKpSemanticProgress,
  encodeKpSemanticProgress
} from "../src/semantic-state/semantic-progress.ts";
import {
  createKpSemanticStateFamilyEvaluator,
  KpSemanticStateFamilyEvaluatorError,
  type KpSemanticStateFamilySample
} from "../src/semantic-state/state-family-evaluator.ts";
import {
  defineKpSemanticStateFamily,
  kpStateFamilyParameters
} from "../src/semantic-state/state-family-definition.ts";
import { declareKpSemanticStateInterpolation } from
  "../src/semantic-state/state-family-transition.ts";

test("capacity zero observes misses without retaining interior samples", () => {
  const fixture = createFixture("lesson.family-evaluator-cache.zero");
  const evaluator = fixture.createEvaluator("first", "alpha", 0);
  const progress = createKpSemanticProgress(1n, 2n);

  evaluator.at(createKpSemanticProgress(0n));
  evaluator.at(createKpSemanticProgress(1n));
  const first = evaluator.at(progress);
  const repeated = evaluator.at(createKpSemanticProgress(2n, 4n));

  assert.notEqual(repeated, first);
  assert.equal(fixture.interpolateCalls, 2);
  assert.deepEqual(evaluator.inspect(), {
    schemaVersion: "kp.semantic-state-family-evaluator-stats.v1",
    kind: "semantic-state-family-evaluator-stats",
    status: "active",
    capacity: 0,
    entries: 0,
    hits: 0,
    misses: 2
  });
});

test("minimum capacity retains one normalized progress sample", () => {
  const fixture = createFixture("lesson.family-evaluator-cache.minimum");
  const evaluator = fixture.createEvaluator("first", "alpha", 1);
  const quarter = evaluator.at(createKpSemanticProgress(1n, 4n));

  assert.equal(
    evaluator.at(createKpSemanticProgress(2n, 8n)),
    quarter
  );
  evaluator.at(createKpSemanticProgress(1n, 2n));
  assert.notEqual(evaluator.at(createKpSemanticProgress(1n, 4n)), quarter);
  assert.equal(fixture.interpolateCalls, 3);
  assert.deepEqual(evaluator.inspect(), {
    schemaVersion: "kp.semantic-state-family-evaluator-stats.v1",
    kind: "semantic-state-family-evaluator-stats",
    status: "active",
    capacity: 1,
    entries: 1,
    hits: 1,
    misses: 3
  });
});

test("capacity limit evicts the least recently used progress deterministically", () => {
  const fixture = createFixture("lesson.family-evaluator-cache.limit");
  const evaluator = fixture.createEvaluator("first", "alpha", 2);
  const quarter = evaluator.at(createKpSemanticProgress(1n, 4n));
  const third = evaluator.at(createKpSemanticProgress(1n, 3n));

  assert.equal(evaluator.at(createKpSemanticProgress(2n, 8n)), quarter);
  evaluator.at(createKpSemanticProgress(1n, 2n));
  assert.equal(evaluator.at(createKpSemanticProgress(1n, 4n)), quarter);
  assert.notEqual(evaluator.at(createKpSemanticProgress(1n, 3n)), third);
  assert.equal(fixture.interpolateCalls, 4);
  assert.deepEqual(evaluator.inspect(), {
    schemaVersion: "kp.semantic-state-family-evaluator-stats.v1",
    kind: "semantic-state-family-evaluator-stats",
    status: "active",
    capacity: 2,
    entries: 2,
    hits: 2,
    misses: 4
  });
});

test("reset clears one evaluator cache and its counters", () => {
  const fixture = createFixture("lesson.family-evaluator-cache.reset");
  const evaluator = fixture.createEvaluator("first", "alpha", 2);
  const progress = createKpSemanticProgress(1n, 2n);
  evaluator.at(progress);
  evaluator.at(progress);

  evaluator.reset();
  assert.deepEqual(evaluator.inspect(), {
    schemaVersion: "kp.semantic-state-family-evaluator-stats.v1",
    kind: "semantic-state-family-evaluator-stats",
    status: "active",
    capacity: 2,
    entries: 0,
    hits: 0,
    misses: 0
  });
  evaluator.at(progress);
  assert.equal(fixture.interpolateCalls, 2);
  assert.equal(evaluator.inspect().misses, 1);
});

test("disposal is idempotent and expires every evaluator operation", () => {
  const fixture = createFixture("lesson.family-evaluator-cache.dispose");
  const evaluator = fixture.createEvaluator("first", "alpha", 2);
  evaluator.at(createKpSemanticProgress(1n, 2n));

  evaluator.dispose();
  evaluator.dispose();
  assert.deepEqual(evaluator.inspect(), {
    schemaVersion: "kp.semantic-state-family-evaluator-stats.v1",
    kind: "semantic-state-family-evaluator-stats",
    status: "disposed",
    capacity: 2,
    entries: 0,
    hits: 0,
    misses: 1
  });
  for (const progress of [
    createKpSemanticProgress(0n),
    createKpSemanticProgress(1n, 2n),
    createKpSemanticProgress(1n)
  ]) {
    assert.throws(() => evaluator.at(progress), isDisposedError);
  }
  assert.throws(() => evaluator.reset(), isDisposedError);
});

test("evaluator caches remain isolated between family applications", () => {
  const fixture = createFixture("lesson.family-evaluator-cache.isolation");
  const first = fixture.createEvaluator("first", "alpha", 1);
  const second = fixture.createEvaluator("second", "beta", 1);
  const progress = createKpSemanticProgress(1n, 2n);

  const firstSample = first.at(progress);
  const secondSample = second.at(progress);
  assert.notEqual(secondSample, firstSample);
  assert.equal(first.at(progress), firstSample);
  assert.equal(second.at(progress), secondSample);
  assert.equal(fixture.interpolateCalls, 2);
  assert.deepEqual(readDriverValue(firstSample), {
    label: "alpha",
    progress: "1/2"
  });
  assert.deepEqual(readDriverValue(secondSample), {
    label: "beta",
    progress: "1/2"
  });

  first.dispose();
  assert.equal(second.at(progress), secondSample);
  assert.equal(second.inspect().status, "active");
});

test("cache capacity must be a non-negative safe integer", () => {
  const fixture = createFixture("lesson.family-evaluator-cache.capacity");
  for (const sampleCacheCapacity of [
    -1,
    1.5,
    Number.POSITIVE_INFINITY,
    Number.MAX_SAFE_INTEGER + 1
  ]) {
    assert.throws(
      () => fixture.createEvaluator("first", "alpha", sampleCacheCapacity),
      (error) => error instanceof KpSemanticStateFamilyEvaluatorError &&
        error.code === "invalid-evaluator-cache-capacity"
    );
  }
});

interface FixtureValue {
  readonly label: string;
  readonly progress: string;
}

function createFixture(namespace: string) {
  const compiled = compileKpSemanticStateSchema(namespace, kpStateGroup({
    value: kpStateValue<FixtureValue>({
      label: "baseline",
      progress: "0/1"
    })
  }));
  const handles = createKpSemanticStateHandleSet(compiled);
  const initial = materializeKpSemanticStateInitialSnapshot(compiled);
  const transition = declareKpSemanticStateInterpolation({
    id: "value-interpolation",
    sourceId: `${namespace}.value`,
    target: handles.refs.value
  });
  let interpolateCalls = 0;
  const definition = defineKpSemanticStateFamily({
    compiled,
    handles,
    id: "set-value",
    sourceId: `${namespace}.set-value`,
    parameters: kpStateFamilyParameters<{ readonly label: string }>(),
    transitions: builder => [builder.interpolate(
      transition,
      ({ parameters, progress }) => {
        interpolateCalls += 1;
        return {
          label: parameters.label,
          progress: encodeKpSemanticProgress(progress)
        };
      }
    )] as const,
    author(parameters, state) {
      state.value.update(() => ({
        label: parameters.label,
        progress: "1/1"
      }));
    }
  });
  return {
    get interpolateCalls() {
      return interpolateCalls;
    },
    createEvaluator(
      applicationId: string,
      label: string,
      sampleCacheCapacity: number
    ) {
      return createKpSemanticStateFamilyEvaluator({
        definition,
        application: definition.apply(initial, {
          applicationId,
          parameters: { label },
          sourceId: `${namespace}.application.${applicationId}`
        }),
        sampleCacheCapacity
      });
    }
  };
}

function readDriverValue<
  Root extends KpSemanticStateGroupDescriptor<KpSemanticStateMemberMap>
>(
  sample: KpSemanticStateFamilySample<Root>
): unknown {
  assert.equal(sample.kind, "ephemeral-interior");
  if (sample.kind !== "ephemeral-interior") {
    throw new Error("Expected an ephemeral interior sample.");
  }
  return sample.source.drivers[0]?.value;
}

function isDisposedError(error: unknown): boolean {
  return error instanceof KpSemanticStateFamilyEvaluatorError &&
    error.code === "family-evaluator-disposed";
}
