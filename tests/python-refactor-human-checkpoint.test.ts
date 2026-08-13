import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const checkpointPath =
  "docs/project/reviews/2026-08-13-python-threshold-refactor-human-checkpoint.md";

test("Python checkpoint records approval without pre-approving a shared API", async () => {
  const checkpoint = await readFile(checkpointPath, "utf8");

  assert.match(checkpoint, /Status: approved 2026-08-13/);
  assert.match(checkpoint, /proceed to\s+caller comparison before extracting shared contracts/);
  assert.match(checkpoint, /does not pre-approve\s+any particular shared API/);
  assert.match(checkpoint, /approve the Python exemplar/);
  assert.match(checkpoint, /request changes/);
  assert.match(checkpoint, /hold or reject/);
});

test("Python checkpoint links exact semantic states and the canonical comparison", async () => {
  const checkpoint = await readFile(checkpointPath, "utf8");
  const pythonArtifact =
    "artifact=animation.programming.python-free-shipping-refactor";

  for (const playhead of ["0.16", "0.34", "0.42", "0.45", "0.59", "0.68", "0.84", "1"]) {
    assert.match(checkpoint, new RegExp(`${pythonArtifact}&playhead=${playhead.replace(".", "\\.")}`));
  }
  assert.match(
    checkpoint,
    /artifact=animation\.programming\.typescript-free-shipping-refactor&playhead=0\.59/
  );
});

test("Python checkpoint records the preservation and evidence boundaries", async () => {
  const checkpoint = await readFile(checkpointPath, "utf8");

  assert.match(checkpoint, /never executes learner source/);
  assert.match(checkpoint, /No package, browser parser, arbitrary execution path, clock, scheduler/);
  assert.match(checkpoint, /shared context-specific HTML/);
  assert.match(checkpoint, /npm run visual:python-refactor/);
  assert.match(checkpoint, /npm run visual:typescript-refactor/);
  assert.match(checkpoint, /known pre-existing shared baseline failure/);
});
