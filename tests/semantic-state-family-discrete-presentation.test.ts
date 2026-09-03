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
  createKpSemanticStateFamilyEvaluator,
  KpSemanticStateFamilyEvaluatorError
} from "../src/semantic-state/state-family-evaluator.ts";
import {
  defineKpSemanticStateFamily,
  kpStateFamilyParameters
} from "../src/semantic-state/state-family-definition.ts";
import {
  declareKpSemanticStateDiscreteTransition,
  declareKpSemanticStatePresentationTransition
} from "../src/semantic-state/state-family-transition.ts";

test("discrete driver selects only explicit exact change points", () => {
  const fixture = createFixture();
  const evaluator = createKpSemanticStateFamilyEvaluator(fixture);

  assert.equal(readPhase(evaluator.at(createKpSemanticProgress(1n, 4n))),
    "before");
  assert.equal(readPhase(evaluator.at(createKpSemanticProgress(1n, 3n))),
    "middle");
  assert.equal(readPhase(evaluator.at(createKpSemanticProgress(1n, 2n))),
    "middle");
  assert.equal(readPhase(evaluator.at(createKpSemanticProgress(3n, 4n))),
    "after");
  assert.deepEqual(fixture.selected, ["middle", "middle", "after"]);
});

test("discrete sampling is identical under direct seek and rewind", () => {
  const fixture = createFixture();
  const evaluator = createKpSemanticStateFamilyEvaluator(fixture);
  const forward = [1n, 2n, 3n].map((numerator) =>
    readPhase(evaluator.at(createKpSemanticProgress(numerator, 4n)))
  );
  const reverse = [3n, 2n, 1n].map((numerator) =>
    readPhase(evaluator.at(createKpSemanticProgress(numerator, 4n)))
  );

  assert.deepEqual(reverse, [...forward].reverse());
});

test("presentation-only transition emits metadata and no semantic overlay", () => {
  const fixture = createFixture();
  const sample = createKpSemanticStateFamilyEvaluator(fixture).at(
    createKpSemanticProgress(1n, 2n)
  );
  assert.equal(sample.kind, "ephemeral-interior");
  if (sample.kind !== "ephemeral-interior") {
    throw new Error("Expected an ephemeral interior sample.");
  }

  assert.equal(sample.source.drivers.length, 1);
  assert.equal(sample.source.drivers.some(({ targetSlotId }) =>
    targetSlotId === fixture.handles.refs.label.slotId), false);
  assert.equal(fixture.handles.pin(
    sample.source.base.snapshot
  ).label.read(), "stable label");
  assert.deepEqual(sample.presentationTransitions, [{
    schemaVersion: "kp.semantic-state-family-presentation-transition.v1",
    kind: "semantic-state-family-presentation-transition",
    declarationId: "label-emphasis",
    sourceId: "lesson.family-discrete-presentation.label",
    targetSlotId: fixture.handles.refs.label.slotId,
    targetPath: ["label"]
  }]);
  assert.equal(Object.isFrozen(sample.presentationTransitions), true);
});

test("discrete selector receives authored value-source authority", () => {
  const fixture = createFixture();
  createKpSemanticStateFamilyEvaluator(fixture).at(
    createKpSemanticProgress(2n, 3n)
  );

  assert.deepEqual(fixture.selectionInputs, [{
    changePointId: "after",
    valueSourceId: "lesson.family-discrete-presentation.phase.after"
  }]);
});

test("invalid and failed discrete selections do not expose a sample", () => {
  const invalid = createFixture({ invalidResult: true });
  assert.throws(() => createKpSemanticStateFamilyEvaluator(invalid).at(
    createKpSemanticProgress(1n, 2n)
  ), (error) => error instanceof KpSemanticStateFamilyEvaluatorError &&
    error.code === "invalid-discrete-result"
  );

  const failure = new Error("selection stopped");
  const failed = createFixture({ failure });
  assert.throws(() => createKpSemanticStateFamilyEvaluator(failed).at(
    createKpSemanticProgress(1n, 2n)
  ), (error) => error instanceof KpSemanticStateFamilyEvaluatorError &&
    error.code === "discrete-selection-failed" && error.cause === failure
  );
});

function createFixture(input: {
  readonly invalidResult?: boolean;
  readonly failure?: Error;
} = {}) {
  const compiled = compileKpSemanticStateSchema(
    "lesson.family-discrete-presentation",
    kpStateGroup({
      phase: kpStateValue<"before" | "middle" | "after">("before"),
      label: kpStateValue("stable label")
    })
  );
  const handles = createKpSemanticStateHandleSet(compiled);
  const initial = materializeKpSemanticStateInitialSnapshot(compiled);
  const discrete = declareKpSemanticStateDiscreteTransition({
    id: "phase-change",
    sourceId: "lesson.family-discrete-presentation.phase",
    target: handles.refs.phase,
    changePoints: [
      {
        id: "after",
        at: createKpSemanticProgress(2n, 3n),
        valueSourceId: "lesson.family-discrete-presentation.phase.after"
      },
      {
        id: "middle",
        at: createKpSemanticProgress(1n, 3n),
        valueSourceId: "lesson.family-discrete-presentation.phase.middle"
      }
    ]
  });
  const presentation = declareKpSemanticStatePresentationTransition({
    id: "label-emphasis",
    sourceId: "lesson.family-discrete-presentation.label",
    target: handles.refs.label
  });
  const selected: string[] = [];
  const selectionInputs: Array<{
    readonly changePointId: string;
    readonly valueSourceId: string;
  }> = [];
  const definition = defineKpSemanticStateFamily({
    compiled,
    handles,
    id: "advance-phase",
    sourceId: "lesson.family-discrete-presentation.advance-phase",
    parameters: kpStateFamilyParameters<{
      readonly finalPhase: "after";
    }>(),
    transitions: builder => [
      builder.discrete(discrete, ({
        changePointId,
        valueSourceId
      }) => {
        selected.push(changePointId);
        selectionInputs.push({ changePointId, valueSourceId });
        if (input.failure !== undefined) throw input.failure;
        if (input.invalidResult === true) {
          return Number.NaN as unknown as "middle" | "after";
        }
        return changePointId === "middle" ? "middle" : "after";
      }),
      builder.presentation(presentation)
    ] as const,
    author(parameters, state) {
      state.phase.update(() => parameters.finalPhase);
    }
  });
  const application = definition.apply(initial, {
    applicationId: "first",
    parameters: { finalPhase: "after" },
    sourceId: "lesson.family-discrete-presentation.application.first"
  });
  return {
    definition,
    application,
    handles,
    selected,
    selectionInputs
  };
}

function readPhase(
  sample: ReturnType<ReturnType<
    typeof createKpSemanticStateFamilyEvaluator
  >["at"]>
) {
  assert.equal(sample.kind, "ephemeral-interior");
  if (sample.kind !== "ephemeral-interior") {
    throw new Error("Expected an ephemeral interior sample.");
  }
  return sample.source.drivers[0]?.value;
}
