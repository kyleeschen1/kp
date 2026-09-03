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
import type { KpSemanticStateOperationTree } from
  "../src/semantic-state/authoring-state-transform.ts";
import {
  KpSemanticStateFamilyApplicationValidationError
} from
  "../src/semantic-state/state-family-application-validation.ts";
import {
  defineKpSemanticStateFamily,
  kpStateFamilyParameters
} from "../src/semantic-state/state-family-definition.ts";
import {
  createKpSemanticProgress
} from "../src/semantic-state/semantic-progress.ts";
import {
  declareKpSemanticStateDiscreteTransition,
  declareKpSemanticStateInterpolation,
  declareKpSemanticStatePresentationTransition,
  KpSemanticStateTransitionValidationError
} from "../src/semantic-state/state-family-transition.ts";

test("one declared driver produces one validated persistent endpoint", () => {
  const fixture = createFixture();
  const family = createFamily(fixture, {
    author(delta, state) {
      state.amount.update(previous => previous + delta);
    }
  });

  const applied = family.apply(fixture.initial, applicationInput);

  assert.equal(applied.after.amount.read(), 5);
  assert.deepEqual(applied.commit.journal.map(({ operation }) =>
    operation.kind), ["update"]);
});

test("endpoint rejects an undeclared write and the missing declared driver", () => {
  const fixture = createFixture();
  const family = createFamily(fixture, {
    author(delta, state) {
      state.other.update(previous => previous + delta);
    }
  });

  assertApplicationFailure(() => family.apply(
    fixture.initial,
    applicationInput
  ), [
    "undeclared-driver-write",
    "missing-driver-write"
  ]);
  assertInputUnchanged(fixture);
});

test("endpoint rejects a missing discrete driver", () => {
  const fixture = createFixture();
  const amount = declareKpSemanticStateInterpolation({
    id: "amount-interpolation",
    sourceId: "lesson.family-application-validation.amount",
    target: fixture.handles.refs.amount
  });
  const other = declareKpSemanticStateDiscreteTransition({
    id: "other-change",
    sourceId: "lesson.family-application-validation.other",
    target: fixture.handles.refs.other,
    changePoints: [{
      id: "other-takes-effect",
      at: createKpSemanticProgress(1n, 2n),
      valueSourceId: "lesson.family-application-validation.other.changed"
    }]
  });
  const family = defineKpSemanticStateFamily({
    compiled: fixture.compiled,
    handles: fixture.handles,
    id: "missing-driver",
    sourceId: "lesson.family-application-validation.missing-driver",
    parameters: kpStateFamilyParameters<{ readonly delta: number }>(),
    transitions: builder => [
      builder.interpolate(amount, interpolateNumber),
      builder.discrete(other, ({ after }) => after)
    ] as const,
    author(parameters, state) {
      state.amount.update(previous => previous + parameters.delta);
    }
  });

  assertApplicationFailure(() => family.apply(
    fixture.initial,
    applicationInput
  ), [
    "missing-driver-write"
  ]);
});

test("presentation-only declarations cannot authorize semantic writes", () => {
  const fixture = createFixture();
  const family = createFamily(fixture, {
    includeOtherPresentation: true,
    author(delta, state) {
      state.amount.update(previous => previous + delta);
      state.other.update(previous => previous + delta);
    }
  });

  assertApplicationFailure(() => family.apply(
    fixture.initial,
    applicationInput
  ), [
    "presentation-only-write"
  ]);
});

test("family boundary rejects cross-schema and derived driver declarations", () => {
  const fixture = createFixture();
  const foreign = createFixture("lesson.family-application-foreign");
  const crossSchema = declareKpSemanticStateInterpolation({
    id: "foreign-amount",
    sourceId: "lesson.family-application-validation.foreign",
    target: foreign.handles.refs.amount
  });
  assert.throws(() => defineKpSemanticStateFamily({
    compiled: fixture.compiled,
    handles: fixture.handles,
    id: "foreign-driver",
    sourceId: "lesson.family-application-validation.foreign-driver",
    parameters: kpStateFamilyParameters<{ readonly delta: number }>(),
    transitions: builder => [
      builder.interpolate(crossSchema, interpolateNumber)
    ] as const,
    author() {}
  }), diagnosticCodes("cross-schema-transition-target"));

  const derivedInterpolation = Reflect.apply(
    declareKpSemanticStateInterpolation,
    undefined,
    [{
      id: "derived-interpolation",
      sourceId: "lesson.family-application-validation.derived",
      target: fixture.handles.refs.total
    }]
  );
  assert.throws(() => defineKpSemanticStateFamily({
    compiled: fixture.compiled,
    handles: fixture.handles,
    id: "derived-driver",
    sourceId: "lesson.family-application-validation.derived-driver",
    parameters: kpStateFamilyParameters<{ readonly delta: number }>(),
    transitions: builder => [
      builder.interpolate(derivedInterpolation, ({ before }) => before)
    ] as const,
    author() {}
  }), diagnosticCodes("invalid-transition-target"));
});

test("endpoint rejects a changed derivation graph before application escapes", () => {
  const fixture = createFixture();
  const replacement = defineKpSemanticStateDerivation({
    compiled: fixture.compiled,
    target: fixture.handles.refs.total,
    dependencies: [fixture.handles.refs.other],
    compute: ([other]) => other
  });
  const family = createFamily(fixture, {
    includeTotalPresentation: true,
    author(delta, state) {
      state.amount.update(previous => previous + delta);
      state.total.derive(replacement);
    }
  });

  assertApplicationFailure(() => family.apply(
    fixture.initial,
    applicationInput
  ), [
    "changed-derivation-authority"
  ]);
  assertInputUnchanged(fixture);
});

function createFixture(
  namespace = "lesson.family-application-validation"
) {
  const compiled = compileKpSemanticStateSchema(namespace, kpStateGroup({
    amount: kpStateValue<number>(2),
    other: kpStateValue<number>(7),
    total: kpStateDerived<number>()
  }));
  const handles = createKpSemanticStateHandleSet(compiled);
  const total = defineKpSemanticStateDerivation({
    compiled,
    target: handles.refs.total,
    dependencies: [handles.refs.amount, handles.refs.other],
    compute: ([amount, other]) => amount + other
  });
  return {
    compiled,
    handles,
    initial: materializeKpSemanticStateInitialSnapshot(compiled, {
      derivations: [total]
    })
  };
}

function createFamily(
  fixture: ReturnType<typeof createFixture>,
  input: {
    readonly includeOtherPresentation?: boolean;
    readonly includeTotalPresentation?: boolean;
    readonly author: (
      delta: number,
      state: KpSemanticStateOperationTree<
        ReturnType<typeof createFixture>["compiled"]["root"]
      >
    ) => void;
  }
) {
  const amount = declareKpSemanticStateInterpolation({
    id: "amount-interpolation",
    sourceId: "lesson.family-application-validation.amount",
    target: fixture.handles.refs.amount
  });
  const other = declareKpSemanticStatePresentationTransition({
    id: "other-presentation",
    sourceId: "lesson.family-application-validation.other",
    target: fixture.handles.refs.other
  });
  const total = declareKpSemanticStatePresentationTransition({
    id: "total-presentation",
    sourceId: "lesson.family-application-validation.total",
    target: fixture.handles.refs.total
  });
  return defineKpSemanticStateFamily({
    compiled: fixture.compiled,
    handles: fixture.handles,
    id: "raise-amount",
    sourceId: "lesson.family-application-validation.raise-amount",
    parameters: kpStateFamilyParameters<{ readonly delta: number }>(),
    transitions: builder => [
      builder.interpolate(amount, interpolateNumber),
      ...(input.includeOtherPresentation
        ? [builder.presentation(other)]
        : []),
      ...(input.includeTotalPresentation
        ? [builder.presentation(total)]
        : [])
    ],
    author(parameters, state) {
      input.author(parameters.delta, state);
    }
  });
}

const applicationInput = {
  applicationId: "first",
  parameters: { delta: 3 },
  sourceId: "lesson.family-application-validation.application.first"
} as const;

function interpolateNumber(input: {
  readonly before: number;
  readonly after: number;
}) {
  return input.before + (input.after - input.before) / 2;
}

function assertApplicationFailure(
  applyFamily: () => unknown,
  expectedCodes: readonly string[]
): void {
  assert.throws(applyFamily, (error) => {
    assert.ok(error instanceof KpSemanticStateFamilyApplicationValidationError);
    assert.deepEqual(error.diagnostics.map(({ code }) => code), expectedCodes);
    assert.equal(Object.isFrozen(error.diagnostics), true);
    return true;
  });
}

function diagnosticCodes(expectedCode: string) {
  return (error: unknown) => {
    assert.ok(error instanceof KpSemanticStateTransitionValidationError);
    assert.deepEqual(error.diagnostics.map(({ code }) => code), [
      expectedCode
    ]);
    return true;
  };
}

function assertInputUnchanged(
  fixture: ReturnType<typeof createFixture>
): void {
  assert.equal(fixture.handles.pin(fixture.initial).amount.read(), 2);
  assert.equal(fixture.handles.pin(fixture.initial).other.read(), 7);
  assert.equal(fixture.initial.entityStores.every(
    store => store.versions.length === 1
  ), true);
}
