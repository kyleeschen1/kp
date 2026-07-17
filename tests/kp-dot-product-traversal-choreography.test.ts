import assert from "node:assert/strict";
import test from "node:test";

import { createKpAnimationAssets } from "../src/animation/catalog.ts";
import {
  createKpDotProductTraversalChoreography,
  sampleKpDotProductTraversalChoreography
} from "../src/animation/dot-product-traversal-choreography.ts";
import type { KpMeasuredEquationTransitionGeometry } from "../src/rendering/equation-motion-dom.ts";
import { sampleKpEquationTokenMotion } from "../src/rendering/semantic-equation-token-renderer.ts";

const animation = createKpAnimationAssets().find(
  (candidate) =>
    candidate.id ===
    "animation.generated.linear-algebra.dot-product.three-vector"
)!;
const choreography = createKpDotProductTraversalChoreography(animation);

test("dot-product fixture exposes one honest six-component semantic fan-in", () => {
  const record =
    animation.transformations[0]?.correspondenceMap?.records[0];
  assert.equal(record?.relation, "fan-in");
  assert.equal(record?.sourceSelectorIds.length, 6);
  assert.deepEqual(record?.targetSelectorIds, [
    "expression.generated.linear-algebra.dot-product.three-vector.result.result.scalar"
  ]);
  assert.equal(choreography.plan.equationTransition.relations[0]?.lifecycle, "merge");
});

test("products and partial sums are authored semantic representations", () => {
  const intermediates = animation.bundle.objects.filter((object) =>
    typeof object.value === "object" &&
    object.value !== null &&
    "representation" in object.value
  );
  assert.equal(intermediates.length, 6);
  assert.deepEqual(
    choreography.contributions.map((contribution) => ({
      productObjectId: contribution.productObjectId,
      partialSumObjectId: contribution.partialSumObjectId,
      productLatex: contribution.productLatex,
      partialSumLatex: contribution.partialSumLatex
    })),
    [
      {
        productObjectId: `${animation.bundle.objects[0]!.id}.intermediate.product.0`,
        partialSumObjectId: `${animation.bundle.objects[0]!.id}.intermediate.partial-sum.0`,
        productLatex: "1 \\times 4 = 4",
        partialSumLatex: "4"
      },
      {
        productObjectId: `${animation.bundle.objects[0]!.id}.intermediate.product.1`,
        partialSumObjectId: `${animation.bundle.objects[0]!.id}.intermediate.partial-sum.1`,
        productLatex: "2 \\times 5 = 10",
        partialSumLatex: "4 + 10 = 14"
      },
      {
        productObjectId: `${animation.bundle.objects[0]!.id}.intermediate.product.2`,
        partialSumObjectId: `${animation.bundle.objects[0]!.id}.intermediate.partial-sum.2`,
        productLatex: "3 \\times 6 = 18",
        partialSumLatex: "4 + 10 + 18 = 32"
      }
    ]
  );
});

test("dot-product choreography refuses renderer-invented intermediates", () => {
  const withoutIntermediates = {
    ...animation,
    bundle: {
      ...animation.bundle,
      objects: animation.bundle.objects.filter((object) =>
        typeof object.value !== "object" ||
        object.value === null ||
        !("representation" in object.value)
      )
    }
  };
  assert.throws(
    () => createKpDotProductTraversalChoreography(withoutIntermediates),
    /requires authored product and partial-sum representations/
  );
});

test("dot-product traversal and propagation follow semantic index order", () => {
  assert.deepEqual(
    choreography.traversal.participants.map(
      (participant) => participant.semanticIndex
    ),
    [0, 1, 2]
  );
  assert.deepEqual(
    choreography.propagation.entries
      .slice()
      .sort((left, right) => left.start - right.start)
      .map((entry) => entry.rank),
    [0, 1, 2]
  );
  assert.ok(
    choreography.propagation.entries.every(
      (entry) =>
        entry.startsAfterPreviousReadiness &&
        entry.overlapsPreviousRank
    )
  );
  assert.deepEqual(
    choreography.contributions.map((contribution) => [
      contribution.product,
      contribution.accumulatedValue
    ]),
    [[4, 4], [10, 14], [18, 32]]
  );
});

test("paired components inherit correlated organic signatures without becoming identical", () => {
  for (const contribution of choreography.contributions) {
    assert.equal(
      contribution.leftSignature.phase,
      contribution.rightSignature.phase
    );
    assert.equal(
      contribution.leftSignature.groupCorrelation,
      contribution.rightSignature.groupCorrelation
    );
    assert.notEqual(
      contribution.leftSignature.id,
      contribution.rightSignature.id
    );
  }
});

test("bounded cascade hands salience forward while prior products persist", () => {
  const firstHandoff = sampleKpDotProductTraversalChoreography({
    choreography,
    progress: 0.25,
    direction: "forward",
    accessibilityMode: "full"
  });
  assert.deepEqual(firstHandoff.motion.activeContributionIndices, [0, 1]);
  assert.equal(firstHandoff.motion.accumulatedThroughIndex, 0);
  assert.equal(firstHandoff.motion.accumulationLatex, "4");

  const finalPair = sampleKpDotProductTraversalChoreography({
    choreography,
    progress: 0.42,
    direction: "forward",
    accessibilityMode: "full"
  });
  assert.deepEqual(finalPair.motion.activeContributionIndices, [2]);
  assert.equal(finalPair.motion.accumulatedThroughIndex, 2);
  assert.equal(finalPair.motion.accumulationLatex, "4 + 10 + 18 = 32");
  assert.ok(finalPair.motion.contributions[0]!.productOpacity > 0);
  assert.ok(finalPair.motion.contributions[1]!.productOpacity > 0);
  assert.equal(finalPair.motion.contributions[2]!.productOpacity, 1);
  assert.deepEqual(choreography.patternCompression, {
    available: true,
    applied: false,
    minimumContributionCount: 5,
    preserveFirstAndFinal: true
  });
});

test("dot-product traversal has exact rewind and focus release laws", () => {
  const forward = sampleKpDotProductTraversalChoreography({
    choreography,
    progress: 0.33,
    direction: "forward",
    accessibilityMode: "full"
  });
  const rewind = sampleKpDotProductTraversalChoreography({
    choreography,
    progress: 0.67,
    direction: "rewind",
    accessibilityMode: "full"
  });
  assert.deepEqual(rewind, forward);

  const end = sampleKpDotProductTraversalChoreography({
    choreography,
    progress: 1,
    direction: "forward",
    accessibilityMode: "full"
  });
  assert.ok(
    end.focusFrames.every(
      (focus) =>
        focus.frame.attentionProgress === 0 &&
        focus.frame.translateZ === 0 &&
        focus.frame.scale === 1
    )
  );
});

test("dot-product token sampler preserves pairs through accumulation and settles exactly", () => {
  const pairing = sampleKpEquationTokenMotion(geometry(), 0.42);
  assert.equal(pairing.dotProductTraversal?.activeContributionIndices[0], 2);
  const pair = pairing.tokens.filter(
    (token) =>
      token.side === "source" &&
      (token.motionId === "left.2" || token.motionId === "right.2")
  );
  assert.equal(pair.length, 2);
  assert.ok(pair.every((token) => token.pose.opacity === 1));
  assert.ok(pair[0]!.pose.x > 0);
  assert.ok(pair[1]!.pose.x < 0);
  assert.equal(
    pairing.tokens.find((token) => token.side === "target")?.pose.opacity,
    0
  );

  const handoff = sampleKpEquationTokenMotion(geometry(), 0.85);
  assert.ok(
    handoff.tokens
      .filter((token) => token.side === "source")
      .every((token) => token.pose.opacity > 0)
  );
  assert.ok(
    (handoff.tokens.find((token) => token.side === "target")?.pose.opacity ??
      0) > 0
  );

  const end = sampleKpEquationTokenMotion(geometry(), 1);
  assert.ok(
    end.tokens
      .filter((token) => token.side === "source")
      .every((token) => token.pose.opacity === 0)
  );
  assert.deepEqual(
    end.tokens.find((token) => token.side === "target")?.pose,
    { opacity: 1, x: 0, y: 0, scale: 1 }
  );
});

function geometry(): KpMeasuredEquationTransitionGeometry {
  const sourceMotionIds = [
    "left.0",
    "left.1",
    "left.2",
    "right.0",
    "right.1",
    "right.2"
  ];
  const selectorIds = choreography.contributions.flatMap(
    (contribution) => [contribution.leftSelectorId]
  ).concat(
    choreography.contributions.map(
      (contribution) => contribution.rightSelectorId
    )
  );
  return {
    transitionId: "transition.dot-product",
    dotProductTraversalPlan: choreography.rendererPlan,
    sourceTokens: sourceMotionIds.map((motionId, index) =>
      token(motionId, index < 3 ? 10 : 70, 10 + (index % 3) * 20)
    ),
    targetTokens: [token("result.32", 45, 30)],
    relations: [{
      recordId: "component-pairs-accumulate",
      lifecycle: "merge",
      source: {
        selectorIds,
        motionIds: sourceMotionIds,
        bounds: { left: 10, top: 10, width: 72, height: 58 }
      },
      target: {
        selectorIds: [choreography.rendererPlan.resultSelectorId],
        motionIds: ["result.32"],
        bounds: { left: 45, top: 30, width: 18, height: 18 }
      },
      delta: { x: 9, y: 0, scaleX: 1, scaleY: 1 }
    }]
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
