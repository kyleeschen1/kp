import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  createKpEconomicsLessonBuffer,
  serializeKpEconomicsLessonBuffer
} from "../src/tutorial/economics-demand-shift/economics-demand-shift-lesson-buffer.ts";
import {
  importKpEconomicsLegacyArticle
} from "../src/tutorial/economics-demand-shift/economics-demand-shift-rc1-importer.ts";
import {
  parseKpEconomicsTwoColumnSource
} from "../src/tutorial/economics-demand-shift/economics-demand-shift-two-column-source.ts";

test("legacy economics inputs reconcile into one valid RC1 authority", () => {
  const imported = importRealSources();

  assert.equal(imported.authority, "article-source");
  assert.equal(imported.compilation.document.id, "lesson.economics.demand-shift");
  assert.deepEqual(
    imported.compilation.document.blocks
      .flatMap((block) => block.kind === "motion" ? [block.id] : []),
    ["follow-shift", "shift-versus-movement"]
  );
  assert.deepEqual(
    imported.compilation.document.blocks
      .flatMap((block) => block.kind === "focus" ? [block.id] : []),
    ["initial-equilibrium", "demand-change"]
  );
  assert.equal(imported.importLock.entries[0]!.version, "1.2.0");
  assert.ok(imported.sourceNoise.ratio <= 0.25);
});

test("migration preserves prose once and aliases legacy motion-after identities", () => {
  const imported = importRealSources();
  const normalized = imported.articleText.replace(/\s+/gu, " ");

  for (const phrase of [
    "Imagine a weekly market for boxes of strawberries.",
    "The new curves meet at $E_1=(8,10)$",
    "Supply did not shift. Explain why equilibrium quantity supplied nevertheless rose."
  ]) {
    assert.equal(normalized.split(phrase).length - 1, 1, phrase);
  }
  assert.match(normalized, /price, \[\$P\$\]\(kp-ref:market\/price-axis\)/u);
  assert.doesNotMatch(imported.articleText, /<!--\s*kp:/u);
  assert.deepEqual(
    imported.aliases.filter(({ role }) => role === "motion-after"),
    [
      { legacyId: "new-equilibrium", articleId: "follow-shift", role: "motion-after" },
      { legacyId: "equation-check", articleId: "shift-versus-movement", role: "motion-after" }
    ]
  );
  assert.equal(
    new Set(imported.aliases.map(({ legacyId }) => legacyId)).size,
    imported.aliases.length
  );
});

test("legacy projection material is frozen evidence rather than source authority", () => {
  const imported = importRealSources();

  assert.equal(Object.isFrozen(imported.legacyProjectionBaseline), true);
  assert.deepEqual(
    imported.legacyProjectionBaseline.passages.map(({ id }) => id),
    [
      "graph-at-rest",
      "initial-equilibrium",
      "follow-shift",
      "new-equilibrium",
      "shift-versus-movement",
      "movement-along-supply"
    ]
  );
  assert.deepEqual(imported.fingerprints.map(({ source }) => source), [
    "markdown",
    "two-column",
    "lesson-buffer"
  ]);
  assert.ok(imported.fingerprints.every(({ sha256 }) =>
    /^sha256:[a-f0-9]{64}$/u.test(sha256)
  ));
});

test("import fails closed when either derived legacy representation drifts", () => {
  const inputs = realInputs();
  assert.throws(() => importKpEconomicsLegacyArticle({
    ...inputs,
    lessonBuffer: inputs.lessonBuffer.replace(
      "Begin with the graph at rest.",
      "A divergent graph opening."
    )
  }), /buffer diverges/u);
  assert.throws(() => importKpEconomicsLegacyArticle({
    ...inputs,
    twoColumnSource: {
      ...inputs.twoColumnSource as object,
      passages: (inputs.twoColumnSource as { passages: object[] }).passages.map(
        (passage, index) => index === 2
          ? { ...passage, motionBlockId: "supply-movement" }
          : passage
      )
    }
  }), /motion ownership diverge/u);
});

function importRealSources() {
  return importKpEconomicsLegacyArticle(realInputs());
}

function realInputs() {
  const markdown = readFileSync(
    "content/lessons/economics-demand-shift.md",
    "utf8"
  );
  const twoColumnSource: unknown = JSON.parse(readFileSync(
    "content/lessons/economics-demand-shift-two-column.json",
    "utf8"
  ));
  const parsed = parseKpEconomicsTwoColumnSource(twoColumnSource);
  return {
    markdown,
    twoColumnSource,
    lessonBuffer: serializeKpEconomicsLessonBuffer(
      createKpEconomicsLessonBuffer(parsed)
    )
  };
}
