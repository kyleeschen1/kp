import { strict as assert } from "node:assert";
import test from "node:test";

import { createLinearSolveIframeExportSmokeFixture } from "../src/tutorial/iframe-export-smoke-fixture.ts";

test("linear solve iframe export smoke fixture assembles artifact document", () => {
  const fixture = createLinearSolveIframeExportSmokeFixture(0.5);

  assert.equal(fixture.id, "fixture.linear-solve.iframe-export-smoke");
  assert.equal(fixture.progress, 0.5);
  assert.equal(fixture.artifact.id, "artifact.linear-solve.iframe");
  assert.equal(fixture.artifact.profileId, "export.linear-solve.iframe");
  assert.deepEqual(fixture.artifact.timelineIds, [
    "timeline.linear-solve.shared"
  ]);
  assert.deepEqual(fixture.diagnostics, []);
  assert.ok(fixture.html.startsWith("<!doctype html>"));
  assert.match(
    fixture.html,
    /data-kp-export-artifact="artifact\.linear-solve\.iframe"/
  );
  assert.match(
    fixture.html,
    /data-kp-tutorial-card="tutorial\.linear-solve\.card\.live-sample"/
  );
  assert.match(fixture.html, /data-kp-tutorial-progress="0\.5"/);
  assert.match(fixture.html, /data-kp-export-artifact-json/);
});
