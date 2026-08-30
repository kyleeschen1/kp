import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const focusDeckDecision =
  "2026-08-29-focus-deck-initial-portable-figure-priority.md";
const focusDeckReview =
  "2026-08-29-supply-tax-focus-deck-long-loop-proposal.md";

test("current project direction holds the bounded Focus Deck checkpoint", async () => {
  const [roadmap, activeThread, catalogueThread, nextActions, entrypoint, decision, review] =
    await Promise.all([
    readFile("docs/project/roadmap.md", "utf8"),
    readFile("docs/project/threads/focus-deck.md", "utf8"),
    readFile("docs/project/threads/animation-catalogue.md", "utf8"),
    readFile("docs/project/next-actions.md", "utf8"),
    readFile("docs/project/authoring/llm-generation-entrypoint.md", "utf8"),
    readFile(`docs/project/decisions/${focusDeckDecision}`, "utf8"),
    readFile(`docs/project/reviews/${focusDeckReview}`, "utf8")
  ]);

  assert.match(roadmap, /Active Thread: `threads\/focus-deck\.md`/);
  assert.match(roadmap, new RegExp(focusDeckDecision.replaceAll(".", "\\.")));
  assert.match(roadmap, new RegExp(focusDeckReview.replaceAll(".", "\\.")));
  assert.match(roadmap, /flashcard capability remains preserved/i);
  assert.match(activeThread,
    /animation\.algebra\.log-product\.equivalence-frame/);
  assert.match(activeThread, /supply-tax Focus Deck/i);
  assert.match(activeThread, /P_D = 12 - Q/);
  assert.match(activeThread, /Flashcards remain a sibling projection/i);
  assert.match(activeThread, /no new[\s\S]*animation clock/i);
  assert.match(catalogueThread, /Status: supporting/i);
  assert.match(catalogueThread, /indefinite-integration power-rule exemplar/i);
  assert.match(nextActions, /approved supply-tax Focus Deck run/i);
  assert.match(nextActions, /Stop before a shared component/i);
  assert.match(nextActions, /flashcard specifications and projections remain supported/i);
  assert.match(decision, /The Focus Deck is a projection/i);
  assert.match(decision, /existing `kp\.article-deck\.v1` derivation/i);
  assert.match(review, /graph geometry[\s\S]*economic truth/i);
  assert.match(review, /human visual checkpoint/i);
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
