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
  createKpFractionCompositionAttentionPacingProfile,
  readKpFractionCompositionAttentionTempo
} from "../src/tutorial/algebra-fraction-composition/fraction-composition-attention-pacing.ts";
import {
  projectKpFractionCompositionAttentionScene
} from "../src/tutorial/algebra-fraction-composition/fraction-composition-attention-scene.ts";
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

test("fraction attention matrix keeps motion and its held endpoint in one scene", () => {
  const matrix = createKpFractionCompositionAttentionMatrix(
    compiled.article.document
  );

  assert.equal(matrix.documentId, compiled.article.document.id);
  assert.equal(matrix.stageId, "solve");
  assert.deepEqual(matrix.beats.map(({ id, framing }) => [id, framing]), [
    ["read-scope", "inspect"],
    ["distribute:motion", "demonstrate"],
    ["evaluate-constant:motion", "demonstrate"],
    ["subtract-four:motion", "demonstrate"],
    ["clear-denominator:motion", "demonstrate"],
    ["divide-by-two:motion", "demonstrate"],
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
  assert.deepEqual(
    checkpointAnchors.map(({ path }) => path),
    [checkpoints[0]?.path, checkpoints.at(-1)?.path]
  );
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

test("attention pacing follows semantic operation groups", () => {
  const profile = createKpFractionCompositionAttentionPacingProfile(
    createKpFractionCompositionArticleRuntimeRanges()
  );

  assert.equal(profile.tempo, "deliberate");
  assert.equal(profile.millisecondsPerOperation, 2_400);
  assert.equal(profile.fullTimelineDurationMs, 31_200);
  assert.deepEqual(Object.values(profile.rangeDurationsMs), [
    4_800,
    4_800,
    7_200,
    7_200,
    7_200
  ]);
});

test("attention tempo remains an internal presentation preference", () => {
  const ranges = createKpFractionCompositionArticleRuntimeRanges();

  assert.equal(readKpFractionCompositionAttentionTempo(""), "deliberate");
  assert.equal(
    readKpFractionCompositionAttentionTempo("?attentionTempo=slow"),
    "slow"
  );
  assert.equal(
    readKpFractionCompositionAttentionTempo("?attentionTempo=brisk"),
    "brisk"
  );
  assert.equal(
    readKpFractionCompositionAttentionTempo("?attentionTempo=unknown"),
    "deliberate"
  );
  assert.equal(
    createKpFractionCompositionAttentionPacingProfile(ranges, "slow")
      .fullTimelineDurationMs,
    39_000
  );
  assert.equal(
    createKpFractionCompositionAttentionPacingProfile(ranges, "brisk")
      .fullTimelineDurationMs,
    23_400
  );
});

test("attention scenes project range-local progress onto the canonical timeline", () => {
  const matrix = createKpFractionCompositionAttentionMatrix(
    compiled.article.document
  );
  const range = createKpFractionCompositionArticleRuntimeRanges()[0]!;

  assert.deepEqual(
    projectKpFractionCompositionAttentionScene(matrix, {
      beatId: "distribute:motion",
      rangeProgress: 0.25
    }).temporalRequest,
    {
      kind: "range-seek",
      rangePath: range.path,
      rangeProgress: 0.25,
      globalProgress: range.start + (range.end - range.start) * 0.25
    }
  );
  assert.deepEqual(
    projectKpFractionCompositionAttentionScene(matrix, {
      beatId: "verify-solution"
    }).temporalRequest,
    {
      kind: "checkpoint-seek",
      checkpointPath: "solved",
      globalProgress: 1
    }
  );
});

test("attention scene seeking is order-independent through reverse and interruption", () => {
  const matrix = createKpFractionCompositionAttentionMatrix(
    compiled.article.document
  );
  const project = (rangeProgress: number) =>
    projectKpFractionCompositionAttentionScene(matrix, {
      beatId: "subtract-four:motion",
      rangeProgress
    });

  const forward = [0, 0.2, 0.7, 1].map(project);
  const reverse = [1, 0.7, 0.2, 0].map(project).reverse();
  assert.deepEqual(reverse, forward);
  project(0.9);
  assert.deepEqual(project(0.35), project(0.35));
  assert.ok(forward.every(({ seekBehavior }) => seekBehavior === "direct"));
  assert.ok(forward.every(({ timelineAuthority }) =>
    timelineAuthority === "none"
  ));
});

test("attention scene selection fails closed on ambiguous temporal input", () => {
  const matrix = createKpFractionCompositionAttentionMatrix(
    compiled.article.document
  );

  assert.throws(
    () => projectKpFractionCompositionAttentionScene(matrix, {
      beatId: "not-authored"
    }),
    /Unknown fraction composition attention beat/u
  );
  assert.throws(
    () => projectKpFractionCompositionAttentionScene(matrix, {
      beatId: "read-scope",
      rangeProgress: 0.5
    }),
    /does not accept range progress/u
  );
  assert.throws(
    () => projectKpFractionCompositionAttentionScene(matrix, {
      beatId: "clear-denominator:motion",
      rangeProgress: 1.01
    }),
    /between 0 and 1/u
  );
});
