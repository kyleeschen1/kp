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
      representationId: "sample.radical"
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
