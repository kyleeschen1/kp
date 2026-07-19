import assert from "node:assert/strict";
import test from "node:test";

import { solveWithBalanceConcept } from "../content/public-api.ts";
import {
  createConceptDraft,
  publishConceptDraft,
  publishedConceptArtifactSchema,
  verifyPublishedConceptArtifact
} from "../src/authoring/public-api.ts";

test("publisher emits a deterministic deeply immutable canonical artifact", async () => {
  const first = await publishConceptDraft(solveWithBalanceConcept);
  const second = await publishConceptDraft(solveWithBalanceConcept);

  assert.deepEqual(first, second);
  assert.equal(first.integrity, "sha256:c97f83668b545f7a5744d5eca1f27c4109fe4696b8c03172114f8eb013a279ec");
  assert.equal(first.manifest.integrity, first.integrity);
  assert.deepEqual(first.dependencies, {
    capabilities: [{ id: "kp.equation", major: 1 }],
    providers: [{
      id: "linear-problems.exact-rational",
      protocol: "linear-problem.v1",
      version: "1.0.0"
    }]
  });
  assert.deepEqual(first.assets, []);
  assert.equal(Object.isFrozen(first), true);
  assert.equal(Object.isFrozen(first.dependencies.capabilities), true);
  assert.equal(await verifyPublishedConceptArtifact(first), true);
});

test("publisher digest changes with content and canonicalizes asset order", async () => {
  const revised = createConceptDraft({
    ...solveWithBalanceConcept,
    title: "A revised linear equation title"
  });
  const original = await publishConceptDraft(solveWithBalanceConcept);
  const changed = await publishConceptDraft(revised);
  assert.notEqual(changed.integrity, original.integrity);

  const assets = [
    {
      id: "balance.static",
      kind: "static-svg" as const,
      path: "assets/balance.svg",
      integrity: `sha256:${"b".repeat(64)}`
    },
    {
      id: "equation.data",
      kind: "data" as const,
      path: "assets/equation.json",
      integrity: `sha256:${"a".repeat(64)}`
    }
  ];
  const ordered = await publishConceptDraft(solveWithBalanceConcept, { assets });
  const reversed = await publishConceptDraft(solveWithBalanceConcept, { assets: [...assets].reverse() });
  assert.equal(ordered.integrity, reversed.integrity);
  assert.deepEqual(ordered.assets.map((asset) => asset.id), ["balance.static", "equation.data"]);
});

test("published artifacts reject tampering and executable payloads", async () => {
  const published = await publishConceptDraft(solveWithBalanceConcept);
  assert.equal(publishedConceptArtifactSchema.safeParse({
    ...published,
    integrity: `sha256:${"0".repeat(64)}`
  }).success, false);
  assert.equal(await verifyPublishedConceptArtifact({
    ...published,
    manifest: { ...published.manifest, title: "Tampered" }
  }), false);
  await assert.rejects(() => publishConceptDraft({
    ...solveWithBalanceConcept,
    onEnter: () => undefined
  } as typeof solveWithBalanceConcept));
});
