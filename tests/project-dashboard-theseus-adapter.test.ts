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
  const capabilityPackageRows =
    sections.get("kp.capability-packages")?.rows ?? [];

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

  const frameSequenceRow = apiRows.find(
    (row) => row.id === "kp.api.embed-frame-sequence-export-preview"
  );

  assert.ok(
    frameSequenceRow?.searchText?.includes("kp.export:encode.gif:*:*")
  );
  assert.ok(
    frameSequenceRow?.preview?.fields.some(
      (field) =>
        field.label === "Export capabilities" &&
        field.value.includes("kp.export:encode.gif:*:* (optional, ready)")
    )
  );
  assert.ok(
    frameSequenceRow?.preview?.fields.some(
      (field) => field.label === "Hosted readiness" && field.value === "ready"
    )
  );

  const graphPackageRow = capabilityPackageRows.find(
    (row) =>
      row.id === "kp.capability-package.package.kp.graph3d.render.webgl.surface-mesh"
  );

  assert.equal(graphPackageRow?.kind, "capability-package");
  assert.ok(graphPackageRow?.tags?.includes("webgl"));
  assert.ok(
    graphPackageRow?.searchText?.includes(
      "kp.graph:render.webgl:graph-3d:surface.mesh"
    )
  );
  assert.ok(
    graphPackageRow?.preview?.fields.some(
      (field) =>
        field.label === "Capability key" &&
        field.value === "kp.graph:render.webgl:graph-3d:surface.mesh"
    )
  );
  assert.ok(
    graphPackageRow?.preview?.fields.some(
      (field) =>
        field.label === "Package coordinates" &&
        field.value === "kp.graph / render.webgl / graph-3d / surface.mesh"
    )
  );

  const sourceTracePackageRow = capabilityPackageRows.find(
    (row) =>
      row.id === "kp.capability-package.package.kp.source-file.animate.execution-trace"
  );

  assert.equal(sourceTracePackageRow?.kind, "capability-package");
  assert.ok(sourceTracePackageRow?.tags?.includes("programming"));
  assert.ok(
    sourceTracePackageRow?.searchText?.includes(
      "kp.source-file:animate.execution-trace:source-file:trace"
    )
  );
  assert.ok(
    sourceTracePackageRow?.preview?.fields.some(
      (field) =>
        field.label === "Package coordinates" &&
        field.value ===
          "kp.source-file / animate.execution-trace / source-file / trace"
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
  assert.ok(
    tutorialManifestRow?.preview?.fields.some(
      (field) =>
        field.label === "Theseus refs" &&
        field.value.includes("next.kp.tutorial-card-manifest-v0")
    )
  );
  assert.ok(
    tutorialManifestRow?.searchText?.includes(
      "decision.kp.semantic-animation-runtime-roadmap"
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
