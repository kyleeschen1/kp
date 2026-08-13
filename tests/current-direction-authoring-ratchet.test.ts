import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const activeContract =
  "run-contract.kp.cross-language-code-animation-foundation-v1";

test("current project direction and model entrypoint name one executable proof", async () => {
  const [roadmap, activeThread, nextActions, entrypoint] = await Promise.all([
    readFile("docs/project/roadmap.md", "utf8"),
    readFile("docs/project/threads/architecture-convergence.md", "utf8"),
    readFile("docs/project/next-actions.md", "utf8"),
    readFile("docs/project/authoring/llm-generation-entrypoint.md", "utf8")
  ]);

  for (const currentSource of [roadmap, activeThread, nextActions]) {
    assert.match(currentSource, new RegExp(activeContract.replaceAll(".", "\\.")));
    assert.match(currentSource, /TypeScript free-shipping-threshold/i);
    assert.match(currentSource, /Python/i);
  }
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
