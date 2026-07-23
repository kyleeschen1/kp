import assert from "node:assert/strict";
import test from "node:test";

import {
  readKpSemanticAnimationWorkbenchRoute,
  writeKpSemanticAnimationWorkbenchRoute
} from "../src/editor/semantic-animation-workbench-route.ts";

test("Workbench route reads canonical query selection and representation", () => {
  assert.deepEqual(
    readKpSemanticAnimationWorkbenchRoute(
      "?view=animation-workbench&q=radical&workbenchAnimation=animation.radical&representation=sample.radical"
    ),
    {
      active: true,
      query: "radical",
      animationId: "animation.radical",
      representationId: "sample.radical",
      roadmap: {
        sortBy: "canonical",
        direction: "ascending"
      }
    }
  );
});

test("Workbench route preserves existing editor animation deep links", () => {
  const search = writeKpSemanticAnimationWorkbenchRoute(
    "?animation=editor-animation.radical&utm_source=review",
    {
      query: "power to radical",
      animationId: "animation.radical"
    }
  );
  const params = new URLSearchParams(search);

  assert.equal(params.get("view"), "animation-workbench");
  assert.equal(params.get("animation"), "editor-animation.radical");
  assert.equal(params.get("utm_source"), "review");
  assert.equal(params.get("q"), "power to radical");
  assert.equal(params.get("workbenchAnimation"), "animation.radical");
});

test("Workbench route omits blank optional state", () => {
  assert.equal(
    writeKpSemanticAnimationWorkbenchRoute(
      "?view=animation-workbench&q=old&representation=old",
      { query: " " }
    ),
    "?view=animation-workbench"
  );
});

test("Workbench route round-trips non-default roadmap controls", () => {
  const search = writeKpSemanticAnimationWorkbenchRoute(
    "?view=animation-workbench&q=radical",
    {
      query: "radical",
      roadmap: {
        sortBy: "topic",
        direction: "descending",
        topic: "Arithmetic · Addition",
        horizon: "later",
        state: "planned"
      }
    }
  );

  assert.deepEqual(readKpSemanticAnimationWorkbenchRoute(search).roadmap, {
    sortBy: "topic",
    direction: "descending",
    topic: "Arithmetic · Addition",
    horizon: "later",
    state: "planned"
  });
  assert.match(search, /roadmapSort=topic/);
  assert.match(search, /roadmapDirection=descending/);
});

test("Workbench route rejects unsupported roadmap values", () => {
  assert.deepEqual(
    readKpSemanticAnimationWorkbenchRoute(
      "?view=animation-workbench&roadmapSort=random&roadmapDirection=sideways&roadmapHorizon=soon&roadmapState=maybe"
    ).roadmap,
    {
      sortBy: "canonical",
      direction: "ascending"
    }
  );
});
