import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("convergence checkpoint reconciles objective state without inferring review", async () => {
  const [checkpoint, atlas, roadmap, nextActions, promotionThread] =
    await Promise.all([
      readFile(
        "docs/project/reviews/2026-08-02-six-loop-product-convergence-human-checkpoint.md",
        "utf8"
      ),
      readFile(
        "docs/project/reviews/2026-08-01-animation-catalogue-seam-atlas.md",
        "utf8"
      ),
      readFile("docs/project/roadmap.md", "utf8"),
      readFile("docs/project/next-actions.md", "utf8"),
      readFile("docs/project/threads/animation-library-promotion.md", "utf8")
    ]);

  assert.match(checkpoint, /Status: `HUMAN_CHECKPOINT`/);
  assert.match(checkpoint, /36\/36 meaningful native paints/);
  assert.match(atlas, /36 meaningfully painted through a native adapter/);
  assert.match(checkpoint, /Human catalogue dispositions.*were not inferred/s);

  for (const command of [
    "visual:animation-catalogue",
    "visual:generated-linear-solve",
    "visual:vector-dot-projection",
    "visual:programming-addition"
  ]) {
    assert.match(checkpoint, new RegExp(command));
  }

  assert.match(checkpoint, /Rank 5 remains `next`, not\s+`promoted`/);
  assert.match(
    promotionThread,
    /Project\s+one vector onto another remains the first unresolved promotion at rank 5/
  );
  assert.match(nextActions, /record each decision independently/);
  assert.match(roadmap, /36 meaningful native\s+paints/);
  assert.doesNotMatch(roadmap, /Two programming gaps remain/);
  assert.doesNotMatch(roadmap, /422,832 initial script bytes/);
});
