import { strict as assert } from "node:assert";
import test from "node:test";

import { createEquationOperationTransition } from "../src/math/equation-transform.ts";
import {
  equationVisualMotifPhaseIds,
  createEquationMotionPlan,
  type EquationMotionPlan
} from "../src/rendering/equation-motion-plan.ts";
import {
  createEquationMotionSampler,
  sampleEquationMotion,
  type EquationMotionFrame,
  type EquationMotionFrameToken
} from "../src/rendering/equation-motion-sampler.ts";
import {
  createRoleAwareMotionTrack,
  roleAwareMotionPrimitiveDescriptors
} from "../src/rendering/role-aware-motion-primitives.ts";
import { sampleKpEquationEnclosureChoreography } from "../src/rendering/equation-enclosure-choreography.ts";
import {
  compileKpCopyFanOutChoreography,
  sampleKpCopyFanOutChoreography
} from "../src/animation/copy-fan-out-choreography.ts";
import { createKpSemanticLineageGraph } from "../src/semantic/semantic-lineage-graph.ts";
import {
  compileSemanticBeatTimeline,
  createSemanticBeatMotionTrack,
  easedProgressBetweenSemanticBeat,
  linearEquationDemoBeatTimeline,
  progressBetweenSemanticBeat
} from "../src/rendering/semantic-beat-compiler.ts";

const findFrameToken = (
  frame: EquationMotionFrame,
  tokenId: string
): EquationMotionFrameToken => {
  const token = frame.tokens.find((candidate) => candidate.tokenId === tokenId);
  assert.ok(token, `missing frame token for ${tokenId}`);
  return token;
};

const findOpacity = (frame: EquationMotionFrame, tokenId: string): number =>
  findFrameToken(frame, tokenId).pose.opacity;

const assertNearlyEqual = (
  actual: number,
  expected: number,
  epsilon = 1e-12
): void => {
  assert.ok(
    Math.abs(actual - expected) <= epsilon,
    `expected ${actual} to be within ${epsilon} of ${expected}`
  );
};

const assertFinitePose = (frame: EquationMotionFrame, tokenId: string): void => {
  const pose = findFrameToken(frame, tokenId).pose;
  assert.equal(Number.isFinite(pose.opacity), true);
  assert.equal(Number.isFinite(pose.x), true);
  assert.equal(Number.isFinite(pose.y), true);
  assert.equal(Number.isFinite(pose.scale), true);
};

test("sampleEquationMotion returns lifecycle frames for subtractBothSides", () => {
  const transition = createEquationOperationTransition({
    sourceLatex: "x + 3 = 7",
    operation: {
      kind: "subtractBothSides",
      valueLatex: "3"
    }
  });
  const plan = createEquationMotionPlan(transition);

  const start = sampleEquationMotion(plan, 0);
  const middle = sampleEquationMotion(plan, 0.3);
  const end = sampleEquationMotion(plan, 1);

  assert.equal(findOpacity(start, "lhs.plus"), 1);
  assert.equal(findOpacity(start, "rhs.inverse.3"), 0);
  assert.equal(findOpacity(end, "lhs.plus"), 1);
  assert.equal(findOpacity(end, "rhs.inverse.3"), 1);
  assert.equal(findOpacity(middle, "lhs.plus"), 1);
  assert.ok(findOpacity(middle, "rhs.inverse.3") > 0);
  assert.ok(findOpacity(middle, "rhs.inverse.3") < 1);
});

test("role-aware motion primitive descriptors compile to sampler tracks", () => {
  assert.deepEqual(
    roleAwareMotionPrimitiveDescriptors.map((descriptor) => [
      descriptor.id,
      descriptor.sourceRole,
      descriptor.targetRole,
      descriptor.tokenLifecycle,
      descriptor.visualLifecycle,
      descriptor.to.scale,
      descriptor.to.y
    ]),
    [
      ["inline-to-fraction", "inline", "fraction-slot", "move", "shift", 0.86, -10],
      ["inline-to-script", "inline", "superscript", "move", "shift", 0.72, -14],
      ["wrap", "expression", "wrapped-expression", "group-wrap", "wrap", 1, 0],
      ["unwrap", "wrapped-expression", "expression", "group-unwrap", "unwrap", 1, 0]
    ]
  );

  const track = createRoleAwareMotionTrack("x", "inline-to-script");
  const frame = sampleEquationMotion(
    planWithTrack(track),
    0.5
  );
  const pose = findFrameToken(frame, "x").pose;

  assert.ok(pose.scale < 1);
  assert.ok(pose.scale > 0.72);
  assert.ok(pose.y < 0);
  assert.ok(pose.y > -14);
});

test("canonical enclosure choreography stages wrap and unwrap in reversible semantic order", () => {
  const wrapEarly = sampleKpEquationEnclosureChoreography("wrap", 0.2);
  const wrapMiddle = sampleKpEquationEnclosureChoreography("wrap", 0.5);
  const wrapLate = sampleKpEquationEnclosureChoreography("wrap", 0.75);

  assert.ok(wrapEarly.persistentTravelProgress > 0);
  assert.equal(wrapEarly.enclosureVisibility, 0);
  assert.equal(wrapEarly.outerArtifactVisibility, 0);
  assert.equal(wrapMiddle.persistentTravelProgress, 1);
  assert.ok(wrapMiddle.enclosureVisibility > wrapMiddle.outerArtifactVisibility);
  assert.equal(wrapLate.enclosureVisibility, 1);
  assert.ok(wrapLate.outerArtifactVisibility < 1);

  const unwrapEarly = sampleKpEquationEnclosureChoreography("unwrap", 0.2);
  const unwrapLate = sampleKpEquationEnclosureChoreography("unwrap", 0.75);
  assert.ok(unwrapEarly.outerArtifactVisibility < unwrapEarly.enclosureVisibility);
  assert.equal(unwrapEarly.persistentTravelProgress, 0);
  assert.ok(unwrapLate.persistentTravelProgress > 0);
  assert.equal(unwrapLate.enclosureVisibility, 0);
});

test("copy/fan-out phase sampling keeps descendants at their source before transit", () => {
  const plan = compileKpCopyFanOutChoreography({
    id: "choreography.sampler-fan-out",
    lineageGraph: createKpSemanticLineageGraph({
      id: "lineage.sampler-fan-out",
      sourceEntityIds: ["source"],
      targetEntityIds: ["left", "right"],
      edges: [{
        id: "split-source",
        relation: "split",
        sourceEntityIds: ["source"],
        targetEntityIds: ["left", "right"],
        summary: "Branch source into two descendants."
      }]
    }),
    sourceEntityId: "source"
  });
  const branch = sampleKpCopyFanOutChoreography({ plan, progress: 0.28 });
  const transit = sampleKpCopyFanOutChoreography({ plan, progress: 0.56 });
  const arrival = sampleKpCopyFanOutChoreography({ plan, progress: 0.92 });

  assert.ok(branch.descendants.every((descendant) =>
    descendant.opacity > 0 && descendant.pathProgress === 0
  ));
  assert.ok(transit.descendants.every((descendant) =>
    descendant.opacity === 1 && descendant.pathProgress > 0 && descendant.pathProgress < 1
  ));
  assert.ok(arrival.descendants.every((descendant) =>
    descendant.opacity === 1 && descendant.pathProgress === 1 && descendant.scale === 1
  ));
});

test("semantic beat compiler exposes the current equation demo timeline", () => {
  assert.equal(linearEquationDemoBeatTimeline.beatCount, 50);
  assert.deepEqual(
    linearEquationDemoBeatTimeline.beats.map((beat) => beat.id),
    [...equationVisualMotifPhaseIds]
  );
  assert.deepEqual(
    linearEquationDemoBeatTimeline.beats.map((beat) => [
      beat.id,
      beat.startBeat,
      beat.endBeat,
      beat.easing
    ]),
    [
      ["artifact-enter", 25, 50, "ease-out"],
      ["artifact-exit", 0, 25, "ease-out"],
      ["layout-shift", 0, 25, "ease-in-out"],
      ["introduced-token-enter", 25, 50, "ease-out"],
      ["relation-flip", 0, 50, "ease-in-out"],
      ["cancel-meet", 0, 20, "ease-in-out"],
      ["cancel-collapse", 20, 25, "ease-out"],
      ["post-cancel-layout-shift", 30, 50, "ease-in-out"],
      ["final-simplify-meet", 0, 20, "ease-in-out"],
      ["final-simplify-collapse", 20, 25, "ease-out"],
      ["final-simplify-reveal", 25, 35, "ease-in-out"],
      ["dot-pair-focus", 0, 12, "ease-in-out"],
      ["dot-product-form", 10, 30, "ease-in-out"],
      ["dot-accumulate", 25, 42, "ease-in-out"],
      ["dot-result-reveal", 39, 50, "ease-in-out"],
      ["radical-fragment-focus", 0, 9, "ease-in-out"],
      ["radical-corner-gather", 7, 34, "ease-in-out"],
      ["radical-representation-handoff", 30, 43, "ease-in-out"],
      ["radical-native-settle", 41, 50, "ease-in-out"],
      ["reflow-signed-terms", 0, 31, "ease-in-out"],
      ["establish-groups", 31, 45, "ease-in-out"],
      ["gather-contributors", 0, 30, "ease-in-out"],
      ["recognize-successor", 30, 45, "ease-in-out"],
      ["native-settle", 45, 50, "ease-in-out"],
      ["unwrap-artifact-exit", 0, 20, "ease-out"],
      ["wrap-artifact-enter", 20, 50, "ease-out"],
      ["wrapped-token-shift", 0, 20, "ease-in-out"],
      ["contract-source", 0, 10, "ease-in-out"],
      ["branch-descendants", 10, 18, "ease-in-out"],
      ["transit-descendants", 17, 39, "ease-in-out"],
      ["arrive-descendants", 36, 46, "ease-in-out"],
      ["settle-descendants", 45, 50, "ease-in-out"],
      ["establish-value-source", 0, 10, "ease-in-out"],
      ["transmit-substitution-value", 7, 34, "ease-in-out"],
      ["replace-substitution-occupant", 31, 42, "ease-in-out"],
      ["settle-substitution-replacement", 40, 50, "ease-in-out"],
      ["orient-exponent", 0, 9, "ease-in-out"],
      ["reflow-continuants", 6, 17, "ease-in-out"],
      ["branch-exponent", 14, 22, "ease-in-out"],
      ["drop-coefficient", 18, 36, "ease-in-out"],
      ["decrement-successor", 22, 38, "ease-in-out"],
      ["settle-derivative", 37, 46, "ease-in-out"],
      ["release-derivative-focus", 44, 50, "ease-in-out"]
    ]
  );
  assert.equal(
    progressBetweenSemanticBeat(
      linearEquationDemoBeatTimeline,
      0.3,
      "layout-shift"
    ),
    0.6
  );
  assertNearlyEqual(
    easedProgressBetweenSemanticBeat(
      linearEquationDemoBeatTimeline,
      0.3,
      "layout-shift"
    ),
    (1 - Math.cos(Math.PI * 0.6)) / 2
  );
  assert.equal(
    progressBetweenSemanticBeat(
      linearEquationDemoBeatTimeline,
      0.8,
      "post-cancel-layout-shift"
    ),
    0.5
  );
});

test("semantic beat compiler creates sampler-compatible beat tracks", () => {
  const track = createSemanticBeatMotionTrack({
    tokenId: "introduced",
    timeline: linearEquationDemoBeatTimeline,
    beatId: "introduced-token-enter",
    lifecycle: "enter",
    visualLifecycle: "enter",
    from: { opacity: 0, x: 0, y: 0, scale: 0.82 },
    to: { opacity: 1, x: 0, y: 0, scale: 1 }
  });

  assert.deepEqual(track, {
    tokenId: "introduced",
    lifecycle: "enter",
    visualLifecycle: "enter",
    start: 0.5,
    end: 1,
    easing: "ease-out",
    from: { opacity: 0, x: 0, y: 0, scale: 0.82 },
    to: { opacity: 1, x: 0, y: 0, scale: 1 }
  });
  assert.equal(
    findFrameToken(sampleEquationMotion(planWithTrack(track), 0.5), "introduced")
      .pose.opacity,
    0
  );
  assert.equal(
    findFrameToken(sampleEquationMotion(planWithTrack(track), 1), "introduced")
      .pose.opacity,
    1
  );
});

test("sampleEquationMotion samples cancellation during left simplification", () => {
  const transition = createEquationOperationTransition({
    sourceLatex: "x + 3 - 3 = 7 - 3",
    operation: {
      kind: "simplifySide",
      side: "left",
      rule: "cancel-additive-inverse"
    }
  });
  const plan = createEquationMotionPlan(transition);

  const start = sampleEquationMotion(plan, 0);
  const middle = sampleEquationMotion(plan, 0.2);
  const end = sampleEquationMotion(plan, 1);

  assert.equal(findOpacity(start, "lhs.plus"), 1);
  assert.equal(findOpacity(end, "lhs.plus"), 0);
  assert.ok(findOpacity(middle, "lhs.plus") > 0);
  assert.ok(findOpacity(middle, "lhs.plus") < 1);
});

test("sampleEquationMotion returns visual motif phases on the same clock", () => {
  const transition = createEquationOperationTransition({
    sourceLatex: "x + 3 - 3 = 7 - 3",
    operation: {
      kind: "simplifySide",
      side: "left",
      rule: "cancel-additive-inverse"
    }
  });
  const plan = createEquationMotionPlan(transition);
  const frame = sampleEquationMotion(plan, 0.45);
  const motif = frame.visualMotifs.find(
    (candidate) => candidate.kind === "cancelation"
  );
  assert.ok(motif);
  const phaseById = new Map(
    motif.phases.map((phase) => [phase.phaseId, phase])
  );

  assert.equal(frame.progress, 0.45);
  assert.equal(findFrameToken(frame, "lhs.plus").tokenId, "lhs.plus");
  assert.equal(phaseById.get("cancel-meet")?.progress, 1);
  assert.equal(phaseById.get("cancel-collapse")?.progress, 0.5);
  assertNearlyEqual(phaseById.get("cancel-collapse")?.easedProgress ?? 0, 0.75);
});

test("createEquationMotionSampler validates motif beat coverage at construction", () => {
  const transition = createEquationOperationTransition({
    sourceLatex: "x + 3 - 3 = 7 - 3",
    operation: {
      kind: "simplifySide",
      side: "left",
      rule: "cancel-additive-inverse"
    }
  });
  const plan = createEquationMotionPlan(transition);
  const brokenTimeline = compileSemanticBeatTimeline({
    id: "missing-cancel-collapse",
    beatCount: linearEquationDemoBeatTimeline.beatCount,
    beats: linearEquationDemoBeatTimeline.beats.filter(
      (beat) => beat.id !== "cancel-collapse"
    )
  });

  assert.throws(
    () => createEquationMotionSampler(plan, { timeline: brokenTimeline }),
    /Unknown semantic beat cancel-collapse/
  );
});

test("createEquationMotionSampler returns independent motif frame objects", () => {
  const transition = createEquationOperationTransition({
    sourceLatex: "x + 3 - 3 = 7 - 3",
    operation: {
      kind: "simplifySide",
      side: "left",
      rule: "cancel-additive-inverse"
    }
  });
  const sampler = createEquationMotionSampler(
    createEquationMotionPlan(transition)
  );
  const first = sampler.sample(0.45);
  const second = sampler.sample(0.45);
  const firstMotif = first.visualMotifs.find(
    (candidate) => candidate.kind === "cancelation"
  );
  const secondMotif = second.visualMotifs.find(
    (candidate) => candidate.kind === "cancelation"
  );
  assert.ok(firstMotif);
  assert.ok(secondMotif);

  (firstMotif.phases[1] as { progress: number }).progress = 0;

  assert.equal(secondMotif.phases[1]?.progress, 0.5);
});

test("sampleEquationMotion samples generalized additive inverse cancelation", () => {
  const transition = createEquationOperationTransition({
    sourceLatex: "y + 2 - 2 = 10 - 2",
    operation: {
      kind: "simplifySide",
      side: "left",
      rule: "cancel-additive-inverse"
    }
  });
  const plan = createEquationMotionPlan(transition);

  const start = sampleEquationMotion(plan, 0);
  const middle = sampleEquationMotion(plan, 0.2);
  const end = sampleEquationMotion(plan, 1);

  assert.equal(findOpacity(start, "lhs.2"), 1);
  assert.ok(findOpacity(middle, "lhs.2") < 1);
  assert.equal(findOpacity(end, "lhs.2"), 0);
  assert.equal(findOpacity(end, "rhs.inverse.2"), 1);
});

test("sampleEquationMotion clamps progress and supports backward sampling", () => {
  const transition = createEquationOperationTransition({
    sourceLatex: "x = 7 - 3",
    operation: {
      kind: "simplifySide",
      side: "right",
      rule: "evaluate-constant-difference"
    }
  });
  const plan = createEquationMotionPlan(transition);

  assert.equal(sampleEquationMotion(plan, -1).progress, 0);
  assert.equal(sampleEquationMotion(plan, 2).progress, 1);
  assert.equal(sampleEquationMotion(plan, Number.NaN).progress, 0);
  assert.equal(sampleEquationMotion(plan, Number.NEGATIVE_INFINITY).progress, 0);
  assert.equal(sampleEquationMotion(plan, Number.POSITIVE_INFINITY).progress, 1);
  assert.equal(findOpacity(sampleEquationMotion(plan, -1), "rhs.4"), 0);
  assert.equal(findOpacity(sampleEquationMotion(plan, 2), "rhs.4"), 1);
  assertFinitePose(sampleEquationMotion(plan, Number.NaN), "rhs.4");

  const later = sampleEquationMotion(plan, 0.75);
  assert.equal(findOpacity(later, "rhs.4"), 1);
  const earlierAfterLater = sampleEquationMotion(plan, 0.25);
  const freshEarlier = sampleEquationMotion(plan, 0.25);

  assert.deepEqual(
    findFrameToken(earlierAfterLater, "rhs.4").pose,
    findFrameToken(freshEarlier, "rhs.4").pose
  );
});

function planWithTrack(
  track: EquationMotionPlan["tracks"][number]
): EquationMotionPlan {
  return {
    sourceLatex: "x",
    targetLatex: "x",
    correspondenceMap: {
      id: "test.role-aware-motion",
      records: [
        {
          id: `identity.${track.tokenId}`,
          relation: "identity",
          sourceSelectorIds: [track.tokenId],
          targetSelectorIds: [track.tokenId],
          summary: `${track.tokenId} role changes`
        }
      ]
    },
    tokens: [
      {
        id: track.tokenId,
        lifecycle: track.lifecycle,
        correspondenceRelation: "identity",
        semanticLifecycle: "identity-preserved",
        visualLifecycle: track.visualLifecycle,
        label: track.tokenId,
        sourceMotionId: `${track.tokenId}.source`,
        targetMotionId: `${track.tokenId}.target`
      }
    ],
    tracks: [track],
    visualMotifs: []
  };
}

test("sampleEquationMotion linearly interpolates all pose fields", () => {
  const plan: EquationMotionPlan = {
    sourceLatex: "x",
    targetLatex: "x",
    correspondenceMap: {
      id: "test.identity",
      records: [
        {
          id: "identity.x",
          relation: "identity",
          sourceSelectorIds: ["x"],
          targetSelectorIds: ["x"],
          summary: "x persists"
        }
      ]
    },
    tokens: [
      {
        id: "x",
        lifecycle: "persist",
        correspondenceRelation: "identity",
        semanticLifecycle: "identity-preserved",
        visualLifecycle: "persist",
        label: "x",
        sourceMotionId: "x",
        targetMotionId: "x"
      }
    ],
    tracks: [
      {
        tokenId: "x",
        lifecycle: "persist",
        visualLifecycle: "persist",
        start: 0,
        end: 1,
        easing: "linear",
        from: { opacity: 0, x: 0, y: 0, scale: 1 },
        to: { opacity: 1, x: 10, y: 20, scale: 2 }
      }
    ],
    visualMotifs: []
  };

  assert.deepEqual(findFrameToken(sampleEquationMotion(plan, 0.5), "x").pose, {
    opacity: 0.5,
    x: 5,
    y: 10,
    scale: 1.5
  });
});

test("sampleEquationMotion applies exact ease-out progress", () => {
  const transition = createEquationOperationTransition({
    sourceLatex: "x = 7 - 3",
    operation: {
      kind: "simplifySide",
      side: "right",
      rule: "evaluate-constant-difference"
    }
  });
  const plan = createEquationMotionPlan(transition);

  assertNearlyEqual(findOpacity(sampleEquationMotion(plan, 0.55), "rhs.4"), 0.75);
});

test("sampleEquationMotion returns independent pose objects", () => {
  const transition = createEquationOperationTransition({
    sourceLatex: "x = 7 - 3",
    operation: {
      kind: "simplifySide",
      side: "right",
      rule: "evaluate-constant-difference"
    }
  });
  const plan = createEquationMotionPlan(transition);

  const first = sampleEquationMotion(plan, 0.55);
  const second = sampleEquationMotion(plan, 0.55);

  (findFrameToken(first, "rhs.4").pose as { opacity: number }).opacity = 0;

  assertNearlyEqual(findOpacity(second, "rhs.4"), 0.75);
});

test("sampleEquationMotion defensively samples invalid track ranges", () => {
  const plan: EquationMotionPlan = {
    sourceLatex: "x",
    targetLatex: "x",
    correspondenceMap: {
      id: "test.identity",
      records: [
        {
          id: "identity.x",
          relation: "identity",
          sourceSelectorIds: ["x"],
          targetSelectorIds: ["x"],
          summary: "x persists"
        }
      ]
    },
    tokens: [
      {
        id: "x",
        lifecycle: "persist",
        correspondenceRelation: "identity",
        semanticLifecycle: "identity-preserved",
        visualLifecycle: "persist",
        label: "x",
        sourceMotionId: "x",
        targetMotionId: "x"
      }
    ],
    tracks: [
      {
        tokenId: "x",
        lifecycle: "persist",
        visualLifecycle: "persist",
        start: 0.5,
        end: 0.5,
        easing: "linear",
        from: { opacity: 0, x: 0, y: 0, scale: 1 },
        to: { opacity: 1, x: 10, y: 20, scale: 2 }
      }
    ],
    visualMotifs: []
  };

  assert.deepEqual(findFrameToken(sampleEquationMotion(plan, 0.49), "x").pose, {
    opacity: 0,
    x: 0,
    y: 0,
    scale: 1
  });
  assert.deepEqual(findFrameToken(sampleEquationMotion(plan, 0.5), "x").pose, {
    opacity: 1,
    x: 10,
    y: 20,
    scale: 2
  });

  const reversedPlan: EquationMotionPlan = {
    ...plan,
    tracks: [
      {
        tokenId: "x",
        lifecycle: "persist",
        visualLifecycle: "persist",
        start: 0.7,
        end: 0.3,
        easing: "linear",
        from: { opacity: 0, x: 0, y: 0, scale: 1 },
        to: { opacity: 1, x: 10, y: 20, scale: 2 }
      }
    ]
  };

  assert.deepEqual(
    findFrameToken(sampleEquationMotion(reversedPlan, 0.69), "x").pose,
    {
      opacity: 0,
      x: 0,
      y: 0,
      scale: 1
    }
  );
  assert.deepEqual(
    findFrameToken(sampleEquationMotion(reversedPlan, 0.7), "x").pose,
    {
      opacity: 1,
      x: 10,
      y: 20,
      scale: 2
    }
  );
});
