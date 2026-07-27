import assert from "node:assert/strict";
import test from "node:test";

import {
  certifyKpTwoRowEquationStageLayout,
  compileKpMeasuredEquationStageInput,
  createKpEquationStageMeasurementIdentity,
  type KpEquationStageEnvelopeDefinition,
  type KpEquationStageEnvelopeObservation,
  type KpEquationStageRect
} from "../src/reader/runtime/equation-stage-layout.ts";
import {
  certifyKpEquationStageTransitCorridor
} from "../src/reader/runtime/equation-stage-transit-corridor.ts";

const identity = createKpEquationStageMeasurementIdentity({
  revision: 9,
  coordinateSpaceId: "fixture.transit-corridor"
});

function baseLayout() {
  const intent = {
    nodeId: "transition.corridor",
    policy: "semantic-two-row-stage" as const,
    rows: [
      {
        id: "row.first",
        role: "first-branch",
        envelopeIds: ["envelope.first.source", "envelope.first.target"]
      },
      {
        id: "row.second",
        role: "second-branch",
        envelopeIds: ["envelope.second.target"]
      }
    ]
  };
  const rects = {
    "envelope.first.source": { left: 10, top: 10, width: 30, height: 20 },
    "envelope.first.target": { left: 100, top: 10, width: 32, height: 20 },
    "envelope.second.target": { left: 70, top: 12, width: 36, height: 22 }
  } as const;
  const definitions: KpEquationStageEnvelopeDefinition[] =
    Object.keys(rects).map((id) => ({
      id,
      transitionId: intent.nodeId,
      endpointObjectId: `endpoint.${id}`,
      memberOwnerIds: [`owner.${id}`]
    }));
  const observations: KpEquationStageEnvelopeObservation[] =
    definitions.map((definition) => ({
      ...definition,
      rect: rects[definition.id as keyof typeof rects],
      baselineY: 26,
      emSizePx: 16,
      measurementIdentity: identity
    }));
  return certifyKpTwoRowEquationStageLayout(
    compileKpMeasuredEquationStageInput({
      intent,
      definitions,
      observations,
      measurementIdentity: identity
    })
  );
}

function corridor() {
  return certifyKpEquationStageTransitCorridor({
    layout: baseLayout(),
    transits: [
      {
        id: "transit.cross-row",
        sourceRowId: "row.first",
        targetRowId: "row.second",
        sourceRect: { left: 12, top: 12, width: 12, height: 16 },
        targetRect: { left: 76, top: 14, width: 12, height: 16 }
      },
      {
        id: "transit.same-row",
        sourceRowId: "row.first",
        targetRowId: "row.first",
        sourceRect: { left: 12, top: 12, width: 12, height: 16 },
        targetRect: { left: 112, top: 12, width: 12, height: 16 }
      }
    ]
  });
}

test("corridor separates rows and chooses direct versus lifted transit", () => {
  const certificate = corridor();
  const [first, second] = certificate.rows;
  const protectedRect = certificate.protectedTransitCorridor.rect;

  assert.equal(certificate.transits[0]?.route, "direct");
  assert.equal(certificate.transits[1]?.route, "lifted");
  assert.equal(protectedRect.top, first!.rect.top + first!.rect.height);
  assert.equal(protectedRect.top + protectedRect.height, second!.rect.top);
  assert.equal(intersects(protectedRect, first!.rect), false);
  assert.equal(intersects(protectedRect, second!.rect), false);
  assert.ok(
    protectedRect.height >=
    16 + certificate.protectedTransitCorridor.clearancePx * 2
  );
});

test("lifted material clears both rows inside the protected corridor", () => {
  const certificate = corridor();
  const lifted = certificate.transits.find(({ route }) => route === "lifted")!;
  const horizontal = lifted.points.slice(1, 3);
  const corridorRect = certificate.protectedTransitCorridor.rect;
  const halfMaterialHeight = 8;
  for (const point of horizontal) {
    assert.ok(
      point.y - halfMaterialHeight >=
      corridorRect.top + certificate.protectedTransitCorridor.clearancePx
    );
    assert.ok(
      point.y + halfMaterialHeight <=
      corridorRect.top + corridorRect.height -
        certificate.protectedTransitCorridor.clearancePx
    );
  }
});

test("full swept bounds contain rows, corridor, and every transit", () => {
  const certificate = corridor();
  for (const rect of [
    ...certificate.rows.map(({ rect }) => rect),
    certificate.protectedTransitCorridor.rect,
    ...certificate.transits.map(({ sweptBounds }) => sweptBounds)
  ]) {
    assert.equal(contains(certificate.sweptBounds, rect), true);
  }
  assert.deepEqual(corridor(), certificate);
});

test("corridor rejects duplicate, unknown-row, and escaped transit evidence", () => {
  const valid = {
    id: "transit.valid",
    sourceRowId: "row.first",
    targetRowId: "row.second",
    sourceRect: { left: 12, top: 12, width: 12, height: 16 },
    targetRect: { left: 76, top: 14, width: 12, height: 16 }
  };
  assert.throws(
    () => certifyKpEquationStageTransitCorridor({
      layout: baseLayout(),
      transits: [valid, valid]
    }),
    /ids must be unique/
  );
  assert.throws(
    () => certifyKpEquationStageTransitCorridor({
      layout: baseLayout(),
      transits: [{ ...valid, targetRowId: "row.unknown" }]
    }),
    /unknown row/
  );
  assert.throws(
    () => certifyKpEquationStageTransitCorridor({
      layout: baseLayout(),
      transits: [{
        ...valid,
        sourceRect: { left: -100, top: -100, width: 12, height: 16 }
      }]
    }),
    /escapes its semantic row occupancy/
  );
});

function intersects(left: KpEquationStageRect, right: KpEquationStageRect) {
  return Math.min(left.left + left.width, right.left + right.width) >
    Math.max(left.left, right.left) &&
    Math.min(left.top + left.height, right.top + right.height) >
    Math.max(left.top, right.top);
}

function contains(outer: KpEquationStageRect, inner: KpEquationStageRect) {
  return inner.left >= outer.left &&
    inner.top >= outer.top &&
    inner.left + inner.width <= outer.left + outer.width &&
    inner.top + inner.height <= outer.top + outer.height;
}
