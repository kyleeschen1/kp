import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpFractionCompositionEquationAnimationAsset
} from "../src/animation/fraction-composition-equation-adapter.ts";
import {
  createNumeratorSplitMergeEquationAnimationAsset
} from "../src/animation/numerator-split-merge-equation-adapter.ts";
import {
  sampleKpAnimationRuntimeFrame
} from "../src/animation/runtime-sampler.ts";
import {
  createKpReaderEquationTransitionPresentationPlan,
  projectKpReaderEquationRenderPlan,
  projectKpReaderEquationTransitionPresentation
} from "../src/reader/renderers/public-api.ts";
import {
  isKpVerifiedExecutableSuccessorMotifProgram
} from "../src/animation/motifs/executable-successor-motif-program-validator.ts";

test("every canonical fraction transition owns one frozen presentation plan", () => {
  const animation = createKpFractionCompositionEquationAnimationAsset();

  for (const [index, transformation] of animation.transformations.entries()) {
    const transition = projectKpReaderEquationRenderPlan({
      animation,
      runtimeFrame: sampleKpAnimationRuntimeFrame({
        id: `runtime.reader-presentation-plan.${index}`,
        animation,
        direction: "forward",
        progress: (index + 0.5) / animation.transformations.length
      })
    }).transitions[0]!;

    assert.equal(transition.id, transformation.id);
    assert.equal(
      transition.presentationPlan.transitionId,
      transformation.id
    );
    assert.equal(Object.isFrozen(transition.presentationPlan), true);
    for (const formerField of [
      "visualMotif",
      "factoringMotifBinding",
      "distributionOperationPlans",
      "fractionMaterialPresentationPlan",
      "structuralSuccession",
      "successorSyntheses",
      "operationChoreography"
    ]) {
      assert.equal(
        Object.hasOwn(transition, formerField),
        false,
        `${transformation.id} must not retain parallel ${formerField} authority`
      );
    }
  }
});

test("the presentation-plan mint preserves exactly one specialized authority", () => {
  const animation = createKpFractionCompositionEquationAnimationAsset();
  const numeratorAnimation =
    createNumeratorSplitMergeEquationAnimationAsset();
  const plans = animation.transformations.map((_, index) =>
    projectKpReaderEquationRenderPlan({
      animation,
      runtimeFrame: sampleKpAnimationRuntimeFrame({
        id: `runtime.reader-presentation-authority.${index}`,
        animation,
        direction: "forward",
        progress: (index + 0.5) / animation.transformations.length
      })
    }).transitions[0]!
  );
  const synthesis = plans
    .map(({ presentationPlan }) =>
      projectKpReaderEquationTransitionPresentation(presentationPlan)
    )
    .find(({ successorSyntheses }) => successorSyntheses !== undefined)!;
  assert.equal(
    isKpVerifiedExecutableSuccessorMotifProgram(
      synthesis.executableProgram
    ),
    true
  );
  assert.equal(synthesis.executableProgram?.kind, "operation-evaluation");
  assert.equal(Object.hasOwn(synthesis, "visualMotif"), false);
  const choreography = plans
    .map(({ presentationPlan }) =>
      projectKpReaderEquationTransitionPresentation(presentationPlan)
    )
    .find(({ operationChoreography }) => operationChoreography !== undefined)!;
  const fractionMaterial = projectKpReaderEquationTransitionPresentation(
    projectKpReaderEquationRenderPlan({
      animation: numeratorAnimation,
      runtimeFrame: sampleKpAnimationRuntimeFrame({
        id: "runtime.reader-presentation-fraction-material",
        animation: numeratorAnimation,
        direction: "forward",
        progress: 0.04
      })
    }).transitions[0]!.presentationPlan
  ).fractionMaterialPresentationPlan!;

  assert.throws(
    () => createKpReaderEquationTransitionPresentationPlan({
      transitionId: "transition.competing-authorities",
      visualMotif: synthesis.visualMotif,
      successorSyntheses: synthesis.successorSyntheses,
      operationChoreography: choreography.operationChoreography
    }),
    /competing presentation authorities/
  );
  assert.throws(
    () => createKpReaderEquationTransitionPresentationPlan({
      transitionId: "transition.successor-without-program",
      successorSyntheses: synthesis.successorSyntheses
    }),
    /requires a minted executable program/
  );
  assert.throws(
    () => createKpReaderEquationTransitionPresentationPlan({
      transitionId: "transition.program-without-successor",
      executableProgram: synthesis.executableProgram
    }),
    /without successor synthesis/
  );
  assert.throws(
    () => createKpReaderEquationTransitionPresentationPlan({
      transitionId: "transition.forged-program",
      successorSyntheses: synthesis.successorSyntheses,
      executableProgram: JSON.parse(JSON.stringify(
        synthesis.executableProgram
      ))
    }),
    /requires a verified operation-evaluation executable program/
  );
  assert.throws(
    () => createKpReaderEquationTransitionPresentationPlan({
      transitionId: "transition.missing-motif",
      operationChoreography: choreography.operationChoreography
    }),
    /without a canonical visual motif/
  );
  assert.throws(
    () => createKpReaderEquationTransitionPresentationPlan({
      transitionId: "transition.competing-fraction-authority",
      fractionMaterialPresentationPlan: fractionMaterial,
      operationChoreography: choreography.operationChoreography
    }),
    /competing presentation authorities/
  );
  assert.throws(
    () => createKpReaderEquationTransitionPresentationPlan({
      transitionId: " "
    }),
    /requires a transition id/
  );
});

test("projection exposes only the evidence named by the plan variant", () => {
  const animation = createKpFractionCompositionEquationAnimationAsset();
  const transition = projectKpReaderEquationRenderPlan({
    animation,
    runtimeFrame: sampleKpAnimationRuntimeFrame({
      id: "runtime.reader-presentation-projection",
      animation,
      direction: "forward",
      progress: 0.04
    })
  }).transitions[0]!;
  const presentation = projectKpReaderEquationTransitionPresentation(
    transition.presentationPlan
  );

  assert.equal(
    transition.presentationPlan.planKind,
    "visual-motif"
  );
  assert.equal(presentation.visualMotif?.kind, "copy-fan-out");
  assert.deepEqual(Object.keys(presentation), ["visualMotif"]);
  assert.equal(Object.isFrozen(presentation), true);
});
