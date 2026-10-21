import assert from "node:assert/strict";
import test from "node:test";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { example } from "../src/authoring/matrix-columns/example.ts";
import { compileMatrixPublication, verifyMatrixPublication } from "../scripts/matrix-publication.ts";
import { buildMatrixEdition } from "../scripts/build-matrix-edition.ts";

test("static matrix reading contains both derived columns and every editorial cue with safe native math", () => {
  const source = example(); source.reading.title = '</script><img src=x onerror="alert(1)">';
  const text = JSON.stringify(source), artifact = compileMatrixPublication(text, "selected.json");
  verifyMatrixPublication(artifact, text, "selected.json");
  assert.deepEqual(artifact.payload.result, [[1, 1], [2, 2]]);
  assert.equal(artifact.math.fragmentCount, 3);
  assert.equal((artifact.payload.reading.html.match(/<math/g) ?? []).length, 3);
  assert.equal((artifact.payload.reading.html.match(/data-reading-beat=/g) ?? []).length, 14);
  for (const cues of source.reading.cues) for (const cue of Object.values(cues)) assert.ok(artifact.payload.reading.html.includes(cue));
  assert.ok(!artifact.payload.reading.html.includes("<img"));
  assert.throws(() => verifyMatrixPublication({ ...artifact, payload: { ...artifact.payload, result: [] } }, text, "selected.json"));
  assert.throws(() => verifyMatrixPublication(artifact, text + "\n", "selected.json"));
});

test("matrix static editions retain exact bytes, reproduce immutably and change identity with source bytes", async () => {
  mkdirSync("tmp/codex", { recursive: true }); const directory = mkdtempSync("tmp/codex/matrix-source-test-");
  try {
    const source = join(directory, "source.json"), text = JSON.stringify(example(), null, 2) + "\n";
    writeFileSync(source, text);
    const first = await buildMatrixEdition(source), repeated = await buildMatrixEdition(source, { check: true });
    assert.equal(first.directory, repeated.directory);
    assert.equal(readFileSync(join(first.directory, "source.json"), "utf8"), text);
    const html = readFileSync(join(first.directory, "index.html"), "utf8");
    assert.ok(!html.includes('<script'));
    const manifest = JSON.parse(readFileSync(join(first.directory, "edition.json"), "utf8"));
    assert.ok(Object.keys(manifest.files).some(path => path.endsWith(".woff2")));
    writeFileSync(source, text + "\n");
    const whitespace = await buildMatrixEdition(source);
    assert.equal(first.revisionId, whitespace.revisionId);
    assert.notEqual(first.sourceRevision, whitespace.sourceRevision);
    assert.notEqual(first.byteEditionId, whitespace.byteEditionId);
    await assert.rejects(buildMatrixEdition(join(first.directory, "source.json")), /outside generated editions/);
  } finally { rmSync(directory, { recursive: true, force: true }); }
});
