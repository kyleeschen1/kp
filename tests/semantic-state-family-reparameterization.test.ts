import assert from "node:assert/strict";
import test from "node:test";

import { compileKpSemanticStateSchema } from
  "../src/semantic-state/authoring-schema-compiler.ts";
import { kpStateGroup, kpStateValue } from
  "../src/semantic-state/authoring-schema.ts";
import { createKpSemanticStateHandleSet } from
  "../src/semantic-state/authoring-state-handles.ts";
import { materializeKpSemanticStateInitialSnapshot } from
  "../src/semantic-state/authoring-state-materializer.ts";
import {
  createKpSemanticProgress,
  encodeKpSemanticProgress
} from "../src/semantic-state/semantic-progress.ts";
import { createKpSemanticStateFamilyEvaluator } from
  "../src/semantic-state/state-family-evaluator.ts";
import {
  defineKpSemanticStateFamily,
  kpStateFamilyParameters,
  KpSemanticStateFamilyError
} from "../src/semantic-state/state-family-definition.ts";
import { declareKpSemanticStateInterpolation } from
  "../src/semantic-state/state-family-transition.ts";

test("reparameterization branches immutably from the persistent source", () => {
  const fixture = createFixture("lesson.family-reparameterization.immutable");
  const original = fixture.apply("original", "alpha");
  const originalRecord = JSON.stringify(original);
  const branch = fixture.family.reparameterize(original, {
    applicationId: "branch",
    parameters: { target: "beta" },
    sourceId: `${fixture.namespace}.reparameterize.branch`
  });

  assert.equal(JSON.stringify(original), originalRecord);
  assert.equal(original.commit.before, fixture.initial);
  assert.equal(branch.commit.before, fixture.initial);
  assert.notEqual(branch.commit.after, original.commit.after);
  assert.notEqual(branch.commit.after.id, original.commit.after.id);
  assert.notEqual(branch.transformationId, original.transformationId);
  assert.equal(original.after.value.read(), "alpha");
  assert.equal(branch.before.value.read(), "baseline");
  assert.equal(branch.after.value.read(), "beta");
  assert.deepEqual(branch.source, {
    schemaVersion: "kp.semantic-state-family-source-provenance.v1",
    kind: "reparameterized",
    sourceId: `${fixture.namespace}.reparameterize.branch`,
    sourceApplication: {
      schemaVersion: "kp.semantic-state-family-application-reference.v1",
      kind: "semantic-state-family-application-reference",
      definitionId: original.definitionId,
      transformationId: original.transformationId,
      applicationId: original.applicationId
    }
  });
  assert.equal(Object.isFrozen(branch), true);
  assert.equal(Object.isFrozen(branch.parameters), true);
  assert.equal(Object.isFrozen(branch.source), true);
  if (branch.source.kind !== "reparameterized") {
    throw new Error("Expected reparameterized provenance.");
  }
  assert.equal(Object.isFrozen(branch.source.sourceApplication), true);
});

test("a reparameterized application owns an isolated evaluator cache", () => {
  const fixture = createFixture("lesson.family-reparameterization.cache");
  const original = fixture.apply("original", "alpha");
  const branch = fixture.family.reparameterize(original, {
    applicationId: "branch",
    parameters: { target: "beta" },
    sourceId: `${fixture.namespace}.reparameterize.branch`
  });
  const originalEvaluator = createKpSemanticStateFamilyEvaluator({
    definition: fixture.family,
    application: original,
    sampleCacheCapacity: 1
  });
  const branchEvaluator = createKpSemanticStateFamilyEvaluator({
    definition: fixture.family,
    application: branch,
    sampleCacheCapacity: 1
  });
  const progress = createKpSemanticProgress(1n, 2n);
  const originalSample = originalEvaluator.at(progress);
  const branchSample = branchEvaluator.at(progress);

  assert.notEqual(branchSample, originalSample);
  assert.equal(readValue(originalSample), "alpha@1/2");
  assert.equal(readValue(branchSample), "beta@1/2");
  assert.equal(originalEvaluator.at(progress), originalSample);
  assert.equal(branchEvaluator.at(progress), branchSample);
  originalEvaluator.dispose();
  assert.equal(branchEvaluator.at(progress), branchSample);
  assert.deepEqual(branchEvaluator.inspect(), {
    schemaVersion: "kp.semantic-state-family-evaluator-stats.v1",
    kind: "semantic-state-family-evaluator-stats",
    status: "active",
    capacity: 1,
    entries: 1,
    hits: 2,
    misses: 1
  });
});

test("reparameterization provenance follows the immediate source application", () => {
  const fixture = createFixture("lesson.family-reparameterization.chain");
  const original = fixture.apply("original", "alpha");
  const second = fixture.family.reparameterize(original, {
    applicationId: "second",
    parameters: { target: "beta" },
    sourceId: `${fixture.namespace}.reparameterize.second`
  });
  const third = fixture.family.reparameterize(second, {
    applicationId: "third",
    parameters: { target: "gamma" },
    sourceId: `${fixture.namespace}.reparameterize.third`
  });

  assert.equal(third.commit.before, fixture.initial);
  assert.equal(third.after.value.read(), "gamma");
  assert.equal(third.source.kind, "reparameterized");
  if (third.source.kind !== "reparameterized") {
    throw new Error("Expected reparameterized provenance.");
  }
  assert.equal(third.source.sourceApplication.applicationId, "second");
  assert.equal(
    third.source.sourceApplication.transformationId,
    second.transformationId
  );
});

test("reparameterization rejects reused and foreign application authority", () => {
  const fixture = createFixture("lesson.family-reparameterization.reject");
  const original = fixture.apply("original", "alpha");
  assert.throws(() => fixture.family.reparameterize(original, {
    applicationId: "original",
    parameters: { target: "beta" },
    sourceId: `${fixture.namespace}.reparameterize.reused`
  }), (error) => error instanceof KpSemanticStateFamilyError &&
    error.code === "reused-source-application-id"
  );

  const foreign = createFixture("lesson.family-reparameterization.foreign");
  const foreignApplication = foreign.apply("foreign", "other");
  assert.throws(() => fixture.family.reparameterize(foreignApplication, {
    applicationId: "branch",
    parameters: { target: "beta" },
    sourceId: `${fixture.namespace}.reparameterize.foreign`
  }), (error) => error instanceof KpSemanticStateFamilyError &&
    error.code === "foreign-reparameterization-source"
  );
});

test("reparameterized parameters retain structural validation", () => {
  const fixture = createFixture("lesson.family-reparameterization.parameters");
  const original = fixture.apply("original", "alpha");

  assert.throws(() => Reflect.apply(
    fixture.family.reparameterize,
    fixture.family,
    [original, {
      applicationId: "branch",
      parameters: { target: () => "beta" },
      sourceId: `${fixture.namespace}.reparameterize.invalid`
    }]
  ), (error) => error instanceof KpSemanticStateFamilyError &&
    error.code === "invalid-family-parameters"
  );
});

function createFixture(namespace: string) {
  const compiled = compileKpSemanticStateSchema(namespace, kpStateGroup({
    value: kpStateValue<string>("baseline")
  }));
  const handles = createKpSemanticStateHandleSet(compiled);
  const initial = materializeKpSemanticStateInitialSnapshot(compiled);
  const transition = declareKpSemanticStateInterpolation({
    id: "value-interpolation",
    sourceId: `${namespace}.value`,
    target: handles.refs.value
  });
  const family = defineKpSemanticStateFamily({
    compiled,
    handles,
    id: "set-value",
    sourceId: `${namespace}.set-value`,
    parameters: kpStateFamilyParameters<{ readonly target: string }>(),
    transitions: builder => [builder.interpolate(
      transition,
      ({ parameters, progress }) =>
        `${parameters.target}@${encodeKpSemanticProgress(progress)}`
    )] as const,
    author(parameters, state) {
      state.value.update(() => parameters.target);
    }
  });
  return {
    namespace,
    family,
    initial,
    apply(applicationId: string, target: string) {
      return family.apply(initial, {
        applicationId,
        parameters: { target },
        sourceId: `${namespace}.application.${applicationId}`
      });
    }
  };
}

function readValue(sample: ReturnType<
  ReturnType<typeof createKpSemanticStateFamilyEvaluator>["at"]
>): unknown {
  assert.equal(sample.kind, "ephemeral-interior");
  if (sample.kind !== "ephemeral-interior") {
    throw new Error("Expected an ephemeral interior sample.");
  }
  return sample.source.drivers[0]?.value;
}
