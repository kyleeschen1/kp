import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { gzipSync } from "node:zlib";

import { chromium, type Browser } from "playwright";
import { preview, type PreviewServer } from "vite";

import {
  inspectKpAnimationLibraryBundleBoundary
} from "./check-animation-library-bundle-boundary.ts";

interface ViteManifestChunk {
  readonly file: string;
  readonly name?: string | undefined;
  readonly src?: string | undefined;
  readonly imports?: readonly string[] | undefined;
  readonly dynamicImports?: readonly string[] | undefined;
  readonly css?: readonly string[] | undefined;
  readonly assets?: readonly string[] | undefined;
}

type ViteManifest = Readonly<Record<string, ViteManifestChunk>>;

export type KpCapabilityResourceKind = "script" | "style" | "font";

export interface KpCapabilityResourceOwner {
  readonly key: string;
  readonly name: string;
}

export interface KpCapabilityResourceAttribution {
  readonly file: string;
  readonly kind: KpCapabilityResourceKind;
  readonly bytes: number;
  readonly gzipBytes: number;
  readonly transferBytes: number;
  readonly owners: readonly KpCapabilityResourceOwner[];
}

export interface KpCapabilityRouteAttribution {
  readonly id: string;
  readonly route: string;
  readonly animationId: string;
  readonly expectedPackId: string;
  readonly packId: string;
  readonly hostOutcome: string;
  readonly adapters: readonly {
    readonly slot: string;
    readonly id: string;
    readonly status: string;
  }[];
  readonly resources: readonly KpCapabilityResourceAttribution[];
  readonly totals: Readonly<Record<KpCapabilityResourceKind, {
    readonly count: number;
    readonly bytes: number;
    readonly gzipBytes: number;
    readonly transferBytes: number;
  }>>;
}

export interface KpCapabilityRouteMatrix {
  readonly commonFiles: readonly string[];
  readonly exclusiveFilesByRoute: Readonly<Record<string, readonly string[]>>;
  readonly routesByOwnerName: Readonly<Record<string, readonly string[]>>;
}

export interface KpSelectedMathCapabilitySignals {
  readonly equationSurfaceRoutes: readonly string[];
  readonly katexScriptRoutes: readonly string[];
  readonly katexStyleRoutes: readonly string[];
}

export interface KpSelectedOptionalCapabilitySignals {
  readonly graph3DSurfaceRoutes: readonly string[];
  readonly graphSvgSurfaceRoutes: readonly string[];
  readonly graphWebglShellRoutes: readonly string[];
  readonly graphWebglThreeRoutes: readonly string[];
  readonly programmingAdapterRoutes: readonly string[];
  readonly apiCatalogRoutes: readonly string[];
  readonly animationDiagnosticsRoutes: readonly string[];
  readonly codeHighlightRoutes: readonly string[];
}

export function assertKpSelectedMathCapabilitySignals(
  signals: KpSelectedMathCapabilitySignals
): void {
  assertExactRouteIds(
    "equation surface",
    signals.equationSurfaceRoutes,
    ["equation-solve-x"]
  );
  assertExactRouteIds(
    "KaTeX script",
    signals.katexScriptRoutes,
    [
      "equation-solve-x",
      "graph-svg-vector",
      "graph-svg-economics",
      "exact-quantity"
    ]
  );
  assertExactRouteIds(
    "KaTeX style",
    signals.katexStyleRoutes,
    ["equation-solve-x", "graph-svg-vector", "graph-svg-economics"]
  );
}

export function assertKpSelectedOptionalCapabilitySignals(
  signals: KpSelectedOptionalCapabilitySignals
): void {
  assertExactRouteIds(
    "Graph3D surface",
    signals.graph3DSurfaceRoutes,
    ["graph-webgl-3d"]
  );
  assertExactRouteIds(
    "graph SVG surface",
    signals.graphSvgSurfaceRoutes,
    ["equation-solve-x", "graph-svg-vector", "graph-svg-economics"]
  );
  assertExactRouteIds(
    "graph WebGL shell",
    signals.graphWebglShellRoutes,
    ["graph-webgl-3d"]
  );
  assertExactRouteIds(
    "Three.js graph renderer",
    signals.graphWebglThreeRoutes,
    ["graph-webgl-3d"]
  );
  assertExactRouteIds(
    "programming adapter",
    signals.programmingAdapterRoutes,
    ["programming-trace"]
  );
  assertExactRouteIds("API catalog", signals.apiCatalogRoutes, []);
  assertExactRouteIds(
    "animation diagnostics",
    signals.animationDiagnosticsRoutes,
    []
  );
  assertExactRouteIds("code highlighting", signals.codeHighlightRoutes, []);
}

const routeSpecs = [
  {
    id: "equation-solve-x",
    animationId: "animation.linear-solve.solve-x",
    expectedPackId: "algebra"
  },
  {
    id: "graph-svg-vector",
    animationId: "animation.dot-projection.basic",
    expectedPackId: "graph"
  },
  {
    id: "graph-svg-economics",
    animationId: "animation.economics.supply-demand-equilibrium-shift",
    expectedPackId: "economics"
  },
  {
    id: "exact-quantity",
    animationId: "animation.exact-fraction-quantity.third-plus-sixth",
    expectedPackId: "exact-quantity"
  },
  {
    id: "graph-webgl-3d",
    animationId: "animation.graph.surface-mode.mesh-to-donut",
    expectedPackId: "graph"
  },
  {
    id: "programming-trace",
    animationId: "animation.programming.add.execution-trace",
    expectedPackId: "programming"
  }
] as const;

export function createKpCapabilityAssetOwnershipIndex(
  manifest: ViteManifest
): ReadonlyMap<string, readonly KpCapabilityResourceOwner[]> {
  const owners = new Map<string, KpCapabilityResourceOwner[]>();
  const add = (
    file: string,
    key: string,
    chunk: ViteManifestChunk
  ): void => {
    const current = owners.get(file) ?? [];
    const owner = {
      key,
      name: chunk.src ?? chunk.name ?? key
    };
    if (!current.some((candidate) =>
      candidate.key === owner.key && candidate.name === owner.name
    )) {
      current.push(owner);
    }
    owners.set(file, current);
  };
  Object.entries(manifest).forEach(([key, chunk]) => {
    add(chunk.file, key, chunk);
    chunk.css?.forEach((file) => add(file, key, chunk));
    chunk.assets?.forEach((file) => add(file, key, chunk));
  });
  return new Map([...owners].map(([file, fileOwners]) => [
    file,
    Object.freeze([...fileOwners].sort((left, right) =>
      left.name.localeCompare(right.name) || left.key.localeCompare(right.key)
    ))
  ]));
}

export function createKpCapabilityRouteMatrix(
  routes: readonly KpCapabilityRouteAttribution[]
): KpCapabilityRouteMatrix {
  if (routes.length === 0) {
    return Object.freeze({
      commonFiles: Object.freeze([]),
      exclusiveFilesByRoute: Object.freeze({}),
      routesByOwnerName: Object.freeze({})
    });
  }
  const routeFiles = new Map(routes.map((route) => [
    route.id,
    new Set(route.resources.map(({ file }) => file))
  ]));
  const commonFiles = [...routeFiles.get(routes[0]!.id)!]
    .filter((file) => routes.every((route) =>
      routeFiles.get(route.id)?.has(file) === true
    ))
    .sort();
  const allOwners = [...new Set(routes.flatMap((route) =>
    route.resources.flatMap(({ owners }) => owners.map(({ name }) => name))
  ))].sort();
  return Object.freeze({
    commonFiles: Object.freeze(commonFiles),
    exclusiveFilesByRoute: Object.freeze(Object.fromEntries(routes.map(
      (route) => [
        route.id,
        Object.freeze(route.resources
          .map(({ file }) => file)
          .filter((file) => routes.every((candidate) =>
            candidate.id === route.id ||
            routeFiles.get(candidate.id)?.has(file) === false
          ))
          .sort())
      ]
    ))),
    routesByOwnerName: Object.freeze(Object.fromEntries(allOwners.map(
      (ownerName) => [
        ownerName,
        Object.freeze(routes
          .filter((route) => route.resources.some(({ owners }) =>
            owners.some(({ name }) => name === ownerName)
          ))
          .map(({ id }) => id))
      ]
    )))
  });
}

async function captureKpAnimationCapabilityAttribution(): Promise<void> {
  const distRoot = resolve("dist");
  const manifestSource = await readFile(
    resolve(distRoot, ".vite/manifest.json"),
    "utf8"
  );
  const manifest = JSON.parse(manifestSource) as ViteManifest;
  const ownership = createKpCapabilityAssetOwnershipIndex(manifest);
  const historicalBaseline = JSON.parse(await readFile(
    resolve("tests/fixtures/animation-performance-baseline.json"),
    "utf8"
  )) as {
    readonly schemaVersion: string;
    readonly snapshot: {
      readonly capturedAt: string;
      readonly artifacts: {
        readonly entryScriptGzipBytes: number;
        readonly threeScriptGzipBytes: number;
      };
      readonly normal: {
        readonly initialScriptTransferBytes: number;
        readonly initialFontTransferBytes: number;
      };
    };
  };
  const bundleBoundary = await inspectKpAnimationLibraryBundleBoundary(
    distRoot
  );
  const server = await startPreview();
  const browser = await chromium.launch({ headless: true });
  try {
    const baseUrl = previewBaseUrl(server);
    const routes: KpCapabilityRouteAttribution[] = [];
    for (const spec of routeSpecs) {
      const first = await measureRoute({
        browser,
        baseUrl,
        distRoot,
        ownership,
        spec
      });
      const repeat = await measureRoute({
        browser,
        baseUrl,
        distRoot,
        ownership,
        spec
      });
      const firstSignature = reproducibleSignature(first);
      const repeatSignature = reproducibleSignature(repeat);
      if (firstSignature !== repeatSignature) {
        throw new Error(
          `Capability attribution was not reproducible for ${spec.id}.`
        );
      }
      routes.push(first);
    }
    const matrix = createKpCapabilityRouteMatrix(routes);
    const capabilitySignals = {
      graph3DSurfaceRoutes: routeIdsRequesting(
        routes,
        /(?:^|\/)graph-3d-surface-capability(?:\.ts)?$/
      ),
      graphSvgSurfaceRoutes: routeIdsRequesting(
        routes,
        /(?:^|\/)graph-svg-surface-capability(?:\.ts)?$/
      ),
      graphWebglShellRoutes: routeIdsRequesting(
        routes,
        /(?:^|\/)graph-webgl(?:\.ts)?$/
      ),
      graphWebglThreeRoutes: routeIdsRequesting(
        routes,
        /(?:^|\/)graph-webgl-three(?:\.ts)?$/
      ),
      equationSurfaceRoutes: routeIdsRequesting(
        routes,
        /equation-surface-adapter/
      ),
      programmingAdapterRoutes: routeIdsRequesting(
        routes,
        /programming-adapter/
      ),
      apiCatalogRoutes: routeIdsRequesting(
        routes,
        /(?:^|\/)api-catalog(?:\.ts)?$/
      ),
      animationDiagnosticsRoutes: routeIdsRequesting(
        routes,
        /(?:^|\/)animation-diagnostics(?:\.ts)?$/
      ),
      codeHighlightRoutes: routeIdsRequesting(
        routes,
        /(?:shiki|highlight\.js|prismjs|code-highlighter)/
      ),
      katexScriptRoutes: routeIdsRequesting(routes, /(?:^|\/)katex$/),
      katexStyleRoutes: routeIdsRequesting(routes, /katex\.min\.css/)
    };
    assertKpSelectedMathCapabilitySignals(capabilitySignals);
    assertKpSelectedOptionalCapabilitySignals(capabilitySignals);
    const runtimeInstances = {
      graph3DSurfaceFiles: scriptFilesRequestedByOwner(
        routes,
        /(?:^|\/)graph-3d-surface-capability(?:\.ts)?$/
      ),
      graphSvgSurfaceFiles: scriptFilesRequestedByOwner(
        routes,
        /(?:^|\/)graph-svg-surface-capability(?:\.ts)?$/
      ),
      graphWebglShellFiles: scriptFilesRequestedByOwner(
        routes,
        /(?:^|\/)graph-webgl(?:\.ts)?$/
      ),
      graphWebglThreeFiles: scriptFilesRequestedByOwner(
        routes,
        /(?:^|\/)graph-webgl-three(?:\.ts)?$/
      ),
      katexScriptFiles: scriptFilesRequestedByOwner(
        routes,
        /(?:^|\/)katex$/
      )
    };
    Object.entries(runtimeInstances).forEach(([label, files]) =>
      assertExactFileCount(label, files, 1)
    );
    const report = {
      schemaVersion: "kp.animation-capability-attribution.v1",
      capturedAt: new Date().toISOString(),
      build: {
        manifestSha256: createHash("sha256")
          .update(manifestSource)
          .digest("hex"),
        routeRuns: 2,
        exactClosureReproducible: true
      },
      historicalBaseline: {
        schemaVersion: historicalBaseline.schemaVersion,
        capturedAt: historicalBaseline.snapshot.capturedAt,
        entryScriptGzipBytes:
          historicalBaseline.snapshot.artifacts.entryScriptGzipBytes,
        threeScriptGzipBytes:
          historicalBaseline.snapshot.artifacts.threeScriptGzipBytes,
        normalInitialScriptTransferBytes:
          historicalBaseline.snapshot.normal.initialScriptTransferBytes,
        normalInitialFontTransferBytes:
          historicalBaseline.snapshot.normal.initialFontTransferBytes
      },
      currentStaticClosure: {
        mainHostGzipBytes: bundleBoundary.mainHostGzipBytes,
        mainHostDeltaFromCeiling: bundleBoundary.deltas.mainHostGzipBytes,
        files: bundleBoundary.fileAttribution.mainHost
      },
      routes,
      matrix,
      capabilitySignals,
      runtimeInstances
    };
    const outputPath = resolve(
      "tmp/codex/animation-capability-attribution.json"
    );
    await mkdir(resolve("tmp/codex"), { recursive: true });
    await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
    console.log(JSON.stringify({
      schemaVersion: report.schemaVersion,
      output: "tmp/codex/animation-capability-attribution.json",
      manifestSha256: report.build.manifestSha256,
      mainHostGzipBytes: report.currentStaticClosure.mainHostGzipBytes,
      routes: routes.map((route) => ({
        id: route.id,
        packId: route.packId,
        hostOutcome: route.hostOutcome,
        scripts: route.totals.script,
        styles: route.totals.style,
        fonts: route.totals.font,
        exclusiveFiles: matrix.exclusiveFilesByRoute[route.id]
      })),
      capabilitySignals: report.capabilitySignals,
      runtimeInstances: report.runtimeInstances
    }, null, 2));
  } finally {
    await browser.close();
    await server.close();
  }
}

function assertExactRouteIds(
  label: string,
  actual: readonly string[],
  expected: readonly string[]
): void {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(
      `${label} capability routes changed: expected ${expected.join(", ")}; ` +
      `received ${actual.join(", ")}.`
    );
  }
}

function assertExactFileCount(
  label: string,
  files: readonly string[],
  expected: number
): void {
  if (files.length !== expected) {
    throw new Error(
      `${label} runtime count changed: expected ${expected}; received ` +
      `${files.length} (${files.join(", ")}).`
    );
  }
}

async function measureRoute(input: {
  readonly browser: Browser;
  readonly baseUrl: string;
  readonly distRoot: string;
  readonly ownership: ReadonlyMap<
    string,
    readonly KpCapabilityResourceOwner[]
  >;
  readonly spec: typeof routeSpecs[number];
}): Promise<KpCapabilityRouteAttribution> {
  const context = await input.browser.newContext({
    viewport: { width: 1280, height: 900 }
  });
  const page = await context.newPage();
  const cdp = await context.newCDPSession(page);
  await cdp.send("Network.enable");
  await cdp.send("Network.setCacheDisabled", { cacheDisabled: true });
  try {
    const route = new URL("/", input.baseUrl);
    route.searchParams.set("artifact", input.spec.animationId);
    await page.goto(route.toString(), {
      waitUntil: "load",
      timeout: 120_000
    });
    await page.waitForFunction((expectedAnimationId) => {
      const catalogue = document.querySelector<HTMLElement>(
        "[data-kp-animation-catalogue]"
      );
      const player = catalogue?.querySelector<HTMLElement>(
        "[data-kp-editor-animation-player]"
      );
      return catalogue?.dataset["kpAnimationCatalogueSelection"] ===
        expectedAnimationId &&
        catalogue.dataset["kpAnimationCatalogueHostOutcome"] !== "pending" &&
        player?.dataset["kpEditorAnimationHydrated"] === "true";
    }, input.spec.animationId, { timeout: 120_000 });
    await page.evaluate(async () => document.fonts.ready);
    await page.waitForLoadState("networkidle", { timeout: 120_000 });
    const runtime = await page.evaluate(() => {
      const catalogue = document.querySelector<HTMLElement>(
        "[data-kp-animation-catalogue]"
      );
      const player = catalogue?.querySelector<HTMLElement>(
        "[data-kp-editor-animation-player]"
      );
      const transfers = new Map<string, number>();
      for (const entry of performance.getEntriesByType("resource") as
        PerformanceResourceTiming[]) {
        const path = new URL(entry.name).pathname.replace(/^\//, "");
        if (!path.startsWith("assets/")) continue;
        transfers.set(path, Math.max(transfers.get(path) ?? 0, entry.transferSize));
      }
      return {
        packId: player?.dataset["kpEditorAnimationPackId"] ?? "",
        hostOutcome:
          catalogue?.dataset["kpAnimationCatalogueHostOutcome"] ?? "unknown",
        adapters: [...(player?.querySelectorAll<HTMLElement>(
          "[data-kp-editor-animation-surface-slot]"
        ) ?? [])].map((slot) => ({
          slot: slot.dataset["kpEditorAnimationSurfaceSlot"] ?? "unknown",
          id: slot.dataset["kpEditorAnimationAdapterId"] ?? "none",
          status: slot.dataset["kpEditorAnimationAdapterStatus"] ?? "unknown"
        })).sort((left, right) => left.slot.localeCompare(right.slot)),
        transfers: [...transfers].sort(([left], [right]) =>
          left.localeCompare(right)
        )
      };
    });
    if (runtime.packId !== input.spec.expectedPackId) {
      throw new Error(
        `${input.spec.id} loaded ${runtime.packId}, expected ${input.spec.expectedPackId}.`
      );
    }
    const resources = (await Promise.all(runtime.transfers.map(
      async ([file, transferBytes]) => {
        const kind = resourceKind(file);
        if (kind === undefined) return undefined;
        const bytes = await readFile(resolve(input.distRoot, file));
        return Object.freeze({
          file,
          kind,
          bytes: bytes.byteLength,
          gzipBytes: gzipSync(bytes).byteLength,
          transferBytes,
          owners: input.ownership.get(file) ?? Object.freeze([])
        });
      }
    ))).filter((resource): resource is KpCapabilityResourceAttribution =>
      resource !== undefined
    );
    return Object.freeze({
      id: input.spec.id,
      route: route.pathname + route.search,
      animationId: input.spec.animationId,
      expectedPackId: input.spec.expectedPackId,
      packId: runtime.packId,
      hostOutcome: runtime.hostOutcome,
      adapters: Object.freeze(runtime.adapters.map((adapter) =>
        Object.freeze(adapter)
      )),
      resources: Object.freeze(resources),
      totals: Object.freeze(Object.fromEntries(
        (["script", "style", "font"] as const).map((kind) => {
          const matches = resources.filter((resource) =>
            resource.kind === kind
          );
          return [kind, Object.freeze({
            count: matches.length,
            bytes: matches.reduce((sum, resource) => sum + resource.bytes, 0),
            gzipBytes: matches.reduce(
              (sum, resource) => sum + resource.gzipBytes,
              0
            ),
            transferBytes: matches.reduce(
              (sum, resource) => sum + resource.transferBytes,
              0
            )
          })];
        })
      )) as Readonly<Record<KpCapabilityResourceKind, {
        readonly count: number;
        readonly bytes: number;
        readonly gzipBytes: number;
        readonly transferBytes: number;
      }>>
    });
  } finally {
    await context.close();
  }
}

function resourceKind(file: string): KpCapabilityResourceKind | undefined {
  if (file.endsWith(".js")) return "script";
  if (file.endsWith(".css")) return "style";
  if (/\.(?:woff2?|ttf)$/.test(file)) return "font";
  return undefined;
}

function reproducibleSignature(route: KpCapabilityRouteAttribution): string {
  return JSON.stringify({
    packId: route.packId,
    hostOutcome: route.hostOutcome,
    adapters: route.adapters,
    resources: route.resources.map(({ file, kind, bytes, gzipBytes, owners }) =>
      ({ file, kind, bytes, gzipBytes, owners })
    )
  });
}

function routeIdsRequesting(
  routes: readonly KpCapabilityRouteAttribution[],
  ownerPattern: RegExp
): readonly string[] {
  return routes.filter((route) => route.resources.some(({ owners }) =>
    owners.some(({ name }) => ownerPattern.test(name))
  )).map(({ id }) => id);
}

function scriptFilesRequestedByOwner(
  routes: readonly KpCapabilityRouteAttribution[],
  ownerPattern: RegExp
): readonly string[] {
  return [...new Set(routes.flatMap((route) =>
    route.resources
      .filter(({ kind, owners }) => kind === "script" && owners.some(
        ({ name }) => ownerPattern.test(name)
      ))
      .map(({ file }) => file)
  ))].sort();
}

async function startPreview(): Promise<PreviewServer> {
  return preview({
    root: process.cwd(),
    logLevel: "silent",
    preview: {
      host: "127.0.0.1",
      port: 4177,
      strictPort: false
    }
  });
}

function previewBaseUrl(server: PreviewServer): string {
  const address = server.httpServer.address();
  if (address === null || typeof address === "string") {
    throw new Error("Vite preview did not expose a TCP address.");
  }
  return `http://127.0.0.1:${address.port}/`;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  await captureKpAnimationCapabilityAttribution();
}
