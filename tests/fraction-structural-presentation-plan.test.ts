import assert from "node:assert/strict";
import test from "node:test";

import {
  createNumeratorSplitMergeEquationAnimationAsset
} from "../src/animation/numerator-split-merge-equation-adapter.ts";
import {
  sampleKpAnimationRuntimeFrame
} from "../src/animation/runtime-sampler.ts";
import {
  createKpSemanticTransformation
} from "../src/semantic/asset-transformation.ts";
import {
  compileKpFractionMaterialPresentationPlan
} from "../src/animation/fraction-material-presentation-plan.ts";
import {
  runKpOperationPresentationLaws
} from "../src/animation/operation-presentation-laws.ts";
import {
  projectKpReaderEquationRenderPlan,
  projectKpReaderEquationTransitionPresentation
} from "../src/reader/renderers/public-api.ts";

test("fraction split and merge own total fission/fusion material plans", () => {
  const animation = createNumeratorSplitMergeEquationAnimationAsset();
  for (const [progress, operation] of [
    [0.25, "fission"],
    [0.75, "fusion"]
  ] as const) {
    const transition = projectKpReaderEquationRenderPlan({
      animation,
      runtimeFrame: sampleKpAnimationRuntimeFrame({
        animation,
        progress
      })
    }).transitions[0]!;
    const presentation = projectKpReaderEquationTransitionPresentation(
      transition.presentationPlan
    );
    const plan = presentation.fractionMaterialPresentationPlan!;

    assert.equal(transition.presentationPlan.planKind, "fraction-material");
    assert.equal(plan.planKind, "fraction-material");
    assert.equal(plan.operation, operation);
    const group = plan.roles.groups.find(
      ({ id }) => id === plan.materialGroupId
    );
    assert.equal(group?.groupKind, operation);
    assert.deepEqual(
      new Set(plan.roles.bundles.flatMap(
        ({ semanticEntityIds }) => semanticEntityIds
      )),
      new Set([
        ...transition.source.flatMap(({ selectors }) =>
          selectors.map(({ id }) => id)
        ),
        ...transition.target.flatMap(({ selectors }) =>
          selectors.map(({ id }) => id)
        )
      ])
    );
    assert.equal(
      plan.roles.bundles.filter(({ role }) => role === "continuant").length,
      4
    );
  }
});

test("fraction material compiler rejects partial structural lineage", () => {
  const transformation = createKpSemanticTransformation({
    id: "transform.test.partial-fraction-fission",
    definitionId: "definition.symbolic.algebra.split-fraction-sum",
    transformType: "splitFractionSum",
    title: "Partial fraction split",
    sourceObjectIds: ["source"],
    targetObjectIds: ["target"],
    preserves: ["identity", "value"],
    correspondenceMap: {
      id: "map.test.partial-fraction-fission",
      records: [{
        id: "rule-splits",
        relation: "fan-out",
        sourceSelectorIds: ["source.rule"],
        targetSelectorIds: ["target.left-rule", "target.right-rule"],
        summary: "Only the rule was described."
      }]
    }
  });

  assert.throws(
    () => compileKpFractionMaterialPresentationPlan({
      transformation,
      sourceSelectorIds: ["source.rule", "source.denominator"],
      targetSelectorIds: [
        "target.left-rule",
        "target.right-rule",
        "target.left-denominator",
        "target.right-denominator"
      ]
    }),
    /has no presentation role/
  );
});

test("fraction material law rejects a reversed operation label", () => {
  const animation = createNumeratorSplitMergeEquationAnimationAsset();
  const transition = projectKpReaderEquationRenderPlan({
    animation,
    runtimeFrame: sampleKpAnimationRuntimeFrame({
      animation,
      progress: 0.25
    })
  }).transitions[0]!;
  const plan = projectKpReaderEquationTransitionPresentation(
    transition.presentationPlan
  ).fractionMaterialPresentationPlan!;
  const diagnostics = runKpOperationPresentationLaws({
    plan: {
      ...plan,
      operation: "fusion"
    },
    context: {
      sourceSelectorIds: transition.source.flatMap(({ selectors }) =>
        selectors.map(({ id }) => id)
      ),
      targetSelectorIds: transition.target.flatMap(({ selectors }) =>
        selectors.map(({ id }) => id)
      ),
      scheduledGroupIds: [plan.materialGroupId],
      endpointSettlement: "native-source-and-target",
      rewind: "exact-semantic-inverse"
    }
  });

  assert.ok(diagnostics.some(
    ({ code }) => code === "lineage.fraction-material-direction"
  ));
});
