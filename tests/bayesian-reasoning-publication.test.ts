import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { createBayesDraft } from "../src/experiments/bayesian-reasoning/draft.ts";
import { buildBayesEdition, compileBayesPublication, verifyBayesPublication } from "../scripts/build-bayesian-edition.ts";

test("immutable Bayesian editions retain source bytes and shared styles; stale files are never overwritten", () => {
  const scratch = fileURLToPath(new URL("../tmp/codex/", import.meta.url)); mkdirSync(scratch, { recursive: true });
  const fixture = mkdtempSync(join(scratch, "bayes-publication-test-")), editions: string[] = [];
  try {
    const source = createBayesDraft(); source.model.events[0]!.label = fixture.split("/").at(-1)!;
    const path = join(fixture, "source.json"), bytes = JSON.stringify(source, null, 2) + "\n"; writeFileSync(path, bytes);
    const first = buildBayesEdition(path); editions.push(first.directory);
    assert.equal(buildBayesEdition(path, true).checked, true);
    assert.equal(readFileSync(join(first.directory, "source.json"), "utf8"), bytes);
    assert.equal(readFileSync(join(first.directory, "styles/experiments/bayesian-reasoning/style.css"), "utf8"), readFileSync(new URL("../src/experiments/bayesian-reasoning/style.css", import.meta.url), "utf8"));
    source.model.events[0]!.label += " edited"; writeFileSync(path, JSON.stringify(source));
    const second = buildBayesEdition(path); editions.push(second.directory);
    assert.notEqual(first.directory, second.directory); assert.notEqual(first.revisionId, second.revisionId);
    assert.equal(readFileSync(join(first.directory, "source.json"), "utf8"), bytes);
    writeFileSync(join(second.directory, "index.html"), "altered");
    assert.throws(() => buildBayesEdition(path, true), /stale or altered/);
    assert.throws(() => buildBayesEdition(path), /stale or altered/);
  } finally {
    for (const directory of editions) rmSync(directory, { recursive: true, force: true });
    rmSync(fixture, { recursive: true, force: true });
  }
});

test("Bayes publication uses existing envelope and reproduces static SVG, math and all required context", () => {
  const source = createBayesDraft(); source.model.events[0]!.label = '<script>alert("label")</script>';
  const bytes = JSON.stringify(source), artifact = compileBayesPublication(bytes, "source.json");
  assert.equal(artifact.schemaVersion, "kp.compiled-publication-artifact.v1");
  const { payload } = artifact, html = payload.reading.html;
  assert.equal(payload.checkpoints.length, 7); assert.equal((html.match(/<svg /g) ?? []).length, 7);
  assert.equal((html.match(/class="katex"/g) ?? []).length, 2);
  assert.match(html, /data-bayes-membership="excluded"[^>]+--bayes-context: 1;/);
  assert.match(html, /--bayes-reference-strength: 1;/);
  assert.ok(!html.includes("<script")); assert.match(html, /&lt;script&gt;/);
  assert.doesNotMatch(html, /data-bayes-apply|data-kp-focus-deck-scrubber|type="module"/);
  for (const projection of [payload.full, payload.compact, payload.context, ...payload.prompts]) assert.equal(projection.revisionId, payload.revisionId);
  for (const assumption of payload.context.assumptions) assert.ok(html.includes(assumption));
  for (const checkpoint of payload.checkpoints) assert.ok(html.includes(`id="${checkpoint.id}"`));
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
  assert.equal(new Set(ids).size, ids.length);
  verifyBayesPublication(artifact, bytes, "source.json");
  const forged = JSON.parse(JSON.stringify(artifact)); forged.payload.context.denominator = "1";
  forged.payloadSha256 = `sha256:${createHash("sha256").update(JSON.stringify(forged.payload)).digest("hex")}`;
  assert.throws(() => verifyBayesPublication(forged, bytes, "source.json"), /does not reproduce/);
});
