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

test("iframe export document serializes dependency and fallback metadata", () => {
  const sample = createLinearSolveTutorialCardSample();
  const artifact = resolveKpTutorialCardIframeExportArtifact(
    createLinearSolveTutorialCardManifest()
  );
  const html = renderKpTutorialCardIframeDocument({
    artifact,
    title: "Solve x + 3 = 7",
    bodyHtml: renderKpTutorialCardHtmlShell(sample, sample.sample(0))
  });

  const match = html.match(
    /<script type="application\/json" data-kp-export-artifact-json>([\s\S]*?)<\/script>/
  );

  assert.ok(match);
  assert.deepEqual(JSON.parse(match[1] ?? ""), {
    id: "artifact.linear-solve.iframe",
    manifestId: "tutorial.linear-solve.card",
    profileId: "export.linear-solve.iframe",
    exportKind: "iframe",
    target: "browser",
    artifactKind: "iframe-document",
    payloadKind: "html-document",
    status: "metadata",
    timelineIds: ["timeline.linear-solve.shared"],
    dependencies: {
      phases: ["critical", "interactive"],
      capabilityKeys: [
        "kp.semantic:document.read:*:*",
        "kp.layout:sample.synchronized-panel:*:*",
        "kp.equation:render.katex:equation:*",
        "kp.graph:render.webgl:graph-3d:surface.mesh"
      ],
      assetIds: []
    },
    fallback: {
      strategy: "static-snapshot",
      preservesLayout: true,
      message:
        "Show static equation and graph snapshots when the interactive runtime is unavailable."
    },
    metadata: {
      responsive: true,
      requiresControls: true,
      fallbackStrategy: "static-snapshot",
      resolver: "iframe-export-profile"
    }
  });
});
