import assert from "node:assert/strict";
import test from "node:test";
import {
  certifyKpEquationMeasuredRouteV2,
  sampleKpCertifiedEquationRouteV2,
  type KpEquationMeasuredPaintOwnershipSnapshotV2
} from "../src/rendering/equation-measured-route-certificate-v2.ts";
import {
  compileKpCollisionSafeTransitTracks,
  sampleKpEquationMotionTrackRect,
  sampleKpEquationMotionTrackOpacityProgress,
  type KpEquationCollisionTrack
} from "../src/rendering/equation-motion-path-planner.ts";
import {
  compileKpEquationGovernanceV2RouteFixture
} from "./helpers/equation-governance-v2-route-fixture.ts";

const measurementIdentity = {
  revision: 2,
  coordinateSpaceId: "stage.route-certificate"
};

test("one settled snapshot certifies route, clearance, arrival, and ownership", () => {
  const result = certifyKpEquationMeasuredRouteV2({
    obligations: compileKpEquationGovernanceV2RouteFixture(),
    transitionId: "transition.0",
    protectedTransit: protectedTransit(),
    ownership: ownership(),
    routeBindings: [{
      recordId: "record.x",
      trackIds: ["track.x"],
      sourceOccurrenceIds: ["source.x"],
      targetOccurrenceIds: ["target.x"]
    }],
    boundaryBindings: [{
      boundaryIntentId: "boundary.equals",
      protectedTrackIds: ["track.equals"]
    }],
    arrivalBindings: [{
      arrivalId: "arrival.term-and-connector",
      targetOccurrenceIds: ["target.x", "target.plus"]
    }]
  });
  assert.equal(result.status, "certified");
  if (result.status !== "certified") return;
  assert.equal(result.certificate.proofs.collisionAvoidance,
    "dense-measured-paint-audit");
  assert.deepEqual(result.certificate.proofs.relationClearance[0], {
    boundaryIntentId: "boundary.equals",
    movingTrackIds: ["track.x"],
    protectedTrackIds: ["track.equals"]
  });
  assert.deepEqual(sampleKpCertifiedEquationRouteV2({
    certificate: result.certificate,
    progress: 0
  }).find(({ trackId }) => trackId === "track.x")?.paintRect,
  result.certificate.tracks.find(({ id }) => id === "track.x")?.startRect);
  assert.deepEqual(sampleKpCertifiedEquationRouteV2({
    certificate: result.certificate,
    progress: 1
  }).find(({ trackId }) => trackId === "track.x")?.paintRect,
  result.certificate.tracks.find(({ id }) => id === "track.x")?.endRect);
  assert.throws(() => JSON.stringify(result.certificate),
    /cannot enter durable state/);
});

test("measurement drift and duplicate paint ownership fail closed", () => {
  const drift = certifyKpEquationMeasuredRouteV2({
    ...validInput(),
    ownership: {
      ...ownership(),
      measurementIdentity: { ...measurementIdentity, revision: 3 }
    }
  });
  assert.equal(drift.status, "repair-required");
  if (drift.status === "repair-required") {
    assert.equal(drift.diagnostics[0]?.code, "route.measurement-mismatch");
  }

  const duplicated = ownership();
  const duplicatePaint = certifyKpEquationMeasuredRouteV2({
    ...validInput(),
    ownership: {
      ...duplicated,
      targetOwners: [
        ...duplicated.targetOwners,
        {
          occurrenceId: "target.duplicate",
          semanticEntityId: "entity.plus",
          paintAtomIds: ["target.atom.plus"]
        }
      ]
    }
  });
  assert.equal(duplicatePaint.status, "repair-required");
  if (duplicatePaint.status === "repair-required") {
    assert.equal(duplicatePaint.diagnostics.some(({ code }) =>
      code === "route.paint-ownership"), true);
  }
});

test("certified sampling is pure and rejects copied authority", () => {
  const result = certifyKpEquationMeasuredRouteV2(validInput());
  assert.equal(result.status, "certified");
  if (result.status !== "certified") return;
  const copied = { ...result.certificate };
  assert.throws(() => sampleKpCertifiedEquationRouteV2({
    certificate: copied,
    progress: 0.5
  }), /minted certificate/);
  assert.doesNotThrow(() => sampleKpCertifiedEquationRouteV2({
    certificate: result.certificate,
    progress: 0.5
  }));
});

function validInput() {
  return {
    obligations: compileKpEquationGovernanceV2RouteFixture(),
    transitionId: "transition.0",
    protectedTransit: protectedTransit(),
    ownership: ownership(),
    routeBindings: [{
      recordId: "record.x",
      trackIds: ["track.x"],
      sourceOccurrenceIds: ["source.x"],
      targetOccurrenceIds: ["target.x"]
    }],
    boundaryBindings: [{
      boundaryIntentId: "boundary.equals",
      protectedTrackIds: ["track.equals"]
    }],
    arrivalBindings: [{
      arrivalId: "arrival.term-and-connector",
      targetOccurrenceIds: ["target.x", "target.plus"]
    }]
  } as const;
}

function protectedTransit() {
  return compileKpCollisionSafeTransitTracks({
    tracks: [track("track.x", 0, 100), track("track.equals", 50, 50)],
    stageOccupancy: {
      measurementIdentity,
      rows: [{
        id: "row.equation",
        rect: { left: -10, top: -5, width: 130, height: 20 }
      }],
      protectedCorridor: { left: -10, top: -45, width: 130, height: 25 },
      geometryAuthority: "certified-stage-layout"
    },
    sampleFrames: (tracks, progress) => tracks.map((track) => {
      const opacityProgress = sampleKpEquationMotionTrackOpacityProgress(
        track,
        progress
      );
      const startOpacity = track.startOpacity ?? 1;
      const endOpacity = track.endOpacity ?? 1;
      return {
        trackId: track.id,
        componentId: track.componentId,
        rect: sampleKpEquationMotionTrackRect(track, progress),
        opacity: startOpacity + (endOpacity - startOpacity) * opacityProgress
      };
    }),
    sampleCount: 40
  });
}

function track(
  id: string,
  startLeft: number,
  endLeft: number
): KpEquationCollisionTrack {
  return {
    id,
    componentId: `component.${id}`,
    lifecycle: "persist",
    startRect: { left: startLeft, top: 0, width: 10, height: 10 },
    endRect: { left: endLeft, top: 0, width: 10, height: 10 }
  };
}

function ownership(): KpEquationMeasuredPaintOwnershipSnapshotV2 {
  return {
    kind: "equation-measured-paint-ownership-snapshot-v2",
    lifecycle: "renderer-session-ephemeral",
    measurementIdentity,
    sourceOwners: [{
      occurrenceId: "source.x",
      semanticEntityId: "entity.x",
      paintAtomIds: ["source.atom.x"]
    }],
    targetOwners: [{
      occurrenceId: "target.x",
      semanticEntityId: "entity.x",
      paintAtomIds: ["target.atom.x"]
    }, {
      occurrenceId: "target.plus",
      semanticEntityId: "entity.plus",
      paintAtomIds: ["target.atom.plus"]
    }]
  };
}
