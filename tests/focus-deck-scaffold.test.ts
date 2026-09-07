import assert from "node:assert/strict";
import test from "node:test";

import { renderKpFocusDeckScaffold } from
  "../src/tutorial/focus-deck-scaffold.ts";

const beats = Object.freeze([
  Object.freeze({ slug: "identify", title: "Identify", html: "<p>Look.</p>" }),
  Object.freeze({ slug: "transform", title: "Transform", html: "<p>Change.</p>" })
]);

test("shared Focus Deck scaffold supplies one projection shell to unlike callers", () => {
  const graph = renderKpFocusDeckScaffold({
    id: "focus-deck.test.graph",
    ariaLabel: "Graph deck",
    activeBeatSlug: "identify",
    stageHtml: '<figure data-stage-kind="graph"></figure>',
    beats,
    rootAttributes: { "data-domain": "economics" }
  });
  const equation = renderKpFocusDeckScaffold({
    id: "focus-deck.test.equation",
    ariaLabel: "Equation deck",
    activeBeatSlug: "transform",
    stageHtml: '<figure data-stage-kind="equation"></figure>',
    beats
  });
  const graph3d = renderKpFocusDeckScaffold({
    id: "focus-deck.test.graph-3d",
    ariaLabel: "3D graph deck",
    activeBeatSlug: "identify",
    stageHtml: '<figure data-stage-kind="graph-3d"></figure>',
    beats
  });

  for (const html of [graph, equation, graph3d]) {
    assert.match(html, /data-kp-focus-deck(?:\s|>)/u);
    assert.match(html, /class="kp-focus-deck__card/u);
    assert.match(html, /data-kp-focus-deck-viewport/u);
    assert.match(html, /data-kp-focus-deck-scrubber/u);
    assert.match(html, /data-kp-focus-deck-previous/u);
    assert.match(html, /data-kp-focus-deck-next/u);
    assert.match(html, /data-kp-focus-deck-position/u);
    assert.equal((html.match(/data-kp-focus-deck-beat=/gu) ?? []).length, 2);
  }
  assert.match(graph, /data-stage-kind="graph"/u);
  assert.match(equation, /data-stage-kind="equation"/u);
  assert.match(graph3d, /data-stage-kind="graph-3d"/u);
  assert.match(graph, /data-kp-focus-deck-active-beat="identify"/u);
  assert.match(equation, /data-kp-focus-deck-active-beat="transform"/u);
});

test("shared Focus Deck scaffold rejects missing semantic endpoints", () => {
  assert.throws(() => renderKpFocusDeckScaffold({
    id: "focus-deck.test.empty",
    ariaLabel: "Empty deck",
    activeBeatSlug: "missing",
    stageHtml: "<figure></figure>",
    beats: []
  }), /requires at least one beat/u);
  assert.throws(() => renderKpFocusDeckScaffold({
    id: "focus-deck.test.unknown",
    ariaLabel: "Unknown beat deck",
    activeBeatSlug: "missing",
    stageHtml: "<figure></figure>",
    beats
  }), /has no beat missing/u);
});
