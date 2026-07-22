import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  compileKpFractionalTransferComparisonLesson
} from "../src/reader/compiler/public-api.ts";

const markdown = readFileSync(
  new URL("../content/lessons/fractional-transfer-comparison.md", import.meta.url),
  "utf8"
);

test("fractional transfer lesson compiles searchable proof and both presentations", () => {
  const artifact = compileKpFractionalTransferComparisonLesson(markdown);

  assert.equal(
    artifact.document.id,
    "lesson.solve-x.fractional-transfer-comparison"
  );
  assert.match(artifact.html, /data-kp-reader-lesson-variant="fractional-transfer"/);
  assert.match(artifact.html, /data-kp-reader-equation-profile-control/);
  assert.match(artifact.html, /The same algebra can be shown at different levels/);
  assert.match(artifact.html, /application\/x-tex">\\frac\{x\}\{2\} = 4/);
  assert.match(artifact.html, /transform\.fractional-linear\.multiply-both-sides-2/);
  assert.match(artifact.html, /transform\.fractional-linear\.project-certified-transfer/);
  assert.equal(artifact.hydration.blocks[0]?.checkpoints.length, 4);
  assert.deepEqual(artifact.hydration.blocks[0]?.equationPresentation?.profileIds, [
    "explain",
    "standard",
    "fluent"
  ]);
});
