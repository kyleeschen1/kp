import assert from "node:assert/strict";
import test from "node:test";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { createHash } from "node:crypto";
import spam from "../content/authoring/r4b-spam-filter.bayes.json" with { type: "json" };
import { buildBayesEdition, compileBayesPublication, verifyBayesPublication } from "../scripts/build-bayesian-edition.ts";

test("authored publication reproduces every projection under one lesson revision without JavaScript", () => {
  const bytes = JSON.stringify(spam), artifact = compileBayesPublication(bytes, "spam.json"), payload = artifact.payload;
  assert.equal(artifact.compiler.version, "2");
  for (const projection of [payload.full, payload.compact, payload.context, ...payload.prompts]) assert.equal(projection.revisionId, payload.revisionId);
  assert.equal(payload.editorialTitle, spam.editorial.title);
  // One heading per self-contained full/compact Article, no third shell copy.
  assert.equal((payload.reading.html.match(/<h1\b/g) ?? []).length, 2);
  assert.ok(payload.reading.html.includes("A false alarm is still a flag"));
  assert.ok(payload.reading.html.includes("What does the flag tell you?"));
  assert.ok(payload.reading.html.includes("Of those 117 messages, 18 are spam"));
  assert.equal((payload.reading.html.match(/<svg /g) ?? []).length, 7);
  assert.equal((payload.reading.html.match(/class="katex"/g) ?? []).length, 2);
  assert.doesNotMatch(payload.reading.html, /<script|data-bayes-apply|type="module"/);
  verifyBayesPublication(artifact, bytes, "spam.json");
  const forged = JSON.parse(JSON.stringify(artifact)); forged.payload.context.editorial.text = "A forged published explanation.";
  forged.payloadSha256 = `sha256:${createHash("sha256").update(JSON.stringify(forged.payload)).digest("hex")}`;
  assert.throws(() => verifyBayesPublication(forged, bytes, "spam.json"), /does not reproduce/);
});

test("prose-only publication edits create new immutable editions without changing probability evidence", () => {
  mkdirSync("tmp/codex", { recursive: true });
  const scratch = mkdtempSync("tmp/codex/bayes-editorial-edition-"), editions: string[] = [];
  try {
    const raw = structuredClone(spam); raw.editorial.title += ` ${scratch}`;
    const path = join(scratch, "source.json"), bytes = JSON.stringify(raw);
    writeFileSync(path, bytes);
    const first = buildBayesEdition(path); editions.push(first.directory);
    const firstArtifact = compileBayesPublication(bytes, path);
    const oldHtml = readFileSync(join(first.directory, "index.html"), "utf8");
    raw.editorial.denominator = ["A revised editorial explanation."];
    const revised = JSON.stringify(raw); writeFileSync(path, revised);
    const second = buildBayesEdition(path); editions.push(second.directory);
    const secondArtifact = compileBayesPublication(revised, path);
    assert.notEqual(first.revisionId, second.revisionId);
    assert.notEqual(first.directory, second.directory);
    assert.equal(firstArtifact.payload.evidenceRevisionId, secondArtifact.payload.evidenceRevisionId);
    assert.equal(readFileSync(join(first.directory, "source.json"), "utf8"), bytes);
    assert.equal(readFileSync(join(first.directory, "index.html"), "utf8"), oldHtml);
    assert.equal(buildBayesEdition(path, true).checked, true);
    writeFileSync(join(second.directory, "index.html"), "altered");
    assert.throws(() => buildBayesEdition(path, true), /stale or altered/);
  } finally {
    for (const directory of editions) rmSync(directory, { recursive: true, force: true });
    rmSync(scratch, { recursive: true, force: true });
  }
});
