import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const focusDeckDecision =
  "2026-08-29-focus-deck-initial-portable-figure-priority.md";
const focusDeckReview =
  "2026-08-29-supply-tax-focus-deck-long-loop-proposal.md";
const stateDecision =
  "2026-09-02-persistent-semantic-state-architecture-direction.md";
const stateProposal =
  "2026-09-02-persistent-semantic-state-foundation-long-loop-proposal.md";

test("current project direction advances semantic state and preserves Focus Deck", async () => {
  const [
    roadmap,
    activeThread,
    focusDeckThread,
    catalogueThread,
    nextActions,
    entrypoint,
    focusDecision,
    focusReview,
    semanticStateDecision,
    semanticStateProposal
  ] =
    await Promise.all([
    readFile("docs/project/roadmap.md", "utf8"),
    readFile("docs/project/threads/typed-semantic-authoring-framework.md", "utf8"),
    readFile("docs/project/threads/focus-deck.md", "utf8"),
    readFile("docs/project/threads/animation-catalogue.md", "utf8"),
    readFile("docs/project/next-actions.md", "utf8"),
    readFile("docs/project/authoring/llm-generation-entrypoint.md", "utf8"),
    readFile(`docs/project/decisions/${focusDeckDecision}`, "utf8"),
    readFile(`docs/project/reviews/${focusDeckReview}`, "utf8"),
    readFile(`docs/project/decisions/${stateDecision}`, "utf8"),
    readFile(`docs/project/reviews/${stateProposal}`, "utf8")
  ]);

  assert.match(
    roadmap,
    /Active Thread: `threads\/typed-semantic-authoring-framework\.md`/
  );
  assert.match(roadmap, /Supporting Threads:[\s\S]*`threads\/focus-deck\.md`/);
  assert.match(roadmap, new RegExp(stateDecision.replaceAll(".", "\\.")));
  assert.match(roadmap, /flashcard capability remains preserved/i);
  assert.match(activeThread,
    /Accepted Semantic State Architecture Direction/);
  assert.match(activeThread, /unit-scalar helper/i);
  assert.match(activeThread, /nonvisual persistent[\s\S]{0,80}snapshot/i);
  assert.match(focusDeckThread,
    /animation\.algebra\.log-product\.equivalence-frame/);
  assert.match(focusDeckThread, /supply-tax caller/i);
  assert.match(focusDeckThread, /P_D = 12 - Q/);
  assert.match(focusDeckThread, /Flashcards remain a sibling projection/i);
  assert.match(focusDeckThread, /no new[\s\S]*animation clock/i);
  assert.match(catalogueThread, /Status: supporting/i);
  assert.match(catalogueThread, /indefinite-integration power-rule exemplar/i);
  assert.match(nextActions, /approved persistent semantic state foundation/i);
  assert.match(nextActions, /mandatory\s+authoring\/API and visual checkpoint G2/i);
  assert.match(nextActions, /Routine nonvisual preapproval does not waive G2/);
  assert.match(nextActions, /run-contract\.kp\.structural-authoring-canonical-tax-v2/);
  assert.match(nextActions, /G3 is now accepted/);
  assert.match(nextActions, /does not itself authorize a merge/);
  assert.match(nextActions, /No implementation queue is\s+newly authorized by closeout/);
  assert.match(nextActions, /Focus Deck remains preserved/i);
  assert.match(focusDecision, /The Focus Deck is a projection/i);
  assert.match(focusDecision, /existing `kp\.article-deck\.v1` derivation/i);
  assert.match(focusReview, /graph geometry[\s\S]*economic truth/i);
  assert.match(focusReview, /human visual checkpoint/i);
  assert.match(semanticStateDecision, /explicit nonvisual persistent snapshot/i);
  assert.match(semanticStateProposal, /30-slice,[\s\S]*nonvisual foundation/i);
  assert.match(semanticStateProposal, /Always stop at `HUMAN_CHECKPOINT`/);
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
  const attentionDirection = attention.slice(0, attention.indexOf("## Goal"));
  assert.match(attentionDirection, /broader lane paused/);
  assert.match(attentionDirection, /active gradient delivery, not a parallel queue/);
  assert.match(attentionDirection, /2026-09-10-gradient-contour-delivery-proposal\.md/);
});

test("authoring integration executes only its explicitly approved contract", async () => {
  const decisionName =
    "2026-09-05-authoring-integration-priority-and-sequence.md";
  const proposalName =
    "2026-09-05-authoring-integration-market-preview-long-loop-proposal.md";
  const [roadmap, thread, nextActions, strategy, entrypoint, decision, proposal] =
    await Promise.all([
      readFile("docs/project/roadmap.md", "utf8"),
      readFile("docs/project/threads/typed-semantic-authoring-framework.md", "utf8"),
      readFile("docs/project/next-actions.md", "utf8"),
      readFile("docs/project/strategy.md", "utf8"),
      readFile("docs/project/authoring/llm-generation-entrypoint.md", "utf8"),
      readFile(`docs/project/decisions/${decisionName}`, "utf8"),
      readFile(`docs/project/reviews/${proposalName}`, "utf8")
    ]);

  // Accepted strategy must be recoverable without treating proposed APIs as shipped.
  for (const source of [roadmap, thread, nextActions, strategy, entrypoint]) {
    assert.ok(source.includes(decisionName));
  }
  for (const source of [roadmap, thread, nextActions]) {
    assert.ok(source.includes(proposalName));
  }
  assert.match(decision, /Status: ACCEPTED DIRECTION/);
  assert.match(strategy, /authoring-first architecture integration/);
  assert.match(entrypoint, /active thread named by that roadmap/);
  assert.match(entrypoint, /bounded market source\/Article\/preview integration is implemented/);
  assert.match(entrypoint, /not universal public generation APIs/);
  assert.match(entrypoint, /authoring-round-trip-packet\.md/);
  assert.match(decision, /does not gate this\s+architecture integration sequence/);
  assert.match(decision, /Generic state updates do not establish mathematical equivalence/);
  assert.match(decision, /checking|comparison is insufficient/);
  assert.match(decision, /reject cohorts larger than two/);
  assert.match(proposal, /Status: APPROVED; exact 28-slice execution authorized/);
  assert.match(proposal, /Executable contract: Theseus owns live status/);
  assert.match(proposal, /same revision\/frame/);
  assert.match(proposal, /mandatory HUMAN_CHECKPOINT/);

  const sliceNumbers = [...proposal.matchAll(/^\| (\d{2}) \|/gm)]
    .map((match) => Number(match[1]));
  assert.deepEqual(sliceNumbers, Array.from({ length: 28 }, (_, index) => index + 1));
});
