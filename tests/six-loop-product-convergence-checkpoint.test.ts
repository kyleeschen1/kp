import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("convergence checkpoint preserves objective state and recorded review", async () => {
  const [
    checkpoint,
    atlas,
    roadmap,
    nextActions,
    promotionThread,
    decision,
    priorityReview
  ] =
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
      readFile("docs/project/threads/animation-library-promotion.md", "utf8"),
      readFile(
        "docs/project/decisions/2026-08-02-kp-checkpoint-and-product-surface-sequence.md",
        "utf8"
      ),
      readFile(
        "docs/project/reviews/2026-08-02-product-surface-priority-next-step-review.md",
        "utf8"
      )
    ]);

  assert.match(
    checkpoint,
    /Status: checkpoint closed; rank-5 vector promotion certified/
  );
  assert.match(checkpoint, /36\/36 meaningful native paints/);
  assert.match(atlas, /39 meaningfully painted through a native adapter/);
  assert.match(checkpoint, /Human catalogue dispositions.*were not inferred/s);

  for (const command of [
    "visual:animation-catalogue",
    "visual:generated-linear-solve",
    "visual:vector-dot-projection",
    "visual:programming-addition"
  ]) {
    assert.match(checkpoint, new RegExp(command));
  }

  assert.match(checkpoint, /Rank 5 is `promoted`/);
  assert.match(
    promotionThread,
    /Current Next Action: Keep `Apply a 2 × 2 matrix to a vector` tabled/
  );
  assert.match(
    nextActions,
    /Whole-file CodeMirror decoupling[\s\S]*complete foundations[\s\S]*Apply a 2 × 2 matrix to a vector` tabled/
  );
  assert.match(decision, /Svelte 5 is the recommended declarative host UI/);
  assert.match(decision, /Graph3D mesh-to-donut:\*\* keep as an internal renderer/);
  assert.match(
    decision,
    /Programming addition trace and comparison:\*\* keep internal/
  );
  assert.match(
    priorityReview,
    /Close the conditional rank-5 vector correction[\s\S]*Prove one Svelte 5 catalogue shell[\s\S]*Pressure the host with rank-6 matrix\/linear map[\s\S]*Build Internal Studio v0[\s\S]*Publish Public Web mission and first lessons[\s\S]*Complete M4 and internal M5 editorial candidates[\s\S]*Build a constrained Public Editor/
  );
  assert.match(roadmap, /38 meaningful native\s+paints/);
  assert.doesNotMatch(roadmap, /Two programming gaps remain/);
  assert.doesNotMatch(roadmap, /422,832 initial script bytes/);
});
