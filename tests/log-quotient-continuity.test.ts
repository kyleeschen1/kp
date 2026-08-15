import assert from "node:assert/strict";
import test from "node:test";

import {
  kpCanonicalLogQuotientContinuity
} from "../src/animation/log-quotient-continuity.ts";

test("quotient continuity classifies every visible occurrence once", () => {
  const continuity = kpCanonicalLogQuotientContinuity;
  const sourceIds = continuity.lifecycle.records
    .flatMap(({ sourceEntityIds }) => sourceEntityIds);
  const targetIds = continuity.lifecycle.records
    .flatMap(({ targetEntityIds }) => targetEntityIds);
  assert.equal(new Set(sourceIds).size, sourceIds.length);
  assert.equal(new Set(targetIds).size, targetIds.length);
  assert.deepEqual(
    continuity.lifecycle.records.map(({ kind }) => kind),
    [
      "successor",
      "successor",
      "continuant",
      "continuant",
      "successor",
      "elimination",
      "introduction",
      "introduction"
    ]
  );
});

test("fan-in has merge lineage and causal derivation authority", () => {
  const continuity = kpCanonicalLogQuotientContinuity;
  const merge = continuity.lineage.edges.find(({ id }) =>
    id.endsWith("difference-derives-quotient")
  );
  assert.deepEqual(merge?.sourceEntityIds, ["source.difference", "source.subtract"]);
  assert.deepEqual(merge?.targetEntityIds, ["target.quotient"]);
  const requirement = continuity.vocabulary.materialContinuity
    .find(({ mode }) => mode === "causal-derivation");
  assert.equal(requirement?.authorityRef.kind, "representational-lineage");
});

test("structural changes depend on semantic settlement rather than authored timing", () => {
  assert.deepEqual(
    kpCanonicalLogQuotientContinuity.causalEvents.map(({ id, kind, after }) => ({
      id,
      kind,
      after
    })),
    [
      {
        id: "event.log-quotient.x-departed",
        kind: "continuant-departed",
        after: []
      },
      {
        id: "event.log-quotient.y-departed",
        kind: "continuant-departed",
        after: []
      },
      {
        id: "event.log-quotient.source-enclosures-retired",
        kind: "structure-retired",
        after: [
          "event.log-quotient.x-departed",
          "event.log-quotient.y-departed"
        ]
      },
      {
        id: "event.log-quotient.x-settled",
        kind: "continuant-settled",
        after: ["event.log-quotient.x-departed"]
      },
      {
        id: "event.log-quotient.y-settled",
        kind: "continuant-settled",
        after: ["event.log-quotient.y-departed"]
      },
      {
        id: "event.log-quotient.operator-fusion-recognizable",
        kind: "fusion-recognizable",
        after: ["event.log-quotient.source-enclosures-retired"]
      },
      {
        id: "event.log-quotient.quotient-recognizable",
        kind: "derivation-recognizable",
        after: [
          "event.log-quotient.x-settled",
          "event.log-quotient.y-settled"
        ]
      },
      {
        id: "event.log-quotient.fraction-bar-introduced",
        kind: "structure-introduced",
        after: ["event.log-quotient.quotient-recognizable"]
      },
      {
        id: "event.log-quotient.target-enclosure-introduced",
        kind: "structure-introduced",
        after: ["event.log-quotient.quotient-recognizable"]
      },
      {
        id: "event.log-quotient.fused-application-settled",
        kind: "fusion-recognizable",
        after: [
          "event.log-quotient.operator-fusion-recognizable",
          "event.log-quotient.fraction-bar-introduced",
          "event.log-quotient.target-enclosure-introduced"
        ]
      }
    ]
  );
});
