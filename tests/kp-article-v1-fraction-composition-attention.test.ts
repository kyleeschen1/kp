import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import type { KpArticleImportLock } from
  "../src/article/kp-article-import-lock.ts";
import {
  compileKpFractionCompositionArticle
} from "../src/tutorial/algebra-fraction-composition/fraction-composition-article-compiler.ts";
import {
  createKpFractionCompositionAttentionMatrix
} from "../src/tutorial/algebra-fraction-composition/fraction-composition-attention-matrix.ts";
import {
  createKpFractionCompositionArticleRuntimeCheckpoints,
  createKpFractionCompositionArticleRuntimeRanges
} from "../src/tutorial/algebra-fraction-composition/fraction-composition-runtime-ranges.ts";
import {
  resolveKpFractionCompositionArticleSemanticReference
} from "../src/tutorial/algebra-fraction-composition/fraction-composition-semantic-navigation.ts";

const compiled = compileKpFractionCompositionArticle({
  text: readFileSync("content/lessons/algebra-fraction-composition.kp.md", "utf8"),
  lock: JSON.parse(readFileSync(
    "content/lessons/algebra-fraction-composition.kp.lock.json",
    "utf8"
  )) as KpArticleImportLock
});

test("fraction attention matrix derives twelve semantic beats from Article IR", () => {
  const matrix = createKpFractionCompositionAttentionMatrix(
    compiled.article.document
  );

  assert.equal(matrix.documentId, compiled.article.document.id);
  assert.equal(matrix.stageId, "solve");
  assert.deepEqual(matrix.beats.map(({ id, framing }) => [id, framing]), [
    ["read-scope", "inspect"],
    ["distribute:motion", "demonstrate"],
    ["distribute:settled", "interpret"],
    ["evaluate-constant:motion", "demonstrate"],
    ["evaluate-constant:settled", "interpret"],
    ["subtract-four:motion", "demonstrate"],
    ["subtract-four:settled", "interpret"],
    ["clear-denominator:motion", "demonstrate"],
    ["clear-denominator:settled", "interpret"],
    ["divide-by-two:motion", "demonstrate"],
    ["divide-by-two:settled", "interpret"],
    ["verify-solution", "verify"]
  ]);
});

test("attention anchors reuse all canonical ranges and endpoint checkpoints", () => {
  const beats = createKpFractionCompositionAttentionMatrix(
    compiled.article.document
  ).beats;
  const rangeAnchors = beats.flatMap(({ anchor }) =>
    anchor.kind === "range" ? [anchor] : []
  );
  const checkpointAnchors = beats.flatMap(({ anchor }) =>
    anchor.kind === "checkpoint" ? [anchor] : []
  );

  assert.deepEqual(
    rangeAnchors,
    createKpFractionCompositionArticleRuntimeRanges().map(
      ({ path, start, end }) => ({ kind: "range", path, start, end })
    )
  );
  const checkpoints = createKpFractionCompositionArticleRuntimeCheckpoints();
  assert.equal(checkpointAnchors[0]?.path, checkpoints[0]?.path);
  assert.deepEqual(
    checkpointAnchors.slice(1, -1).map(({ path }) => path),
    checkpoints.slice(1).map(({ path }) => path)
  );
  assert.equal(checkpointAnchors.at(-1)?.path, checkpoints.at(-1)?.path);
});

test("attention names only locked semantic addresses and never owns time", () => {
  const matrix = createKpFractionCompositionAttentionMatrix(
    compiled.article.document
  );

  for (const beat of matrix.beats) {
    assert.equal(beat.timelineAuthority, "none");
    assert.ok(beat.passageMarkdown.trim().length > 0);
    for (const address of [
      ...beat.primaryAddresses,
      ...beat.contextAddresses
    ]) {
      assert.notEqual(
        resolveKpFractionCompositionArticleSemanticReference(address),
        undefined,
        `${beat.id} must use a locked semantic address`
      );
    }
    assert.deepEqual(Object.keys(beat).sort(), [
      "anchor",
      "contextAddresses",
      "framing",
      "id",
      "passageMarkdown",
      "primaryAddresses",
      "sourceBlockId",
      "sourceSlot",
      "stageId",
      "timelineAuthority"
    ]);
  }
});

test("attention derivation is deterministic", () => {
  assert.deepEqual(
    createKpFractionCompositionAttentionMatrix(compiled.article.document),
    createKpFractionCompositionAttentionMatrix(compiled.article.document)
  );
});
