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
    query: `radical "rewrite"`,
    results: [result("animation.radical", "Power to radical")],
    selectedAnimationId: "animation.radical",
    selectedDescriptor: {
      ...createKpEditorAnimationLibrary()[0]!,
      animationId: "animation.radical"
    }
  });

  assert.match(html, /data-kp-animation-workbench/);
  assert.match(html, /data-kp-animation-workbench-query/);
  assert.match(html, /data-kp-animation-workbench-results/);
  assert.match(html, /data-kp-animation-workbench-detail/);
  assert.match(html, /value="radical &quot;rewrite&quot;"/);
  assert.match(html, /data-action="show-editor"/);
  assert.match(html, /data-kp-animation-workbench-result="animation.radical"/);
  assert.match(html, /data-kp-animation-workbench-selection="animation.radical"/);
  assert.match(html, /data-kp-animation-workbench-live-preview/);
  assert.match(html, /data-kp-editor-animation-player/);
});

test("Workbench shell never mounts a player for planned items", () => {
  const planned = result(
    "animation.algebra.quadratic.solution-branching",
    "Quadratic solution branching",
    true
  );
  const html = renderKpSemanticAnimationWorkbenchShell({
    query: "quadratic",
    results: [planned],
    selectedAnimationId: planned.entry.identity.animationId
  });

  assert.match(html, /data-kp-animation-workbench-planned-preview/);
  assert.doesNotMatch(html, /data-kp-editor-animation-player/);
});

test("Workbench shell renders one top-level result per canonical entry", () => {
  const html = renderKpSemanticAnimationWorkbenchShell({
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
      tags: [],
      representations: [],
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
