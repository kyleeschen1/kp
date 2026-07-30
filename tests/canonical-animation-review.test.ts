import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("Animation Library is one passive lazy host over existing representations", async () => {
  const [html, source] = await Promise.all([
    readFile("canonical-animation-review.html", "utf8"),
    readFile("src/experiments/canonical-animation-review.ts", "utf8")
  ]);

  assert.match(html, /<h1 id="animation-library-title">Animation Library<\/h1>/);
  assert.match(html, /data-animation-library-search/);
  assert.match(html, /data-animation-library-representations/);
  assert.match(html, /data-animation-library-viewport-shell="wide"/);
  assert.match(html, /fixed <strong>Review<\/strong> control/);
  assert.equal((html.match(/<iframe/g) ?? []).length, 1);
  assert.equal(
    (source.match(/^import /gm) ?? []).length,
    2,
    "the display entry imports metadata and the generic host-status protocol"
  );
  assert.match(source, /animation-library-display-catalog\.ts/);
  assert.match(source, /animation-host-status\.ts/);
  assert.match(source, /animation-library-review-bootstrap\.ts/);
  assert.match(source, /replaceChildren/);
  assert.doesNotMatch(source, /\binnerHTML\b/);
  assert.doesNotMatch(
    source,
    /\b(create|compile|reconcile|render)Kp.*(AnimationAsset|Renderer|Scene)/
  );
});
