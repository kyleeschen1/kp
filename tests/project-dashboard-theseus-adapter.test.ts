import { strict as assert } from "node:assert";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import test from "node:test";

import {
  createKpTheseusDashboardExtensionPayload
} from "../src/project-dashboard/theseus-adapter.ts";

const repoRoot = fileURLToPath(new URL("../", import.meta.url));

test("KP Theseus dashboard extension payload exposes gallery and API rows", () => {
  const payload = createKpTheseusDashboardExtensionPayload();
  const sections = new Map(
    payload.contribution.sections?.map((section) => [section.id, section])
  );
  const galleryRows = sections.get("kp.gallery")?.rows ?? [];
  const apiRows = sections.get("kp.api")?.rows ?? [];

  assert.equal(payload.extension.id, "kp");
  assert.equal(payload.extension.title, "Kinetic Press");
  assert.equal(payload.contribution.health?.[0]?.status, "ok");
  assert.ok(
    galleryRows.some(
      (row) =>
        row.id === "kp.gallery.animation-cancelation" &&
        row.kind === "object" &&
        row.tags?.includes("animation")
    )
  );
  const matrixRow = apiRows.find((row) => row.id === "kp.api.semantic-matrix");

  assert.equal(matrixRow?.kind, "api");
  assert.ok(matrixRow?.tags?.includes("semantic-object"));
  assert.ok(matrixRow?.searchText?.includes("matrix-grid"));
  assert.ok(matrixRow?.searchText?.includes("determinant"));
  assert.ok(
    matrixRow?.preview?.fields.some(
      (field) =>
        field.label === "Protocols" &&
        field.value === "toLatex, evaluate, matrixForm"
    )
  );
  assert.ok(
    matrixRow?.preview?.fields.some(
      (field) =>
        field.label === "Capabilities" &&
        field.value === "render (active), select (active), derive (planned), execute (active)"
    )
  );
  assert.ok(
    matrixRow?.preview?.fields.some(
      (field) =>
        field.label === "Derive descriptors" &&
        field.value === "matrix.linear-map"
    )
  );
  assert.ok(matrixRow?.searchText?.includes("matrix.linear-map"));
  assert.ok(
    matrixRow?.preview?.fields.some(
      (field) =>
        field.label === "Source refs" &&
        field.value.includes("src/editor/api-catalog.ts")
    )
  );
  assert.ok(
    matrixRow?.preview?.fields.some(
      (field) =>
        field.label === "Verification" &&
        field.value.includes("tests/api-catalog.test.ts")
    )
  );

  const graphRow = galleryRows.find(
    (row) => row.id === "kp.gallery.visual-webgl-graph"
  );

  assert.ok(graphRow?.searchText?.includes("src/rendering/graph-transitions.ts"));
  assert.ok(graphRow?.searchText?.includes("Open donut graph sample"));
  assert.ok(
    graphRow?.preview?.fields.some(
      (field) => field.label === "Maturity" && field.value === "active renderer"
    )
  );
  assert.ok(
    graphRow?.preview?.fields.some(
      (field) =>
        field.label === "Sample targets" &&
        field.value.includes("Open donut graph sample")
    )
  );

  const syncedRow = galleryRows.find(
    (row) => row.id === "kp.gallery.sample-synced-equation-graph-linear-solve"
  );

  assert.ok(syncedRow?.searchText?.includes("linear-equation-solve-x"));
  assert.ok(
    syncedRow?.searchText?.includes(
      "layout.sample.linear-solve-synchronized-panel"
    )
  );
  assert.ok(syncedRow?.searchText?.includes("solve-x-shared-clock"));
  assert.ok(
    syncedRow?.preview?.fields.some(
      (field) =>
        field.label === "Sample targets" &&
        field.value.includes("Open synchronized solve sample")
    )
  );

  const tutorialManifestRow = galleryRows.find(
    (row) => row.id === "kp.gallery.tutorial-card-manifest-v0"
  );

  assert.ok(tutorialManifestRow?.searchText?.includes("KpTutorialCardManifest"));
  assert.ok(
    tutorialManifestRow?.searchText?.includes("src/tutorial/card-manifest.ts")
  );
  assert.ok(
    tutorialManifestRow?.preview?.fields.some(
      (field) =>
        field.label === "Verification" &&
        field.value.includes("tests/tutorial-card-manifest.test.ts")
    )
  );
});

test("KP Theseus dashboard extension command writes JSON payload", () => {
  const output = execFileSync(
    process.execPath,
    [
      "--disable-warning=ExperimentalWarning",
      "scripts/project-dashboard-extension.ts"
    ],
    {
      cwd: repoRoot,
      encoding: "utf8"
    }
  );
  const payload = JSON.parse(output) as ReturnType<
    typeof createKpTheseusDashboardExtensionPayload
  >;

  assert.equal(payload.extension.id, "kp");
  assert.ok(
    payload.contribution.sections?.some(
      (section) => section.id === "kp.gallery" && section.rows.length > 0
    )
  );
});
