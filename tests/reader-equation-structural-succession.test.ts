import assert from "node:assert/strict";
import test from "node:test";

import {
  createExponentRadicalRewriteAnimationAsset
} from "../src/animation/exponent-radical-adapter.ts";
import {
  createLinearSolveAnimationAsset
} from "../src/animation/linear-solve-adapter.ts";
import {
  sampleKpAnimationRuntimeFrame
} from "../src/animation/runtime-sampler.ts";
import {
  projectKpReaderEquationRenderPlan,
  projectKpReaderEquationTransitionPresentation
} from "../src/reader/renderers/public-api.ts";

test("reader plan preserves compiler-owned structural succession intent", () => {
  const animation = createExponentRadicalRewriteAnimationAsset();
  const runtimeFrame = sampleKpAnimationRuntimeFrame({
    id: "runtime.reader.radical-structural-intent",
    animation,
    direction: "forward",
    progress: 0.5
  });
  const transition = projectKpReaderEquationRenderPlan({
    animation,
    runtimeFrame
  }).transitions[0]!;
  const presentation = projectKpReaderEquationTransitionPresentation(
    transition.presentationPlan
  );
  const succession = presentation.structuralSuccession!;
  const {
    operationPresentationPlan,
    ...structuralIntent
  } = succession;

  assert.equal(presentation.visualMotif?.kind, "radical-corner-transfer");
  assert.equal(operationPresentationPlan.planKind, "structural-succession");
  assert.deepEqual(structuralIntent, {
    kind: "equation-structural-succession-intent",
    id: `structural-succession.${transition.id}`,
    motifKind: "radical-corner-transfer",
    sourceEntityIds: [
      "expression.generated.radical.square-root-as-power.power.exponent-numerator",
      "expression.generated.radical.square-root-as-power.power.exponent-fraction-line",
      "expression.generated.radical.square-root-as-power.power.exponent-denominator"
    ],
    targetEntityIds: [
      "expression.generated.radical.square-root-as-power.radical.radical-overbar",
      "expression.generated.radical.square-root-as-power.radical.radical-hook"
    ],
    actPhaseIds: ["radical-representation-handoff"],
    paintStrategy: {
      kind: "solid-mask-succession",
      profileId: "radical-morph.conventional-solid-mask.v1",
      morph: {
        start: 0.06,
        end: 0.82,
        easing: "ease-in-out"
      },
      settlement: {
        start: 0.82,
        end: 0.94,
        easing: "ease-in-out"
      },
      solidMask: {
        maximumDistancePx: 24,
        edgeSoftnessPx: 0.7,
        boundsPaddingPx: 4,
        sourceTravelFraction: 1,
        sourceArcHeightPx: 6,
        shapeLeadFraction: 0.12,
        targetGrowthOriginXFraction: 0.36,
        targetGrowthOriginYFraction: 0.16,
        targetGrowthSoftnessPx: 0.8,
        bridgeExpansionPx: 0.55,
        endpointBlendFraction: 0.08
      }
    }
  });
  if (operationPresentationPlan.planKind === "structural-succession") {
    const source = operationPresentationPlan.roles.bundles.find(
      ({ id }) => id === operationPresentationPlan.sourceBundleId
    );
    const target = operationPresentationPlan.roles.bundles.find(
      ({ id }) => id === operationPresentationPlan.targetBundleId
    );
    assert.equal(source?.role, "source-material");
    assert.equal(target?.role, "target-material");
    assert.equal(
      operationPresentationPlan.roles.bundles.filter(
        ({ role }) => role === "continuant"
      ).length,
      1
    );
  }
});

test("ordinary correspondence receives motif intent without structural strategy", () => {
  const animation = createLinearSolveAnimationAsset();
  const transition = projectKpReaderEquationRenderPlan({
    animation,
    runtimeFrame: sampleKpAnimationRuntimeFrame({
      id: "runtime.reader.linear-motif-intent",
      animation,
      direction: "forward",
      progress: 0.5
    })
  }).transitions[0]!;
  const presentation = projectKpReaderEquationTransitionPresentation(
    transition.presentationPlan
  );

  assert.notEqual(presentation.visualMotif, undefined);
  assert.equal(presentation.structuralSuccession, undefined);
});
