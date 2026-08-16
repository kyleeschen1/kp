import assert from "node:assert/strict";
import test from "node:test";

import {
  checkKpAnimationAssetReferenceClosure,
  checkKpAnimationAssetSeekRewindLaw
} from "../src/animation/asset.ts";
import { sampleKpAnimationFrameDescriptor } from "../src/animation/frame-descriptor.ts";
import { createFunctionWrapAnimationAsset } from "../src/animation/function-wrap-adapter.ts";
import {
  requireKpFunctionWrapAssetBinding
} from "../src/animation/function-wrap-asset-binding.ts";
import { isKpCompiledMotifPlan } from
  "../src/domain-ir/equation-motif-invocation.ts";
import { isKpValidatedEquationExtensionPack } from
  "../src/domain-ir/equation-extension-pack-validator.ts";
import {
  checkKpAnimationAssetVisualMotifDefinitionCoverage,
  createKpAnimationAssetVisualMotifTimeline
} from "../src/animation/visual-motif.ts";
import {
  defaultEquationTransformVisualMotifRules
} from "../src/animation/motifs/equation-visual-motif-defaults.ts";
import {
  checkGeneratedFunctionWrapTransformDefinitionCoverage,
  listGeneratedAlgebraTransformDefinitions,
  listGeneratedFunctionWrapTransformDefinitions
} from "../src/semantic/generated-algebra-transform-definition-registry.ts";

test("createFunctionWrapAnimationAsset adapts f of x into AnimationAsset", () => {
  const animation = createFunctionWrapAnimationAsset();

  assert.equal(animation.id, "animation.generated.function-wrap.apply-f");
  assert.equal(animation.bundle.id, "asset.generated.function-wrap.apply-f");
  assert.deepEqual(
    animation.bundle.objects.map((object) => object.id),
    [
      "expression.generated.function-wrap.apply-f.input",
      "expression.generated.function-wrap.apply-f.wrapped"
    ]
  );
  const binding = requireKpFunctionWrapAssetBinding(animation);
  assert.deepEqual(
    {
      packId: binding.packId,
      operationKind: binding.operationKind,
      recipeId: binding.recipeId,
      motifId: binding.invocation.motifId,
      rendererCapabilityId: binding.rendererCapabilityId,
      roles: Object.fromEntries(
        binding.compiledMotifPlan.roleBindings.map(({ roleId, entities }) => [
          roleId,
          entities.map(({ entityId }) => entityId)
        ])
      )
    },
    {
      packId: "equation-pack.function-wrap.v1",
      operationKind: "operation.wrap-function.v1",
      recipeId: "recipe.equation.function-application.v1",
      motifId: "motif.function-wrap.v1",
      rendererCapabilityId: "renderer-capability.equation.native-katex.v1",
      roles: {
        argument: ["expression.generated.function-wrap.apply-f.wrapped.argument"],
        function: ["expression.generated.function-wrap.apply-f.wrapped.function"],
        "leading-enclosure": [
          "expression.generated.function-wrap.apply-f.wrapped.left-paren"
        ],
        "trailing-enclosure": [
          "expression.generated.function-wrap.apply-f.wrapped.right-paren"
        ]
      }
    }
  );
  assert.equal(isKpCompiledMotifPlan(binding.compiledMotifPlan), true);
  assert.equal(
    isKpValidatedEquationExtensionPack(binding.registryAuthority),
    true
  );
  assert.deepEqual(
    animation.transformations.map((transformation) => [
      transformation.id,
      transformation.definitionId
    ]),
    [
      [
        "transform.generated.function-wrap.apply-f.wrap-function",
        "definition.generated.function-wrap.wrap-function"
      ]
    ]
  );
  assert.deepEqual(
    animation.transformationTree.root.kind === "sequence"
      ? animation.transformationTree.root.children.map((child) => child.id)
      : [],
    ["transform.generated.function-wrap.apply-f.wrap-function"]
  );
  assert.deepEqual(checkKpAnimationAssetReferenceClosure(animation), {
    lawId: "animation.reference-closure",
    passed: true,
    failures: []
  });
  assert.deepEqual(checkKpAnimationAssetSeekRewindLaw(animation), {
    lawId: "animation.seek-rewind",
    passed: true,
    failures: []
  });
  assert.deepEqual(
    checkKpAnimationAssetVisualMotifDefinitionCoverage({
      animation,
      rules: defaultEquationTransformVisualMotifRules
    }),
    {
      lawId: "animation.visual-motif.definition-coverage",
      passed: true,
      failures: []
    }
  );
  assert.deepEqual(
    createKpAnimationAssetVisualMotifTimeline({
      id: "animation.generated.function-wrap.apply-f.visual",
      animation,
      rules: defaultEquationTransformVisualMotifRules
    }).segments.map((segment) => [segment.transformationNodeId, segment.motifKind]),
    [["transform.generated.function-wrap.apply-f.wrap-function", "wrap"]]
  );
  const frame = sampleKpAnimationFrameDescriptor({
    id: "frame.generated.function-wrap.apply-f.middle",
    animation,
    direction: "forward",
    progress: 0.5
  });

  assert.deepEqual(
    {
      animationId: frame.animationId,
      timelineId: frame.timelineId,
      elapsedMs: frame.elapsedMs,
      beat: frame.beat,
      phaseIndex: frame.phaseIndex,
      phaseId: frame.phaseId,
      nodeIds: frame.nodeIds,
      diagnostics: frame.diagnostics
    },
    {
      animationId: "animation.generated.function-wrap.apply-f",
      timelineId: "timeline.generated.function-wrap.apply-f.shared",
      elapsedMs: 1200,
      beat: 25,
      phaseIndex: 0,
      phaseId: "animation.generated.function-wrap.apply-f.forward.0",
      nodeIds: ["transform.generated.function-wrap.apply-f.wrap-function"],
      diagnostics: []
    }
  );
});

test("generated function-wrap transform definitions expose promoted coverage", () => {
  assert.deepEqual(
    listGeneratedFunctionWrapTransformDefinitions().map((definition) => [
      definition.id,
      definition.transformType,
      definition.artifactPolicy,
      definition.preserves
    ]),
    [
      [
        "definition.generated.function-wrap.wrap-function",
        "wrapFunction",
        "target-only",
        ["identity", "role"]
      ]
    ]
  );
  assert.deepEqual(
    checkGeneratedFunctionWrapTransformDefinitionCoverage(),
    {
      lawId: "generated-function-wrap.transform-definition-coverage",
      passed: true,
      failures: []
    }
  );
});

test("generated function-wrap coverage reports identity preservation drift", () => {
  assert.deepEqual(
    checkGeneratedFunctionWrapTransformDefinitionCoverage(
      listGeneratedAlgebraTransformDefinitions().map((definition) =>
        definition.id === "definition.generated.function-wrap.wrap-function"
          ? {
              ...definition,
              preserves: ["role"]
            }
          : definition
      )
    ),
    {
      lawId: "generated-function-wrap.transform-definition-coverage",
      passed: false,
      failures: [
        {
          path: "definitions[definition.generated.function-wrap.wrap-function].preserves",
          message:
            "Generated function-wrap transform definition.generated.function-wrap.wrap-function must preserve identity, role."
        }
      ]
    }
  );
});
