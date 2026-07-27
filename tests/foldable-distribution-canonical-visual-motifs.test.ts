import assert from "node:assert/strict";
import test from "node:test";

import {
  compileKpAnimationAssetSemanticRefs
} from "../src/animation/asset.ts";
import {
  createKpFoldableDistributionEquationAnimationAsset,
  createKpFoldableDistributionVisualMotifTimeline
} from "../src/animation/foldable-distribution-equation-adapter.ts";
import {
  checkTransformTreeVisualMotifRewindLaw
} from "../src/animation/motifs/visual-motif-composition.ts";
import {
  sampleKpAnimationRuntimeFrame
} from "../src/animation/runtime-sampler.ts";
import {
  projectKpReaderEquationRenderPlan
} from "../src/reader/renderers/equation-render-plan.ts";

test("foldable distribution animation retains four phases and six operations", () => {
  const animation = createKpFoldableDistributionEquationAnimationAsset();
  const refs = compileKpAnimationAssetSemanticRefs(animation);
  const timeline = createKpFoldableDistributionVisualMotifTimeline();

  assert.deepEqual(refs.diagnostics, []);
  assert.equal(animation.transformations.length, 6);
  assert.deepEqual(
    timeline.forwardPhases.map(({ segmentIds }) => segmentIds.length),
    [2, 2, 1, 1]
  );
  assert.equal(checkTransformTreeVisualMotifRewindLaw(timeline).passed, true);
});

test("canonical phases select proper semantic motifs without fade primitives", () => {
  const timeline = createKpFoldableDistributionVisualMotifTimeline();

  assert.deepEqual(
    timeline.segments.map(({ motifKind }) => motifKind),
    [
      "copy-fan-out",
      "copy-fan-out",
      "successor-synthesis",
      "successor-synthesis",
      "semantic-reorder-and-group",
      "merge-fan-in"
    ]
  );
  for (const segment of timeline.segments) {
    assert.equal(
      segment.motionPrimitiveIds.some((primitive) =>
        ["enter", "exit", "reveal", "vanish"].includes(primitive)
      ),
      false,
      segment.id
    );
    assert.ok((segment.canonicalOperationIds?.length ?? 0) > 0);
    assert.ok((segment.trustedMotifIds?.length ?? 0) > 0);
  }
});

test("every phase compiles semantic transition IR rather than fallback paint", () => {
  const animation = createKpFoldableDistributionEquationAnimationAsset();
  for (const progress of [0.05, 0.3, 0.55, 0.8]) {
    const runtimeFrame = sampleKpAnimationRuntimeFrame({
      animation,
      progress
    });
    const renderPlan = projectKpReaderEquationRenderPlan({
      animation,
      runtimeFrame
    });

    assert.ok(renderPlan.transitions.length > 0);
    assert.ok(renderPlan.transitions.every(
      ({ semanticStatus }) => semanticStatus === "ready"
    ));
    assert.ok(renderPlan.transitions.every(
      ({ relations }) => relations.some(({ lifecycle }) =>
        lifecycle === "persist" ||
        lifecycle === "split" ||
        lifecycle === "merge" ||
        lifecycle === "role-change"
      )
    ));
  }
});

test("structural branching and fusion remain opaque semantic relations", () => {
  const animation = createKpFoldableDistributionEquationAnimationAsset();
  const relations = animation.transformations.flatMap(
    (transformation) => transformation.correspondenceMap?.records ?? []
  );

  assert.equal(relations.some(({ relation }) => relation === "fan-out"), true);
  assert.equal(relations.some(({ relation }) => relation === "fan-in"), true);
  assert.equal(
    animation.metadata?.["paintPolicy"],
    "opaque-lineage"
  );
  assert.ok(animation.transformations.every((transformation) => {
    const kinds = new Set(
      transformation.correspondenceMap?.records.map(({ relation }) => relation)
    );
    return !(kinds.size === 2 && kinds.has("removal") && kinds.has("introduction"));
  }));
});
