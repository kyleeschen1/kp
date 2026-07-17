import assert from "node:assert/strict";
import test from "node:test";

import {
  createExponentRadicalRewriteAnimationAsset
} from "../src/animation/exponent-radical-adapter.ts";
import {
  createKpRadicalSuccessionChoreography,
  kpRadicalSuccessionTiming,
  sampleKpRadicalSuccessionChoreography
} from "../src/animation/radical-succession-choreography.ts";
import { validateKpChoreographyHierarchyPlan } from "../src/animation/choreography-hierarchy.ts";
import type { KpMeasuredEquationTransitionGeometry } from "../src/rendering/equation-motion-dom.ts";
import { sampleKpEquationTokenMotion } from "../src/rendering/semantic-equation-token-renderer.ts";

const choreography = createKpRadicalSuccessionChoreography(
  createExponentRadicalRewriteAnimationAsset()
);

test("radical rewrite compiles continuants and explicit fragment successions", () => {
  assert.deepEqual(
    choreography.plan.phases.map((phase) => phase.id),
    ["orient", "reflow", "act", "settle", "release"]
  );
  assert.equal(choreography.plan.vocabulary.continuants.length, 3);
  assert.equal(
    choreography.plan.vocabulary.representationalLineages.length,
    2
  );
  assert.equal(choreography.fragmentLineage.absorptions.length, 1);
  assert.equal(choreography.propagationRule, "far-to-near");
  assert.deepEqual(choreography.pathRequirement, {
    motifId: "radical.rewrite-power-as-root",
    requiredPathFamily: "opposite-corner",
    requireOppositeCornerReconciliation: true
  });
});

test("radical hierarchy keeps semantic authority above independently moving tokens", () => {
  assert.deepEqual(
    validateKpChoreographyHierarchyPlan(choreography.hierarchy),
    []
  );
  assert.equal(choreography.hierarchy.groups.length, 1);
  assert.equal(choreography.hierarchy.tokens.length, 5);
  assert.ok(
    choreography.hierarchy.tokens.every(
      (token) => token.kind === "structural"
    )
  );
  assert.deepEqual(
    choreography.hierarchy.settlement.nativeTokenIds,
    choreography.hierarchy.tokens.map((token) => token.id)
  );
});

test("shared timing isolates base reflow before notation gathering", () => {
  assert.equal(
    choreography.timeline.phases.find((phase) => phase.phaseId === "reflow")
      ?.end,
    kpRadicalSuccessionTiming.reflowEnd
  );
  const reflow = sampleKpRadicalSuccessionChoreography({
    choreography,
    progress: 0.25,
    direction: "forward",
    accessibilityMode: "full"
  });
  assert.deepEqual(reflow.timeline.activePhaseIds, ["reflow"]);
  const act = sampleKpRadicalSuccessionChoreography({
    choreography,
    progress: 0.5,
    direction: "forward",
    accessibilityMode: "full"
  });
  assert.deepEqual(act.timeline.activePhaseIds, ["act"]);
});

test("token sampler uses opposite-corner gathering and far-side stagger", () => {
  const midpoint = sampleKpEquationTokenMotion(geometry(), 0.55);
  assert.equal(
    midpoint.representationalSuccession?.kind,
    "opposite-corner-seed"
  );
  const sourceNotation = midpoint.tokens.filter(
    (token) => token.side === "source" && token.motionId.startsWith("exponent.")
  );
  const targetNotation = midpoint.tokens.filter(
    (token) => token.side === "target" && token.motionId.startsWith("radical.")
  );
  assert.equal(sourceNotation.length, 3);
  assert.equal(targetNotation.length, 2);
  assert.ok(
    sourceNotation.every(
      (token) =>
        token.pose.opacity === 1 &&
        token.pose.scale >= 0.78 &&
        token.motionPathVariant === "opposite-corner"
    )
  );
  assert.ok(
    new Set(
      sourceNotation.map((token) => `${token.pose.x},${token.pose.y}`)
    ).size > 1
  );
  const targetTransfer = sampleKpEquationTokenMotion(geometry(), 0.67).tokens
    .filter(
      (token) => token.side === "target" && token.motionId.startsWith("radical.")
    );
  assert.ok(new Set(targetTransfer.map((token) => token.pose.opacity)).size > 1);
  assert.deepEqual(
    targetTransfer.map((token) => token.motionPathVariant),
    ["diagonal-arc-below", "diagonal-arc-above"]
  );
  assert.ok(targetTransfer.every((token) => token.pose.scale >= 0.82));

  const base = midpoint.tokens.find((token) => token.motionId === "base.x");
  assert.equal(base?.pose.opacity, 1);
  assert.equal(base?.pose.scale, 1);
});

test("exponent fragments retain distinct slots inside one corner region", () => {
  const sampledGeometry = geometry();
  const gathered = sampleKpEquationTokenMotion(sampledGeometry, 0.64);
  const bundle = gathered.representationalSuccession?.bundlePoint;
  assert.ok(bundle);
  const gatheredCenters = gathered.tokens
    .filter(
      (token) =>
        token.side === "source" && token.motionId.startsWith("exponent.")
    )
    .map((token) => {
      const source = sampledGeometry.sourceTokens.find(
        (candidate) => candidate.motionId === token.motionId
      )!;
      return {
        x: source.localRect.left + source.localRect.width / 2 + token.pose.x,
        y: source.localRect.top + source.localRect.height / 2 + token.pose.y
      };
    });
  assert.equal(
    new Set(gatheredCenters.map((center) => `${center.x},${center.y}`)).size,
    3
  );
  assert.ok(gatheredCenters.every(
    (center) => Math.hypot(center.x - bundle.x, center.y - bundle.y) < 30
  ));
});

test("radical succession settles to exact native token endpoints", () => {
  const end = sampleKpEquationTokenMotion(geometry(), 1);
  assert.ok(
    end.tokens
      .filter((token) => token.side === "source")
      .every((token) => token.pose.opacity === 0)
  );
  assert.ok(
    end.tokens
      .filter((token) => token.side === "target")
      .every(
        (token) =>
          token.pose.opacity === 1 &&
          token.pose.x === 0 &&
          token.pose.y === 0 &&
          token.pose.scale === 1
      )
  );
});

test("radical target fragments are still before native settlement begins", () => {
  const sampledGeometry = geometry();
  const settlementStart = sampleKpEquationTokenMotion(sampledGeometry, 0.88);
  const targetNotation = settlementStart.tokens.filter(
    (token) => token.side === "target" && token.motionId.startsWith("radical.")
  );
  assert.equal(targetNotation.length, 2);
  assert.ok(targetNotation.every(
    (token) => token.pose.x === 0 && token.pose.y === 0 && token.pose.scale === 1
  ));
});

function geometry(): KpMeasuredEquationTransitionGeometry {
  const element = () => ({ style: {}, dataset: {} }) as unknown as HTMLElement;
  const token = (
    motionId: string,
    left: number,
    top: number,
    width = 8,
    height = 8
  ) => ({
    motionId,
    text: motionId,
    rect: { left, top, width, height },
    localRect: { left, top, width, height },
    element: element()
  });
  return {
    transitionId: "transition.radical",
    representationalSuccessionKind: "opposite-corner-seed",
    sourceTokens: [
      token("base.x", 10, 30, 14, 18),
      token("exponent.numerator", 32, 4),
      token("exponent.line", 30, 13, 12, 2),
      token("exponent.denominator", 32, 18)
    ],
    targetTokens: [
      token("radicand.x", 38, 30, 14, 18),
      token("radical.glyph", 22, 24, 10, 26),
      token("radical.bar", 30, 22, 28, 2)
    ],
    relations: [
      {
        recordId: "base-becomes-radicand",
        lifecycle: "role-change",
        source: endpoint(["base.x"], { left: 10, top: 30, width: 14, height: 18 }),
        target: endpoint(["radicand.x"], { left: 38, top: 30, width: 14, height: 18 }),
        delta: { x: 28, y: 0, scaleX: 1, scaleY: 1 }
      },
      {
        recordId: "unit-numerator-absorbed",
        lifecycle: "exit",
        source: endpoint(
          ["exponent.numerator"],
          { left: 32, top: 4, width: 8, height: 8 }
        )
      },
      {
        recordId: "fraction-rule-becomes-radical-overbar",
        lifecycle: "role-change",
        source: endpoint(
          ["exponent.line"],
          { left: 30, top: 13, width: 12, height: 2 }
        ),
        target: endpoint(
          ["radical.bar"],
          { left: 30, top: 22, width: 28, height: 2 }
        ),
        delta: { x: 23, y: 8, scaleX: 1, scaleY: 1 }
      },
      {
        recordId: "denominator-becomes-radical-hook",
        lifecycle: "role-change",
        source: endpoint(
          ["exponent.denominator"],
          { left: 32, top: 18, width: 8, height: 8 }
        ),
        target: endpoint(
          ["radical.glyph"],
          { left: 22, top: 24, width: 10, height: 26 }
        ),
        delta: { x: -9, y: 12, scaleX: 1, scaleY: 1 }
      }
    ]
  };
}

function endpoint(
  motionIds: readonly string[],
  bounds: { left: number; top: number; width: number; height: number }
) {
  return {
    selectorIds: [...motionIds],
    motionIds: [...motionIds],
    bounds
  };
}
