import assert from "node:assert/strict";
import test from "node:test";

import {
  deriveKpAnimationAcceptanceBrief,
  renderKpAnimationAcceptanceBrief
} from "../src/editor/semantic-animation-workbench-acceptance.ts";
import type {
  KpSemanticAnimationWorkbenchIndexEntry
} from "../src/editor/semantic-animation-workbench-index.ts";

test("acceptance brief retains semantic law and lifecycle provenance", () => {
  const brief = deriveKpAnimationAcceptanceBrief({
    entry: entry(),
    lawChecks: [
      {
        id: "check.radical.seek-rewind",
        lawId: "animation.seek-rewind",
        level: "strict",
        targetId: "tree.radical"
      }
    ],
    lawEvidence: "available"
  });

  assert.deepEqual(brief.criteria[0]?.sourceIds, [
    "check.radical.seek-rewind",
    "animation.seek-rewind"
  ]);
  assert.equal(
    brief.criteria[1]?.detail,
    "Maturity promoted · approval approved."
  );
  assert.equal(brief.criteria[2]?.detail, "Verification passing.");
  assert.deepEqual(brief.missingEvidence, [
    "No current item-scoped feedback is attached."
  ]);
});

test("acceptance brief exposes missing law evidence instead of inventing prose", () => {
  const planned = entry({
    playability: "planned-only",
    maturity: "proposed",
    approval: "unapproved",
    verification: "unknown"
  });
  const brief = deriveKpAnimationAcceptanceBrief({
    entry: planned,
    lawEvidence: "unavailable"
  });
  const html = renderKpAnimationAcceptanceBrief(brief);

  assert.equal(
    brief.criteria.some((criterion) => criterion.kind === "semantic-law"),
    false
  );
  assert.match(
    html,
    /Semantic law checks will appear when a concrete animation asset is published/
  );
  assert.match(html, /Source: lifecycle\.maturity · lifecycle\.approval/);
});

function entry(
  lifecycle: Partial<
    KpSemanticAnimationWorkbenchIndexEntry["lifecycle"]
  > = {}
): KpSemanticAnimationWorkbenchIndexEntry {
  return {
    schemaVersion: "kp.semantic-animation-workbench-index-entry.v1",
    identity: {
      schemaVersion: "kp.canonical-animation-identity.v1",
      animationId: "animation.radical",
      title: "Power to radical",
      aliases: [],
      familyIds: [],
      provenance: {
        kind: "catalog",
        descriptorId: "editor.animation.radical"
      },
      availability:
        lifecycle.playability === "planned-only" ? "planned" : "concrete"
    },
    summary: "Preserve the base while the power becomes a radical.",
    tags: [],
    representations: [],
    promotion: {
      schemaVersion: "kp.artifact-promotion-lineage.v1",
      animationId: "animation.radical",
      facet: {
        maturity:
          lifecycle.playability === "planned-only"
            ? "reviewable"
            : "promoted",
        novelty: "composition",
        humanReviewRequired: false,
        goldCohort: lifecycle.playability !== "planned-only"
      },
      evidenceSourceIds: ["review.fixture"]
    },
    lifecycle: {
      schemaVersion: "kp.animation-lifecycle-facets.v1",
      roadmap: "now",
      execution: "complete",
      maturity: "promoted",
      approval: "approved",
      review: "approved",
      verification: "passing",
      playability: "playable",
      ...lifecycle
    },
    controlIds: [],
    diagnostics: []
  };
}
