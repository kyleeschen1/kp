import assert from "node:assert/strict";
import test from "node:test";

import {
  checkKpAnimationAssetSeekRewindLaw,
  validateKpAnimationAsset
} from "../src/animation/asset.ts";
import {
  kpFivePlusTwoEvaluationAnimationId,
  kpFivePlusTwoEvaluationSpec,
  kpOnePlusTwoEvaluationAnimationId,
  createKpFivePlusTwoEvaluationAnimationAsset,
  createKpOnePlusTwoEvaluationAnimationAsset
} from "../src/animation/operation-evaluation-adapter.ts";
import {
  kpOperationEvaluationContinuityReference
} from "../src/animation/operation-evaluation-continuity-reference.ts";
import {
  sampleKpAnimationRuntimeFrame
} from "../src/animation/runtime-sampler.ts";
import {
  kpAnimationCatalogPackId
} from "../src/animation/catalog-loader.ts";
import {
  projectKpReaderEquationRenderPlan
} from "../src/reader/renderers/equation-render-plan.ts";

test("one plus two compiles one registry-verified continuity presentation", () => {
  const animation = createKpOnePlusTwoEvaluationAnimationAsset();
  const runtimeFrame = sampleKpAnimationRuntimeFrame({
    animation,
    direction: "forward",
    progress: 0.5
  });
  const renderPlan = projectKpReaderEquationRenderPlan({
    animation,
    runtimeFrame
  });
  const transition = renderPlan.transitions[0];

  assert.equal(animation.id, kpOnePlusTwoEvaluationAnimationId);
  assert.deepEqual(validateKpAnimationAsset(animation), []);
  assert.equal(renderPlan.transitions.length, 1);
  assert.equal(transition?.transformType, "simplifyConstantSum");
  assert.equal(
    transition?.presentationPlan.planKind,
    "successor-synthesis"
  );
  if (
    transition?.presentationPlan.planKind !== "successor-synthesis"
  ) return;
  assert.equal(transition.presentationPlan.successorSyntheses.length, 1);
  const binding = transition.presentationPlan.successorSyntheses[0]!;
  assert.equal(
    binding.paintContinuityPlan.carriers[0]?.transferTopology,
    "bounded-semantic-contact-co-presence"
  );
  assert.equal(
    binding.continuityProgram.topology,
    "bounded-semantic-contact-co-presence"
  );
  assert.equal(
    binding.continuityProgram.program,
    transition.presentationPlan.executableProgram
  );
  assert.equal(
    binding.paintContinuityPlan.nonZeroPaint,
    "opaque"
  );
  assert.equal(
    binding.paintContinuityPlan.endpointSettlement,
    "native-source-and-target"
  );
  assert.deepEqual(
    binding.sourceAnnotations.map(
      ({ semanticRole, contribution, propagationRank }) => [
        semanticRole,
        contribution,
        propagationRank
      ]
    ),
    [
      ["addend", "material-input", 0],
      ["addition-operator", "catalyst", 1],
      ["addend", "material-input", 2]
    ]
  );
  assert.deepEqual(
    binding.lineages[0]?.sourceAnnotationIds,
    binding.sourceAnnotations
      .filter(({ contribution }) => contribution === "material-input")
      .map(({ id }) => id)
  );
});

test("one plus two keeps caller authority semantic and rewinds exactly", () => {
  const animation = createKpOnePlusTwoEvaluationAnimationAsset();
  const serialized = JSON.stringify(animation);

  assert.equal(checkKpAnimationAssetSeekRewindLaw(animation).passed, true);
  assert.equal(serialized.includes("paintPolicy"), false);
  assert.equal(serialized.includes("pathFamily"), false);
  assert.equal(serialized.includes("handoffProgress"), false);
  assert.equal(serialized.includes("opacity"), false);
  assert.equal(serialized.includes("keyframes"), false);
  assert.equal(
    animation.metadata?.["operationEvaluationContinuityReference"],
    kpOperationEvaluationContinuityReference.canonicalExemplar.id
  );
  assert.equal(
    animation.timeline?.durationMs,
    Math.ceil(
      kpOperationEvaluationContinuityReference.pacing
        .minimumActionDurationMs /
      (
        1 -
        kpOperationEvaluationContinuityReference.pacing.setupFraction -
        kpOperationEvaluationContinuityReference.pacing.settleFraction
      )
    )
  );
});

test("five plus two reuses the exact executable evaluation route", () => {
  const canonical = createKpOnePlusTwoEvaluationAnimationAsset();
  const generalized = createKpFivePlusTwoEvaluationAnimationAsset();
  const canonicalPlan = renderPlanAtMidpoint(canonical);
  const generalizedPlan = renderPlanAtMidpoint(generalized);
  const canonicalTransition = canonicalPlan.transitions[0];
  const generalizedTransition = generalizedPlan.transitions[0];

  assert.equal(generalized.id, kpFivePlusTwoEvaluationAnimationId);
  assert.deepEqual(validateKpAnimationAsset(generalized), []);
  assert.equal(animationObjectLatex(generalized, 0), "5 + 2");
  assert.equal(animationObjectLatex(generalized, 1), "7");
  assert.equal(
    generalizedTransition?.presentationPlan.planKind,
    "successor-synthesis"
  );
  assert.equal(
    canonicalTransition?.presentationPlan.planKind,
    "successor-synthesis"
  );
  if (
    canonicalTransition?.presentationPlan.planKind !== "successor-synthesis" ||
    generalizedTransition?.presentationPlan.planKind !== "successor-synthesis"
  ) return;

  // Object identity proves callers receive the registry-minted program rather
  // than equivalent-looking per-example presentation instructions.
  assert.equal(
    generalizedTransition.presentationPlan.executableProgram,
    canonicalTransition.presentationPlan.executableProgram
  );
  assert.deepEqual(
    executableRouteFingerprint(generalizedTransition.presentationPlan),
    executableRouteFingerprint(canonicalTransition.presentationPlan)
  );
  assert.equal(
    generalizedTransition.presentationPlan.successorSyntheses[0]
      ?.continuityProgram,
    canonicalTransition.presentationPlan.successorSyntheses[0]
      ?.continuityProgram
  );

  assert.deepEqual(Object.keys(kpFivePlusTwoEvaluationSpec).sort(), [
    "id",
    "left",
    "right"
  ]);
  for (
    const field of
    kpOperationEvaluationContinuityReference.forbiddenCallerAuthority
  ) {
    assert.equal(
      Object.keys(kpFivePlusTwoEvaluationSpec).includes(field),
      false,
      `five plus two must not author ${field}`
    );
  }
});

test("one plus two is owned by its lazy capability pack", () => {
  assert.equal(
    kpAnimationCatalogPackId(kpOnePlusTwoEvaluationAnimationId),
    "operation-evaluation"
  );
  assert.equal(
    kpAnimationCatalogPackId(kpFivePlusTwoEvaluationAnimationId),
    "operation-evaluation"
  );
});

function renderPlanAtMidpoint(
  animation: ReturnType<typeof createKpOnePlusTwoEvaluationAnimationAsset>
) {
  return projectKpReaderEquationRenderPlan({
    animation,
    runtimeFrame: sampleKpAnimationRuntimeFrame({
      animation,
      direction: "forward",
      progress: 0.5
    })
  });
}

function executableRouteFingerprint(
  plan: Extract<
    ReturnType<typeof renderPlanAtMidpoint>["transitions"][number][
      "presentationPlan"
    ],
    { readonly planKind: "successor-synthesis" }
  >
) {
  const program = plan.executableProgram;
  const synthesis = plan.successorSyntheses[0];

  return {
    programId: program.id,
    programVersion: program.programVersion,
    programKind: program.kind,
    phases: program.phases,
    topology: synthesis?.continuityProgram.topology,
    forwardContinuityPhases:
      synthesis?.continuityProgram.forwardPhases
  };
}

function animationObjectLatex(
  animation: ReturnType<typeof createKpOnePlusTwoEvaluationAnimationAsset>,
  index: number
): string | undefined {
  const value = animation.bundle.objects[index]?.value;
  if (
    typeof value !== "object" ||
    value === null ||
    !("latex" in value) ||
    typeof value.latex !== "string"
  ) return undefined;
  return value.latex;
}
