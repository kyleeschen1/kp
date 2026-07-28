import { strict as assert } from "node:assert";
import test from "node:test";

import {
  createKpLearnerExperienceLibrary,
  findKpLearnerCanonicalAnimationPresentation,
  type KpLearnerExperienceDescriptor
} from "../src/editor/learner-experience-library.ts";

test("learner experience library puts the foldable distribution exemplar first", () => {
  const experiences = createKpLearnerExperienceLibrary();

  assert.deepEqual(experiences.map(({ id }) => id), [
    "foldable-distribution-scroll-lesson",
    "fraction-composition-scroll-lesson",
    "distribution-area-scroll-lesson",
    "divide-both-sides-scroll-lesson",
    "numerator-split-merge-scroll-lesson",
    "fractional-transfer-comparison-scroll-lesson",
    "solve-fractional-linear-scroll-lesson",
    "solve-x-scroll-lesson",
    "solve-with-balance-concept-room"
  ]);
  assert.deepEqual(withoutPresentations(experiences[0]!), {
    id: "foldable-distribution-scroll-lesson",
    kind: "scroll-lesson",
    title: "Distribute, evaluate, and collect",
    summary:
      "Follow 3(x+2)+2(x-1) to 5x+4, then fold or pin the evaluation detail you want to inspect.",
    href: "/reader/foldable-distribution/",
    actionLabel: "Review foldable evaluation",
    status: "exemplar",
    animationIds: ["animation.foldable-distribution.collect-like-terms"]
  });
  assert.deepEqual(withoutPresentations(experiences[1]!), {
    id: "fraction-composition-scroll-lesson",
    kind: "scroll-lesson",
    title: "Distribute and solve with a fraction",
    summary:
      "Follow two thirds times x plus six through thirteen exact operations, folding or pinning the evaluation detail you want to inspect.",
    href: "/reader/fraction-composition/",
    actionLabel: "Review fraction composition",
    status: "prototype",
    animationIds: ["animation.fraction-composition.two-thirds-solve"]
  });
  assert.deepEqual(withoutPresentations(experiences[2]!), {
    id: "distribution-area-scroll-lesson",
    kind: "scroll-lesson",
    title: "See distribution become area",
    summary:
      "Watch 3(x+2) become 3x+6 while the same rectangle partitions in lockstep.",
    href: "/reader/distribution-area/",
    actionLabel: "Review algebra and area",
    status: "prototype",
    animationIds: ["exemplar.distribution-area.3-times-x-plus-2"]
  });
  assert.deepEqual(withoutPresentations(experiences[3]!), {
    id: "divide-both-sides-scroll-lesson",
    kind: "scroll-lesson",
    title: "Divide both sides",
    summary:
      "Watch 3x = 12 become two matched fractions, cancel, and resolve to x = 4.",
    href: "/reader/divide-both-sides/",
    actionLabel: "Review division animation",
    status: "exemplar",
    animationIds: ["animation.divide-both-sides.solve-3x-equals-12"]
  });
  assert.deepEqual(withoutPresentations(experiences[4]!), {
    id: "numerator-split-merge-scroll-lesson",
    kind: "scroll-lesson",
    title: "Split and merge a fraction",
    summary:
      "Watch one denominator branch across a numerator sum, then run the exact structure backward.",
    href: "/reader/split-merge-fractions/",
    actionLabel: "Review split and merge",
    status: "exemplar",
    animationIds: ["animation.numerator-split-merge.round-trip"]
  });
  assert.deepEqual(withoutPresentations(experiences[5]!), {
    id: "fractional-transfer-comparison-scroll-lesson",
    kind: "scroll-lesson",
    title: "Compare equation views",
    summary:
      "Switch between the complete balanced proof and a certified fluent transfer for x/2 = 4.",
    href: "/reader/fractional-transfer/",
    actionLabel: "Compare proof and shortcut",
    status: "exemplar",
    animationIds: [
      "animation.fractional-linear.x-over-2.balanced-proof",
      "animation.fractional-linear.x-over-2.fluent-projection"
    ]
  });
  assert.deepEqual(withoutPresentations(experiences[6]!), {
    id: "solve-fractional-linear-scroll-lesson",
    kind: "scroll-lesson",
    title: "Solve a fractional equation",
    summary:
      "Watch subtraction, cancellation, and multiplication carry x through a fraction to its solution.",
    href: "/reader/solve-fractional-linear/",
    actionLabel: "Review fraction animation",
    status: "prototype",
    animationIds: ["animation.fractional-linear.solve-x-over-2"]
  });
  assert.deepEqual(withoutPresentations(experiences[7]!), {
    id: "solve-x-scroll-lesson",
    kind: "scroll-lesson",
    title: "Solve for x",
    summary:
      "Scroll through a short explanation and watch each symbol find its next place.",
    href: "/reader/solve-x/",
    actionLabel: "Open scroll lesson",
    status: "exemplar",
    animationIds: ["animation.linear-solve.solve-x"]
  });
});

test("learner animation ids derive from one canonical presentation binding", () => {
  const experiences = createKpLearnerExperienceLibrary();
  const distribution = experiences.find(
    ({ id }) => id === "distribution-area-scroll-lesson"
  )!;

  assert.deepEqual(distribution.animationPresentations, [
    {
      assetId: "exemplar.distribution-area.3-times-x-plus-2",
      canonicalAnimationId:
        "animation.generated.distribution.expand-a-sum",
      choreographyId:
        "choreography.lesson.distribution-area.algebra-and-area"
    }
  ]);
  assert.deepEqual(
    distribution.animationIds,
    distribution.animationPresentations.map(({ assetId }) => assetId)
  );
  assert.equal(
    findKpLearnerCanonicalAnimationPresentation(
      "animation.generated.distribution.expand-a-sum"
    )?.experience.id,
    distribution.id
  );
});

function withoutPresentations(
  experience: KpLearnerExperienceDescriptor
): Omit<KpLearnerExperienceDescriptor, "animationPresentations"> {
  const { animationPresentations: _presentations, ...legacy } = experience;
  return legacy;
}
