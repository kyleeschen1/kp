import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpExactFractionQuantityRuntimeSession,
  isKpExactFractionQuantityRuntimeSession,
  sampleKpExactFractionQuantityRuntime
} from "../src/rendering/exact-fraction-quantity-runtime.ts";
import {
  kpExactFractionQuantityPreservationManifest as manifest
} from "../src/reader/compiler/exact-fraction-quantity-preservation-manifest.ts";
import {
  kpIdentityFissionExecutableProgram
} from "../src/animation/motifs/identity-fission-executable-program.ts";
import {
  kpIdentityFusionExecutableProgram
} from "../src/animation/motifs/identity-fusion-executable-program.ts";

test("one sealed runtime session owns one renderer and consumes the shared clock", () => {
  const session = createKpExactFractionQuantityRuntimeSession();

  assert.ok(isKpExactFractionQuantityRuntimeSession(session));
  assert.equal(session.rendererSessionCount, 1);
  assert.equal(session.clockAuthority, "shared-animation-runtime-clock");
  assert.equal(session.presentation.beats.length, 5);
  assert.equal(session.symbolic.endpoints.length, 5);
  assert.equal(session.symbolic.transientEndpoints.length, 1);
  assert.ok(Object.isFrozen(session));
  assert.equal(
    session.identityFission.program,
    kpIdentityFissionExecutableProgram
  );
  assert.equal(
    session.identityFission.route.primitiveRoute,
    "fission-fusion:fission"
  );
  assert.equal(
    session.identityFusion.program,
    kpIdentityFusionExecutableProgram
  );
  assert.equal(
    session.identityFusion.route.primitiveRoute,
    "fission-fusion:fusion"
  );
});

test("symbolic and concrete refinement share one identity-fission program", () => {
  const session = createKpExactFractionQuantityRuntimeSession();
  const refinement = session.presentation.beats[1]!;
  if (refinement.motif.kind !== "partition-refinement") {
    throw new Error("Expected partition refinement.");
  }
  const executions = session.identityFission;
  const forwardPhaseIds = executions.program.phases.map(({ id }) => id);

  assert.equal(
    executions.concrete.forward.primitive.plan,
    refinement.motif.fissionPlan
  );
  assert.equal(
    executions.concrete.forward.route,
    executions.route
  );
  assert.deepEqual(
    executions.concrete.forward.phaseOrder,
    forwardPhaseIds
  );
  assert.deepEqual(
    executions.concrete.rewind.phaseOrder,
    [...forwardPhaseIds].reverse()
  );
  assert.equal(executions.symbolic.length, 1);
  assert.equal(executions.symbolic[0]?.forward.length, 2);
  assert.equal(executions.symbolic[0]?.rewind.length, 2);
  for (const execution of [
    ...executions.symbolic[0]!.forward,
    ...executions.symbolic[0]!.rewind
  ]) {
    assert.equal(execution.programId, executions.program.id);
    assert.equal(execution.route, executions.route);
    assert.equal(execution.primitive.plan.mode, "fission");
    assert.equal(execution.primitive.plan.sourceEntityIds.length, 1);
    assert.equal(execution.primitive.plan.targetEntityIds.length, 3);
    assert.equal(
      new Set(execution.primitive.plan.targetEntityIds).size,
      execution.primitive.plan.targetEntityIds.length
    );
  }
  const symbolicTargetSets = executions.symbolic[0]!.forward.map(
    ({ primitive }) => primitive.plan.targetEntityIds
  );
  assert.ok(symbolicTargetSets[0]!.every(
    (id) => !symbolicTargetSets[1]!.includes(id)
  ));
});

test("every beat samples through one immutable synchronized runtime frame", () => {
  const session = createKpExactFractionQuantityRuntimeSession();
  for (const progressPermille of manifest.presentation.fullMotionSamplesPermille) {
    const frame = sampleKpExactFractionQuantityRuntime({
      session,
      clock: {
        direction: "forward",
        progress: progressPermille / 1_000
      }
    });

    assert.equal(frame.sessionId, session.id);
    assert.equal(frame.rendererSessionId, session.rendererSessionId);
    assert.equal(
      frame.presentationBeatId,
      frame.projection.neutralFrame.beat.id
    );
    assert.equal(frame.viewPaintOwnership.length, 4);
    assert.equal(frame.visibleOperation.viewBindings.length, 4);
    assert.ok(frame.visibleOperation.viewBindings.every((binding) =>
      binding.invocationId === frame.visibleOperation.invocationId &&
      binding.phase === frame.visibleOperation.phase
    ));
    assert.ok(Object.isFrozen(frame));
  }
});

test("grouping and concrete part merge share one identity-fusion program", () => {
  const session = createKpExactFractionQuantityRuntimeSession();
  const executions = session.identityFusion;
  const merge = session.presentation.beats[3]!;
  if (merge.motif.kind !== "part-merge") {
    throw new Error("Expected part merge.");
  }

  assert.equal(
    executions.concrete.forward.primitive.plan,
    merge.motif.fusionPlan
  );
  assert.equal(executions.concrete.forward.route, executions.route);
  assert.deepEqual(
    executions.concrete.forward.phaseOrder,
    executions.program.phases.map(({ id }) => id)
  );
  assert.deepEqual(
    executions.concrete.rewind.phaseOrder,
    [...executions.concrete.forward.phaseOrder].reverse()
  );
  assert.equal(executions.symbolic.length, 2);
  assert.equal(executions.symbolic[0]?.forward.length, 2);
  assert.equal(executions.symbolic[1]?.forward.length, 1);
  for (const execution of executions.symbolic.flatMap(
    ({ forward, rewind }) => [...forward, ...rewind]
  )) {
    assert.equal(execution.programId, executions.program.id);
    assert.equal(execution.route, executions.route);
    assert.equal(execution.primitive.plan.mode, "fusion");
    assert.ok(execution.primitive.plan.sourceEntityIds.length >= 2);
    assert.equal(execution.primitive.plan.targetEntityIds.length, 1);
    assert.equal(execution.primitive.plan.microStaggerSpan, 0);
  }
});

test("grouping and merge frames retain simultaneous opaque fusion", () => {
  const session = createKpExactFractionQuantityRuntimeSession();
  const grouping = sampleKpExactFractionQuantityRuntime({
    session,
    clock: { direction: "forward", progress: 0.48 }
  });
  const merge = sampleKpExactFractionQuantityRuntime({
    session,
    clock: { direction: "forward", progress: 0.69 }
  });

  assert.equal(grouping.symbolicMotion.dispatch, "identity-fusion");
  assert.equal(grouping.symbolicMotion.identityFusionExecutions?.length, 2);
  assert.equal(grouping.identityFusion?.symbolicExecutions.length, 2);
  assert.equal(grouping.identityFusion?.concreteExecution, undefined);
  assert.equal(merge.symbolicMotion.dispatch, "identity-fusion");
  assert.equal(merge.symbolicMotion.identityFusionExecutions?.length, 1);
  assert.equal(merge.identityFusion?.symbolicExecutions.length, 1);
  assert.equal(
    merge.identityFusion?.concreteExecution,
    session.identityFusion.concrete.forward
  );
  assert.ok(merge.motifFrame !== undefined);
  assert.ok([
    ...merge.motifFrame.sources,
    ...merge.motifFrame.targets
  ].every(({ opacity }) => opacity === 0 || opacity === 1));
  assert.equal(
    merge.motifFrame.progress,
    merge.visibleOperation.programPhase?.programProgress
  );
  for (const frame of [grouping, merge]) {
    const phase = frame.visibleOperation.programPhase;
    assert.equal(phase?.programKind, "identity-fusion");
    assert.ok(frame.visibleOperation.viewBindings.every(
      ({ programPhase }) => programPhase === phase
    ));
    for (const execution of frame.identityFusion!.symbolicExecutions) {
      assert.equal(
        execution.samplePhaseTelemetry(phase!.programProgress).activePhaseId,
        phase!.phaseId
      );
    }
  }
});

test("paint ownership is exclusive and native at every settled endpoint", () => {
  const session = createKpExactFractionQuantityRuntimeSession();
  for (const checkpoint of manifest.checkpoints) {
    const frame = sampleKpExactFractionQuantityRuntime({
      session,
      clock: {
        direction: "forward",
        progress: checkpoint.progressPermille / 1_000
      }
    });

    assert.equal(frame.ownershipPhase, "target-native");
    assert.equal(frame.settlementPolicy, "reuse-native-endpoint-geometry");
    assert.ok(frame.viewPaintOwnership.every((owner) =>
      owner.owner === (owner.view === "symbolic"
        ? "native-katex"
        : "native-svg") &&
      owner.nativeOpacity === 1 &&
      owner.transientOpacity === 0
    ));
  }

  const moving = sampleKpExactFractionQuantityRuntime({
    session,
    clock: { direction: "forward", progress: 0.29 }
  });
  assert.equal(moving.ownershipPhase, "transient");
  assert.ok(moving.viewPaintOwnership.every((owner) =>
    owner.owner === "shared-transient-paint" &&
    owner.nativeOpacity === 0 &&
    owner.transientOpacity === 1
  ));
});

test("direct and rewind sampling share identical absolute visual state", () => {
  const session = createKpExactFractionQuantityRuntimeSession();
  for (const progress of [0, 0.18, 0.29, 0.5, 0.72, 0.91, 1]) {
    const forward = sampleKpExactFractionQuantityRuntime({
      session,
      clock: { direction: "forward", progress }
    });
    const rewind = sampleKpExactFractionQuantityRuntime({
      session,
      clock: { direction: "rewind", progress }
    });

    assert.deepEqual(forward.projection, rewind.projection);
    assert.deepEqual(forward.motifFrame, rewind.motifFrame);
    assert.deepEqual(forward.visibleOperation, rewind.visibleOperation);
    assert.deepEqual(forward.symbolicMotion, rewind.symbolicMotion);
    assert.deepEqual(forward.viewPaintOwnership, rewind.viewPaintOwnership);
    assert.equal(forward.ownershipPhase, rewind.ownershipPhase);
    assert.equal(forward.clock.direction, "forward");
    assert.equal(rewind.clock.direction, "rewind");
  }
});

test("fission settles before the multiplier evaluation subsegment", () => {
  const session = createKpExactFractionQuantityRuntimeSession();
  const refinement = sampleKpExactFractionQuantityRuntime({
    session,
    clock: { direction: "forward", progress: 0.29 }
  });

  assert.equal(refinement.projection.neutralFrame.beat.localProgress, 0.5);
  assert.equal(refinement.motifFrame?.progress, 1);
  assert.equal(
    refinement.visibleOperation.programPhase?.phaseId,
    "settle-descendants"
  );
  assert.equal(refinement.identityFission?.symbolicExecutions.length, 0);
  assert.equal(refinement.visibleOperation.phase, "action");
  assert.equal(refinement.visibleOperation.actionProgress, 0.5);
  assert.match(
    refinement.symbolicMotion.segment.id,
    /evaluate-unit-multiplier/u
  );
  assert.equal(refinement.symbolicMotion.segmentProgress, 0);
  assert.equal(refinement.symbolicMotion.dispatch, "opaque-successor");
  assert.equal(refinement.easingApplications, 1);
});

test("all four refinement views consume the same sampled program phase", () => {
  const session = createKpExactFractionQuantityRuntimeSession();
  const frame = sampleKpExactFractionQuantityRuntime({
    session,
    clock: { direction: "forward", progress: 0.25 }
  });
  const phase = frame.visibleOperation.programPhase;

  assert.equal(frame.symbolicMotion.dispatch, "identity-fission");
  assert.equal(frame.symbolicMotion.identityFissionExecutions?.length, 2);
  assert.equal(frame.identityFission?.symbolicExecutions.length, 2);
  assert.equal(frame.identityFission?.concreteExecution,
    session.identityFission.concrete.forward);
  assert.ok(phase !== undefined);
  assert.ok(frame.visibleOperation.viewBindings.every(
    ({ programPhase }) => programPhase === phase
  ));
  assert.equal(frame.identityFission?.programProgress,
    phase.programProgress);
  for (const execution of [
    frame.identityFission!.concreteExecution,
    ...frame.identityFission!.symbolicExecutions
  ]) {
    const telemetry = execution.samplePhaseTelemetry(
      phase.programProgress
    );
    assert.equal(telemetry.activePhaseId, phase.phaseId);
  }
  assert.equal(frame.motifFrame?.progress, phase.programProgress);
  assert.ok([
    ...frame.motifFrame!.sources,
    ...frame.motifFrame!.targets
  ].every(({ opacity }) => opacity === 0 || opacity === 1));
});

test("runtime is history independent and rejects forged sessions", () => {
  const session = createKpExactFractionQuantityRuntimeSession();
  const first = sampleKpExactFractionQuantityRuntime({
    session,
    clock: { direction: "forward", progress: 0.72 }
  });
  sampleKpExactFractionQuantityRuntime({
    session,
    clock: { direction: "forward", progress: 0.1 }
  });
  const repeated = sampleKpExactFractionQuantityRuntime({
    session,
    clock: { direction: "forward", progress: 0.72 }
  });

  assert.deepEqual(first, repeated);
  assert.throws(
    () => sampleKpExactFractionQuantityRuntime({
      session: { ...session },
      clock: { direction: "forward", progress: 0.5 }
    }),
    /sealed canonical session/
  );
  assert.throws(
    () => sampleKpExactFractionQuantityRuntime({
      session,
      clock: { direction: "forward", progress: Number.NaN }
    }),
    /progress must be finite/
  );
});
