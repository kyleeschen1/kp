import assert from "node:assert/strict";
import test from "node:test";

import { compileKpSemanticStateSchema } from
  "../src/semantic-state/authoring-schema-compiler.ts";
import {
  kpStateDerived,
  kpStateGroup,
  kpStateValue
} from "../src/semantic-state/authoring-schema.ts";
import { createKpSemanticStateHandleSet } from
  "../src/semantic-state/authoring-state-handles.ts";
import { createKpSemanticProgress } from
  "../src/semantic-state/semantic-progress.ts";
import {
  compileKpSemanticStateTransitionPlan,
  declareKpSemanticStateDiscreteTransition,
  declareKpSemanticStateInterpolation,
  declareKpSemanticStatePresentationTransition,
  type KpSemanticStateTransitionPlan
} from "../src/semantic-state/state-family-transition.ts";
import {
  projectKpSemanticStateTransitionFootprint,
  type KpSemanticStateTransitionFootprintError
} from "../src/semantic-state/state-family-transition-footprint.ts";

function fixture() {
  const compiled = compileKpSemanticStateSchema(
    "lesson.aggregate-footprint",
    kpStateGroup({
      amount: kpStateValue(0),
      phase: kpStateValue<"before" | "after">("before"),
      outcome: kpStateDerived<number>()
    })
  );
  const handles = createKpSemanticStateHandleSet(compiled);
  const semantic = declareKpSemanticStateInterpolation({
    id: "amount-interpolation",
    sourceId: "test.footprint.amount",
    target: handles.refs.amount
  });
  const discrete = declareKpSemanticStateDiscreteTransition({
    id: "phase-change",
    sourceId: "test.footprint.phase",
    target: handles.refs.phase,
    changePoints: [{
      id: "settled",
      at: createKpSemanticProgress(1n, 2n),
      valueSourceId: "test.footprint.phase.settled"
    }]
  });
  const presentation = declareKpSemanticStatePresentationTransition({
    id: "outcome-emphasis",
    sourceId: "test.footprint.outcome",
    target: handles.refs.outcome
  });
  return { compiled, semantic, discrete, presentation };
}

test("footprints separate semantic discrete and presentation-only targets", () => {
  const data = fixture();
  const plan = compileKpSemanticStateTransitionPlan({
    compiled: data.compiled,
    declarations: [data.presentation, data.discrete, data.semantic]
  });
  const footprint = projectKpSemanticStateTransitionFootprint(plan);

  assert.deepEqual(footprint.semanticWrites.map(project), [{
    writeClass: "semantic-write",
    declarationId: "amount-interpolation",
    sourceId: "test.footprint.amount",
    path: ["amount"],
    encodedPath: "amount"
  }]);
  assert.deepEqual(footprint.discreteWrites.map(project), [{
    writeClass: "discrete-write",
    declarationId: "phase-change",
    sourceId: "test.footprint.phase",
    path: ["phase"],
    encodedPath: "phase"
  }]);
  assert.deepEqual(footprint.presentationOnly.map(project), [{
    writeClass: "presentation-only",
    declarationId: "outcome-emphasis",
    sourceId: "test.footprint.outcome",
    path: ["outcome"],
    encodedPath: "outcome"
  }]);
  assert.equal(Object.isFrozen(footprint), true);
  assert.equal(Object.isFrozen(footprint.targetIndex), true);
});

test("an exact repeated declaration normalizes to one footprint entry", () => {
  const data = fixture();
  const plan = {
    schemaVersion: "kp.semantic-state-transition-plan.v1",
    kind: "semantic-state-transition-plan",
    namespace: data.compiled.namespace,
    declarations: [data.semantic, data.semantic]
  } as KpSemanticStateTransitionPlan;

  assert.equal(
    projectKpSemanticStateTransitionFootprint(plan).semanticWrites.length,
    1
  );
});

test("competing footprint owners fail instead of normalizing", () => {
  const data = fixture();
  const competing = {
    ...data.semantic,
    id: "competing-amount"
  } as typeof data.semantic;
  const plan = {
    schemaVersion: "kp.semantic-state-transition-plan.v1",
    kind: "semantic-state-transition-plan",
    namespace: data.compiled.namespace,
    declarations: [data.semantic, competing]
  } as KpSemanticStateTransitionPlan;

  assert.equal(captureCode(plan), "duplicate-footprint-target");
});

test("forged derived and foreign writes fail at footprint projection", () => {
  const data = fixture();
  const derivedWrite = {
    ...data.semantic,
    target: {
      ...data.semantic.target,
      descriptorKind: "derived-value"
    }
  } as typeof data.semantic;
  assert.equal(captureCode({
    schemaVersion: "kp.semantic-state-transition-plan.v1",
    kind: "semantic-state-transition-plan",
    namespace: data.compiled.namespace,
    declarations: [derivedWrite]
  }), "derived-semantic-write");

  const foreign = {
    ...data.semantic,
    target: { ...data.semantic.target, namespace: "lesson.foreign" }
  } as typeof data.semantic;
  assert.equal(captureCode({
    schemaVersion: "kp.semantic-state-transition-plan.v1",
    kind: "semantic-state-transition-plan",
    namespace: data.compiled.namespace,
    declarations: [foreign]
  }), "foreign-footprint-target");
});

function project(entry: ReturnType<
  typeof projectKpSemanticStateTransitionFootprint
>["semanticWrites"][number]) {
  return {
    writeClass: entry.writeClass,
    declarationId: entry.declarationId,
    sourceId: entry.sourceId,
    path: entry.target.path,
    encodedPath: entry.target.encodedPath
  };
}

function captureCode(plan: KpSemanticStateTransitionPlan):
  KpSemanticStateTransitionFootprintError["code"] {
  try {
    projectKpSemanticStateTransitionFootprint(plan);
  } catch (error) {
    return (error as KpSemanticStateTransitionFootprintError).code;
  }
  throw new Error("Expected transition footprint projection to fail.");
}
