import assert from "node:assert/strict";
import test from "node:test";

import {
  createDistributionExpansionAnimationAsset,
  createDistributionFactoringAnimationAsset
} from "../src/animation/distribution-adapter.ts";
import {
  compileKpDistributionFactoringPresentationPlan
} from "../src/animation/distribution-factoring-presentation-plan.ts";
import {
  findKpRegisteredOperationPresentationPlan
} from "../src/animation/operation-presentation-plan-types.ts";
import {
  createKpFoldableDistributionEquationAnimationAsset
} from "../src/animation/foldable-distribution-equation-adapter.ts";
import {
  sampleKpAnimationRuntimeFrame
} from "../src/animation/runtime-sampler.ts";
import {
  createKpSemanticTransformation
} from "../src/semantic/asset-transformation.ts";
import {
  projectKpReaderEquationRenderPlan,
  projectKpReaderEquationTransitionPresentation
} from "../src/reader/renderers/public-api.ts";

test("generated distribution owns one total verified branch plan", () => {
  const animation = createDistributionExpansionAnimationAsset();
  const transition = projectKpReaderEquationRenderPlan({
    animation,
    runtimeFrame: sampleKpAnimationRuntimeFrame({
      animation,
      progress: 0.5
    })
  }).transitions[0]!;
  const presentation = projectKpReaderEquationTransitionPresentation(
    transition.presentationPlan
  );
  const plan = presentation.distributionOperationPlans?.[0]!;

  assert.equal(transition.presentationPlan.planKind, "distribution");
  assert.equal(plan.planKind, "distribution");
  assert.equal(Object.isFrozen(plan), true);
  assert.equal(plan.roles.bundles.filter(
    ({ role }) => role === "source-material"
  ).length, 1);
  assert.equal(plan.roles.bundles.filter(
    ({ role }) => role === "target-material"
  ).length, 2);
  assert.deepEqual(
    new Set(plan.roles.bundles.map(({ role }) => role)),
    new Set([
      "source-material",
      "target-material",
      "continuant",
      "artifact"
    ])
  );
  assert.equal(
    plan.roles.bundles.flatMap(({ semanticEntityIds }) =>
      semanticEntityIds
    ).length,
    transition.source.flatMap(({ selectors }) => selectors).length +
      transition.target.flatMap(({ selectors }) => selectors).length
  );
});

test("parallel foldable fan-outs retain both verified operation plans", () => {
  const animation = createKpFoldableDistributionEquationAnimationAsset();
  const transition = projectKpReaderEquationRenderPlan({
    animation,
    runtimeFrame: sampleKpAnimationRuntimeFrame({
      animation,
      progress: 0.05
    })
  }).transitions[0]!;
  const presentation = projectKpReaderEquationTransitionPresentation(
    transition.presentationPlan
  );

  assert.equal(transition.presentationPlan.planKind, "distribution");
  assert.equal(presentation.distributionOperationPlans?.length, 2);
  assert.deepEqual(
    presentation.distributionOperationPlans?.map(
      ({ planKind }) => planKind
    ),
    ["distribution", "distribution"]
  );
  assert.ok(presentation.distributionOperationPlans?.every(
    ({ roles }) =>
      roles.bundles.some(
        ({ role }) => role === "artifact"
      )
  ));
});

test("generated and foldable factoring bind the extracted factor result", () => {
  for (const animation of [
    createDistributionFactoringAnimationAsset(),
    createKpFoldableDistributionEquationAnimationAsset()
  ]) {
    const progress = animation.id.includes("foldable") ? 0.7 : 0.5;
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
    const binding = presentation.factoringMotifBinding!;
    const plan = binding.operationPresentationPlan;

    assert.equal(transition.presentationPlan.planKind, "factoring");
    assert.equal(plan.planKind, "factoring");
    if (plan.planKind !== "factoring") continue;
    const result = plan.roles.bundles.find(
      ({ id }) => id === plan.resultBundleId
    );
    assert.equal(result?.role, "target-material");
    assert.deepEqual(result?.semanticEntityIds, [binding.commonFactorId]);
    assert.ok(plan.roles.bundles.filter(
      ({ role }) => role === "source-material"
    ).length >= 2);
  }
});

test("distribution compiler rejects partial and structurally forged lineage", () => {
  const partial = createKpSemanticTransformation({
    id: "transform.test.partial-distribution",
    definitionId:
      "definition.generated.distribution.distribute-multiplication",
    transformType: "distributeMultiplication",
    title: "Partial distribution",
    sourceObjectIds: ["source"],
    targetObjectIds: ["target"],
    preserves: ["identity", "value"],
    correspondenceMap: {
      id: "map.test.partial-distribution",
      records: [{
        id: "factor-fans-out",
        relation: "fan-out",
        sourceSelectorIds: ["source.factor"],
        targetSelectorIds: ["target.factor.left", "target.factor.right"],
        summary: "Factor copies."
      }]
    }
  });
  assert.throws(
    () => compileKpDistributionFactoringPresentationPlan({
      transformation: partial,
      sourceSelectorIds: ["source.factor", "source.addend"],
      targetSelectorIds: [
        "target.factor.left",
        "target.factor.right",
        "target.addend"
      ]
    }),
    /has no presentation role/
  );

  const wrongTransfer = createKpSemanticTransformation({
    ...partial,
    id: "transform.test.forged-distribution",
    correspondenceMap: {
      id: "map.test.forged-distribution",
      records: [{
        id: "factors-merge",
        relation: "fan-in",
        sourceSelectorIds: ["source.factor.left", "source.factor.right"],
        targetSelectorIds: ["target.factor"],
        summary: "Wrong direction."
      }]
    }
  });
  assert.throws(
    () => compileKpDistributionFactoringPresentationPlan({
      transformation: wrongTransfer,
      sourceSelectorIds: [
        "source.factor.left",
        "source.factor.right"
      ],
      targetSelectorIds: ["target.factor"]
    }),
    /one total fan-out ownership transfer/
  );
});

test("distribution plan cache stays with the verified transformation identity", () => {
  const animation = createDistributionExpansionAnimationAsset();
  const canonical = animation.transformations[0]!;
  const structuralCopy = { ...canonical };
  projectKpReaderEquationRenderPlan({
    animation,
    runtimeFrame: sampleKpAnimationRuntimeFrame({
      animation,
      progress: 0.5
    })
  });

  assert.equal(
    findKpRegisteredOperationPresentationPlan(canonical)?.planKind,
    "distribution"
  );
  assert.equal(
    findKpRegisteredOperationPresentationPlan(structuralCopy),
    undefined
  );
});
