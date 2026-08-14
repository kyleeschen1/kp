import assert from "node:assert/strict";
import test from "node:test";

import { kpNormalMatrixProofPromptIds } from
  "../src/semantic/normal-matrix-proof-prompt-ids.ts";
import {
  createKpNormalMatrixProofReturnRehearsal,
  kpNormalMatrixProofReturnCaptureTemplate
} from "../src/tutorial/normal-matrix-proof/normal-matrix-proof-return-rehearsal.ts";
import { renderKpNormalMatrixProofReturnRehearsalHtml } from
  "../src/tutorial/normal-matrix-proof/normal-matrix-proof-prompt-publication.ts";

test("manual returns cover every prompt once across day zero one and seven", () => {
  const sessions = createKpNormalMatrixProofReturnRehearsal(
    "https://kinetic.press/learn/math/normal-matrices/"
  );
  const promptIds = sessions.flatMap(({ prompts }) =>
    prompts.map(({ id }) => id)
  );

  assert.deepEqual(sessions.map(({ id }) => id), [
    "day-zero",
    "day-one",
    "day-seven"
  ]);
  assert.equal(new Set(promptIds).size, kpNormalMatrixProofPromptIds.length);
  assert.deepEqual([...promptIds].sort(), [...kpNormalMatrixProofPromptIds].sort());
  assert.ok(sessions.flatMap(({ prompts }) => prompts).every(({ promptUrl }) =>
    promptUrl.startsWith("/learn/math/normal-matrices/?") &&
    promptUrl.includes("review=") &&
    promptUrl.includes("#kp-ref:normal-proof/")
  ));
});

test("rehearsal is static link HTML with a copyable capture template", () => {
  const html = renderKpNormalMatrixProofReturnRehearsalHtml();

  assert.match(html, /Day zero/u);
  assert.match(html, /Day one/u);
  assert.match(html, /Day seven/u);
  assert.match(html, /What I reconstructed before revealing answers/u);
  assert.ok(html.includes(kpNormalMatrixProofReturnCaptureTemplate));
  assert.equal(html.split("review=").length - 1, 11);
  assert.doesNotMatch(
    html,
    /<script|<form|fetch\(|localStorage|indexedDB|data-[^=]*analytics/iu
  );
});
