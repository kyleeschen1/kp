import assert from "node:assert/strict";
import test from "node:test";
import {
  defineKpReaderEquationLessonDescriptors,
  compileKpReaderCanonicalTransitionPolicy,
  kpReaderEquationLessonVariants,
  resolveKpReaderEquationLessonDescriptor,
  type KpReaderEquationLessonVariant
} from "../src/reader/app/equation-lesson-descriptor.ts";
import {
  resolveKpReaderEquationPresentationProfile
} from "../src/reader/runtime/public-api.ts";
import { sampleKpAnimationRuntimeFrame } from "../src/animation/runtime-sampler.ts";
import { projectKpReaderEquationRenderPlan } from "../src/reader/renderers/equation-render-plan.ts";

type Equal<TLeft, TRight> =
  (<T>() => T extends TLeft ? 1 : 2) extends
  (<T>() => T extends TRight ? 1 : 2) ? true : false;
type Assert<TValue extends true> = TValue;
type InferredVariants = Assert<Equal<
  KpReaderEquationLessonVariant,
  | "streamlined"
  | "teacher-zero"
  | "fractional-linear"
  | "fractional-transfer"
  | "divide-both-sides"
  | "numerator-split-merge"
  | "radical-succession"
  | "foldable-distribution"
  | "fraction-composition"
  | "generated-linear-solve"
>>;
const inferredVariants: InferredVariants = true;

test("equation lesson descriptors retain literal variants and runtime coverage", async () => {
  assert.equal(inferredVariants, true);
  assert.deepEqual(kpReaderEquationLessonVariants, [
    "streamlined",
    "teacher-zero",
    "fractional-linear",
    "fractional-transfer",
    "divide-both-sides",
    "numerator-split-merge",
    "radical-succession",
    "foldable-distribution",
    "fraction-composition",
    "generated-linear-solve"
  ]);

  const standard = resolveKpReaderEquationPresentationProfile("standard");
  for (const variant of kpReaderEquationLessonVariants) {
    const descriptor = await resolveKpReaderEquationLessonDescriptor(variant);
    assert.equal(descriptor.id, variant);
    assert.equal(descriptor.createAnimation(standard).kind, "animation-asset");
  }
});

test("descriptor capabilities preserve lesson-specific runtime behavior", async () => {
  const standard = resolveKpReaderEquationPresentationProfile("standard");
  const fluent = resolveKpReaderEquationPresentationProfile("fluent");
  const fractional = await resolveKpReaderEquationLessonDescriptor("fractional-linear");
  const transfer = await resolveKpReaderEquationLessonDescriptor("fractional-transfer");

  assert.equal(fractional.compactTranscriptAvailable, true);
  assert.equal(typeof fractional.bindStructuralAnchors, "function");
  assert.notEqual(
    transfer.createAnimation(standard).id,
    transfer.createAnimation(fluent).id
  );
  assert.equal(transfer.stageKicker?.(standard), undefined);
  assert.equal(transfer.stageKicker?.(fluent), "Follow the certified shortcut");
});

test("descriptor definition and resolution reject ambiguous variants", async () => {
  assert.throws(
    () => defineKpReaderEquationLessonDescriptors({
      example: {
        id: "different",
        createAnimation: () => {
          throw new Error("not reached");
        },
        compactTranscriptAvailable: false
      }
    }),
    /declared mismatched id different/
  );
  await assert.rejects(
    resolveKpReaderEquationLessonDescriptor("not-a-lesson"),
    /Unknown reader equation lesson variant not-a-lesson/
  );
});

test("fractional reader executes every registered evaluation through the canonical compositor", async () => {
  const descriptor = await resolveKpReaderEquationLessonDescriptor("fractional-linear");
  const animation = descriptor.createAnimation(resolveKpReaderEquationPresentationProfile("standard"));
  const policy = compileKpReaderCanonicalTransitionPolicy({ descriptor, animation });
  assert.ok(policy);
  let evaluations = 0;
  for (let index = 0; index < animation.transformations.length; index += 1) {
    const runtimeFrame = sampleKpAnimationRuntimeFrame({
      animation, direction: "forward",
      progress: (index + 0.5) / animation.transformations.length
    });
    for (const transition of projectKpReaderEquationRenderPlan({ animation, runtimeFrame }).transitions) {
      const plan = transition.presentationPlan;
      if (plan.planKind === "successor-synthesis") {
        evaluations += 1;
        assert.equal(plan.executableProgram.id, "kp.executable-program.operation-evaluation");
        assert.ok(policy.transitionIds.includes(transition.id),
          `${transition.id} must execute its registered evaluation instead of the legacy fading sampler`);
      }
      if (plan.planKind === "explicit-static-checkpoint") {
        assert.ok(!policy.transitionIds.includes(transition.id),
          "routing evaluations must not replace the existing introductions with static checkpoints");
      }
    }
  }
  assert.equal(evaluations, 2);
});
