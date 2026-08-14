import assert from "node:assert/strict";
import test from "node:test";

import {
  kpNormalMatrixProofPromptIds,
  kpNormalMatrixProofPrompts
} from "../src/semantic/normal-matrix-proof-prompts.ts";
import { decodeKpNormalMatrixProofUrl } from
  "../src/public-web/normal-matrix-proof-url-codec.ts";
import { createKpNormalMatrixProofPromptProjections } from
  "../src/tutorial/normal-matrix-proof/normal-matrix-proof-prompt-projection.ts";
import { renderKpNormalMatrixProofPromptSurfaceHtml } from
  "../src/tutorial/normal-matrix-proof/normal-matrix-proof-prompt-publication.ts";

test("all prompts project from one validated suite into exact proof locations", () => {
  const projections = createKpNormalMatrixProofPromptProjections(
    "https://kinetic.press/learn/math/normal-matrices/"
  );

  assert.deepEqual(projections.map(({ id }) => id), kpNormalMatrixProofPromptIds);
  assert.equal(new Set(projections.map(({ promptUrl }) => promptUrl)).size, 11);
  projections.forEach((projection, index) => {
    const authored = kpNormalMatrixProofPrompts[index]!;
    const promptUrl = new URL(projection.promptUrl, "https://kinetic.press");
    const returnUrl = new URL(projection.returnUrl, "https://kinetic.press");
    assert.equal(projection.question, authored.card.prompt);
    assert.equal(projection.checkpointId, authored.checkpointId);
    assert.equal(
      decodeKpNormalMatrixProofUrl(promptUrl).checkpoint,
      authored.checkpointId
    );
    assert.equal(promptUrl.searchParams.get("review"), authored.id);
    assert.equal(returnUrl.searchParams.has("review"), false);
    assert.equal(promptUrl.hash, `#kp-ref:${projection.focusAddress}`);
    assert.equal(returnUrl.hash, promptUrl.hash);
  });
});

test("the prompt publication is searchable static HTML with native reveal", () => {
  const html = renderKpNormalMatrixProofPromptSurfaceHtml();

  assert.equal(html.split("data-kp-normal-proof-prompt=").length - 1, 11);
  assert.equal(html.split("<details ").length - 1, 11);
  for (const prompt of kpNormalMatrixProofPrompts) {
    assert.ok(html.includes(prompt.card.prompt));
    assert.ok(html.includes(`review=${prompt.id}`));
  }
  assert.match(html, /The unmatched nonnegative squared norm must be zero/u);
  assert.match(html, /href="\/learn\/math\/normal-matrices\/\?checkpoint=/u);
  assert.doesNotMatch(html, /<script|hidden|display:\s*none/iu);
});
