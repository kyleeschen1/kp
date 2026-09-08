import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { createBayesDraft } from "../src/experiments/bayesian-reasoning/draft.ts";
import { compileBayesPublication, verifyBayesPublication } from "../scripts/build-bayesian-edition.ts";

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
