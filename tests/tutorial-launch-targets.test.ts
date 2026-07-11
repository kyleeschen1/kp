import { strict as assert } from "node:assert";
import test from "node:test";

import { projectDashboardData } from "../src/project-dashboard/data.ts";
import {
  findKpTutorialLaunchTarget,
  listKpTutorialLaunchTargets,
  listKpTutorialLaunchTargetsByKind
} from "../src/tutorial/launch-targets.ts";

test("tutorial launch target registry lists browser-smokeable tutorial surfaces", () => {
  const targets = listKpTutorialLaunchTargets();

  assert.deepEqual(
    targets.map((target) => ({
      id: target.id,
      kind: target.kind,
      launchPath: target.launchPath,
      dashboardRowId: target.dashboardRowId,
      sampleId: target.sampleId,
      artifactId: target.artifactId,
      manifestId: target.manifestId,
      payloadKind: target.payloadKind
    })),
    [
      {
        id: "launch.tutorial.linear-solve.live-card",
        kind: "tutorial-card",
        launchPath: "/",
        dashboardRowId: "sample-synced-equation-graph-linear-solve",
        sampleId: "tutorial.linear-solve.card.live-sample",
        artifactId: undefined,
        manifestId: "tutorial.linear-solve.card",
        payloadKind: undefined
      },
      {
        id: "launch.export.linear-solve.iframe",
        kind: "iframe-export-artifact",
        launchPath: "/",
        dashboardRowId: "iframe-export-artifact",
        sampleId: undefined,
        artifactId: "artifact.linear-solve.iframe",
        manifestId: "tutorial.linear-solve.card",
        payloadKind: "html-document"
      },
      {
        id: "launch.export.linear-solve.static-steps",
        kind: "static-step-export-artifact",
        launchPath: "/",
        dashboardRowId: "static-step-export-artifact",
        sampleId: undefined,
        artifactId: "artifact.linear-solve.steps",
        manifestId: "tutorial.linear-solve.card",
        payloadKind: "json-document"
      },
      {
        id: "launch.tutorial.programming.add",
        kind: "programming-tutorial-card",
        launchPath: "/",
        dashboardRowId: "semantic-source-file",
        sampleId: "tutorial.programming.add.card.live-sample",
        artifactId: undefined,
        manifestId: "tutorial.programming.add.card",
        payloadKind: undefined
      }
    ]
  );
});

test("tutorial launch targets carry dashboard selectors and smoke probes", () => {
  const iframeTarget = findKpTutorialLaunchTarget(
    "launch.export.linear-solve.iframe"
  );
  const programmingTarget = findKpTutorialLaunchTarget(
    "launch.tutorial.programming.add"
  );

  assert.ok(iframeTarget);
  assert.deepEqual(iframeTarget.dashboardSelectRowSelector, [
    "[data-kp-select-agenda-row=\"iframe-export-artifact\"]"
  ]);
  assert.deepEqual(iframeTarget.previewSelectors, [
    "[data-kp-preview-link=\"export-artifact\"]",
    "[data-kp-preview-export-artifact=\"artifact.linear-solve.iframe\"]",
    "[data-kp-preview-export-payload=\"html-document\"]"
  ]);

  assert.ok(programmingTarget);
  assert.deepEqual(programmingTarget.smokeSelectors, [
    "[data-kp-tutorial-card=\"tutorial.programming.add.card.live-sample\"]",
    "[data-kp-tutorial-manifest=\"tutorial.programming.add.card\"]",
    "[data-kp-tutorial-source-file=\"source-file.programming.add\"]"
  ]);
});

test("tutorial launch targets resolve to dashboard rows and can filter by kind", () => {
  for (const target of listKpTutorialLaunchTargets()) {
    assert.ok(
      projectDashboardData.gallery.some(
        (item) => item.id === target.dashboardRowId
      ),
      `Expected dashboard row ${target.dashboardRowId}`
    );
  }

  assert.deepEqual(
    listKpTutorialLaunchTargetsByKind("iframe-export-artifact").map(
      (target) => target.id
    ),
    ["launch.export.linear-solve.iframe"]
  );
  assert.equal(
    findKpTutorialLaunchTarget("launch.missing.target"),
    undefined
  );
});
