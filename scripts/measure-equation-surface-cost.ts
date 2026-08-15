import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { gzipSync } from "node:zlib";

import { chromium, type Browser } from "playwright";
import { preview, type PreviewServer } from "vite";

import {
  createKpEquationSurfaceCostPlan
} from "../src/architecture/equation-surface-cost-model.ts";
import {
  createKpCapabilityAssetOwnershipIndex,
  createKpCapabilityRouteMatrix,
  type KpCapabilityResourceAttribution,
  type KpCapabilityResourceKind,
  type KpCapabilityResourceOwner,
  type KpCapabilityRouteAttribution
} from "./animation-capability-attribution.ts";

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

interface ActiveFrameEvidence {
  readonly playerCount: number;
  readonly directProgressAdvanced: boolean;
  readonly sharedClockOwner: "editor-animation-player";
  readonly cssAnimationAuthority: "none";
}

interface MeasuredRoute {
  readonly attribution: KpCapabilityRouteAttribution;
  readonly activeFrame: ActiveFrameEvidence;
}

const distRoot = resolve("dist");
const outputPath = resolve("tmp/codex/equation-surface-cost-baseline.json");
const plan = createKpEquationSurfaceCostPlan();
const manifest = JSON.parse(await readFile(
  resolve(distRoot, ".vite/manifest.json"),
  "utf8"
)) as ViteManifest;
const ownership = createKpCapabilityAssetOwnershipIndex(manifest);
const sourceMeasurements = await Promise.all(plan.sourceCategories.map(
  async (category) => {
    const files = await Promise.all(category.sourcePaths.map(async (sourcePath) => {
      const bytes = await readFile(resolve(sourcePath));
      return Object.freeze({
        sourcePath,
        bytes: bytes.byteLength,
        gzipBytes: gzipSync(bytes).byteLength
      });
    }));
    return Object.freeze({
      category: category.category,
      bytes: files.reduce((total, file) => total + file.bytes, 0),
      gzipBytes: files.reduce((total, file) => total + file.gzipBytes, 0),
      files: Object.freeze(files)
    });
  }
));
const server = await startPreview();
const browser = await chromium.launch({ headless: true });

try {
  const baseUrl = previewBaseUrl(server);
  const routes: MeasuredRoute[] = [];
  for (const family of plan.families) {
    const first = await measureRoute({
      browser,
      baseUrl,
      spec: family,
      ownership
    });
    const repeat = await measureRoute({
      browser,
      baseUrl,
      spec: family,
      ownership
    });
    if (closureSignature(first.attribution) !==
        closureSignature(repeat.attribution)) {
      throw new Error(
        `Equation route closure was not reproducible for ${family.familyId}.`
      );
    }
    if (!first.activeFrame.directProgressAdvanced ||
        !repeat.activeFrame.directProgressAdvanced) {
      throw new Error(`Equation player did not advance for ${family.familyId}.`);
    }
    routes.push(first);
  }
  const attributions = routes.map(({ attribution }) => attribution);
  const unrelatedOwners = attributions.flatMap((route) =>
    route.resources.flatMap((resource) => resource.owners
      .filter(({ name }) => /graph-3d|graph-webgl|programming-surface/.test(name))
      .map(({ name }) => `${route.id}:${name}`)));
  if (unrelatedOwners.length > 0) {
    throw new Error(
      `Equation routes loaded unrelated capabilities: ${unrelatedOwners.join(", ")}`
    );
  }
  const matrix = createKpCapabilityRouteMatrix(attributions);
  const report = {
    schemaVersion: "kp.equation-surface-cost-baseline.v1",
    capturedAt: new Date().toISOString(),
    build: {
      routeRuns: 2,
      exactClosureReproducible: true
    },
    compatibility: plan.compatibility,
    sourceMeasurements,
    families: plan.families.map((family) => ({
      ...family,
      measured: routes.find(({ attribution }) =>
        attribution.id === family.familyId)!
    })),
    routeMatrix: matrix,
    unrelatedCapabilityOwners: unrelatedOwners
  };
  await mkdir(resolve("tmp/codex"), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  console.log(JSON.stringify({
    schemaVersion: report.schemaVersion,
    output: "tmp/codex/equation-surface-cost-baseline.json",
    compatibility: report.compatibility,
    sourceMeasurements: sourceMeasurements.map(({ category, bytes, gzipBytes, files }) => ({
      category,
      files: files.length,
      bytes,
      gzipBytes
    })),
    routes: routes.map(({ attribution, activeFrame }) => ({
      id: attribution.id,
      animationId: attribution.animationId,
      scripts: attribution.totals.script,
      styles: attribution.totals.style,
      fonts: attribution.totals.font,
      activeFrame
    })),
    commonFiles: matrix.commonFiles.length,
    unrelatedCapabilityOwners: unrelatedOwners
  }, null, 2));
} finally {
  await browser.close();
  await server.close();
}

async function measureRoute(input: {
  readonly browser: Browser;
  readonly baseUrl: string;
  readonly spec: typeof plan.families[number];
  readonly ownership: ReadonlyMap<string, readonly KpCapabilityResourceOwner[]>;
}): Promise<MeasuredRoute> {
  const context = await input.browser.newContext({
    viewport: { width: 1_200, height: 760 }
  });
  const page = await context.newPage();
  const cdp = await context.newCDPSession(page);
  await cdp.send("Network.enable");
  await cdp.send("Network.setCacheDisabled", { cacheDisabled: true });
  try {
    const route = new URL(input.spec.route, input.baseUrl);
    await page.goto(route.toString(), { waitUntil: "load", timeout: 120_000 });
    await page.waitForFunction((animationId) => {
      const catalogue = document.querySelector<HTMLElement>(
        "[data-kp-animation-catalogue]"
      );
      const player = catalogue?.querySelector<HTMLElement>(
        `[data-kp-editor-animation-id="${animationId}"]`
      );
      const slot = player?.querySelector<HTMLElement>(
        '[data-kp-editor-animation-surface-slot="equation"]'
      );
      return catalogue?.dataset["kpAnimationCatalogueSelection"] ===
        animationId &&
        catalogue.dataset["kpAnimationCatalogueHostOutcome"] === "painted" &&
        player?.dataset["kpEditorAnimationHydrated"] === "true" &&
        slot?.dataset["kpEditorAnimationAdapterStatus"] === "ready";
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
        if (path.startsWith("assets/")) {
          transfers.set(path, Math.max(
            transfers.get(path) ?? 0,
            entry.transferSize
          ));
        }
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
          left.localeCompare(right))
      };
    });
    if (runtime.packId !== input.spec.expectedPackId) {
      throw new Error(
        `${input.spec.familyId} loaded ${runtime.packId}, expected ` +
        `${input.spec.expectedPackId}.`
      );
    }
    const resources = (await Promise.all(runtime.transfers.map(
      async ([file, transferBytes]) => {
        const kind = resourceKind(file);
        if (kind === undefined) return undefined;
        const bytes = await readFile(resolve(distRoot, file));
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
      resource !== undefined);
    const activeFrame = await page.evaluate(async () => {
      const players = [...document.querySelectorAll<HTMLElement>(
        "[data-kp-editor-animation-player]"
      )];
      const player = players[0];
      const seek = player?.querySelector<HTMLInputElement>(
        '[data-action="seek-editor-animation"]'
      );
      const play = player?.querySelector<HTMLButtonElement>(
        '[data-action="toggle-editor-animation"]'
      );
      if (player === undefined || seek === null || seek === undefined ||
          play === null || play === undefined) {
        throw new Error("Equation cost route lacks player controls.");
      }
      seek.value = "0";
      seek.dispatchEvent(new Event("input", { bubbles: true }));
      const start = Number(player.dataset["kpEditorAnimationProgress"] ?? 0);
      play.click();
      await new Promise<void>((resolve, reject) => {
        const timeout = window.setTimeout(() => reject(
          new Error("Equation player did not advance within two seconds.")), 2_000);
        const observe = (): void => {
          if (Number(player.dataset["kpEditorAnimationProgress"] ?? 0) > start) {
            window.clearTimeout(timeout);
            resolve();
          } else {
            requestAnimationFrame(observe);
          }
        };
        requestAnimationFrame(observe);
      });
      play.click();
      return {
        playerCount: players.length,
        directProgressAdvanced:
          Number(player.dataset["kpEditorAnimationProgress"] ?? 0) > start,
        sharedClockOwner: "editor-animation-player" as const,
        cssAnimationAuthority: "none" as const
      };
    });
    if (activeFrame.playerCount !== 1) {
      throw new Error(
        `${input.spec.familyId} mounted ${activeFrame.playerCount} players.`
      );
    }
    return Object.freeze({
      attribution: Object.freeze({
        id: input.spec.familyId,
        route: input.spec.route,
        animationId: input.spec.animationId,
        expectedPackId: input.spec.expectedPackId,
        packId: runtime.packId,
        hostOutcome: runtime.hostOutcome,
        adapters: Object.freeze(runtime.adapters),
        resources: Object.freeze(resources),
        totals: totalsFor(resources)
      }),
      activeFrame: Object.freeze(activeFrame)
    });
  } finally {
    await context.close();
  }
}

function totalsFor(resources: readonly KpCapabilityResourceAttribution[]):
KpCapabilityRouteAttribution["totals"] {
  return Object.freeze(Object.fromEntries(
    (["script", "style", "font"] as const).map((kind) => {
      const matches = resources.filter((resource) => resource.kind === kind);
      return [kind, Object.freeze({
        count: matches.length,
        bytes: matches.reduce((sum, resource) => sum + resource.bytes, 0),
        gzipBytes: matches.reduce((sum, resource) =>
          sum + resource.gzipBytes, 0),
        transferBytes: matches.reduce((sum, resource) =>
          sum + resource.transferBytes, 0)
      })];
    })
  )) as KpCapabilityRouteAttribution["totals"];
}

function resourceKind(file: string): KpCapabilityResourceKind | undefined {
  if (file.endsWith(".js")) return "script";
  if (file.endsWith(".css")) return "style";
  if (/\.(?:woff2?|ttf)$/.test(file)) return "font";
  return undefined;
}

function closureSignature(route: KpCapabilityRouteAttribution): string {
  return JSON.stringify({
    packId: route.packId,
    hostOutcome: route.hostOutcome,
    adapters: route.adapters,
    resources: route.resources.map(({ file, kind, bytes, gzipBytes, owners }) =>
      ({ file, kind, bytes, gzipBytes, owners }))
  });
}

async function startPreview(): Promise<PreviewServer> {
  return preview({
    root: process.cwd(),
    logLevel: "silent",
    preview: { host: "127.0.0.1", port: 0, strictPort: false }
  });
}

function previewBaseUrl(server: PreviewServer): string {
  const address = server.httpServer.address();
  if (address === null || typeof address === "string") {
    throw new Error("Equation cost preview did not expose a TCP address.");
  }
  return `http://127.0.0.1:${address.port}/`;
}
