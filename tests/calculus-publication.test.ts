import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { compileCalculusPublication, verifyCalculusPublication } from "../scripts/calculus-publication.ts";
import { digestEditionBytes } from "../scripts/immutable-local-edition.ts";

for (const name of ["stationary-change", "two-reversals"]) test(`${name}: publication reproduces checked math, source and editorial passages`, () => {
  const path = `content/authoring/transfer/${name}.json`, bytes = readFileSync(path, "utf8");
  const artifact = compileCalculusPublication(bytes, path);
  verifyCalculusPublication(JSON.parse(JSON.stringify(artifact)), bytes, path);
  assert.equal(artifact.source.sha256, digestEditionBytes(bytes));
  assert.equal(artifact.payload.proseAuthority, "editorial");
  assert.equal(artifact.payload.checkpoints.length, 5);
  assert.ok(artifact.math.fragmentCount > 20);
  for (const step of artifact.payload.source.steps) assert.ok(artifact.payload.reading.html.includes(step.text));
  for (const field of ["initial", "reading", "source", "revisionId"]) {
    const altered = JSON.parse(JSON.stringify(artifact)); altered.payload[field] = "forged";
    altered.payloadSha256 = digestEditionBytes(JSON.stringify(altered.payload));
    assert.throws(() => verifyCalculusPublication(altered, bytes, path), /does not reproduce/);
  }
  assert.throws(() => verifyCalculusPublication(artifact, bytes + " ", path), /does not reproduce/);
});

test("publication rejects unsupported mathematics and escapes editorial markup", () => {
  const source = JSON.parse(readFileSync("content/authoring/transfer/stationary-change.json", "utf8"));
  assert.throws(() => compileCalculusPublication(JSON.stringify({ ...source, inner: "x/z" }), "source.json"), /inner:/);
  source.title = "<img src=x onerror=alert(1)>"; source.steps[0].text = "</script><script>alert(1)</script>";
  const html = compileCalculusPublication(JSON.stringify(source), "source.json").payload.reading.html;
  assert.ok(html.includes("&lt;img")); assert.ok(html.includes("&lt;/script&gt;"));
  assert.ok(!html.includes("<script>alert"));
});
