import assert from "node:assert/strict";
import test from "node:test";

import {
  renderKpSemanticAnimationWorkbenchShell
} from "../src/editor/semantic-animation-workbench-shell.ts";
import type {
  KpSemanticAnimationWorkbenchQueryResult
} from "../src/editor/semantic-animation-workbench-query.ts";

test("Workbench shell renders a labeled search and two-pane control surface", () => {
  const html = renderKpSemanticAnimationWorkbenchShell({
    query: `radical "rewrite"`,
    results: [result("animation.radical", "Power to radical")],
    selectedAnimationId: "animation.radical"
  });

  assert.match(html, /data-kp-animation-workbench/);
  assert.match(html, /data-kp-animation-workbench-query/);
  assert.match(html, /data-kp-animation-workbench-results/);
  assert.match(html, /data-kp-animation-workbench-detail/);
  assert.match(html, /value="radical &quot;rewrite&quot;"/);
  assert.match(html, /data-action="show-editor"/);
  assert.match(html, /data-kp-animation-workbench-result="animation.radical"/);
  assert.match(html, /data-kp-animation-workbench-selection="animation.radical"/);
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
  title: string
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
        provenance: { kind: "catalog", descriptorId: `editor.${animationId}` },
        availability: "concrete"
      },
      summary: `${title} summary`,
      tags: [],
      representations: [],
      lifecycle: {
        schemaVersion: "kp.animation-lifecycle-facets.v1",
        roadmap: "untracked",
        execution: "complete",
        maturity: "approved",
        approval: "approved",
        review: "unreviewed",
        verification: "unknown",
        playability: "playable"
      },
      controlIds: [],
      diagnostics: []
    }
  };
}
