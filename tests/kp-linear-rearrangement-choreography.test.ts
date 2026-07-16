import assert from "node:assert/strict";
import test from "node:test";

import { createLinearSolveAnimationAsset } from "../src/animation/linear-solve-adapter.ts";
import {
  createKpLinearRearrangementChoreography,
  kpLinearRearrangementTiming,
  sampleKpLinearRearrangementChoreography
} from "../src/animation/linear-rearrangement-choreography.ts";
import type {
  KpMeasuredEquationTransitionEndpoint,
  KpMeasuredEquationTransitionGeometry
} from "../src/rendering/equation-motion-dom.ts";
import { sampleKpEquationTokenMotion } from "../src/rendering/semantic-equation-token-renderer.ts";

const choreography = createKpLinearRearrangementChoreography(
  createLinearSolveAnimationAsset()
);

test("linear rearrangement compiles one causal operation subgraph per solve step", () => {
  assert.deepEqual(
    choreography.steps.map((step) => step.kind),
    [
      "balanced-introduction",
      "cancel-additive-inverses",
      "simplify-constant-difference"
    ]
  );
  assert.deepEqual(
    choreography.steps[0]?.operationSubgraph.nodes.map((node) => node.kind),
    [
      "focus-cause",
      "reserve-space",
      "move-continuants",
      "introduce-balanced-terms",
      "recognize-result",
      "release-focus"
    ]
  );
  assert.deepEqual(
    choreography.steps[1]?.operationSubgraph.nodes.map((node) => node.kind),
    [
      "focus-cause",
      "hold-layout",
      "meet-canceling-terms",
      "collapse-canceling-terms",
      "compact-survivors",
      "recognize-result",
      "release-focus"
    ]
  );
  assert.deepEqual(
    choreography.steps[2]?.operationSubgraph.nodes.map((node) => node.kind),
    [
      "focus-cause",
      "move-continuants",
      "converge-operands",
      "derive-result",
      "recognize-result",
      "release-focus"
    ]
  );
  assert.ok(
    choreography.steps.every((step) =>
      step.plan.vocabulary.objectConstancy.every((requirement) =>
        requirement.preserveThrough.includes("rewind")
      )
    )
  );
});

test("linear rearrangement timeline reserves, acts, recognizes, then releases", () => {
  const step = choreography.steps[0]!;
  assert.equal(
    step.timeline.phases.find((phase) => phase.phaseId === "orient")?.end,
    kpLinearRearrangementTiming.orientEnd
  );
  assert.equal(
    step.timeline.phases.find((phase) => phase.phaseId === "reflow")?.end,
    kpLinearRearrangementTiming.reflowEnd
  );
  assert.equal(
    step.timeline.phases.find((phase) => phase.phaseId === "act")?.end,
    kpLinearRearrangementTiming.actEnd
  );
  const release = sampleKpLinearRearrangementChoreography({
    step,
    progress: 1,
    direction: "forward",
    accessibilityMode: "full"
  });
  assert.equal(release.focus.attentionProgress, 0);
  assert.equal(release.focus.translateZ, 0);
  assert.equal(release.focus.scale, 1);
  assert.equal(release.releaseProgress, 1);
});

test("balanced inverse terms remain absent until persistent reflow reserves space", () => {
  const beforeEntry = sampleKpEquationTokenMotion(
    balancedIntroductionGeometry(),
    0.3
  );
  const inverseTerms = beforeEntry.tokens.filter(
    (token) => token.side === "target" && token.motionId.startsWith("inverse.")
  );
  assert.equal(
    (beforeEntry.linearRearrangement?.reservationProgress ?? 0) < 1,
    true
  );
  assert.ok(inverseTerms.every((token) => token.pose.opacity === 0));
  const persistent = beforeEntry.tokens.filter(
    (token) => token.side === "source"
  );
  assert.ok(persistent.every((token) => token.pose.opacity === 1));
  assert.ok(persistent.some((token) => Math.abs(token.pose.x) > 0));

  const afterReservation = sampleKpEquationTokenMotion(
    balancedIntroductionGeometry(),
    0.52
  );
  assert.equal(afterReservation.linearRearrangement?.reservationProgress, 1);
  assert.ok(
    afterReservation.tokens
      .filter((token) =>
        token.side === "target" && token.motionId.startsWith("inverse.")
      )
      .every((token) => token.pose.opacity > 0)
  );
  assert.equal(
    new Set(
      afterReservation.tokens
        .filter((token) =>
          token.side === "target" && token.motionId.startsWith("inverse.")
        )
        .map((token) => token.pose.opacity)
    ).size,
    1
  );
});

test("cancellation meets at nonzero material size before collapse and survivor compaction", () => {
  const meeting = sampleKpEquationTokenMotion(cancellationGeometry(), 0.5);
  const canceling = meeting.tokens.filter(
    (token) => token.motionId.startsWith("cancel.")
  );
  assert.ok(canceling.every((token) => token.pose.opacity === 1));
  assert.ok(canceling.every((token) => token.pose.scale >= 0.78));
  assert.ok(canceling.every((token) => Math.abs(token.pose.x) > 0));
  assert.equal(
    meeting.linearRearrangement?.persistentReflowProgress,
    0
  );

  const met = sampleKpEquationTokenMotion(cancellationGeometry(), 0.62);
  const metTerms = met.tokens.filter(
    (token) => token.motionId.startsWith("cancel.")
  );
  const centers = metTerms.map((token) => {
    const native = cancellationGeometry().sourceTokens.find(
      (candidate) => candidate.motionId === token.motionId
    )!;
    return native.localRect.left + native.localRect.width / 2 + token.pose.x;
  });
  assert.ok(Math.abs(centers[0]! - centers[1]!) < 0.001);
  assert.ok(metTerms.every((token) => token.pose.scale > 0.65));

  const collapsing = sampleKpEquationTokenMotion(cancellationGeometry(), 0.69);
  assert.ok(
    collapsing.tokens
      .filter((token) => token.motionId.startsWith("cancel."))
      .every((token) => token.pose.opacity > 0 && token.pose.opacity < 1)
  );
  assert.ok(
    collapsing.tokens
      .filter((token) => token.motionId.startsWith("persist."))
      .some((token) => Math.abs(token.pose.x) > 0)
  );
});

test("constant operands travel independently on arcs before the derived result appears", () => {
  const converging = sampleKpEquationTokenMotion(
    constantDerivationGeometry(),
    0.55
  );
  const operands = converging.tokens.filter(
    (token) => token.side === "source" && token.motionId.startsWith("operand.")
  );
  const result = converging.tokens.find(
    (token) => token.side === "target" && token.motionId === "result.4"
  );
  assert.ok(operands.every((token) => token.pose.opacity === 1));
  assert.ok(operands.every((token) => token.pose.scale >= 0.8));
  assert.equal(new Set(operands.map((token) => token.pose.y)).size, 2);
  assert.equal(result?.pose.opacity, 0);

  const derived = sampleKpEquationTokenMotion(
    constantDerivationGeometry(),
    0.72
  );
  const derivedResult = derived.tokens.find(
    (token) => token.side === "target" && token.motionId === "result.4"
  );
  assert.ok((derivedResult?.pose.opacity ?? 0) > 0);
  const arrivingOperands = derived.tokens.filter(
    (token) => token.side === "source" && token.motionId.startsWith("operand.")
  );
  assert.ok(arrivingOperands.every((token) => token.pose.opacity > 0));
  const targetCenter = 72 + 12 / 2;
  for (const token of arrivingOperands) {
    const native = constantDerivationGeometry().sourceTokens.find(
      (candidate) => candidate.motionId === token.motionId
    )!;
    const center = native.localRect.left + native.localRect.width / 2;
    assert.ok(Math.abs(center + token.pose.x - targetCenter) < 0.001);
  }
  assert.equal(derivedResult?.pose.y, 0);
});

test("linear rearrangement settles exactly to native target token endpoints", () => {
  for (const geometry of [
    balancedIntroductionGeometry(),
    cancellationGeometry(),
    constantDerivationGeometry()
  ]) {
    const end = sampleKpEquationTokenMotion(geometry, 1);
    assert.ok(
      end.tokens
        .filter((token) => token.side === "source")
        .every((token) => token.pose.opacity === 0)
    );
    assert.ok(
      end.tokens
        .filter((token) => token.side === "target")
        .every((token) =>
          token.pose.opacity === 1 &&
          token.pose.x === 0 &&
          token.pose.y === 0 &&
          token.pose.scale === 1
        )
    );
  }
});

function balancedIntroductionGeometry(): KpMeasuredEquationTransitionGeometry {
  return {
    transitionId: "transition.balanced-introduction",
    linearRearrangementKind: "balanced-introduction",
    sourceTokens: [
      token("persist.x", 8),
      token("persist.equals", 44),
      token("persist.7", 68)
    ],
    targetTokens: [
      token("target.x", 8),
      token("inverse.left", 34),
      token("target.equals", 58),
      token("target.7", 82),
      token("inverse.right", 104)
    ],
    relations: [
      relation("x", "persist", ["persist.x"], ["target.x"], 0),
      relation("equals", "persist", ["persist.equals"], ["target.equals"], 14),
      relation("seven", "persist", ["persist.7"], ["target.7"], 14),
      {
        recordId: "inverse-terms-enter",
        lifecycle: "enter",
        target: endpoint(["inverse.left", "inverse.right"], 34, 80)
      }
    ]
  };
}

function cancellationGeometry(): KpMeasuredEquationTransitionGeometry {
  return {
    transitionId: "transition.cancel",
    linearRearrangementKind: "cancel-additive-inverses",
    sourceTokens: [
      token("persist.x", 8),
      token("cancel.plus3", 30),
      token("cancel.minus3", 54),
      token("persist.equals", 82)
    ],
    targetTokens: [
      token("target.x", 8),
      token("target.equals", 38)
    ],
    relations: [
      relation("x", "persist", ["persist.x"], ["target.x"], 0),
      {
        recordId: "left-inverses-cancel",
        lifecycle: "cancel",
        source: endpoint(["cancel.plus3", "cancel.minus3"], 30, 42)
      },
      relation("equals", "persist", ["persist.equals"], ["target.equals"], -44)
    ]
  };
}

function constantDerivationGeometry(): KpMeasuredEquationTransitionGeometry {
  return {
    transitionId: "transition.derive",
    linearRearrangementKind: "simplify-constant-difference",
    sourceTokens: [
      token("persist.x", 8),
      token("persist.equals", 38),
      token("operand.7", 66),
      token("operand.minus3", 92)
    ],
    targetTokens: [
      token("target.x", 8),
      token("target.equals", 38),
      token("result.4", 72)
    ],
    relations: [
      relation("x", "persist", ["persist.x"], ["target.x"], 0),
      relation("equals", "persist", ["persist.equals"], ["target.equals"], 0),
      {
        recordId: "constants-merge",
        lifecycle: "merge",
        source: endpoint(["operand.7", "operand.minus3"], 66, 38),
        target: endpoint(["result.4"], 72, 12),
        delta: { x: -7, y: 0, scaleX: 1, scaleY: 1 }
      }
    ]
  };
}

function relation(
  recordId: string,
  lifecycle: "persist",
  sourceIds: readonly string[],
  targetIds: readonly string[],
  deltaX: number
) {
  return {
    recordId,
    lifecycle,
    source: endpoint(sourceIds, 0, 12),
    target: endpoint(targetIds, deltaX, 12),
    delta: { x: deltaX, y: 0, scaleX: 1, scaleY: 1 }
  } as const;
}

function endpoint(
  motionIds: readonly string[],
  left: number,
  width: number
): KpMeasuredEquationTransitionEndpoint {
  return {
    selectorIds: [...motionIds],
    motionIds: [...motionIds],
    bounds: { left, top: 20, width, height: 18 }
  };
}

function token(motionId: string, left: number) {
  const rect = { left, top: 20, width: 12, height: 18 };
  return {
    motionId,
    text: motionId,
    rect,
    localRect: rect,
    element: { style: {}, dataset: {} } as unknown as HTMLElement
  };
}
