import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  kpLispReconstructedGlobalProgress,
  projectKpLispBindAndReconstructProgress,
  unprojectKpLispBindAndReconstructProgress
} from "../src/tutorial/lisp-function-application/lisp-function-application-motion-controller.ts";

test("first motion block maps exactly onto application through reconstruction", () => {
  assert.equal(projectKpLispBindAndReconstructProgress(0), 0);
  assert.equal(projectKpLispBindAndReconstructProgress(1), 0.74);
  assert.equal(kpLispReconstructedGlobalProgress, 0.74);
  for (let index = 0; index <= 100; index += 1) {
    const local = index / 100;
    assert.ok(Math.abs(
      unprojectKpLispBindAndReconstructProgress(
        projectKpLispBindAndReconstructProgress(local)
      ) - local
    ) < 1e-12);
  }
});

test("motion projection clamps bounded controls and rejects nonfinite input", () => {
  assert.equal(projectKpLispBindAndReconstructProgress(-1), 0);
  assert.equal(projectKpLispBindAndReconstructProgress(2), 0.74);
  assert.throws(
    () => projectKpLispBindAndReconstructProgress(Number.NaN),
    /finite/
  );
});

test("local controller reuses the canonical playback reducer and sampler", async () => {
  const source = await readFile(
    new URL(
      "../src/tutorial/lisp-function-application/lisp-function-application-motion-controller.ts",
      import.meta.url
    ),
    "utf8"
  );
  assert.match(source, /reduceKpEditorAnimationPlaybackSession/);
  assert.match(source, /sampleKpLispLambdaApplicationRuntimeFrame/);
  assert.doesNotMatch(source, /setInterval|new Worker/);
});
