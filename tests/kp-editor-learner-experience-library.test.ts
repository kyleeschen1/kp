import { strict as assert } from "node:assert";
import test from "node:test";

import {
  createKpLearnerExperienceLibrary
} from "../src/editor/learner-experience-library.ts";

test("learner experience library puts the semantic reader exemplar first", () => {
  const experiences = createKpLearnerExperienceLibrary();

  assert.deepEqual(experiences.map(({ id }) => id), [
    "solve-x-scroll-lesson",
    "solve-with-balance-concept-room"
  ]);
  assert.deepEqual(experiences[0], {
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
