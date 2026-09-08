import assert from "node:assert/strict";
import test from "node:test";

import { renderKpFocusDeckScaffold, readKpFocusDeckScrubberKeyTarget } from
  "../src/tutorial/focus-deck-scaffold.ts";

const beats = Object.freeze([
  Object.freeze({ slug: "identify", title: "Identify", html: "<p>Look.</p>" }),
  Object.freeze({ slug: "transform", title: "Transform", html: "<p>Change.</p>" })
]);

test("shared arrow keys cannot skip a boundary after fractional scrubbing", () => {
  const event = { key: "ArrowRight", defaultPrevented: false, altKey: false, ctrlKey: false, metaKey: false };
  for (let count = 2; count <= 15; count++) {
    for (let interval = 0; interval < count - 1; interval++) {
      for (const fraction of [.01, .2, .49, .51, .7, .99]) {
        const position = interval + fraction;
        for (const key of ["ArrowRight", "ArrowUp"])
          assert.equal(readKpFocusDeckScrubberKeyTarget({ ...event, key }, position, count), interval + 1);
        for (const key of ["ArrowLeft", "ArrowDown"])
          assert.equal(readKpFocusDeckScrubberKeyTarget({ ...event, key }, position, count), interval);
      }
    }
  }
});

test("shared slider keys select bounded semantic steps without taking modified keys", () => {
  const event = { key: "ArrowRight", defaultPrevented: false, altKey: false, ctrlKey: false, metaKey: false };
  for (const key of ["ArrowRight", "ArrowUp"]) {
    assert.equal(readKpFocusDeckScrubberKeyTarget({ ...event, key }, 1, 4), 2);
    assert.equal(readKpFocusDeckScrubberKeyTarget({ ...event, key }, 3, 4), 3);
  }
  for (const key of ["ArrowLeft", "ArrowDown"]) {
    assert.equal(readKpFocusDeckScrubberKeyTarget({ ...event, key }, 1, 4), 0);
    assert.equal(readKpFocusDeckScrubberKeyTarget({ ...event, key }, 0, 4), 0);
  }
  assert.equal(readKpFocusDeckScrubberKeyTarget({ ...event, key: "Home" }, 2, 4), 0);
  assert.equal(readKpFocusDeckScrubberKeyTarget({ ...event, key: "End" }, 0, 4), 3);
  assert.equal(readKpFocusDeckScrubberKeyTarget(event, 1.25, 4), 2);
  assert.equal(readKpFocusDeckScrubberKeyTarget({ ...event, key: "Tab" }, 1, 4), undefined);
  for (const flag of ["defaultPrevented", "altKey", "ctrlKey", "metaKey"] as const) {
    assert.equal(readKpFocusDeckScrubberKeyTarget({ ...event, [flag]: true }, 1, 4), undefined);
  }
});

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
