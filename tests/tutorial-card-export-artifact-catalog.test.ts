import { strict as assert } from "node:assert";
import test from "node:test";

import { findApiCatalogItem } from "../src/editor/api-catalog.ts";
import { projectDashboardData } from "../src/project-dashboard/data.ts";
import {
  findKpTutorialExportArtifactCatalogEntry,
  listKpTutorialExportArtifactCatalogEntries
} from "../src/tutorial/export-artifact-catalog.ts";

test("tutorial export artifact catalog exposes iframe and static-step rows", () => {
  const entries = listKpTutorialExportArtifactCatalogEntries();

  assert.deepEqual(
    entries.map((entry) => ({
      id: entry.id,
      title: entry.title,
      dashboardRowId: entry.dashboardRowId,
      apiItemId: entry.apiItemId,
      status: entry.artifact.status,
      payloadKind: entry.artifact.payloadKind,
      checkpointCount: entry.checkpointCount,
      sampleProgresses: entry.sampleProgresses
    })),
    [
      {
        id: "artifact.linear-solve.iframe",
        title: "Iframe export artifact",
        dashboardRowId: "iframe-export-artifact",
        apiItemId: "embed-iframe-export-artifact",
        status: "metadata",
        payloadKind: "html-document",
        checkpointCount: undefined,
        sampleProgresses: undefined
      },
      {
        id: "artifact.linear-solve.steps",
        title: "Static-step export artifact",
        dashboardRowId: "static-step-export-artifact",
        apiItemId: "embed-static-step-export-artifact",
        status: "renderable",
        payloadKind: "json-document",
        checkpointCount: 4,
        sampleProgresses: [0, 1 / 3, 2 / 3, 1]
      }
    ]
  );
});

test("tutorial export artifact catalog rows resolve dashboard and API records", () => {
  for (const entry of listKpTutorialExportArtifactCatalogEntries()) {
    assert.ok(
      projectDashboardData.gallery.some((item) => item.id === entry.dashboardRowId),
      `Expected dashboard row ${entry.dashboardRowId}`
    );
    assert.ok(
      findApiCatalogItem(entry.apiItemId),
      `Expected API item ${entry.apiItemId}`
    );
  }
});

test("tutorial export artifact catalog lookup returns source-backed metadata", () => {
  const entry = findKpTutorialExportArtifactCatalogEntry(
    "artifact.linear-solve.steps"
  );

  assert.ok(entry);
  assert.equal(entry.artifact.profileId, "export.linear-solve.steps");
  assert.deepEqual(entry.sourceRefs.map((sourceRef) => sourceRef.href), [
    "src/tutorial/export-artifact.ts",
    "src/tutorial/static-step-checkpoints.ts",
    "src/tutorial/static-step-sequence-renderer.ts"
  ]);
  assert.deepEqual(entry.verification, [
    "tests/tutorial-card-export-artifact.test.ts",
    "tests/tutorial-card-static-step-artifact.test.ts"
  ]);
});
