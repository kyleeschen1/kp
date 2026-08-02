import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  assertKpSelectedApplicationCapabilitySignals,
  assertKpSelectedMathCapabilitySignals,
  assertKpSelectedOptionalCapabilitySignals,
  createKpCapabilityAssetOwnershipIndex,
  createKpCapabilityRouteMatrix,
  type KpCapabilityRouteAttribution
} from "../scripts/animation-capability-attribution.ts";

const catalogueRouteIds = [
  "equation-solve-x",
  "graph-svg-vector",
  "graph-svg-economics",
  "exact-quantity",
  "graph-webgl-3d",
  "programming-trace"
] as const;

test("catalogue routes own their narrow application closure", () => {
  assert.doesNotThrow(() => assertKpSelectedApplicationCapabilitySignals({
    svelteCatalogueRoutes: catalogueRouteIds,
    imperativeCatalogueRoutes: [],
    legacyMainRoutes: [],
    animationPlayerGestaltRoutes: []
  }));
  assert.throws(() => assertKpSelectedApplicationCapabilitySignals({
    svelteCatalogueRoutes: catalogueRouteIds,
    imperativeCatalogueRoutes: [],
    legacyMainRoutes: ["graph-svg-economics"],
    animationPlayerGestaltRoutes: []
  }), /legacy main application capability routes changed/);
  assert.throws(() => assertKpSelectedApplicationCapabilitySignals({
    svelteCatalogueRoutes: catalogueRouteIds,
    imperativeCatalogueRoutes: ["graph-svg-economics"],
    legacyMainRoutes: [],
    animationPlayerGestaltRoutes: []
  }), /imperative catalogue application capability routes changed/);
});

test("selected math capability signal ratchet rejects unrelated routes", () => {
  assert.doesNotThrow(() => assertKpSelectedMathCapabilitySignals({
    equationSurfaceRoutes: ["equation-solve-x"],
    katexScriptRoutes: [
      "equation-solve-x",
      "graph-svg-vector",
      "graph-svg-economics",
      "exact-quantity"
    ],
    katexStyleRoutes: [
      "equation-solve-x",
      "graph-svg-vector",
      "graph-svg-economics"
    ]
  }));
  assert.throws(() => assertKpSelectedMathCapabilitySignals({
    equationSurfaceRoutes: ["equation-solve-x", "programming-trace"],
    katexScriptRoutes: [],
    katexStyleRoutes: []
  }), /equation surface capability routes changed/);
});

test("optional capability signal ratchet keeps each runtime caller-led", () => {
  assert.doesNotThrow(() => assertKpSelectedOptionalCapabilitySignals({
    graph3DSurfaceRoutes: ["graph-webgl-3d"],
    graphSvgSurfaceRoutes: [
      "equation-solve-x",
      "graph-svg-vector",
      "graph-svg-economics"
    ],
    graphWebglShellRoutes: ["graph-webgl-3d"],
    graphWebglThreeRoutes: ["graph-webgl-3d"],
    programmingAdapterRoutes: ["programming-trace"],
    apiCatalogRoutes: [],
    animationDiagnosticsRoutes: [],
    codeHighlightRoutes: []
  }));
  assert.throws(() => assertKpSelectedOptionalCapabilitySignals({
    graph3DSurfaceRoutes: [],
    graphSvgSurfaceRoutes: [],
    graphWebglShellRoutes: [],
    graphWebglThreeRoutes: ["graph-webgl-3d", "programming-trace"],
    programmingAdapterRoutes: [],
    apiCatalogRoutes: ["programming-trace"],
    animationDiagnosticsRoutes: [],
    codeHighlightRoutes: []
  }), /Graph3D surface capability routes changed/);
});

test("capability ownership maps emitted files, styles, and assets to source owners", () => {
  const index = createKpCapabilityAssetOwnershipIndex({
    "src/main.ts": {
      file: "assets/main.js",
      name: "main",
      src: "src/main.ts",
      css: ["assets/main.css"],
      assets: ["assets/math.woff2"]
    },
    "src/feature.ts": {
      file: "assets/feature.js",
      name: "feature",
      src: "src/feature.ts",
      css: ["assets/main.css"]
    }
  });

  assert.deepEqual(index.get("assets/main.js"), [
    { key: "src/main.ts", name: "src/main.ts" }
  ]);
  assert.deepEqual(index.get("assets/main.css"), [
    { key: "src/feature.ts", name: "src/feature.ts" },
    { key: "src/main.ts", name: "src/main.ts" }
  ]);
  assert.deepEqual(index.get("assets/math.woff2"), [
    { key: "src/main.ts", name: "src/main.ts" }
  ]);
});

test("route matrix separates common and exact route-exclusive closure", () => {
  const equation = route("equation", [
    resource("assets/main.js", "src/main.ts"),
    resource("assets/equation.js", "src/editor/equation-surface-adapter.ts")
  ]);
  const graph = route("graph", [
    resource("assets/main.js", "src/main.ts"),
    resource("assets/graph.js", "src/editor/graph-adapter.ts")
  ]);

  assert.deepEqual(createKpCapabilityRouteMatrix([equation, graph]), {
    commonFiles: ["assets/main.js"],
    exclusiveFilesByRoute: {
      equation: ["assets/equation.js"],
      graph: ["assets/graph.js"]
    },
    routesByOwnerName: {
      "src/editor/equation-surface-adapter.ts": ["equation"],
      "src/editor/graph-adapter.ts": ["graph"],
      "src/main.ts": ["equation", "graph"]
    }
  });
});

test("stable attribution command covers the approved six-route matrix twice", async () => {
  const [packageSource, scriptSource, reviewSource] = await Promise.all([
    readFile("package.json", "utf8"),
    readFile("scripts/animation-capability-attribution.ts", "utf8"),
    readFile(
      "docs/project/reviews/2026-08-02-animation-capability-closure-attribution.md",
      "utf8"
    )
  ]);
  const packageJson = JSON.parse(packageSource) as {
    readonly scripts?: Readonly<Record<string, string>>;
  };

  assert.equal(
    packageJson.scripts?.["perf:animation:attribution"],
    "node --disable-warning=ExperimentalWarning scripts/animation-capability-attribution.ts"
  );
  for (const routeId of catalogueRouteIds) {
    assert.match(scriptSource, new RegExp(`id: "${routeId}"`));
  }
  assert.match(scriptSource, /routeRuns: 2/);
  assert.match(scriptSource, /exactClosureReproducible: true/);
  assert.match(
    scriptSource,
    /tmp\/codex\/animation-capability-attribution\.json/
  );
  assert.match(reviewSource, /all six closures reproduced exactly/);
  assert.match(reviewSource, /250,000-byte script and 2\.5-second LCP/);
});

test("bundle boundary measures the representative catalogue route closure", async () => {
  const source = await readFile(
    "scripts/check-animation-library-bundle-boundary.ts",
    "utf8"
  );

  assert.match(
    source,
    /"src\/animation\/catalog-packs\/economics\.ts"/
  );
  assert.match(
    source,
    /"src\/editor\/graph-svg-surface-capability\.ts"/
  );
  assert.match(
    source,
    /measuredCatalogueRouteScriptFiles[\s\S]*extname\(file\) === "\.js"/
  );
});

function route(
  id: string,
  resources: KpCapabilityRouteAttribution["resources"]
): KpCapabilityRouteAttribution {
  return {
    id,
    route: `/?artifact=${id}`,
    animationId: `animation.${id}`,
    expectedPackId: id,
    packId: id,
    hostOutcome: "painted",
    adapters: [],
    resources,
    totals: {
      script: { count: resources.length, bytes: 0, gzipBytes: 0, transferBytes: 0 },
      style: { count: 0, bytes: 0, gzipBytes: 0, transferBytes: 0 },
      font: { count: 0, bytes: 0, gzipBytes: 0, transferBytes: 0 }
    }
  };
}

function resource(
  file: string,
  ownerName: string
): KpCapabilityRouteAttribution["resources"][number] {
  return {
    file,
    kind: "script",
    bytes: 0,
    gzipBytes: 0,
    transferBytes: 0,
    owners: [{ key: ownerName, name: ownerName }]
  };
}
