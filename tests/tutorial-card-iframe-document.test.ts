import { strict as assert } from "node:assert";
import test from "node:test";

import { renderKpTutorialCardHtmlShell } from "../src/tutorial/card-html-shell.ts";
import { createLinearSolveTutorialCardManifest } from "../src/tutorial/card-manifest.ts";
import { renderKpTutorialCardIframeDocument } from "../src/tutorial/iframe-export-document.ts";
import { resolveKpTutorialCardIframeExportArtifact } from "../src/tutorial/export-artifact-resolver.ts";
import { createLinearSolveTutorialCardSample } from "../src/tutorial/linear-solve-card-sample.ts";

test("iframe export document wraps the tutorial card shell with artifact metadata", () => {
  const sample = createLinearSolveTutorialCardSample();
  const artifact = resolveKpTutorialCardIframeExportArtifact(
    createLinearSolveTutorialCardManifest()
  );
  const bodyHtml = renderKpTutorialCardHtmlShell(sample, sample.sample(0.25));

  const html = renderKpTutorialCardIframeDocument({
    artifact,
    title: "Solve x < 3 & embed",
    bodyHtml
  });

  assert.ok(html.startsWith("<!doctype html>"));
  assert.match(
    html,
    /<html lang="en" data-kp-export-artifact="artifact\.linear-solve\.iframe"/
  );
  assert.match(html, /data-kp-export-profile="export\.linear-solve\.iframe"/);
  assert.match(html, /data-kp-export-kind="iframe"/);
  assert.match(html, /data-kp-export-target="browser"/);
  assert.match(html, /data-kp-export-status="metadata"/);
  assert.match(html, /<meta charset="utf-8" \/>/);
  assert.match(
    html,
    /<meta name="viewport" content="width=device-width, initial-scale=1" \/>/
  );
  assert.match(html, /<title>Solve x &lt; 3 &amp; embed<\/title>/);
  assert.match(html, /<body data-kp-export-payload="html-document">/);
  assert.match(
    html,
    /data-kp-tutorial-card="tutorial\.linear-solve\.card\.live-sample"/
  );
  assert.match(html, /data-kp-tutorial-progress="0\.25"/);
});
