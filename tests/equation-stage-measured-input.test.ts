import assert from "node:assert/strict";
import test from "node:test";

import {
  compileKpFoldableDistributionStaticProjection
} from "../src/semantic/foldable-distribution-fold-projection.ts";
import {
  createKpFoldableDistributionFoldIntent
} from "../src/semantic/foldable-distribution-fold-intent.ts";
import {
  createKpFoldableDistributionEndpointSpecs
} from "../src/semantic/foldable-distribution-endpoint-spec.ts";
import {
  planKpFoldableDistributionLayout
} from "../src/reader/runtime/foldable-distribution-layout.ts";
import {
  compileKpMeasuredEquationStageInput,
  createKpEquationStageMeasurementIdentity,
  type KpEquationStageEnvelopeDefinition,
  type KpEquationStageEnvelopeObservation,
  type KpEquationStagePhaseIntent
} from "../src/reader/runtime/equation-stage-layout.ts";

const measurementIdentity = createKpEquationStageMeasurementIdentity({
  revision: 4,
  coordinateSpaceId: "fixture.foldable-stage"
});

function foldableFixture() {
  const projection = compileKpFoldableDistributionStaticProjection(
    createKpFoldableDistributionFoldIntent({ mode: "expanded" })
  );
  const intent = planKpFoldableDistributionLayout({
    projection,
    viewport: "phone"
  }).phases[0]!;
  const requested = new Set(intent.rows.flatMap(({ envelopeIds }) => envelopeIds));
  const definitions: KpEquationStageEnvelopeDefinition[] = [];
  for (const endpoint of createKpFoldableDistributionEndpointSpecs()) {
    for (const envelope of endpoint.groupEnvelopes) {
      if (!requested.has(envelope.id)) continue;
      definitions.push({
        id: envelope.id,
        transitionId: intent.nodeId,
        endpointObjectId: endpoint.objectId,
        memberOwnerIds: envelope.memberSelectorIds
      });
    }
  }
  const observations = definitions.map((definition, index) => ({
    ...definition,
    rect: {
      left: index * 120,
      top: index % 2 * 48,
      width: 100,
      height: 32
    },
    baselineY: index % 2 * 48 + 24,
    emSizePx: 16,
    measurementIdentity
  }));
  return { intent, definitions, observations };
}

test("foldable row envelopes close over complete native endpoint membership", () => {
  const fixture = foldableFixture();
  const measured = compileKpMeasuredEquationStageInput({
    ...fixture,
    measurementIdentity
  });

  assert.equal(measured.executionState, "measured");
  assert.deepEqual(
    measured.envelopes.map(({ id }) => id),
    fixture.intent.rows.flatMap(({ envelopeIds }) => envelopeIds)
  );
  assert.ok(measured.envelopes.every(
    ({ measurementIdentity: identity }) => identity === measured.measurementIdentity
  ));
});

test("measured input rejects missing, duplicate, and cross-transition envelopes", () => {
  const fixture = foldableFixture();
  assert.throws(
    () => compileKpMeasuredEquationStageInput({
      ...fixture,
      definitions: fixture.definitions.slice(1),
      measurementIdentity
    }),
    /no semantic definition/
  );
  assert.throws(
    () => compileKpMeasuredEquationStageInput({
      ...fixture,
      observations: [...fixture.observations, fixture.observations[0]!],
      measurementIdentity
    }),
    /repeats observation/
  );
  assert.throws(
    () => compileKpMeasuredEquationStageInput({
      ...fixture,
      observations: fixture.observations.map((observation, index) =>
        index === 0
          ? { ...observation, transitionId: "transition.foreign" }
          : observation
      ),
      measurementIdentity
    }),
    /crosses transition/
  );
});

test("measured input rejects partial activity, foreign members, and mixed spaces", () => {
  const fixture = foldableFixture();
  for (const observations of [
    fixture.observations.map((observation, index) =>
      index === 0
        ? { ...observation, memberOwnerIds: observation.memberOwnerIds.slice(1) }
        : observation
    ),
    fixture.observations.map((observation, index) =>
      index === 0
        ? { ...observation, memberOwnerIds: [...observation.memberOwnerIds, "foreign"] }
        : observation
    )
  ]) {
    assert.throws(
      () => compileKpMeasuredEquationStageInput({
        ...fixture,
        observations,
        measurementIdentity
      }),
      /partially active or has foreign members/
    );
  }
  assert.throws(
    () => compileKpMeasuredEquationStageInput({
      ...fixture,
      observations: fixture.observations.map((observation, index) =>
        index === 0
          ? {
              ...observation,
              measurementIdentity: {
                revision: 5,
                coordinateSpaceId: measurementIdentity.coordinateSpaceId
              }
            }
          : observation
      ),
      measurementIdentity
    }),
    /measurement identity mismatch/
  );
});

test("nested semantic groups may share native members without becoming duplicates", () => {
  const intent: KpEquationStagePhaseIntent = {
    nodeId: "transition.nested",
    policy: "single-row",
    rows: [{
      id: "row.nested",
      role: "equation",
      envelopeIds: ["envelope.outer", "envelope.inner"]
    }]
  };
  const definitions: readonly KpEquationStageEnvelopeDefinition[] = [
    {
      id: "envelope.outer",
      transitionId: intent.nodeId,
      endpointObjectId: "endpoint.nested",
      memberOwnerIds: ["owner.a", "owner.b", "owner.c"]
    },
    {
      id: "envelope.inner",
      transitionId: intent.nodeId,
      endpointObjectId: "endpoint.nested",
      memberOwnerIds: ["owner.b", "owner.c"]
    }
  ];
  const observations: readonly KpEquationStageEnvelopeObservation[] =
    definitions.map((definition, index) => ({
      ...definition,
      rect: { left: index * 10, top: 0, width: 40, height: 20 },
      baselineY: 15,
      emSizePx: 16,
      measurementIdentity
    }));

  assert.equal(
    compileKpMeasuredEquationStageInput({
      intent,
      definitions,
      observations,
      measurementIdentity
    }).envelopes.length,
    2
  );
});
