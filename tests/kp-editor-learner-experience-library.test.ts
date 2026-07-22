import { strict as assert } from "node:assert";
import test from "node:test";

import {
  createKpLearnerExperienceLibrary
} from "../src/editor/learner-experience-library.ts";

test("learner experience library puts the synchronized distribution exemplar first", () => {
  const experiences = createKpLearnerExperienceLibrary();

  assert.deepEqual(experiences.map(({ id }) => id), [
    "distribution-area-scroll-lesson",
    "divide-both-sides-scroll-lesson",
    "numerator-split-merge-scroll-lesson",
    "fractional-transfer-comparison-scroll-lesson",
    "solve-fractional-linear-scroll-lesson",
    "solve-x-scroll-lesson",
    "solve-with-balance-concept-room"
  ]);
  assert.deepEqual(experiences[0], {
    id: "distribution-area-scroll-lesson",
    kind: "scroll-lesson",
    title: "See distribution become area",
    summary:
      "Watch 3(x+2) become 3x+6 while the same rectangle partitions in lockstep.",
    href: "/reader/distribution-area/",
    actionLabel: "Review algebra and area",
    status: "prototype"
  });
  assert.deepEqual(experiences[1], {
    id: "divide-both-sides-scroll-lesson",
    kind: "scroll-lesson",
    title: "Divide both sides",
    summary:
      "Watch 3x = 12 become two matched fractions, cancel, and resolve to x = 4.",
    href: "/reader/divide-both-sides/",
    actionLabel: "Review division animation",
    status: "exemplar"
  });
  assert.deepEqual(experiences[2], {
    id: "numerator-split-merge-scroll-lesson",
    kind: "scroll-lesson",
    title: "Split and merge a fraction",
    summary:
      "Watch one denominator branch across a numerator sum, then run the exact structure backward.",
    href: "/reader/split-merge-fractions/",
    actionLabel: "Review split and merge",
    status: "exemplar"
  });
  assert.deepEqual(experiences[3], {
    id: "fractional-transfer-comparison-scroll-lesson",
    kind: "scroll-lesson",
    title: "Compare equation views",
    summary:
      "Switch between the complete balanced proof and a certified fluent transfer for x/2 = 4.",
    href: "/reader/fractional-transfer/",
    actionLabel: "Compare proof and shortcut",
    status: "exemplar"
  });
  assert.deepEqual(experiences[4], {
    id: "solve-fractional-linear-scroll-lesson",
    kind: "scroll-lesson",
    title: "Solve a fractional equation",
    summary:
      "Watch subtraction, cancellation, and multiplication carry x through a fraction to its solution.",
    href: "/reader/solve-fractional-linear/",
    actionLabel: "Review fraction animation",
    status: "prototype"
  });
  assert.deepEqual(experiences[5], {
    id: "solve-x-scroll-lesson",
    kind: "scroll-lesson",
    title: "Solve for x",
    summary:
      "Scroll through a short explanation and watch each symbol find its next place.",
    href: "/reader/solve-x/",
    actionLabel: "Open scroll lesson",
    status: "exemplar"
  });
});
