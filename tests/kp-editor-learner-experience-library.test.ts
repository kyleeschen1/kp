import { strict as assert } from "node:assert";
import test from "node:test";

import {
  createKpLearnerExperienceLibrary
} from "../src/editor/learner-experience-library.ts";

test("learner experience library puts the fractional review exemplar first", () => {
  const experiences = createKpLearnerExperienceLibrary();

  assert.deepEqual(experiences.map(({ id }) => id), [
    "solve-fractional-linear-scroll-lesson",
    "solve-x-scroll-lesson",
    "solve-with-balance-concept-room"
  ]);
  assert.deepEqual(experiences[0], {
    id: "solve-fractional-linear-scroll-lesson",
    kind: "scroll-lesson",
    title: "Solve a fractional equation",
    summary:
      "Watch subtraction, cancellation, and multiplication carry x through a fraction to its solution.",
    href: "/reader/solve-fractional-linear/",
    actionLabel: "Review fraction animation",
    status: "prototype"
  });
  assert.deepEqual(experiences[1], {
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
