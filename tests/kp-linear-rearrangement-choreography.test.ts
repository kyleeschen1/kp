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
import { createKpEquationSuccessorSynthesisPlan } from "../src/rendering/equation-linear-rearrangement.ts";
import {
  createKpWitnessedAnnihilationBinding,
  createKpWitnessedAnnihilationPlan
} from "../src/animation/witnessed-annihilation.ts";
import "../src/rendering/equation-witnessed-annihilation-register.ts";

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
  assert.deepEqual(
    choreography.sequence.bridges.map((bridge) => bridge.attention),
    ["transfer", "hold"]
  );
  assert.deepEqual(
    choreography.sequence.bridges.map((bridge) => bridge.velocity),
    ["settle-before-next", "continuous"]
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

test("linear successor binding excludes the subtraction catalyst from result material", () => {
  const step = choreography.steps[2]!;
  const binding = step.successorSynthesisBinding!;
  assert.equal(binding.authority.operationId, "kp.algebra.simplify-constant-difference");
  assert.deepEqual(
    binding.sourceAnnotations.map((annotation) => [
      annotation.semanticRole,
      annotation.contribution,
      annotation.propagationRank
    ]),
    [
      ["minuend", "material-input", 0],
      ["subtraction-operator", "catalyst", 0],
      ["subtrahend", "material-input", 1]
    ]
  );
  const successor = step.plan.semantic.lifecycle.records.find(
    (record) => record.kind === "successor"
  );
  const catalyst = step.plan.semantic.lifecycle.records.find(
    (record) => record.id.endsWith(".catalyst-retirement")
  );
  assert.deepEqual(successor?.sourceEntityIds, [
    "equation.linear-solve.left-simplified.rhs.7",
    "equation.linear-solve.left-simplified.rhs.3"
  ]);
  assert.deepEqual(catalyst?.sourceEntityIds, [
    "equation.linear-solve.left-simplified.rhs.minus"
  ]);
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

test("shared witnessed annihilation meets, witnesses, then compacts survivors", () => {
  const meeting = sampleKpEquationTokenMotion(cancellationGeometry(), 0.5);
  const canceling = meeting.tokens.filter(
    (token) => token.motionId.startsWith("cancel.")
  );
  assert.ok(canceling.every((token) => token.pose.opacity === 1));
  assert.ok(canceling.every((token) => token.pose.scale >= 0.72));
  assert.ok(canceling.every((token) => Math.abs(token.pose.x) > 0));
  assert.equal(new Set(canceling.map((token) => Math.sign(token.pose.y))).size, 2);
  assert.equal(
    meeting.linearRearrangement?.persistentReflowProgress,
    1
  );

  const met = sampleKpEquationTokenMotion(cancellationGeometry(), 0.7);
  const metTerms = met.tokens.filter(
    (token) => token.motionId.startsWith("cancel.")
  );
  const centers = metTerms.map((token) => {
    const native = cancellationGeometry().sourceTokens.find(
      (candidate) => candidate.motionId === token.motionId
    )!;
    return native.localRect.left + native.localRect.width / 2 + token.pose.x;
  });
  assert.ok(Math.abs(centers[0]! - centers[1]!) < 26);
  assert.ok(metTerms.every((token) => token.pose.scale === 0.72));
  assert.equal(met.witnessedAnnihilation?.witnessReadable, true);
  assert.equal(met.witnessedAnnihilation?.witness.latex, "0");

  const collapsing = sampleKpEquationTokenMotion(cancellationGeometry(), 0.82);
  assert.ok(
    collapsing.tokens
      .filter((token) => token.motionId.startsWith("cancel."))
      .every((token) => token.pose.opacity > 0 && token.pose.opacity < 1)
  );
  assert.ok(
    collapsing.tokens
      .filter((token) => token.motionId.startsWith("persist."))
      .every((token) => Math.abs(token.pose.x) === 0)
  );
  const compacting = sampleKpEquationTokenMotion(cancellationGeometry(), 0.94);
  assert.ok(
    compacting.tokens
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
  assert.ok(operands.every((token) => token.pose.scale >= 0.68));
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
    assert.ok(Math.abs(center + token.pose.x - targetCenter) <= 4.01);
  }
  assert.ok(Math.abs(derivedResult?.pose.y ?? 0) > 0.25);
  assert.ok(Math.abs(derivedResult?.pose.y ?? 0) < 3);
});

test("convergence keeps the constant expression ordered while tightening toward its result", () => {
  const geometry = {
    ...constantDerivationGeometry(),
    successorPresentationRecipe: "convergence-v1" as const
  };
  const converging = sampleKpEquationTokenMotion(geometry, 0.6);
  const sources = converging.tokens.filter((token) => token.side === "source");
  const nativeCenters = geometry.sourceTokens.map(
    (token) => token.localRect.left + token.localRect.width / 2
  );
  const convergedCenters = sources.map((token) => {
    const native = geometry.sourceTokens.find(
      (candidate) => candidate.motionId === token.motionId
    )!;
    return native.localRect.left + native.localRect.width / 2 + token.pose.x;
  });
  assert.deepEqual([...convergedCenters].sort((left, right) => left - right), convergedCenters);
  assert.ok(
    Math.max(...convergedCenters) - Math.min(...convergedCenters) <
    Math.max(...nativeCenters) - Math.min(...nativeCenters)
  );
  assert.ok(sources.every((token) => token.pose.opacity === 1));
  assert.ok(sources.every((token) => Math.abs(token.pose.y) < 0.001));
  assert.equal(
    converging.tokens.find((token) => token.side === "target")?.pose.opacity,
    0
  );

  const catalystRetiring = sampleKpEquationTokenMotion(geometry, 0.68);
  const catalyst = catalystRetiring.tokens.find((token) =>
    token.side === "source" && token.motionId === "operator.minus"
  );
  const materialInputs = catalystRetiring.tokens.filter((token) =>
    token.side === "source" && token.motionId.startsWith("operand.")
  );
  assert.ok((catalyst?.pose.opacity ?? 1) < 1);
  assert.ok(materialInputs.every((token) => token.pose.opacity === 1));

  const gated = sampleKpEquationTokenMotion(geometry, 0.83);
  assert.ok(gated.tokens.filter((token) =>
    token.side === "source" &&
    (token.motionId.startsWith("operand.") || token.motionId === "operator.minus")
  )
    .every((token) => token.pose.opacity === 0));
  assert.equal(
    gated.tokens.find((token) => token.side === "target")?.pose.opacity,
    0
  );

  const resolving = sampleKpEquationTokenMotion(geometry, 0.9);
  assert.ok(resolving.tokens.filter((token) =>
    token.side === "source" && token.motionId.startsWith("operand.")
  )
    .every((token) => token.pose.opacity === 0));
  assert.ok((resolving.tokens.find((token) =>
    token.side === "target" && token.motionId === "result.4"
  )
    ?.pose.opacity ?? 0) > 0.5);
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
  const geometry: KpMeasuredEquationTransitionGeometry = {
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
  const animation = createLinearSolveAnimationAsset();
  const transformation = animation.transformations.find((candidate) =>
    candidate.transformType === "cancelAdditiveInverses"
  )!;
  const binding = createKpWitnessedAnnihilationBinding({
    operationId: "kp.algebra.cancel-additive-inverses",
    transformation,
    bundle: animation.bundle,
    cancellationRecordId: "left-inverses-cancel"
  });
  return {
    ...geometry,
    witnessedAnnihilationPlan: createKpWitnessedAnnihilationPlan({
      id: binding.id,
      witness: binding.witness,
      sources: [
        {
          id: "cancel.plus3",
          selectorIds: [binding.sources[0]!.selectorIds[0]!],
          semanticRole: "additive-term",
          semanticRank: 0
        },
        {
          id: "cancel.minus3",
          selectorIds: [binding.sources[1]!.selectorIds[0]!],
          semanticRole: "additive-inverse",
          semanticRank: 1
        }
      ],
      measurements: {
        "cancel.plus3": geometry.sourceTokens[1]!.localRect,
        "cancel.minus3": geometry.sourceTokens[2]!.localRect
      },
      survivors: [
        {
          id: "persist.x",
          sourceSelectorIds: ["x"],
          targetSelectorIds: ["x.target"],
          sourceRect: geometry.sourceTokens[0]!.localRect,
          targetRect: geometry.targetTokens[0]!.localRect
        },
        {
          id: "persist.equals",
          sourceSelectorIds: ["equals"],
          targetSelectorIds: ["equals.target"],
          sourceRect: geometry.sourceTokens[3]!.localRect,
          targetRect: geometry.targetTokens[1]!.localRect
        }
      ]
    })
  };
}

function constantDerivationGeometry(): KpMeasuredEquationTransitionGeometry {
  const geometry: KpMeasuredEquationTransitionGeometry = {
    transitionId: "transition.derive",
    linearRearrangementKind: "simplify-constant-difference",
    successorSynthesisBinding: {
      id: "successor.transition.derive",
      relationRecordId: "constants-merge",
      authority: {
        operationId: "kp.algebra.simplify-constant-difference",
        bindingId: "binding.transition.derive"
      },
      sourceAnnotations: [
        {
          id: "operand.7",
          semanticRole: "minuend",
          selectorIds: ["operand.7"],
          contribution: "material-input",
          propagationRank: 0
        },
        {
          id: "operator.minus",
          semanticRole: "subtraction-operator",
          selectorIds: ["operator.minus"],
          contribution: "catalyst",
          propagationRank: 0
        },
        {
          id: "operand.3",
          semanticRole: "subtrahend",
          selectorIds: ["operand.3"],
          contribution: "material-input",
          propagationRank: 1
        }
      ],
      targetAnnotations: [{
        id: "result.4",
        semanticRole: "evaluated-difference",
        selectorIds: ["result.4"],
        propagationRank: 0
      }],
      lineages: [{
        id: "lineage.transition.derive",
        sourceAnnotationIds: ["operand.7", "operand.3"],
        targetAnnotationIds: ["result.4"]
      }]
    },
    sourceTokens: [
      token("persist.x", 8),
      token("persist.equals", 38),
      token("operand.7", 66),
      token("operator.minus", 88),
      token("operand.3", 100)
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
        source: endpoint(["operand.7", "operator.minus", "operand.3"], 66, 46),
        target: endpoint(["result.4"], 72, 12),
        delta: { x: -7, y: 0, scaleX: 1, scaleY: 1 }
      }
    ]
  };
  return {
    ...geometry,
    successorSynthesisPlan: createKpEquationSuccessorSynthesisPlan(geometry)
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
