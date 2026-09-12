import test from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { createKpCommonFactorExample } from "../src/authoring/common-factor-author-check.ts";
import { buildCommonFactorEdition, compileCommonFactorPublication, verifyCommonFactorPublication } from "../scripts/build-common-factor-edition.ts";
import { digestEditionBytes } from "../scripts/immutable-local-edition.ts";

test("factoring publication reproduces all views from one verified source without live controls", () => {
  const source = createKpCommonFactorExample();
  const bytes = JSON.stringify({ ...source, editorial: { ...source.editorial, title: "<script>bad</script>" } });
  const artifact = compileCommonFactorPublication(bytes, "source.json"), { payload } = artifact, html = payload.reading.html;
  assert.equal(payload.checkpoints.length, 2);
  for (const view of [payload.full, payload.compact, ...payload.prompts]) assert.equal(view.revisionId, payload.revisionId);
  assert.equal((html.match(/<math/g) ?? []).length, 6);
  assert.doesNotMatch(html, /<script|data-common-factor-apply|data-kp-focus-deck-scrubber|type="module"/);
  assert.match(html, /&lt;script&gt;/); assert.match(html, /factor may be zero/);
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]); assert.equal(new Set(ids).size, ids.length);
  verifyCommonFactorPublication(artifact, bytes, "source.json");
  const forged = JSON.parse(JSON.stringify(artifact)); forged.payload.full.facts.factor = "z";
  forged.payloadSha256 = digestEditionBytes(JSON.stringify(forged.payload));
  assert.throws(() => verifyCommonFactorPublication(forged, bytes, "source.json"), /does not reproduce/);
});

test("selected-source editions preserve exact bytes and never overwrite an altered edition", () => {
  const scratch = fileURLToPath(new URL("../tmp/codex/", import.meta.url)); mkdirSync(scratch, { recursive: true });
  const fixture = mkdtempSync(join(scratch, "common-factor-publication-test-")), editions: string[] = [];
  try {
    const base = createKpCommonFactorExample();
    const source = { ...base, editorial: { ...base.editorial, title: fixture.split("/").at(-1)! } };
    const path = join(fixture, "source.json"), bytes = JSON.stringify(source, null, 2) + "\n"; writeFileSync(path, bytes);
    const first = buildCommonFactorEdition(path); editions.push(first.directory);
    assert.equal(buildCommonFactorEdition(path, true).checked, true);
    assert.equal(readFileSync(join(first.directory, "source.json"), "utf8"), bytes);
    assert.equal(readFileSync(join(first.directory, "styles/tutorial/focus-deck-typography.css"), "utf8"), readFileSync(new URL("../src/tutorial/focus-deck-typography.css", import.meta.url), "utf8"));
    assert.equal(readFileSync(join(first.directory, "styles/experiments/authored-focus-card.css"), "utf8"), readFileSync(new URL("../src/experiments/authored-focus-card.css", import.meta.url), "utf8"));
    source.editorial.title += " edited"; writeFileSync(path, JSON.stringify(source));
    const second = buildCommonFactorEdition(path); editions.push(second.directory);
    assert.notEqual(first.directory, second.directory); assert.notEqual(first.revisionId, second.revisionId);
    assert.equal(readFileSync(join(first.directory, "source.json"), "utf8"), bytes);
    writeFileSync(join(second.directory, "index.html"), "altered");
    assert.throws(() => buildCommonFactorEdition(path, true), /stale or altered/);
    assert.throws(() => buildCommonFactorEdition(path), /stale or altered/);
  } finally {
    for (const directory of editions) rmSync(directory, { recursive: true, force: true });
    rmSync(fixture, { recursive: true, force: true });
  }
});
