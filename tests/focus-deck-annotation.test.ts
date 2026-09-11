import assert from "node:assert/strict";
import test from "node:test";
import { renderKpFocusDeckAnnotation } from "../src/tutorial/focus-deck-annotation.ts";

test("annotations default to shared roles and escape plain-language content", () => {
  const html = renderKpFocusDeckAnnotation({ entityId: 'entity."<x>', text: "Across < 3", detail: "Adds & retains" });
  assert.match(html, /data-kp-focus-deck-type="label"/u);
  assert.match(html, /data-kp-focus-deck-type="support"/u);
  assert.match(html, /entity\.&quot;&lt;x&gt;/u);
  assert.match(html, /Across &lt; 3/u);
  assert.match(html, /Adds &amp; retains/u);
  assert.doesNotMatch(html, /style=|font-|<svg|<text/u);
  for (const role of ["label", "support", "meta"] as const) {
    assert.match(renderKpFocusDeckAnnotation({ entityId: "entity.x", text: "X", role }), new RegExp(`data-kp-focus-deck-type="${role}"`, "u"));
  }
});

test("annotation boundary rejects missing meaning and excludes physical typography", () => {
  assert.throws(() => renderKpFocusDeckAnnotation({ entityId: "", text: "X" }), /require an entity/u);
  assert.throws(() => renderKpFocusDeckAnnotation({ entityId: "entity.x", text: " " }), /readable text/u);
  assert.throws(() => renderKpFocusDeckAnnotation({ entityId: "entity.x", text: "X",
    // @ts-expect-error Physical size is not an instructional text role.
    role: "large"
  }), /Unknown Focus Deck text role/u);
  const html = renderKpFocusDeckAnnotation({ entityId: "entity.x", text: "X",
    // @ts-expect-error The renderer uses shared policy, not caller font overrides.
    fontSize: 8
  });
  assert.doesNotMatch(html, /fontSize|style=/u);
});
