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
  projectKpReaderEquationTransitionPresentation,
  compileKpReaderEquationMaterialPlan,
  validateKpReaderEquationMaterialPlanTotality
} from "../src/reader/renderers/public-api.ts";

test("foldable distribution animation retains five phases and seven operations", () => {
  const animation = createKpFoldableDistributionEquationAnimationAsset();
  const refs = compileKpAnimationAssetSemanticRefs(animation);
  const timeline = createKpFoldableDistributionVisualMotifTimeline();

  assert.deepEqual(refs.diagnostics, []);
  assert.equal(animation.transformations.length, 7);
  assert.deepEqual(
    timeline.forwardPhases.map(({ segmentIds }) => segmentIds.length),
    [2, 2, 1, 1, 1]
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
      "merge-fan-in",
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
  for (const progress of [0.05, 0.25, 0.5, 0.7, 0.9]) {
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
    assert.ok(
      renderPlan.transitions.every(
        ({ semanticStatus }) => semanticStatus === "ready"
      ),
      renderPlan.transitions.flatMap(
        ({ semanticDiagnostics }) => semanticDiagnostics.map(
          ({ message }) => message
        )
      ).join("\n")
    );
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

test("reader execution retains the signed-term reorder motif", () => {
  const animation = createKpFoldableDistributionEquationAnimationAsset();
  const runtimeFrame = sampleKpAnimationRuntimeFrame({
    animation,
    progress: 0.5
  });
  const transition = projectKpReaderEquationRenderPlan({
    animation,
    runtimeFrame
  }).transitions[0]!;
  const presentation = projectKpReaderEquationTransitionPresentation(
    transition.presentationPlan
  );

  assert.equal(transition.transformType, "groupLikeTerms");
  assert.equal(
    presentation.visualMotif?.kind,
    "semantic-reorder-and-group"
  );
});

test("factoring binds the exact x lineage and preserves all other context", () => {
  const animation = createKpFoldableDistributionEquationAnimationAsset();
  for (const [direction, progress] of [
    ["forward", 0.7],
    ["rewind", 0.3]
  ] as const) {
    const runtimeFrame = sampleKpAnimationRuntimeFrame({
      animation,
      direction,
      progress
    });
    const transition = projectKpReaderEquationRenderPlan({
      animation,
      runtimeFrame
    }).transitions[0]!;
    const presentation = projectKpReaderEquationTransitionPresentation(
      transition.presentationPlan
    );
    const binding = presentation.factoringMotifBinding!;
    const relation = transition.relations.find(
      ({ recordId }) => recordId === binding.relationRecordId
    )!;

    assert.equal(transition.transformType, "factorCommonTerm");
    assert.equal(binding.synchronization, "simultaneous");
    assert.equal(binding.fusionPaintPolicy, "opaque-many-to-one");
    assert.equal(binding.coefficientEvaluation, "deferred");
    assert.deepEqual(
      binding.factorCopyIds,
      direction === "forward"
        ? relation.sourceSelectorIds
        : relation.targetSelectorIds
    );
    assert.equal(
      binding.commonFactorId,
      (direction === "forward"
        ? relation.targetSelectorIds
        : relation.sourceSelectorIds)[0]
    );
    assert.equal(
      binding.contextCorrespondences.length,
      transition.relations.length - 1
    );
  }
});

test("parallel motif phases retain one complete cohort and execution authority", () => {
  const animation = createKpFoldableDistributionEquationAnimationAsset();
  for (const [progress, executionKind] of [
    [0.05, "copy-fan-out"],
    [0.3, "operation-evaluation"]
  ] as const) {
    const runtimeFrame = sampleKpAnimationRuntimeFrame({
      animation,
      progress
    });
    const renderPlan = projectKpReaderEquationRenderPlan({
      animation,
      runtimeFrame
    });
    const transition = renderPlan.transitions[0]!;
    const presentation = projectKpReaderEquationTransitionPresentation(
      transition.presentationPlan
    );

    assert.match(transition.id, /^cohort\./);
    assert.equal(transition.transformType, "parallelSemanticCohort");
    // Successor cohorts use the sealed program as their execution authority;
    // retaining the older decorative motif label would let tests pass while a
    // different runtime route actually executes.
    const effectiveExecutionKind =
      presentation.executableProgram?.kind ??
      presentation.visualMotif?.kind;
    assert.equal(
      effectiveExecutionKind,
      executionKind,
      "homogeneous parallel cohorts must retain their execution authority"
    );
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
  const presentation = projectKpReaderEquationTransitionPresentation(
    transition.presentationPlan
  );

  assert.match(transition.id, /^cohort\./);
  assert.equal(
    presentation.executableProgram?.kind,
    "operation-evaluation"
  );
  assert.equal(presentation.successorSyntheses?.length, 2);
  assert.equal(
    new Set(presentation.successorSyntheses?.map(({ id }) => id)).size,
    2
  );
  assert.ok(presentation.successorSyntheses?.every((binding) =>
    binding.sourceAnnotations.some(
      ({ contribution }) => contribution === "catalyst"
    )
  ));
});

test("final collection retains separate sum and difference successor bindings", () => {
  const animation = createKpFoldableDistributionEquationAnimationAsset();
  const runtimeFrame = sampleKpAnimationRuntimeFrame({
    animation,
    progress: 0.9
  });
  const transition = projectKpReaderEquationRenderPlan({
    animation,
    runtimeFrame
  }).transitions[0]!;
  const presentation = projectKpReaderEquationTransitionPresentation(
    transition.presentationPlan
  );

  assert.equal(
    transition.id,
    "transform.foldable-distribution.collect-results"
  );
  assert.deepEqual(
    presentation.successorSyntheses?.map(
      ({ authority }) => authority.operationId
    ).sort(),
    [
      "kp.algebra.simplify-constant-difference",
      "kp.algebra.simplify-constant-sum"
    ]
  );
  assert.ok(presentation.successorSyntheses?.every((binding) =>
    binding.sourceAnnotations.filter(
      ({ contribution }) => contribution === "material-input"
    ).length === 2 &&
    binding.sourceAnnotations.filter(
      ({ contribution }) => contribution === "catalyst"
    ).length === 1
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
