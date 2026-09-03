import assert from "node:assert/strict";
import test from "node:test";

import {
  addExactRationals,
  createExactRational,
  multiplyExactRationals,
  subtractExactRationals,
  type NormalizedExactRational
} from "../protocols/exact-rational.ts";
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
  createKpSemanticStateFamilyEvaluator,
  KpSemanticStateFamilyEvaluatorError
} from "../src/semantic-state/state-family-evaluator.ts";
import {
  defineKpSemanticStateFamily,
  kpStateFamilyParameters
} from "../src/semantic-state/state-family-definition.ts";
import { declareKpSemanticStateInterpolation } from
  "../src/semantic-state/state-family-transition.ts";

test("typed semantic interpolator produces one exact interior driver", () => {
  const fixture = createFixture();
  const evaluator = createKpSemanticStateFamilyEvaluator(fixture);
  const sample = evaluator.at(createKpSemanticProgress(1n, 2n));

  assert.equal(sample.kind, "ephemeral-interior");
  if (sample.kind !== "ephemeral-interior") {
    throw new Error("Expected an ephemeral interior sample.");
  }
  assert.equal(sample.source.base.snapshot, fixture.initial);
  assert.equal(sample.source.drivers.length, 1);
  assert.equal(
    sample.source.drivers[0]?.targetSlotId,
    fixture.transition.target.slotId
  );
  assert.deepEqual(sample.source.drivers[0]?.value, createExactRational(4n));
  assert.equal(fixture.interpolateCalls, 1);
  assert.equal("view" in sample, false);
});

test("equivalent progress produces the same canonical overlay result", () => {
  const fixture = createFixture();
  const evaluator = createKpSemanticStateFamilyEvaluator(fixture);
  const first = evaluator.at(createKpSemanticProgress(1n, 2n));
  const second = evaluator.at(createKpSemanticProgress(2n, 4n));

  assert.equal(first.kind, "ephemeral-interior");
  assert.equal(second.kind, "ephemeral-interior");
  if (first.kind !== "ephemeral-interior" ||
    second.kind !== "ephemeral-interior") {
    throw new Error("Expected ephemeral interior samples.");
  }
  assert.deepEqual(first.source.progress, second.source.progress);
  assert.deepEqual(first.source.drivers, second.source.drivers);
  assert.equal(fixture.interpolateCalls, 2);
});

test("interpolation receives exact driver parameter and progress types", () => {
  const fixture = createFixture();
  createKpSemanticStateFamilyEvaluator(fixture).at(
    createKpSemanticProgress(1n, 2n)
  );

  assert.deepEqual(fixture.callbackTypes, {
    before: createExactRational(2n),
    after: createExactRational(6n),
    parameter: createExactRational(6n),
    progress: createKpSemanticProgress(1n, 2n)
  });
});

test("invalid interpolation results fail before a sample escapes", () => {
  const fixture = createFixture({ invalidResult: true });
  const evaluator = createKpSemanticStateFamilyEvaluator(fixture);

  assert.throws(() => evaluator.at(createKpSemanticProgress(1n, 2n)),
    (error) => error instanceof KpSemanticStateFamilyEvaluatorError &&
      error.code === "invalid-interpolation-result" &&
      error.declarationId === fixture.transition.id
  );
  assert.equal(fixture.application.commit.before, fixture.initial);
  assert.equal(fixture.application.commit.journal.length, 1);
});

test("interpolation failures retain their exact cause and no partial sample", () => {
  const failure = new Error("interpolator stopped");
  const fixture = createFixture({ failure });
  const evaluator = createKpSemanticStateFamilyEvaluator(fixture);

  assert.throws(() => evaluator.at(createKpSemanticProgress(1n, 3n)),
    (error) => error instanceof KpSemanticStateFamilyEvaluatorError &&
      error.code === "interpolation-failed" && error.cause === failure
  );
});

function createFixture(input: {
  readonly invalidResult?: boolean;
  readonly failure?: Error;
} = {}) {
  const compiled = compileKpSemanticStateSchema(
    "lesson.family-interpolation",
    kpStateGroup({ amount: kpStateValue<NormalizedExactRational>(
      createExactRational(2n)
    ) })
  );
  const handles = createKpSemanticStateHandleSet(compiled);
  const initial = materializeKpSemanticStateInitialSnapshot(compiled);
  const transition = declareKpSemanticStateInterpolation({
    id: "amount-interpolation",
    sourceId: "lesson.family-interpolation.amount",
    target: handles.refs.amount
  });
  let interpolateCalls = 0;
  let callbackTypes: Record<string, unknown> = {};
  const definition = defineKpSemanticStateFamily({
    compiled,
    handles,
    id: "set-amount",
    sourceId: "lesson.family-interpolation.set-amount",
    parameters: kpStateFamilyParameters<{
      readonly target: NormalizedExactRational;
    }>(),
    transitions: builder => [builder.interpolate(
      transition,
      ({ before, after, parameters, progress }) => {
        const typedBefore: NormalizedExactRational = before;
        const typedAfter: NormalizedExactRational = after;
        const typedParameter: NormalizedExactRational = parameters.target;
        // @ts-expect-error Exact driver values cannot widen to an unrelated type.
        const wrongType: string = before;
        void wrongType;
        interpolateCalls += 1;
        callbackTypes = {
          before: typedBefore,
          after: typedAfter,
          parameter: typedParameter,
          progress
        };
        if (input.failure !== undefined) throw input.failure;
        if (input.invalidResult === true) {
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
    parameters: { target: createExactRational(6n) },
    sourceId: "lesson.family-interpolation.application.first"
  });
  return {
    definition,
    application,
    initial,
    transition,
    get interpolateCalls() {
      return interpolateCalls;
    },
    get callbackTypes() {
      return callbackTypes;
    }
  };
}
