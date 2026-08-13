import assert from "node:assert/strict";
import test from "node:test";

import { createDivideBothSidesEquationAnimationAsset } from "../src/animation/divide-both-sides-equation-adapter.ts";
import { createKpLinearRearrangementChoreography } from "../src/animation/linear-rearrangement-choreography.ts";
import { checkKpCancellationPresentationLaws } from "../src/animation/cancellation-presentation-laws.ts";
import { createKpWitnessedAnnihilationBinding } from "../src/animation/witnessed-annihilation.ts";
import { createKpEquationLinearRearrangementBindings } from "../src/rendering/equation-linear-rearrangement-bindings.ts";
import { kpEquationPresentationProfile } from "../src/animation/equation-presentation-policy.ts";
import type {
  KpMeasuredEquationTransitionEndpoint,
  KpMeasuredEquationTransitionGeometry
} from "../src/rendering/equation-motion-dom.ts";
import { sampleKpEquationTokenMotion } from "../src/rendering/semantic-equation-token-renderer.ts";
import { createKpEquationSuccessorSynthesisPlan } from "../src/rendering/equation-linear-rearrangement.ts";
import { createDivideBothSidesEquationKpAsset } from "../src/semantic/divide-both-sides-equation-asset.ts";
import { createKpDivideBothSidesSelectorAnnotatedLatex } from "../src/rendering/divide-both-sides-selector-annotated-latex.ts";

test("divide asset binds a first-class divide-both-sides rearrangement", () => {
  const animation = createDivideBothSidesEquationAnimationAsset();
  const bindings = createKpEquationLinearRearrangementBindings(animation);
  assert.deepEqual(
    bindings.map((binding) => [binding.transformationId, binding.kind]),
    [
      ["transform.divide-both-sides.divide-by-3", "divide-both-sides"],
      ["transform.divide-both-sides.cancel-coefficient", "cancel-multiplicative-inverses"],
      ["transform.divide-both-sides.simplify-quotient", "simplify-constant-quotient"]
    ]
  );
  const choreography = createKpLinearRearrangementChoreography(animation);
  assert.deepEqual(choreography.steps.map((step) => step.kind), [
    "divide-both-sides",
    "cancel-multiplicative-inverses",
    "simplify-constant-quotient"
  ]);
  assert.ok(choreography.steps[0]?.operationSubgraph.nodes.some(
    (node) => node.kind === "introduce-division-structure"
  ));
});

test("coefficient cancellation certifies one and quotient synthesis owns all inputs", () => {
  const animation = createDivideBothSidesEquationAnimationAsset();
  const cancellation = animation.transformations[1]!;
  const witness = createKpWitnessedAnnihilationBinding({
    operationId: "kp.algebra.cancel-multiplicative-inverses",
    transformation: cancellation,
    bundle: animation.bundle,
    cancellationRecordId: "coefficient-and-divisor-cancel"
  });
  assert.equal(witness.witness.semanticValue.latex, "1");
  assert.equal(witness.witness.identityKind, "multiplicative");

  const quotient = createKpEquationLinearRearrangementBindings(animation)[2]!;
  assert.deepEqual(
    quotient.successorSynthesisBinding?.sourceAnnotations.map((annotation) => [
      annotation.semanticRole,
      annotation.contribution,
      annotation.propagationRank
    ]),
    [
      ["dividend", "material-input", 0],
      ["division-operator", "catalyst", 0],
      ["divisor", "material-input", 1]
    ]
  );
  assert.deepEqual(
    quotient.successorSynthesisBinding?.targetAnnotations.map((annotation) => [
      annotation.semanticRole,
      annotation.propagationRank
    ]),
    [["evaluated-quotient", 0]]
  );
});

test("coefficient and divisor follow opposing arcs into their shared midpoint", () => {
  const animation = createDivideBothSidesEquationAnimationAsset();
  const cancellation = kpEquationPresentationProfile(animation).cancellation;
  assert.equal(cancellation, "counter-orbit-v1");

  const geometry: KpMeasuredEquationTransitionGeometry = {
    transitionId: "transition.coefficient-cancellation",
    linearRearrangementKind: "cancel-multiplicative-inverses",
    cancellationPresentationRecipe: cancellation,
    sourceTokens: [
      token("source.numerator.3", 10, 8),
      token("source.denominator.3", 50, 32)
    ],
    targetTokens: [],
    relations: [{
      recordId: "coefficient-and-divisor-cancel",
      lifecycle: "cancel",
      source: endpoint(["source.numerator.3", "source.denominator.3"], 10, 52)
    }]
  };
  const orbiting = sampleKpEquationTokenMotion(geometry, 0.55).tokens;
  assert.deepEqual(orbiting.map((token) => Math.sign(token.pose.y)), [-1, 1]);

  const meeting = sampleKpEquationTokenMotion(geometry, 0.68).tokens;
  const sourceCenterById = new Map(
    geometry.sourceTokens.map((token) => [
      token.motionId,
      {
        x: token.localRect.left + token.localRect.width / 2,
        y: token.localRect.top + token.localRect.height / 2
      }
    ])
  );
  const meetingCenters = meeting.map((token) =>
    ({
      x: sourceCenterById.get(token.motionId)!.x + token.pose.x,
      y: sourceCenterById.get(token.motionId)!.y + token.pose.y
    })
  );
  assert.ok(meeting.every((token) => token.pose.opacity > 0));
  assert.ok(meetingCenters.every((point) =>
    Math.abs(point.x - meetingCenters[0]!.x) < 0.001 &&
    Math.abs(point.y - meetingCenters[0]!.y) < 0.001
  ));
  assert.deepEqual(sampleKpEquationTokenMotion(geometry, 0.68).tokens, meeting);

  const snapshot = (progress: number) => ({
    sources: sampleKpEquationTokenMotion(geometry, progress).tokens.map((motion) => {
      const origin = sourceCenterById.get(motion.motionId)!;
      return {
        id: motion.motionId,
        x: origin.x + motion.pose.x,
        y: origin.y + motion.pose.y,
        opacity: motion.pose.opacity
      };
    })
  });
  assert.deepEqual(checkKpCancellationPresentationLaws({
    beforeContact: snapshot(0.55),
    contact: snapshot(0.68),
    retired: snapshot(0.8),
    rewindContact: snapshot(0.68)
  }), []);
});

test("divide states annotate every semantic glyph and both fraction rules", () => {
  const asset = createDivideBothSidesEquationKpAsset();
  for (const state of asset.bundle.objects) {
    const compiled = createKpDivideBothSidesSelectorAnnotatedLatex(state);
    assert.ok(compiled);
    assert.deepEqual(
      compiled.annotated.annotations.map((annotation) => annotation.selectorId),
      state.selectors
        .filter((selector) => selector.kind !== "artifact")
        .map((selector) => selector.id)
    );
  }
  const divided = createKpDivideBothSidesSelectorAnnotatedLatex(asset.bundle.objects[1]!);
  assert.equal(divided?.structuralSelectorIds.length, 2);
  assert.match(divided!.annotated.rawLatex, /\\frac\{3x\}\{3\}.*\\frac\{12\}\{3\}/);
});

test("matched divisors and rules share one entry clock without deformation", () => {
  const before = sampleKpEquationTokenMotion(divideEntryGeometry(), 0.3);
  assert.ok(before.tokens.filter((token) => token.side === "target" && token.motionId.startsWith("structure."))
    .every((token) => token.pose.opacity === 0));

  const entering = sampleKpEquationTokenMotion(divideEntryGeometry(), 0.52);
  const structures = entering.tokens.filter(
    (token) => token.side === "target" && token.motionId.startsWith("structure.")
  );
  assert.equal(structures.length, 4);
  assert.equal(new Set(structures.map((token) => token.pose.opacity)).size, 1);
  assert.equal(new Set(structures.map((token) => token.pose.y)).size, 1);
  assert.ok(structures.every((token) => token.pose.scale === 1));
  assert.ok((entering.linearRearrangement?.structureEntryProgress ?? 0) > 0);

  const end = sampleKpEquationTokenMotion(divideEntryGeometry(), 1);
  assert.ok(end.tokens.filter((token) => token.side === "source")
    .every((token) => token.pose.opacity === 0));
  assert.ok(end.tokens.filter((token) => token.side === "target")
    .every((token) => token.pose.opacity === 1 && token.pose.x === 0 && token.pose.y === 0 && token.pose.scale === 1));
});

test("quotient inputs converge before four appears and settle to native endpoints", () => {
  const geometry = quotientGeometry();
  const converging = sampleKpEquationTokenMotion(geometry, 0.55);
  const resultAtConvergence = converging.tokens.find((token) =>
    token.side === "target" && token.motionId.endsWith("rhs.4")
  );
  assert.equal(resultAtConvergence?.pose.opacity, 0);
  const materialInputIds = new Set(
    geometry.successorSynthesisBinding?.sourceAnnotations
      .filter((annotation) => annotation.contribution === "material-input")
      .map((annotation) => annotation.id)
  );
  assert.ok(converging.tokens.filter((token) =>
    token.side === "source" && materialInputIds.has(token.motionId)
  ).every((token) => token.pose.opacity === 1));

  const derived = sampleKpEquationTokenMotion(geometry, 0.9);
  assert.ok((derived.tokens.find((token) =>
    token.side === "target" && token.motionId.endsWith("rhs.4")
  )?.pose.opacity ?? 0) > 0);

  const settled = sampleKpEquationTokenMotion(geometry, 1);
  assert.ok(settled.tokens.filter((token) => token.side === "source")
    .every((token) => token.pose.opacity === 0));
  assert.ok(settled.tokens.filter((token) => token.side === "target")
    .every((token) => token.pose.opacity === 1 && token.pose.x === 0 && token.pose.y === 0 && token.pose.scale === 1));
});

function divideEntryGeometry(): KpMeasuredEquationTransitionGeometry {
  return {
    transitionId: "transition.divide-entry",
    linearRearrangementKind: "divide-both-sides",
    sourceTokens: [
      token("source.3", 10, 20),
      token("source.x", 24, 20),
      token("source.equals", 58, 20),
      token("source.12", 84, 20)
    ],
    targetTokens: [
      token("target.3", 10, 8),
      token("target.x", 24, 8),
      token("structure.left-rule", 8, 28),
      token("structure.left-divisor", 19, 40),
      token("target.equals", 58, 20),
      token("target.12", 82, 8),
      token("structure.right-rule", 80, 28),
      token("structure.right-divisor", 87, 40)
    ],
    relations: [
      relation("coefficient", ["source.3"], ["target.3"], 0, -12),
      relation("variable", ["source.x"], ["target.x"], 0, -12),
      relation("equals", ["source.equals"], ["target.equals"], 0, 0),
      relation("constant", ["source.12"], ["target.12"], -2, -12),
      {
        recordId: "matched-divisors-enter",
        lifecycle: "enter",
        target: endpoint(["structure.left-divisor", "structure.right-divisor"], 19, 80)
      },
      {
        recordId: "fraction-rules-enter",
        lifecycle: "enter",
        target: endpoint(["structure.left-rule", "structure.right-rule"], 8, 92)
      }
    ]
  };
}

function quotientGeometry(): KpMeasuredEquationTransitionGeometry {
  const animation = createDivideBothSidesEquationAnimationAsset();
  const binding = createKpEquationLinearRearrangementBindings(animation)[2]!
    .successorSynthesisBinding!;
  const sourceIds = binding.sourceAnnotations.map((annotation) => annotation.id);
  const targetId = binding.targetAnnotations[0]!.id;
  const geometry: KpMeasuredEquationTransitionGeometry = {
    transitionId: "transition.quotient",
    linearRearrangementKind: "simplify-constant-quotient",
    successorSynthesisBinding: binding,
    successorPresentationRecipe: "counter-convergence-v1",
    sourceTokens: [
      token("persist.x.quotient", 8, 20),
      token("persist.equals.quotient", 38, 20),
      ...sourceIds.map((id, index) => token(id, 70 + index * 15, 20))
    ],
    targetTokens: [
      token("target.x.quotient", 8, 20),
      token("target.equals.quotient", 38, 20),
      token(targetId, 76, 20)
    ],
    relations: [
      relation("x", ["persist.x.quotient"], ["target.x.quotient"], 0, 0),
      relation("equals", ["persist.equals.quotient"], ["target.equals.quotient"], 0, 0),
      {
        recordId: "quotient-becomes-four",
        lifecycle: "merge",
        source: endpoint(sourceIds, 70, 42),
        target: endpoint([targetId], 76, 12),
        delta: { x: -8, y: 0, scaleX: 1, scaleY: 1 }
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
  sourceIds: readonly string[],
  targetIds: readonly string[],
  x: number,
  y: number
) {
  return {
    recordId,
    lifecycle: "persist" as const,
    source: endpoint(sourceIds, 0, 12),
    target: endpoint(targetIds, x, 12),
    delta: { x, y, scaleX: 1, scaleY: 1 }
  };
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

function token(motionId: string, left: number, top: number) {
  const rect = { left, top, width: 12, height: 18 };
  return {
    motionId,
    text: motionId,
    rect,
    localRect: rect,
    element: { style: {}, dataset: {} } as unknown as HTMLElement
  };
}
