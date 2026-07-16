import assert from "node:assert/strict";
import test from "node:test";

import { createFunctionWrapAnimationAsset } from "../src/animation/function-wrap-adapter.ts";
import { createLinearSolveAnimationAsset } from "../src/animation/linear-solve-adapter.ts";
import { createKpAnimationAssetVisualMotifTimeline } from "../src/animation/visual-motif.ts";
import {
  findEquationAnimationCatalogEntry
} from "../src/editor/equation-animation-catalog.ts";
import { defaultEquationTransformVisualMotifRules } from "../src/rendering/equation-visual-motif-defaults.ts";
import {
  choreographyEnvelopePhaseIds,
  choreographyExemplarBaseline,
  choreographyExemplarBaselines
} from "./fixtures/choreography-exemplar-baseline.ts";

test("dashboard exemplar baselines close the five-phase envelope without hiding gaps", () => {
  assert.equal(choreographyExemplarBaselines.length, 3);

  for (const baseline of choreographyExemplarBaselines) {
    assert.deepEqual(
      baseline.phases.map((phase) => phase.phaseId),
      choreographyEnvelopePhaseIds
    );
    assert.deepEqual(
      baseline.checkpoints.map((checkpoint) => checkpoint.id),
      [
        "start",
        "focus-peak",
        "reflow-complete",
        "act-midpoint",
        "settled",
        "released",
        "rewind"
      ]
    );
    assert.ok(baseline.continuants.length > 0);
    assert.ok(baseline.appearances.every((appearance) => appearance.cause.length > 0));
    assert.ok(baseline.knownGaps.length > 0);
    assert.ok(
      baseline.phases.some((phase) =>
        phase.status === "missing" || phase.status === "partial"
      )
    );
  }
});

test("function-wrap baseline pins reflow before independently timed wrapper entry", () => {
  const baseline = choreographyExemplarBaseline(
    "exemplar.function-wrap.dashboard-v0"
  );
  const animation = createFunctionWrapAnimationAsset();
  const timeline = createKpAnimationAssetVisualMotifTimeline({
    animation,
    rules: defaultEquationTransformVisualMotifRules
  });
  const fixture = findEquationAnimationCatalogEntry(
    "fixture-wrapper-function-wrap"
  );
  const transition = fixture.transitions[0]!;

  assert.ok(baseline.animationIds.includes(animation.id));
  assert.deepEqual(timeline.segments[0]?.phaseIds, [
    "wrapped-token-shift",
    "wrap-artifact-enter"
  ]);
  assert.deepEqual(
    transition.correspondenceMap?.records.map((record) => [
      record.relation,
      record.sourceSelectorIds,
      record.targetSelectorIds
    ]),
    [
      [
        "role-change",
        ["wrapper.function.wrap.source.x"],
        ["wrapper.function.wrap.target.x"]
      ],
      [
        "artifact",
        [],
        ["wrapper.function.wrap.target.f"]
      ],
      [
        "artifact",
        [],
        [
          "wrapper.function.wrap.target.open-paren",
          "wrapper.function.wrap.target.close-paren"
        ]
      ]
    ]
  );
  assert.deepEqual(
    transition.tokens.map((token) => [
      token.id,
      token.motion?.start,
      token.motion?.end
    ]),
    [
      ["wrapper.function.wrap.x", 0, 0.4],
      ["wrapper.function.wrap.f", 0.5, 0.78],
      ["wrapper.function.wrap.open-paren", 0.42, 0.7],
      ["wrapper.function.wrap.close-paren", 0.42, 0.7]
    ]
  );
});

test("radical baseline pins semantic object constancy and representational lineage", () => {
  const baseline = choreographyExemplarBaseline(
    "exemplar.radical-rewrite.dashboard-v0"
  );
  const fixture = findEquationAnimationCatalogEntry(
    "fixture-radical-rewrite-power-as-root"
  );
  const transition = fixture.transitions[0]!;

  assert.equal(baseline.continuants[0]?.relation, "role-change");
  assert.equal(
    baseline.continuants[1]?.relation,
    "representational-lineage"
  );
  assert.deepEqual(
    transition.correspondenceMap?.records.map((record) => record.relation),
    ["role-change", "removal", "artifact"]
  );
  assert.deepEqual(
    transition.tokens.map((token) => [
      token.id,
      token.sourceMotionId,
      token.targetMotionId
    ]),
    [
      [
        "radical.rewrite-power-as-root.x",
        "radical.rewrite-power-as-root.source.x",
        "radical.rewrite-power-as-root.target.x"
      ],
      [
        "radical.rewrite-power-as-root.exponent",
        "radical.rewrite-power-as-root.source.exponent",
        undefined
      ],
      [
        "radical.rewrite-power-as-root.radical",
        undefined,
        "radical.rewrite-power-as-root.target.radical"
      ]
    ]
  );
  assert.match(
    baseline.geometry.join(" "),
    /opposite corner|down and inward/i
  );
  assert.match(
    baseline.propagation.join(" "),
    /six-by-two.*ten-by-two/i
  );
});

test("linear baseline pins causal operation order and persistent equation anchors", () => {
  const baseline = choreographyExemplarBaseline(
    "exemplar.linear-rearrangement.dashboard-v0"
  );
  const animation = createLinearSolveAnimationAsset();
  const timeline = createKpAnimationAssetVisualMotifTimeline({
    animation,
    rules: defaultEquationTransformVisualMotifRules
  });

  assert.ok(baseline.animationIds.includes(animation.id));
  assert.deepEqual(
    timeline.segments.map((segment) => [
      segment.transformationKind,
      segment.motifKind,
      segment.phaseIds
    ]),
    [
      [
        "subtractBothSides",
        "append-after-shift",
        ["layout-shift", "introduced-token-enter"]
      ],
      [
        "cancelAdditiveInverses",
        "cancelation",
        ["cancel-meet", "cancel-collapse", "post-cancel-layout-shift"]
      ],
      [
        "simplifyConstantDifference",
        "simplify-into",
        [
          "final-simplify-meet",
          "final-simplify-collapse",
          "final-simplify-reveal"
        ]
      ]
    ]
  );
  assert.deepEqual(
    animation.transformationTree.annotations.map((annotation) => [
      annotation.kind,
      annotation.targetNodeId,
      annotation.placement
    ]),
    [
      ["pause", "transform.linear-solve.subtract-both-sides-3", "after"],
      ["focus", "transform.linear-solve.cancel-left-additive-inverse", "during"],
      ["pause", "transform.linear-solve.cancel-left-additive-inverse", "after"]
    ]
  );
  assert.deepEqual(
    baseline.continuants.map((continuant) => continuant.id),
    ["continuant.linear.x", "continuant.linear.relation"]
  );
});
