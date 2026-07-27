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
  projectKpReaderEquationRenderPlan,
  compileKpReaderEquationMaterialPlan,
  validateKpReaderEquationMaterialPlanTotality
} from "../src/reader/renderers/public-api.ts";

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
    assert.equal(renderPlan.transitions.length, 1);
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

test("parallel motif phases render as one complete source-target cohort", () => {
  const animation = createKpFoldableDistributionEquationAnimationAsset();
  for (const progress of [0.05, 0.3]) {
    const runtimeFrame = sampleKpAnimationRuntimeFrame({
      animation,
      progress
    });
    const renderPlan = projectKpReaderEquationRenderPlan({
      animation,
      runtimeFrame
    });
    const transition = renderPlan.transitions[0]!;

    assert.match(transition.id, /^cohort\./);
    assert.equal(transition.transformType, "parallelSemanticCohort");
    assert.equal(
      transition.relations.length,
      runtimeFrame.activeTransformationIds.reduce((count, id) =>
        count + animation.transformations.find(
          (candidate) => candidate.id === id
        )!.correspondenceMap!.records.length, 0)
    );
    const material = compileKpReaderEquationMaterialPlan(renderPlan);
    assert.deepEqual(material.diagnostics, []);
    assert.deepEqual(
      validateKpReaderEquationMaterialPlanTotality(renderPlan, material),
      []
    );
  }
});

test("parallel product cohort retains both successor synthesis bindings", () => {
  const animation = createKpFoldableDistributionEquationAnimationAsset();
  const runtimeFrame = sampleKpAnimationRuntimeFrame({
    animation,
    progress: 0.3
  });
  const transition = projectKpReaderEquationRenderPlan({
    animation,
    runtimeFrame
  }).transitions[0]!;

  assert.match(transition.id, /^cohort\./);
  assert.equal(transition.successorSyntheses?.length, 2);
  assert.equal(
    new Set(transition.successorSyntheses?.map(({ id }) => id)).size,
    2
  );
  assert.ok(transition.successorSyntheses?.every((binding) =>
    binding.sourceAnnotations.some(
      ({ contribution }) => contribution === "catalyst"
    )
  ));
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
