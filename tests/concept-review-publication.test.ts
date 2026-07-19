import assert from "node:assert/strict";
import test from "node:test";

import canonicalArtifactSource from "../content/generated/artifacts/mathematics.linear-equations.solve-with-balance--1.0.0.ts";
import {
  conceptReviewInspectionSchema,
  publishLinearEquationConceptReview
} from "../src/app-adapters/public-api.ts";
import { publishedConceptArtifactSchema } from "../src/authoring/public-api.ts";
import { parseConceptRoomRoute } from "../src/kernel/public-api.ts";
import { createCanonicalConceptRoomTrace } from "./fixtures/canonical-concept-room-trace.ts";

test("Review publication is searchable, static, printable, and checkpoint-addressable", () => {
  const publication = publicationFixture();
  assert.equal(publication.canonicalPath,
    "/concepts/mathematics/linear-equations/solve-with-balance");
  assert.match(publication.html, /^<!doctype html>/);
  assert.match(publication.html, /See concepts move/);
  assert.match(publication.html, /Subtract 3 from both sides/);
  assert.match(publication.html, /x = 5\/2/);
  assert.match(publication.html, /class="katex-display"/);
  assert.equal(matches(publication.html, /data-kp-review-checkpoint=/g), 4);
  assert.equal(matches(publication.html, /data-kp-review-balance-svg/g), 4);
  assert.equal(matches(publication.html, /<a data-kp-review-explore-link/g), 4);
  assert.match(publication.html, /href="#checkpoint-subtract-three"/);
  assert.match(publication.html, /@media print/);
  assert.doesNotMatch(publication.html, /<script type="module"/);
  assert.doesNotMatch(publication.html, /<animate/);
});

test("Review inspection capsule validates exact checkpoint-to-route projection", () => {
  const publication = publicationFixture();
  const inspection = conceptReviewInspectionSchema.parse(publication.inspection);
  assert.equal(Object.isFrozen(inspection.checkpoints), true);
  assert.deepEqual(inspection.checkpoints.map((checkpoint) => checkpoint.frameId), [
    "frame.initial", "frame.step.1", "frame.step.2", "frame.step.2"
  ]);
  inspection.checkpoints.forEach((checkpoint) => {
    const route = parseConceptRoomRoute(checkpoint.exploreUrl);
    assert.equal(route.checkpoint, checkpoint.id);
    assert.equal(route.timePermille, checkpoint.progressPermille);
    assert.equal(route.mode, "touch");
    assert.equal(route.projection, "balance");
    assert.deepEqual(route.focus, [...checkpoint.semanticRefs].sort());
  });
  assert.throws(() => conceptReviewInspectionSchema.parse({
    ...inspection,
    checkpoints: [{ ...inspection.checkpoints[0], progressPermille: 1001 }]
  }), /progressPermille/);
});

test("Review publication is deterministic for one published artifact and trace", () => {
  const first = publicationFixture();
  const second = publicationFixture();
  assert.equal(first.html, second.html);
  assert.deepEqual(first.inspection, second.inspection);
});

test("Review publication refuses checkpoint mathematics that diverge from the artifact", () => {
  const published = publishedConceptArtifactSchema.parse(canonicalArtifactSource);
  const artifact = {
    ...published,
    manifest: {
      ...published.manifest,
      checkpoints: published.manifest.checkpoints.map((checkpoint, index) => index === 1
        ? { ...checkpoint, semanticRefs: ["operation.subtract-three", "diagram.balance"] }
        : checkpoint)
    }
  };
  assert.throws(() => publishLinearEquationConceptReview({
    artifact,
    trace: createCanonicalConceptRoomTrace(),
    diagramSemanticId: "diagram.balance"
  }), /does not reference projected equation/);
});

function publicationFixture() {
  return publishLinearEquationConceptReview({
    artifact: publishedConceptArtifactSchema.parse(canonicalArtifactSource),
    trace: createCanonicalConceptRoomTrace(),
    diagramSemanticId: "diagram.balance"
  });
}

function matches(value: string, pattern: RegExp): number {
  return [...value.matchAll(pattern)].length;
}
