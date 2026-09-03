import assert from "node:assert/strict";
import test from "node:test";

import { compileKpSemanticStateSchema } from
  "../src/semantic-state/authoring-schema-compiler.ts";
import { kpStateGroup, kpStateValue } from
  "../src/semantic-state/authoring-schema.ts";
import { createKpSemanticStateHandleSet } from
  "../src/semantic-state/authoring-state-handles.ts";
import {
  defineKpSemanticStateFamily,
  kpStateFamilyParameters,
  KpSemanticStateFamilyError
} from "../src/semantic-state/state-family-definition.ts";
import {
  declareKpSemanticStateInterpolation
} from "../src/semantic-state/state-family-transition.ts";

interface ScaleParameters {
  readonly scale: number;
  readonly reason: string;
}

test("family records reuse transformation identity and freeze typed inputs", () => {
  const fixture = createFixture();
  const family = createFamily(fixture);
  const mutable = { scale: 3, reason: "pressure" };
  const application = family.prepareApplication({
    applicationId: "first",
    parameters: mutable,
    sourceId: "lesson.family-definition.application.first"
  });
  mutable.scale = 9;

  assert.equal(
    family.id,
    "kp-state/lesson.family-definition/transformation/scale-amount"
  );
  assert.equal(application.definitionId, family.id);
  assert.equal(
    application.transformationId,
    "kp-state/lesson.family-definition/transformation/scale-amount/application/first"
  );
  assert.deepEqual(application.parameters, {
    scale: 3,
    reason: "pressure"
  });
  assert.deepEqual(application.source, {
    schemaVersion: "kp.semantic-state-family-source-provenance.v1",
    kind: "authored",
    sourceId: "lesson.family-definition.application.first"
  });
  assert.equal(application.transitionPlan, family.declaration.transitionPlan);
  assert.equal(Object.isFrozen(application), true);
  assert.equal(Object.isFrozen(application.parameters), true);
  assert.equal(Object.isFrozen(application.source), true);
});

test("callback identity cannot become family or application authority", () => {
  const fixture = createFixture();
  const first = createFamily(fixture);
  const second = createFamily(fixture, true);
  const applicationInput = {
    applicationId: "stable",
    parameters: { scale: 2, reason: "same-data" },
    sourceId: "lesson.family-definition.application.stable"
  } as const;

  assert.equal(first.id, second.id);
  assert.deepEqual(first.declaration, second.declaration);
  assert.equal(
    first.prepareApplication(applicationInput).transformationId,
    second.prepareApplication(applicationInput).transformationId
  );
  assert.notEqual(
    first.capabilities.transitions[0]?.interpolate,
    second.capabilities.transitions[0]?.interpolate
  );
});

test("family parameters and provenance fail at the local boundary", () => {
  const family = createFamily(createFixture());
  assert.throws(() => Reflect.apply(family.prepareApplication, family, [{
    applicationId: "invalid-parameters",
    parameters: { scale: () => 2, reason: "executable" },
    sourceId: "lesson.family-definition.application.invalid"
  }]), (error) => {
    assert.ok(error instanceof KpSemanticStateFamilyError);
    assert.equal(error.code, "invalid-family-parameters");
    return true;
  });
  assert.throws(() => family.prepareApplication({
    applicationId: "invalid-source",
    parameters: { scale: 2, reason: "source" },
    sourceId: " "
  }), (error) => {
    assert.ok(error instanceof KpSemanticStateFamilyError);
    assert.equal(error.code, "invalid-family-source");
    return true;
  });
});

function createFixture() {
  const compiled = compileKpSemanticStateSchema(
    "lesson.family-definition",
    kpStateGroup({ amount: kpStateValue<number>(2) })
  );
  return {
    compiled,
    handles: createKpSemanticStateHandleSet(compiled)
  };
}

function createFamily(
  fixture: ReturnType<typeof createFixture>,
  alternate = false
) {
  const amount = declareKpSemanticStateInterpolation({
    id: "amount-interpolation",
    sourceId: "lesson.family-definition.amount",
    target: fixture.handles.refs.amount
  });
  return defineKpSemanticStateFamily({
    ...fixture,
    id: "scale-amount",
    sourceId: "lesson.family-definition.scale-amount",
    parameters: kpStateFamilyParameters<ScaleParameters>(),
    transitions: builder => [
      builder.interpolate(amount, ({ before, after, parameters }) =>
        alternate
          ? after - (after - before) / parameters.scale
          : before + (after - before) / parameters.scale
      )
    ] as const,
    author(parameters, state) {
      state.amount.update(previous => previous * parameters.scale);
    }
  });
}
