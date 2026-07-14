import { strict as assert } from "node:assert";
import test from "node:test";

import {
  apiCatalogGroups,
  apiCatalogItemDetailFields,
  apiCatalogItemSearchFields,
  findApiCatalogItem
} from "../src/editor/api-catalog.ts";

test("API catalog exposes typed metadata for semantic objects", () => {
  const expression = findApiCatalogItem("semantic-expression");
  const matrix = findApiCatalogItem("semantic-matrix");
  const sourceFile = findApiCatalogItem("semantic-source-file");

  assert.equal(expression?.group.id, "semantic-objects");
  assert.deepEqual(expression?.item.details?.protocols, [
    "toLatex",
    "evaluate",
    "differentiate",
    "graphForm",
    "numericSample"
  ]);
  assert.ok(expression?.item.details?.computes?.includes("derivative"));

  assert.equal(matrix?.group.id, "semantic-objects");
  assert.equal(matrix?.group.category, "semantic-object");
  assert.deepEqual(matrix?.item.details?.protocols, [
    "toLatex",
    "evaluate",
    "matrixForm"
  ]);
  assert.deepEqual(matrix?.item.details?.views, [
    "latex",
    "matrix-grid",
    "linear-map"
  ]);
  assert.deepEqual(matrix?.item.details?.lenses, [
    "rows",
    "columns",
    "entries"
  ]);
  assert.deepEqual(matrix?.item.details?.computes, ["shape", "determinant"]);

  assert.equal(sourceFile?.group.id, "semantic-objects");
  assert.equal(sourceFile?.item.status, "active");
  assert.deepEqual(sourceFile?.item.details?.protocols, ["select", "validate"]);
  assert.deepEqual(sourceFile?.item.details?.views, [
    "code",
    "source-range overlay",
    "inspector"
  ]);
  assert.deepEqual(sourceFile?.item.details?.lenses, [
    "lines",
    "source ranges",
    "language",
    "revision"
  ]);
});

test("API catalog exposes typed metadata for semantic transformations", () => {
  const jacobian = findApiCatalogItem("transform-compute-jacobian");

  assert.equal(jacobian?.group.category, "semantic-transformation");
  assert.deepEqual(jacobian?.item.details?.inputs, ["Function"]);
  assert.deepEqual(jacobian?.item.details?.outputs, [
    "Matrix",
    "LinearMap"
  ]);
  assert.deepEqual(jacobian?.item.details?.preserves, [
    "domain point",
    "local derivative provenance"
  ]);
  assert.ok(
    jacobian?.item.details?.visualMotifs?.includes(
      "jacobian-local-linearization"
    )
  );
});

test("API catalog covers notation and layout entities with the same metadata protocol", () => {
  const radical = findApiCatalogItem("notation-radical-to-exponent");
  const synchronizedPanel = findApiCatalogItem("layout-synchronized-panel");
  const runtimeFrame = findApiCatalogItem("capability-animation-runtime-frame");
  const externalAnimationPort = findApiCatalogItem(
    "capability-external-animation-port"
  );

  assert.equal(radical?.group.category, "notation-transformation");
  assert.deepEqual(radical?.item.details?.preserves, [
    "semantic object identity"
  ]);
  assert.ok(
    radical?.item.details?.visualMotifs?.includes("radical-fold-bundle-swap")
  );

  assert.equal(synchronizedPanel?.group.category, "layout");
  assert.deepEqual(synchronizedPanel?.item.details?.protocols, [
    "render",
    "animate"
  ]);
  assert.deepEqual(synchronizedPanel?.item.details?.views, [
    "equation-panel",
    "graph-panel",
    "code-panel"
  ]);
  assert.deepEqual(synchronizedPanel?.item.details?.preserves, [
    "shared playhead",
    "selected semantic object"
  ]);

  assert.equal(runtimeFrame?.group.id, "capabilities-representations");
  assert.equal(runtimeFrame?.item.status, "active");
  assert.deepEqual(runtimeFrame?.item.details?.protocols, [
    "sampleKpAnimationRuntimeFrame",
    "createKpAnimationRuntimeScrubberControl",
    "sampleKpAnimationRuntimeFrameFromScrubber"
  ]);
  assert.deepEqual(runtimeFrame?.item.details?.outputs, [
    "clock",
    "phase",
    "selector frames",
    "active render targets",
    "child frames",
    "diagnostics",
    "frame descriptor"
  ]);

  assert.equal(externalAnimationPort?.group.id, "capabilities-representations");
  assert.equal(externalAnimationPort?.item.status, "active");
  assert.deepEqual(externalAnimationPort?.item.details?.protocols, [
    "createKpExternalAnimationPort",
    "runKpExternalAnimationPort",
    "summarizeKpExternalAnimationPortDiagnostics",
    "checkKpExternalAnimationPortLossDiagnostics",
    "createProgrammingTraceExternalAnimationPort",
    "createAdditionProgramTraceExternalAnimationPort"
  ]);
  assert.deepEqual(externalAnimationPort?.item.details?.outputs, [
    "AnimationAsset",
    "port diagnostics",
    "animation validation diagnostics",
    "diagnostic summary",
    "loss reporting law"
  ]);
});

test("API catalog exposes the complete layout object vocabulary", () => {
  const layoutGroup = apiCatalogGroups.find(
    (group) => group.id === "layout-objects"
  );
  const split = findApiCatalogItem("layout-split");
  const overlay = findApiCatalogItem("layout-overlay");
  const pinnedStage = findApiCatalogItem("layout-pinned-stage");

  assert.deepEqual(
    layoutGroup?.items.map((item) => item.id),
    [
      "layout-row",
      "layout-column",
      "layout-stack",
      "layout-grid",
      "layout-split",
      "layout-tabs",
      "layout-overlay",
      "layout-scroll-sequence",
      "layout-pinned-stage",
      "layout-synchronized-panel"
    ]
  );
  assert.deepEqual(split?.item.details?.lenses, [
    "primary pane",
    "secondary pane",
    "resizer"
  ]);
  assert.deepEqual(overlay?.item.details?.preserves, [
    "base view identity",
    "overlay selector targets"
  ]);
  assert.deepEqual(pinnedStage?.item.details?.protocols, [
    "render",
    "animate",
    "pin"
  ]);
});

test("API catalog exposes active tutorial card manifest API", () => {
  const kpCard = findApiCatalogItem("embed-kp-card");
  const staticStepArtifact = findApiCatalogItem(
    "embed-static-step-export-artifact"
  );
  const dependencyManifest = findApiCatalogItem("embed-dependency-manifest");

  assert.equal(kpCard?.group.category, "embed");
  assert.equal(kpCard?.item.status, "active");
  assert.deepEqual(kpCard?.item.details?.protocols, [
    "manifest",
    "validate",
    "export"
  ]);
  assert.deepEqual(kpCard?.item.details?.views, [
    "interactive-card",
    "iframe",
    "gif",
    "step-sequence"
  ]);
  assert.deepEqual(kpCard?.item.details?.preserves, [
    "semantic object identity",
    "shared timeline identity",
    "layout composition"
  ]);
  assert.equal(staticStepArtifact?.item.status, "active");
  assert.deepEqual(staticStepArtifact?.item.details?.protocols, [
    "selectKpTutorialStaticStepCheckpoints",
    "renderKpTutorialCardStaticStepSequence"
  ]);
  assert.deepEqual(staticStepArtifact?.item.details?.outputs, [
    "json-document",
    "checkpoint frames"
  ]);
  assert.equal(dependencyManifest?.item.status, "planned");
});

test("API catalog exposes browser hardening artifacts and samples", () => {
  const iframeAssetManifest = findApiCatalogItem("embed-iframe-asset-manifest");
  const hostedReadiness = findApiCatalogItem("embed-hosted-artifact-readiness");
  const staticHostRoot = findApiCatalogItem("embed-static-host-fixture-root");
  const iframePathClosure = findApiCatalogItem(
    "embed-iframe-static-asset-path-closure"
  );
  const executionTraceCard = findApiCatalogItem(
    "embed-programming-execution-trace-card"
  );
  const comparisonShell = findApiCatalogItem(
    "embed-synchronized-comparison-card"
  );

  assert.equal(iframeAssetManifest?.group.category, "embed");
  assert.equal(iframeAssetManifest?.item.status, "active");
  assert.deepEqual(iframeAssetManifest?.item.details?.protocols, [
    "createKpIframeExportAssetManifest"
  ]);
  assert.deepEqual(iframeAssetManifest?.item.details?.outputs, [
    "dependency phases",
    "capability keys",
    "asset ids",
    "embed policy"
  ]);
  assert.equal(hostedReadiness?.item.status, "active");
  assert.deepEqual(hostedReadiness?.item.details?.protocols, [
    "validateKpTutorialHostedArtifactReadiness"
  ]);
  assert.equal(staticHostRoot?.item.status, "active");
  assert.deepEqual(staticHostRoot?.item.details?.protocols, [
    "createLinearSolveStaticHostFixtureRoot",
    "findKpStaticHostFixtureEntry"
  ]);
  assert.equal(iframePathClosure?.item.status, "active");
  assert.deepEqual(iframePathClosure?.item.details?.protocols, [
    "createKpIframeStaticAssetPathClosure"
  ]);

  assert.equal(executionTraceCard?.item.status, "active");
  assert.deepEqual(executionTraceCard?.item.details?.views, [
    "source-file panel",
    "execution-trace panel"
  ]);
  assert.ok(
    executionTraceCard?.item.details?.protocols?.includes(
      "createAdditionProgrammingExecutionTraceTutorialCardSample"
    )
  );

  assert.equal(comparisonShell?.item.status, "active");
  assert.deepEqual(comparisonShell?.item.details?.preserves, [
    "shared progress value",
    "child card identity"
  ]);
});

test("API catalog exposes frame sequence export preview API", () => {
  const frameSequencePreview = findApiCatalogItem(
    "embed-frame-sequence-export-preview"
  );

  assert.equal(frameSequencePreview?.group.category, "embed");
  assert.equal(frameSequencePreview?.item.status, "active");
  assert.deepEqual(frameSequencePreview?.item.details?.protocols, [
    "createKpTutorialParentTimelineFrameExportContract",
    "sampleKpTutorialEquationFramesForExport",
    "sampleKpTutorialGraphFramesForExport",
    "sampleKpTutorialProgrammingFramesForExport",
    "createKpTutorialFrameSequenceArtifact",
    "renderKpTutorialFrameSequencePreviewHtml"
  ]);
  assert.deepEqual(frameSequencePreview?.item.details?.outputs, [
    "frame-sequence artifact",
    "json-document preview",
    "rewind frame ids"
  ]);
});

test("API catalog detail helpers normalize preview and search fields", () => {
  const matrix = findApiCatalogItem("semantic-matrix");
  assert.ok(matrix);

  const fields = apiCatalogItemDetailFields(matrix.group, matrix.item);
  const searchFields = apiCatalogItemSearchFields(matrix.group, matrix.item);

  assert.deepEqual(
    fields.map((field) => field.label),
    [
      "API group",
      "API category",
      "API id",
      "API kind",
      "API status",
      "Protocols",
      "Views",
      "Lenses",
      "Computes"
    ]
  );
  assert.ok(searchFields.includes("matrix-grid"));
  assert.ok(searchFields.includes("determinant"));
  assert.ok(searchFields.includes("semantic-object"));
});
