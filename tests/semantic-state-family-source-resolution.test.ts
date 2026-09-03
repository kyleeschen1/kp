import assert from "node:assert/strict";
import test from "node:test";

import { readKpSemanticSlotBinding } from
  "../src/semantic-state/aggregate-snapshot.ts";
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
  KpSemanticDerivedEvaluationError,
  resolveKpSemanticConcreteDependency
} from "../src/semantic-state/derived-evaluator.ts";
import {
  compileKpSemanticDerivedGraph,
  normalizeKpSemanticDerivedGraphInput
} from "../src/semantic-state/derived-graph.ts";
import { createKpSemanticProgress } from
  "../src/semantic-state/semantic-progress.ts";
import { createKpSemanticStateFamilyEvaluator } from
  "../src/semantic-state/state-family-evaluator.ts";
import { adaptKpSnapshotToSemanticStateReadSource } from
  "../src/semantic-state/state-family-sample-source.ts";
import {
  defineKpSemanticStateFamily,
  kpStateFamilyParameters
} from "../src/semantic-state/state-family-definition.ts";
import { declareKpSemanticStateInterpolation } from
  "../src/semantic-state/state-family-transition.ts";

test("persistent source resolution is exact snapshot-adapter parity", () => {
  const fixture = createFixture();
  const fromSnapshot = resolveKpSemanticConcreteDependency({
    graph: fixture.graph,
    snapshot: fixture.initial,
    dependency: fixture.amountDependency
  });
  const fromSource = resolveKpSemanticConcreteDependency({
    graph: fixture.graph,
    source: adaptKpSnapshotToSemanticStateReadSource(fixture.initial),
    dependency: fixture.amountDependency
  });

  assert.deepEqual(fromSource, fromSnapshot);
  assert.equal(fromSource.entityId, fromSnapshot.entityId);
  assert.equal(fromSource.versionId, fromSnapshot.versionId);
  assert.equal(fromSnapshot.kind, "resolved-semantic-concrete-dependency");
  assert.equal(fromSnapshot.entityId,
    readKpSemanticSlotBinding(
      fixture.initial,
      fixture.handles.refs.amount.slotId
    ).entityId);
});

test("overlayed driver resolves through an explicit transient token", () => {
  const fixture = createFixture();
  const source = interiorSource(fixture);
  const resolved = resolveKpSemanticConcreteDependency({
    graph: fixture.graph,
    source,
    dependency: fixture.amountDependency
  });
  assert.equal(resolved.kind, "resolved-semantic-transient-dependency");
  if (resolved.kind !== "resolved-semantic-transient-dependency") {
    throw new Error("Expected a transient dependency.");
  }
  const before = readKpSemanticSlotBinding(
    fixture.application.commit.before,
    fixture.handles.refs.amount.slotId
  );
  const after = readKpSemanticSlotBinding(
    fixture.application.commit.after,
    fixture.handles.refs.amount.slotId
  );

  assert.equal(resolved.value, 4);
  assert.equal(resolved.baseSnapshotId, fixture.initial.id);
  assert.deepEqual(resolved.token, {
    schemaVersion: "kp.semantic-transient-dependency-token.v1",
    kind: "semantic-transient-dependency-token",
    definitionId: fixture.application.definitionId,
    transformationId: fixture.application.transformationId,
    applicationId: fixture.application.applicationId,
    declarationId: fixture.transition.id,
    slotId: fixture.handles.refs.amount.slotId,
    beforeEntityId: before.entityId,
    beforeVersionId: before.versionId,
    afterEntityId: after.entityId,
    afterVersionId: after.versionId,
    progress: "1/2"
  });
  assert.equal("snapshotId" in resolved, false);
  assert.equal("entityId" in resolved, false);
  assert.equal("versionId" in resolved, false);
  assert.equal(Object.isFrozen(resolved.token), true);
});

test("unaffected overlay dependency retains exact persistent authority", () => {
  const fixture = createFixture();
  const resolved = resolveKpSemanticConcreteDependency({
    graph: fixture.graph,
    source: interiorSource(fixture),
    dependency: fixture.stableDependency
  });
  const baseline = resolveKpSemanticConcreteDependency({
    graph: fixture.graph,
    snapshot: fixture.initial,
    dependency: fixture.stableDependency
  });

  assert.equal(resolved.kind, "resolved-semantic-concrete-dependency");
  assert.deepEqual(resolved, baseline);
});

test("overlay resolution retains derived and foreign source failures", () => {
  const fixture = createFixture();
  const source = interiorSource(fixture);
  const derivedTarget = fixture.graph.input.definitions[0]?.target;
  if (derivedTarget === undefined) {
    throw new Error("Expected one derived target.");
  }
  assert.throws(() => resolveKpSemanticConcreteDependency({
    graph: fixture.graph,
    source,
    dependency: derivedTarget
  }), (error) => error instanceof KpSemanticDerivedEvaluationError &&
    error.code === "derived-dependency-not-concrete"
  );

  const foreign = createFixture("lesson.family-source-resolution.foreign");
  assert.throws(() => resolveKpSemanticConcreteDependency({
    graph: fixture.graph,
    source: interiorSource(foreign),
    dependency: fixture.amountDependency
  }), (error) => error instanceof KpSemanticDerivedEvaluationError &&
    error.code === "foreign-derived-snapshot"
  );
});

function createFixture(namespace = "lesson.family-source-resolution") {
  const compiled = compileKpSemanticStateSchema(namespace, kpStateGroup({
    amount: kpStateValue<number>(2),
    stable: kpStateValue("stable"),
    total: kpStateDerived<string>()
  }));
  const handles = createKpSemanticStateHandleSet(compiled);
  const total = defineKpSemanticStateDerivation({
    compiled,
    target: handles.refs.total,
    dependencies: [handles.refs.amount, handles.refs.stable],
    compute: ([amount, stable]) => `${stable}:${amount}`
  });
  const initial = materializeKpSemanticStateInitialSnapshot(compiled, {
    derivations: [total]
  });
  const graph = compileKpSemanticDerivedGraph(
    normalizeKpSemanticDerivedGraphInput(compiled, [total])
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
    sourceId: `${namespace}.application.first`
  });
  const dependency = (encodedPath: "amount" | "stable") => {
    const found = graph.input.edges.find(({ dependency }) =>
      dependency.encodedPath === encodedPath
    )?.dependency;
    if (found === undefined) {
      throw new Error(`Missing graph dependency ${encodedPath}.`);
    }
    return found;
  };
  return {
    definition,
    application,
    graph,
    handles,
    initial,
    transition,
    amountDependency: dependency("amount"),
    stableDependency: dependency("stable")
  };
}

function interiorSource(fixture: ReturnType<typeof createFixture>) {
  const sample = createKpSemanticStateFamilyEvaluator(fixture).at(
    createKpSemanticProgress(1n, 2n)
  );
  if (sample.kind !== "ephemeral-interior") {
    throw new Error("Expected an ephemeral interior sample.");
  }
  return sample.source;
}
