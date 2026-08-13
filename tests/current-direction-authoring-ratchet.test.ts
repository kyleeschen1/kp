import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const completedContract =
  "run-contract.kp.cross-language-code-animation-foundation-v1";

test("current project direction closes the code proof and names product convergence next", async () => {
  const [roadmap, activeThread, nextActions, entrypoint] = await Promise.all([
    readFile("docs/project/roadmap.md", "utf8"),
    readFile("docs/project/threads/architecture-convergence.md", "utf8"),
    readFile("docs/project/next-actions.md", "utf8"),
    readFile("docs/project/authoring/llm-generation-entrypoint.md", "utf8")
  ]);

  for (const currentSource of [roadmap, activeThread, nextActions]) {
    assert.match(currentSource, /Public\s+Web v0/i);
  }
  assert.match(roadmap, new RegExp(completedContract.replaceAll(".", "\\.")));
  assert.match(activeThread, new RegExp(completedContract.replaceAll(".", "\\.")));
  assert.match(roadmap, /TypeScript, Python, and Scheme/i);
  assert.match(nextActions, /wrap\/unwrap/i);
  assert.doesNotMatch(
    activeThread.slice(0, activeThread.indexOf("## Goal")),
    /repair the bounded catalogue stage-reservation/i
  );
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
