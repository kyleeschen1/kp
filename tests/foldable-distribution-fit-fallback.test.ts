import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpFoldableDistributionFoldIntent
} from "../src/semantic/foldable-distribution-fold-intent.ts";
import {
  compileKpFoldableDistributionStaticProjection
} from "../src/semantic/foldable-distribution-fold-projection.ts";
import {
  planKpFoldableDistributionFitFallback,
  resolveKpFoldableDistributionFitFallback
} from "../src/reader/renderers/foldable-distribution-fit-fallback.ts";
import {
  planKpReaderCertifiedEquationStageResponsiveFit,
  type KpReaderCertifiedEquationStageFitResult
} from "../src/reader/renderers/equation-responsive-fit.ts";
import {
  certifyKpSingleRowEquationStageLayout,
  certifyKpTwoRowEquationStageLayout,
  compileKpMeasuredEquationStageInput,
  createKpEquationStageMeasurementIdentity,
  type KpEquationStageEnvelopeDefinition,
  type KpEquationStageEnvelopeObservation,
  type KpEquationStagePhaseIntent
} from "../src/reader/runtime/equation-stage-layout.ts";
import {
  certifyKpEquationStageTransitCorridor
} from "../src/reader/runtime/equation-stage-transit-corridor.ts";

function projection(mode: "expanded" | "collapsed") {
  return compileKpFoldableDistributionStaticProjection(
    createKpFoldableDistributionFoldIntent({ mode })
  );
}

test("wide expanded fallback has one deterministic semantic ladder", () => {
  const first = planKpFoldableDistributionFitFallback({
    projection: projection("expanded"),
    viewport: "wide"
  });
  const second = planKpFoldableDistributionFitFallback({
    projection: projection("expanded"),
    viewport: "wide"
  });

  assert.deepEqual(first, second);
  assert.deepEqual(
    first.candidates.map(({ strategy }) => strategy),
    [
      "requested",
      "semantic-stage",
      "semantic-fold",
      "semantic-condense"
    ]
  );
  assert.equal(first.wrapAllowed, false);
  assert.equal(first.operationSpecificCoordinates, false);
  assert.deepEqual(
    first.candidates.map(({ layoutIntent }) => layoutIntent.viewport),
    ["wide", "phone", "phone", "phone"]
  );
});

test("every fallback preserves trace, checkpoints, and accessible content", () => {
  const plan = planKpFoldableDistributionFitFallback({
    projection: projection("expanded"),
    viewport: "wide"
  });

  assert.equal(plan.preservation.phaseNodeIds.length, 5);
  assert.equal(plan.preservation.operationIds.length, 7);
  assert.equal(plan.preservation.checkpointIds.length, 6);
  assert.equal(plan.preservation.accessibilityContentIds.length, 13);
  for (const candidate of plan.candidates) {
    assert.deepEqual(candidate.preservation, plan.preservation);
    assert.deepEqual(
      candidate.projection.semanticTruth,
      plan.candidates[0]!.projection.semanticTruth
    );
    assert.deepEqual(
      candidate.layoutIntent.phases.map(({ nodeId }) => nodeId),
      plan.preservation.phaseNodeIds
    );
  }
});

test("phone and collapsed requests omit semantically duplicate fallbacks", () => {
  const phone = planKpFoldableDistributionFitFallback({
    projection: projection("expanded"),
    viewport: "phone"
  });
  const collapsed = planKpFoldableDistributionFitFallback({
    projection: projection("collapsed"),
    viewport: "phone"
  });

  assert.deepEqual(
    phone.candidates.map(({ strategy }) => strategy),
    ["requested", "semantic-fold", "semantic-condense"]
  );
  assert.deepEqual(
    collapsed.candidates.map(({ strategy }) => strategy),
    ["requested"]
  );
});

test("resolver chooses the first certified readable candidate", () => {
  const plan = planKpFoldableDistributionFitFallback({
    projection: projection("expanded"),
    viewport: "wide"
  });
  const assessments = plan.candidates.map((candidate) => ({
    candidateId: candidate.id,
    phaseResults: candidate.layoutIntent.phases.map((phase) =>
      phaseFit(phase, candidate.strategy === "semantic-fold" ||
        candidate.strategy === "semantic-condense")
    )
  })).reverse();
  const resolution = resolveKpFoldableDistributionFitFallback({
    plan,
    assessments
  });

  assert.equal(resolution.kind, "satisfied");
  if (resolution.kind !== "satisfied") {
    throw new Error("Expected a readable semantic fallback.");
  }
  assert.equal(resolution.candidate.strategy, "semantic-fold");
  assert.equal(resolution.phaseFits.length, 5);
  assert.deepEqual(
    resolution.attemptedCandidateIds,
    plan.candidates.slice(0, 3).map(({ id }) => id)
  );
});

test("resolver reports deterministic failure without shrinking or wrapping", () => {
  const plan = planKpFoldableDistributionFitFallback({
    projection: projection("expanded"),
    viewport: "phone"
  });
  const resolution = resolveKpFoldableDistributionFitFallback({
    plan,
    assessments: plan.candidates.map((candidate) => ({
      candidateId: candidate.id,
      phaseResults: candidate.layoutIntent.phases.map((phase) =>
        phaseFit(phase, false)
      )
    }))
  });

  assert.deepEqual(resolution, {
    kind: "unsatisfied",
    reason: "no-readable-semantic-fallback",
    attemptedCandidateIds: plan.candidates.map(({ id }) => id)
  });
});

function phaseFit(
  phase: KpEquationStagePhaseIntent,
  readable: boolean
): KpReaderCertifiedEquationStageFitResult {
  const identity = createKpEquationStageMeasurementIdentity({
    revision: 12,
    coordinateSpaceId: "fixture.foldable-fit-fallback"
  });
  const observations: KpEquationStageEnvelopeObservation[] = [];
  phase.rows.forEach((row, rowIndex) => {
    row.envelopeIds.forEach((id, envelopeIndex) => {
      observations.push({
        id,
        transitionId: phase.nodeId,
        endpointObjectId: `endpoint.${id}`,
        memberOwnerIds: [`owner.${id}`],
        rect: {
          left: 10 + envelopeIndex * 42,
          top: 10 + rowIndex * 4,
          width: 34,
          height: 20
        },
        baselineY: 26 + rowIndex * 4,
        emSizePx: 16,
        measurementIdentity: identity
      });
    });
  });
  const definitions: KpEquationStageEnvelopeDefinition[] =
    observations.map(({ id, transitionId, endpointObjectId, memberOwnerIds }) => ({
      id,
      transitionId,
      endpointObjectId,
      memberOwnerIds
    }));
  const measured = compileKpMeasuredEquationStageInput({
    intent: phase,
    measurementIdentity: identity,
    definitions,
    observations
  });
  const layout = phase.policy === "single-row"
    ? certifyKpSingleRowEquationStageLayout(measured)
    : certifyKpTwoRowEquationStageLayout(measured);
  const first = observations[0]!;
  const corridor = certifyKpEquationStageTransitCorridor({
    layout,
    transits: [{
      id: `transit.${phase.nodeId}`,
      sourceRowId: phase.rows[0]!.id,
      targetRowId: phase.rows[0]!.id,
      sourceRect: first.rect,
      targetRect: first.rect
    }]
  });
  return planKpReaderCertifiedEquationStageResponsiveFit({
    layout: corridor,
    viewportWidth: readable ? 1_000 : 1,
    viewportHeight: readable ? 1_000 : 1,
    horizontalPadding: 0,
    verticalPadding: 0,
    minScale: 0.68
  });
}
