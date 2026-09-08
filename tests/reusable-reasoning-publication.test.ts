import assert from "node:assert/strict";
import test from "node:test";
import { createHash } from "node:crypto";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildReasoningEdition, compileReasoningPublication, verifyReasoningPublication } from "../scripts/build-reasoning-edition.ts";
import { createKpReasoningSource } from "../src/experiments/reusable-reasoning/source.ts";

test("static publication retains one revision, every assumption and exact native steps without JavaScript", () => {
  const source = createKpReasoningSource();
  const sourceText = JSON.stringify({ ...source, title: '<script>alert("editorial")</script>' });
  const artifact = compileReasoningPublication(sourceText, "example.json");
  assert.equal(artifact.schemaVersion, "kp.compiled-publication-artifact.v1");
  for (const projection of [artifact.payload.full, artifact.payload.compact, artifact.payload.context, ...artifact.payload.prompts]) {
    assert.equal(projection.revisionId, artifact.payload.revisionId);
  }
  const html = artifact.payload.reading.html;
  assert.ok(!html.includes("<script"));
  for (const assumption of artifact.payload.context.assumptions) assert.ok(html.includes(assumption.statement));
  for (const state of artifact.payload.context.states) {
    assert.ok(html.includes(`id="${state.stateId}"`));
    assert.ok(artifact.math.sourceLatex.includes(state.segments.map(segment => segment.latex).join("")));
  }
  for (const link of html.matchAll(/href="#([^"]+)"/g)) assert.ok(html.includes(`id="${link[1]}"`));
  verifyReasoningPublication(artifact, sourceText, "example.json");
  const forged = JSON.parse(JSON.stringify(artifact));
  forged.payload.context.assumptions = [];
  forged.payloadSha256 = `sha256:${createHash("sha256").update(JSON.stringify(forged.payload)).digest("hex")}`;
  assert.throws(() => verifyReasoningPublication(forged, sourceText, "example.json"), /does not reproduce/);
});

test("filesystem editions preserve source bytes, reject stale files and keep revisions separate", () => {
  const scratchRoot = new URL("../tmp/codex/", import.meta.url);
  mkdirSync(scratchRoot, { recursive: true });
  const fixture = mkdtempSync(fileURLToPath(new URL("reasoning-publication-test-", scratchRoot)));
  const editions: string[] = [];
  try {
    const sourcePath = join(fixture, "source.json");
    const source = { ...createKpReasoningSource(), title: `Filesystem ${fixture.split("/").at(-1)}` };
    const bytes = JSON.stringify(source, null, 2) + "\n";
    writeFileSync(sourcePath, bytes);
    const first = buildReasoningEdition(sourcePath); editions.push(first.directory);
    assert.equal(readFileSync(join(first.directory, "source.json"), "utf8"), bytes);
    assert.equal(buildReasoningEdition(sourcePath, true).checked, true);
    writeFileSync(sourcePath, JSON.stringify({ ...source, compact: "A new editorial reading." }));
    const second = buildReasoningEdition(sourcePath); editions.push(second.directory);
    assert.notEqual(second.directory, first.directory);
    assert.notEqual(second.revisionId, first.revisionId);
    assert.equal(readFileSync(join(first.directory, "source.json"), "utf8"), bytes);
    writeFileSync(join(second.directory, "index.html"), "altered");
    assert.throws(() => buildReasoningEdition(sourcePath, true), /stale or altered/);
    assert.throws(() => buildReasoningEdition(sourcePath), /stale or altered/);
    writeFileSync(sourcePath, "{");
    assert.throws(() => buildReasoningEdition(sourcePath), SyntaxError);
  } finally {
    // Only this test's freshly allocated fixture and generated editions are removed.
    for (const directory of editions) rmSync(directory, { recursive: true, force: true });
    rmSync(fixture, { recursive: true, force: true });
  }
});
