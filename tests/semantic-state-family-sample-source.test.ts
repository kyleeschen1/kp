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
import { createKpSemanticProgress } from
  "../src/semantic-state/semantic-progress.ts";
import {
  adaptKpSnapshotToSemanticStateReadSource,
  createKpEphemeralSemanticStateReadSource,
  KpSemanticStateSampleSourceError
} from "../src/semantic-state/state-family-sample-source.ts";
import {
  defineKpSemanticStateFamily,
  kpStateFamilyParameters
} from "../src/semantic-state/state-family-definition.ts";
import {
  declareKpSemanticStateInterpolation,
  declareKpSemanticStatePresentationTransition
} from "../src/semantic-state/state-family-transition.ts";

test("persistent source adapter retains the exact snapshot authority", () => {
  const fixture = createFixture();
  const source = adaptKpSnapshotToSemanticStateReadSource(fixture.initial);

  assert.deepEqual(Object.keys(source), [
    "schemaVersion",
    "kind",
    "namespace",
    "snapshot"
  ]);
  assert.equal(source.kind, "persistent-snapshot");
  assert.equal(source.snapshot, fixture.initial);
  assert.equal(source.namespace, fixture.initial.namespace);
  assert.equal(Object.isFrozen(source), true);
});

test("interior source overlays declared drivers without snapshot identity", () => {
  const fixture = createFixture();
  const mutable = { amount: 3 };
  const source = createKpEphemeralSemanticStateReadSource({
    application: fixture.application,
    progress: createKpSemanticProgress(1n, 2n),
    drivers: [{ declaration: fixture.transition, value: mutable }]
  });
  mutable.amount = 99;

  assert.deepEqual(Object.keys(source), [
    "schemaVersion",
    "kind",
    "namespace",
    "application",
    "progress",
    "base",
    "drivers",
    "driverIndex"
  ]);
  assert.equal("id" in source, false);
  assert.equal("snapshotId" in source, false);
  assert.equal("versionId" in source, false);
  assert.equal("entityStores" in source, false);
  assert.equal("journal" in source, false);
  assert.equal(source.base.snapshot, fixture.initial);
  assert.deepEqual(source.drivers[0]?.value, { amount: 3 });
  assert.equal(
    source.driverIndex[fixture.transition.target.slotId],
    0
  );
  assert.equal(Object.isFrozen(source), true);
  assert.equal(Object.isFrozen(source.drivers), true);
  assert.equal(Object.isFrozen(source.drivers[0]?.value), true);
});

test("source construction leaves the persistent history inventory exact", () => {
  const fixture = createFixture();
  const before = captureHistory(fixture);

  createKpEphemeralSemanticStateReadSource({
    application: fixture.application,
    progress: createKpSemanticProgress(2n, 4n),
    drivers: [{ declaration: fixture.transition, value: { amount: 3 } }]
  });

  assert.deepEqual(captureHistory(fixture), before);
});

test("endpoint progress cannot become an ephemeral overlay", () => {
  const fixture = createFixture();
  for (const progress of [
    createKpSemanticProgress(0n),
    createKpSemanticProgress(1n)
  ]) {
    assertSourceFailure(() => createKpEphemeralSemanticStateReadSource({
      application: fixture.application,
      progress,
      drivers: []
    }), "endpoint-overlay-progress");
  }
});

test("overlay inputs fail on duplicate foreign and undeclared drivers", () => {
  const fixture = createFixture();
  assertSourceFailure(() => createKpEphemeralSemanticStateReadSource({
    application: fixture.application,
    progress: createKpSemanticProgress(1n, 2n),
    drivers: [
      { declaration: fixture.transition, value: { amount: 3 } },
      { declaration: fixture.transition, value: { amount: 4 } }
    ]
  }), "duplicate-overlay-driver");

  const foreign = createFixture("lesson.family-sample-source.foreign");
  assertSourceFailure(() => createKpEphemeralSemanticStateReadSource({
    application: fixture.application,
    progress: createKpSemanticProgress(1n, 2n),
    drivers: [{ declaration: foreign.transition, value: { amount: 3 } }]
  }), "foreign-overlay-driver");

  const undeclared = declareKpSemanticStateInterpolation({
    id: "other-interpolation",
    sourceId: "lesson.family-sample-source.other",
    target: fixture.handles.refs.other
  });
  assertSourceFailure(() => createKpEphemeralSemanticStateReadSource({
    application: fixture.application,
    progress: createKpSemanticProgress(1n, 2n),
    drivers: [{ declaration: undeclared, value: "changed" }]
  }), "undeclared-overlay-driver");
});

test("overlay values must remain structural ephemeral data", () => {
  const fixture = createFixture();
  assertSourceFailure(() => createKpEphemeralSemanticStateReadSource({
    application: fixture.application,
    progress: createKpSemanticProgress(1n, 2n),
    drivers: [{ declaration: fixture.transition, value: () => 3 }]
  }), "invalid-overlay-value");
});

test("presentation metadata cannot masquerade as a driver overlay", () => {
  const fixture = createFixture();
  assertSourceFailure(() => Reflect.apply(
    createKpEphemeralSemanticStateReadSource,
    undefined,
    [{
      application: fixture.application,
      progress: createKpSemanticProgress(1n, 2n),
      drivers: [{ declaration: fixture.presentation, value: "emphasized" }]
    }]
  ), "presentation-only-overlay-driver");
});

function createFixture(namespace = "lesson.family-sample-source") {
  const compiled = compileKpSemanticStateSchema(namespace, kpStateGroup({
    value: kpStateValue({ amount: 2 }),
    other: kpStateValue("stable")
  }));
  const handles = createKpSemanticStateHandleSet(compiled);
  const initial = materializeKpSemanticStateInitialSnapshot(compiled);
  const transition = declareKpSemanticStateInterpolation({
    id: "value-interpolation",
    sourceId: `${namespace}.value`,
    target: handles.refs.value
  });
  const presentation = declareKpSemanticStatePresentationTransition({
    id: "other-presentation",
    sourceId: `${namespace}.other`,
    target: handles.refs.other
  });
  const family = defineKpSemanticStateFamily({
    compiled,
    handles,
    id: "raise-value",
    sourceId: `${namespace}.raise-value`,
    parameters: kpStateFamilyParameters<{ readonly delta: number }>(),
    transitions: builder => [
      builder.interpolate(transition, ({ before }) => before),
      builder.presentation(presentation)
    ] as const,
    author(parameters, state) {
      state.value.update(({ amount }) => ({
        amount: amount + parameters.delta
      }));
    }
  });
  const application = family.apply(initial, {
    applicationId: "first",
    parameters: { delta: 2 },
    sourceId: `${namespace}.application.first`
  });
  return {
    compiled,
    handles,
    initial,
    transition,
    presentation,
    family,
    application
  };
}

function captureHistory(fixture: ReturnType<typeof createFixture>) {
  return {
    snapshots: [
      fixture.application.commit.before,
      fixture.application.commit.after
    ],
    snapshotIds: [
      fixture.application.commit.before.id,
      fixture.application.commit.after.id
    ],
    versionIds: [
      ...fixture.application.commit.before.entityStores,
      ...fixture.application.commit.after.entityStores
    ].flatMap((store) => store.versions.map(({ id }) => id)),
    transactionId: fixture.application.commit.transactionId,
    journal: fixture.application.commit.journal
  };
}

function assertSourceFailure(
  createSource: () => unknown,
  code: KpSemanticStateSampleSourceError["code"]
): void {
  assert.throws(createSource, (error) =>
    error instanceof KpSemanticStateSampleSourceError &&
      error.code === code
  );
}
