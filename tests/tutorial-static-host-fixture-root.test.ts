import { strict as assert } from "node:assert";
import test from "node:test";

import {
  createLinearSolveStaticHostFixtureRoot,
  findKpStaticHostFixtureEntry
} from "../src/tutorial/static-host-fixture-root.ts";

test("linear solve static-host fixture root exposes relative artifact entries", () => {
  const root = createLinearSolveStaticHostFixtureRoot({ iframeProgress: 0.5 });

  assert.equal(root.id, "fixture.linear-solve.static-host-root");
  assert.deepEqual(
    root.entries.map((entry) => [
      entry.path,
      entry.artifactId,
      entry.artifactKind,
      entry.contentType
    ]),
    [
      [
        "linear-solve/iframe/index.html",
        "artifact.linear-solve.iframe",
        "iframe-document",
        "text/html"
      ],
      [
        "linear-solve/static-steps/index.html",
        "artifact.linear-solve.steps",
        "static-step-sequence",
        "text/html"
      ]
    ]
  );
  assert.deepEqual(root.readinessDiagnostics, []);
  assert.equal(root.entries.some((entry) => entry.path.startsWith("/")), false);
  assert.equal(
    root.entries.some((entry) => /^https?:\/\//u.test(entry.path)),
    false
  );
});

test("static-host fixture entries can be looked up by relative path", () => {
  const root = createLinearSolveStaticHostFixtureRoot({ iframeProgress: 0.5 });
  const iframeEntry = findKpStaticHostFixtureEntry(
    root,
    "linear-solve/iframe/index.html"
  );
  const stepEntry = findKpStaticHostFixtureEntry(
    root,
    "linear-solve/static-steps/index.html"
  );

  assert.equal(iframeEntry?.artifactId, "artifact.linear-solve.iframe");
  assert.match(iframeEntry?.content ?? "", /data-kp-export-artifact-json/);
  assert.equal(stepEntry?.artifactId, "artifact.linear-solve.steps");
  assert.match(stepEntry?.content ?? "", /data-kp-static-step-sequence-json/);
  assert.equal(
    findKpStaticHostFixtureEntry(root, "/linear-solve/iframe/index.html"),
    undefined
  );
});
