import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("review gallery is a passive controller over existing surfaces", async () => {
  const [html, source] = await Promise.all([
    readFile("canonical-animation-review.html", "utf8"),
    readFile("src/experiments/canonical-animation-review.ts", "utf8")
  ]);

  assert.match(html, /data-review-artifact="fraction-split"/);
  assert.match(html, /data-review-artifact="fraction-merge"/);
  assert.match(html, /data-review-artifact="cohort"/);
  assert.match(html, /aria-label="Authority diagnostics"/);
  assert.match(html, /data-review-projections/);
  assert.match(html, /title="Canonical fraction split animation"/);
  assert.match(
    source,
    /governed-canonical-construction-projections\.ts/
  );
  assert.equal((source.match(/^import /gm) ?? []).length, 1);
  assert.doesNotMatch(
    source,
    /\b(create|compile|reconcile|render)Kp|renderer-session|innerHTML/
  );
  assert.match(source, /projectKpGovernedCanonicalConstructionCohort/);
  assert.match(source, /slider\.dispatchEvent\(new Event\("input"/);
  assert.match(source, /button\.click\(\)/);
});
