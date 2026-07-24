import assert from "node:assert/strict";
import test from "node:test";

import {
  renderKpSemanticAnimationWorkbenchShell
} from "../src/editor/semantic-animation-workbench-shell.ts";
import type {
  KpSemanticAnimationWorkbenchQueryResult
} from "../src/editor/semantic-animation-workbench-query.ts";
import {
  createKpEditorAnimationLibrary
} from "../src/editor/animation-library.ts";

test("Workbench shell renders a labeled search and two-pane control surface", () => {
  const html = renderKpSemanticAnimationWorkbenchShell({
    ...roadmapInput(),
    query: `radical "rewrite"`,
    results: [result("animation.radical", "Power to radical")],
    selectedAnimationId: "animation.radical",
    selectedRepresentationId: "representation.animation.radical",
    selectedPlaybackRepresentationId: "representation.animation.radical",
    selectedDescriptor: {
      ...createKpEditorAnimationLibrary()[0]!,
      animationId: "animation.radical"
    }
  });

  assert.match(html, /data-kp-animation-workbench/);
  assert.match(html, /data-kp-animation-workbench-roadmap/);
  assert.equal(
    html.match(/data-kp-animation-workbench-roadmap-row=/g)?.length,
    2
  );
  assert.match(html, /Architecture benefit/);
  assert.match(html, /Why this order/);
  assert.match(html, /Roadmap order/);
  assert.equal(
    html.match(/data-action="select-animation-workbench-roadmap-link"/g)
      ?.length,
    1
  );
  assert.match(
    html,
    /data-kp-animation-workbench-roadmap-row="arithmetic"[\s\S]*?<th scope="row">Arithmetic<\/th>/
  );
  assert.match(html, /data-kp-animation-workbench-query/);
  assert.match(html, /aria-keyshortcuts="Control\+K Meta\+K \/"/);
  assert.match(html, /data-kp-animation-workbench-results/);
  assert.match(html, /data-kp-animation-workbench-detail/);
  assert.match(html, /value="radical &quot;rewrite&quot;"/);
  assert.match(html, /data-action="show-editor"/);
  assert.match(html, /data-kp-animation-workbench-result="animation.radical"/);
  assert.match(html, /data-kp-animation-workbench-selection="animation.radical"/);
  assert.match(html, /data-kp-animation-workbench-live-preview/);
  assert.match(html, /data-kp-editor-animation-player/);
  assert.match(html, /data-kp-animation-workbench-acceptance/);
  assert.match(html, /data-kp-animation-workbench-review/);
  assert.match(html, /data-kp-animation-workbench-promotion-lineage/);
  assert.match(html, /Promotion lineage/);
  assert.match(html, /Loading the existing development review inbox/);
  assert.match(
    html,
    /data-action="select-animation-workbench-representation"/
  );
  assert.match(
    html,
    /data-kp-animation-workbench-representation="representation\.animation\.radical"/
  );
  assert.match(html, /Loading semantic law checks/);
  assert.match(html, /data-kp-animation-workbench-static-hint/);
  assert.match(html, /What I should see/);
  assert.match(html, /data-kp-animation-workbench-metadata/);
  const titleIndex = html.indexOf("<h2>Power to radical</h2>");
  const playerIndex = html.indexOf("data-kp-editor-animation-player");
  const acceptanceIndex = html.indexOf(
    "data-kp-animation-workbench-acceptance="
  );
  const metadataIndex = html.indexOf(
    "data-kp-animation-workbench-metadata"
  );
  assert.ok(titleIndex < playerIndex);
  assert.ok(playerIndex < acceptanceIndex);
  assert.ok(acceptanceIndex < metadataIndex);
  assert.equal(
    [
      "roadmap",
      "execution",
      "maturity",
      "approval",
      "review",
      "verification",
      "playability"
    ].every((facet) =>
      html.includes(
        `data-kp-animation-workbench-lifecycle-facet="${facet}"`
      )
    ),
    true
  );
  assert.match(html, /aria-label="Maturity: approved"/);
});

test("Workbench shell never mounts a player for planned items", () => {
  const planned = result(
    "animation.algebra.quadratic.solution-branching",
    "Quadratic solution branching",
    true
  );
  const html = renderKpSemanticAnimationWorkbenchShell({
    ...roadmapInput(),
    query: "quadratic",
    results: [planned],
    selectedAnimationId: planned.entry.identity.animationId
  });

  assert.match(html, /data-kp-animation-workbench-planned-preview/);
  assert.doesNotMatch(html, /data-kp-editor-animation-player/);
  assert.match(
    html,
    /Semantic law checks will appear when a concrete animation asset is published/
  );
  assert.match(html, /aria-label="Maturity: proposed"/);
  assert.match(html, /aria-label="Playability: planned-only"/);
  assert.match(html, /data-kp-animation-workbench-no-representations/);
});

test("Workbench shell renders one top-level result per canonical entry", () => {
  const html = renderKpSemanticAnimationWorkbenchShell({
    ...roadmapInput(),
    query: "",
    results: [
      result("animation.radical", "Power to radical"),
      result("animation.tangent", "Tangent graph")
    ],
    selectedAnimationId: "animation.tangent"
  });

  assert.equal(
    html.match(/data-kp-animation-workbench-result=/g)?.length,
    2
  );
  assert.match(html, /aria-pressed="true">[\s\S]*Tangent graph/);
});

function result(
  animationId: string,
  title: string,
  planned = false
): KpSemanticAnimationWorkbenchQueryResult {
  return {
    score: 0,
    matchedValues: [],
    entry: {
      schemaVersion: "kp.semantic-animation-workbench-index-entry.v1",
      identity: {
        schemaVersion: "kp.canonical-animation-identity.v1",
        animationId,
        title,
        aliases: [`alias.${animationId}`],
        familyIds: [],
        provenance: planned
          ? { kind: "approved-plan", sourcePath: "plan.md" }
          : { kind: "catalog", descriptorId: `editor.${animationId}` },
        availability: planned ? "planned" : "concrete"
      },
      summary: `${title} summary`,
      tags: ["algebra", "reviewable"],
      representations: planned
        ? []
        : [
            {
              schemaVersion:
                "kp.animation-representation-relationship.v2",
              id: `relationship.${animationId}`,
              animationId,
              representationId: `representation.${animationId}`,
              kind: "editor",
              label: `${title} editor`,
              playable: true,
              presentationRole: "canonical",
              canonicalRepresentationId: `representation.${animationId}`,
              choreographySource: {
                kind: "catalog-animation",
                sourceId: animationId,
                choreographyId: `choreography.catalog.${animationId}`
              },
              aliases: []
            }
          ],
      promotion: {
        schemaVersion: "kp.artifact-promotion-lineage.v1",
        animationId,
        facet: {
          maturity: planned ? "reviewable" : "gold",
          novelty: "composition",
          humanReviewRequired: false,
          goldCohort: !planned
        },
        evidenceSourceIds: [
          planned
            ? "artifact-promotion.default-reviewable-composition-policy"
            : "review.fixture"
        ]
      },
      lifecycle: {
        schemaVersion: "kp.animation-lifecycle-facets.v1",
        roadmap: "untracked",
        execution: planned ? "not-scheduled" : "complete",
        maturity: planned ? "proposed" : "approved",
        approval: planned ? "unapproved" : "approved",
        review: "unreviewed",
        verification: "unknown",
        playability: planned ? "planned-only" : "playable"
      },
      controlIds: [],
      diagnostics: []
    }
  };
}

function roadmapInput() {
  const rows = [
    {
      id: "workbench",
      order: 1,
      title: "Workbench",
      objective: "Project one roadmap.",
      topic: "Platform",
      horizon: "now" as const,
      state: "active" as const,
      architectureBenefit: "One control plane.",
      rationale: "Make progress legible."
    },
    {
      id: "arithmetic",
      order: 2,
      title: "Arithmetic",
      objective: "Retain arithmetic.",
      topic: "Arithmetic",
      horizon: "later" as const,
      state: "planned" as const,
      architectureBenefit: "Shared quantities.",
      rationale: "Follow architectural pressure."
    }
  ];
  return {
    roadmap: {
      planId: "plan-revision.kp.v6",
      planRevision: 6,
      planTitle: "Roadmap v6",
      objective: "Keep one roadmap authority.",
      rows
    },
    roadmapRows: rows,
    roadmapQuery: {
      sortBy: "canonical" as const,
      direction: "ascending" as const
    },
    roadmapTopics: ["Arithmetic", "Platform"],
    roadmapAnimationLinks: [
      {
        phaseId: "workbench",
        animationId: "animation.radical",
        representationId: "representation.animation.radical"
      }
    ]
  };
}
