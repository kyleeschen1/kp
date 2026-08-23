import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const completedContract =
  "run-contract.kp.animation.animation-governance-epoch-v2-approved";
const checkpointReview =
  "2026-08-23-animation-governance-epoch-v2-derivative-checkpoint.md";

test("current project direction holds the derivative governance checkpoint", async () => {
  const [roadmap, activeThread, nextActions, entrypoint, checkpoint] = await Promise.all([
    readFile("docs/project/roadmap.md", "utf8"),
    readFile("docs/project/threads/animation-catalogue.md", "utf8"),
    readFile("docs/project/next-actions.md", "utf8"),
    readFile("docs/project/authoring/llm-generation-entrypoint.md", "utf8"),
    readFile(`docs/project/reviews/${checkpointReview}`, "utf8")
  ]);

  assert.match(roadmap, /threads\/animation-catalogue\.md/);
  assert.match(roadmap, new RegExp(checkpointReview.replaceAll(".", "\\.")));
  assert.match(roadmap, /TypeScript, Python, and Scheme/i);
  assert.match(activeThread, /derivative\.power-rule-x-cubed/);
  assert.match(activeThread, /stop before a second caller/i);
  assert.match(nextActions, /d\/dx x\^3 -> 3x\^\(3-1\) -> 3x\^2/i);
  assert.match(nextActions, /human review/i);
  assert.match(checkpoint, new RegExp(completedContract.replaceAll(".", "\\.")));
  assert.match(checkpoint, /no renderer, timing, path, glyph inference/i);
  assert.match(entrypoint, /Minimal Successful Construction/);
  assert.match(entrypoint, /canonical-animation-public-api\.ts/);
  assert.match(entrypoint, /\{ request, authority \}/);
  assert.doesNotMatch(
    entrypoint,
    /Propose a new semantic animation \| `kp\.llm-animation-draft\.v2`/
  );
  assert.match(entrypoint, /There is not yet a universal arbitrary-source code-animation generator/i);
  assert.match(entrypoint, /typed gap/i);
});

test("supporting threads cannot restart deferred tutorial or runtime work", async () => {
  const [tutorial, runtime, attention] = await Promise.all([
    readFile("docs/project/threads/cross-domain-tutorial-platform.md", "utf8"),
    readFile("docs/project/threads/semantic-runtime.md", "utf8"),
    readFile("docs/project/threads/explanation-attention.md", "utf8")
  ]);

  assert.match(tutorial.slice(0, tutorial.indexOf("## Goal")), /deferred/i);
  assert.doesNotMatch(
    tutorial.slice(0, tutorial.indexOf("## Goal")),
    /Current Next Action: Build botanical Lisp/
  );
  assert.match(runtime.slice(0, runtime.indexOf("## Goal")), /TypeScript caller/);
  assert.match(attention.slice(0, attention.indexOf("## Goal")), /Status: paused/);
});
