import assert from "node:assert/strict";
import test from "node:test";
import {
  defineKpReaderEquationLessonDescriptors,
  kpReaderEquationLessonVariants,
  resolveKpReaderEquationLessonDescriptor,
  type KpReaderEquationLessonVariant
} from "../src/reader/app/equation-lesson-descriptor.ts";
import {
  resolveKpReaderEquationPresentationProfile
} from "../src/reader/runtime/public-api.ts";

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
    "fraction-composition"
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
