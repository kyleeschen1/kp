import { expect, test } from "@playwright/test";
import { readFileSync, statSync } from "node:fs";
import { basename, resolve } from "node:path";

import type {
  KpTutorialScrollCoordinatorMetrics
} from "../src/tutorial/kp-tutorial-motion.ts";
import type {
  KpEconomicsGraphRuntimeMetrics
} from "../src/editor/graph-svg-viewport.ts";

const route = "/tutorials/economics/demand-shift/?layout=two-column-scroll";
const routeEntry =
  "src/tutorial/economics-demand-shift/economics-demand-shift-tutorial-entry.ts";
// These ceilings leave bounded machine variance above the production exemplar,
// while making an eager heavy renderer or duplicated scroll clock fail loudly.
const budgets = Object.freeze({
  initialTransferBytes: 360_000,
  initialScriptBytes: 275_000,
  initialResourceCount: 48,
  cumulativeLayoutShift: 0.02,
  initialLongestTaskMs: 150,
  activeP95FrameMs: 42,
  activeLongestTaskMs: 100
});

// These are measured debts, not permissions to grow the route. Later slices
// ratchet each list to empty as its owning capability is removed.
const routeClosureDebt = Object.freeze({
  catalogue: [
    "animation-catalogue-player-host",
    "animation-library",
    "animation-library-display-catalog",
    "kp-catalogue-identities"
  ],
  runtimeKatex: ["katex", "katex-adapter"],
  unrelatedGraphDomains: [
    "constant-force-work-energy-adapter",
    "focus-profile",
    "integral-area-sweep-adapter",
    "linear-map",
    "matrix",
    "matrix-linear-map-frame",
    "matrix-linear-map-pacing",
    "propagation-compiler"
  ]
});

interface KpTutorialPerformanceProbe {
  cls: number;
  geometryReads: number;
  longTasks: number[];
}

interface KpTutorialRuntimePerformanceApi {
  readonly resetScrollCoordinator: () => void;
  readonly snapshotScrollCoordinator: () => KpTutorialScrollCoordinatorMetrics;
}

interface KpGraphRuntimePerformanceApi {
  readonly reset: () => void;
  readonly snapshot: () => KpEconomicsGraphRuntimeMetrics;
}

interface ViteManifestChunk {
  readonly file: string;
  readonly name?: string;
  readonly imports?: readonly string[];
  readonly css?: readonly string[];
  readonly assets?: readonly string[];
}

function readEconomicsRouteBuildAttribution(): {
  readonly entry: string;
  readonly javascript: readonly RouteBuildFile[];
  readonly css: readonly RouteBuildFile[];
  readonly assets: readonly RouteBuildFile[];
  readonly totals: Record<string, number>;
  readonly manifestJavascript: readonly RouteBuildFile[];
  readonly manifestCss: readonly RouteBuildFile[];
  readonly manifestAssets: readonly RouteBuildFile[];
} {
  const manifest = JSON.parse(readFileSync(
    resolve(process.cwd(), "dist/.vite/manifest.json"),
    "utf8"
  )) as Record<string, ViteManifestChunk>;
  const entry = manifest[routeEntry];
  if (entry === undefined) throw new Error(`Missing Vite entry ${routeEntry}.`);
  const directImports = new Set(entry.imports ?? []);
  const visited = new Set<string>();
  const visit = (key: string): void => {
    if (visited.has(key)) return;
    const chunk = manifest[key];
    if (chunk === undefined) throw new Error(`Missing Vite manifest chunk ${key}.`);
    visited.add(key);
    for (const imported of chunk.imports ?? []) visit(imported);
  };
  visit(routeEntry);

  const javascript = [...visited].map((key): RouteBuildFile => {
    const chunk = manifest[key]!;
    return routeBuildFile({
      key,
      file: chunk.file,
      ...(chunk.name === undefined ? {} : { name: chunk.name }),
      direct: key === routeEntry || directImports.has(key)
    });
  }).sort(compareRouteBuildFiles);
  const cssFiles = new Set<string>();
  const assetFiles = new Set<string>();
  for (const key of visited) {
    const chunk = manifest[key]!;
    for (const file of chunk.css ?? []) cssFiles.add(file);
    for (const file of chunk.assets ?? []) assetFiles.add(file);
  }
  const css = [...cssFiles].map((file) => routeBuildFile({ file }))
    .sort(compareRouteBuildFiles);
  const assets = [...assetFiles].map((file) => routeBuildFile({ file }))
    .sort(compareRouteBuildFiles);
  const manifestFiles = new Map<string, RouteBuildFile>();
  for (const [key, chunk] of Object.entries(manifest)) {
    if (!chunk.file.startsWith("assets/")) continue;
    manifestFiles.set(chunk.file, routeBuildFile({
      key,
      file: chunk.file,
      ...(chunk.name === undefined ? {} : { name: chunk.name })
    }));
  }
  for (const file of [...css, ...assets]) {
    if (!manifestFiles.has(file.file)) manifestFiles.set(file.file, file);
  }
  const manifestJavascript = [...manifestFiles.values()]
    .filter(({ file }) => file.endsWith(".js"))
    .sort(compareRouteBuildFiles);
  const manifestCss = [...manifestFiles.values()]
    .filter(({ file }) => file.endsWith(".css"))
    .sort(compareRouteBuildFiles);
  const manifestAssets = [...manifestFiles.values()]
    .filter(({ file }) => !file.endsWith(".js") && !file.endsWith(".css"))
    .sort(compareRouteBuildFiles);
  return {
    entry: entry.file,
    javascript,
    css,
    assets,
    totals: Object.fromEntries([
      ...new Set([...javascript, ...css, ...assets].map(({ category }) => category))
    ].sort().map((category) => [category, [...javascript, ...css, ...assets]
      .filter((file) => file.category === category)
      .reduce((total, { bytes }) => total + bytes, 0)])),
    manifestJavascript,
    manifestCss,
    manifestAssets
  };
}

interface RouteBuildFile {
  readonly key?: string;
  readonly file: string;
  readonly name?: string;
  readonly bytes: number;
  readonly category: string;
  readonly direct?: boolean;
}

function routeBuildFile(input: {
  readonly key?: string;
  readonly file: string;
  readonly name?: string;
  readonly direct?: boolean;
}): RouteBuildFile {
  return {
    ...input,
    bytes: statSync(resolve(process.cwd(), "dist", input.file)).size,
    category: routeBuildCategory(`${input.name ?? ""} ${input.file}`)
  };
}

function routeBuildCategory(value: string): string {
  if (/katex/i.test(value) && /\.js$/i.test(value)) return "runtime-katex-js";
  if (/katex/i.test(value) && /\.css$/i.test(value)) return "katex-css";
  if (/katex/i.test(value)) return "katex-font";
  if (/catalogue|animation-library/i.test(value)) return "catalogue";
  if (/integral|matrix|constant-force|physics|dot-projection|vector-projection|linear-map|propagation-compiler|focus-profile/i
    .test(value)) return "unrelated-graph-domain";
  if (/graph-svg-viewport/i.test(value)) return "shared-graph-viewport";
  if (/economics/i.test(value)) return "economics";
  if (/\.css$/i.test(value)) return "other-css";
  return "shared-runtime";
}

function compareRouteBuildFiles(left: RouteBuildFile, right: RouteBuildFile): number {
  return left.category.localeCompare(right.category) ||
    left.file.localeCompare(right.file);
}

function routeBuildTotals(files: readonly RouteBuildFile[]): Record<string, number> {
  return Object.fromEntries([
    ...new Set(files.map(({ category }) => category))
  ].sort().map((category) => [category, files
    .filter((file) => file.category === category)
    .reduce((total, { bytes }) => total + bytes, 0)]));
}

function loadedRouteNames(
  files: readonly RouteBuildFile[],
  category: string
): string[] {
  return files.filter((file) => file.category === category)
    .map(({ name, file }) => name ?? basename(file, ".js"))
    .sort();
}

test("production economics tutorial stays inside publication and motion budgets", async ({
  page
}, testInfo) => {
  const buildAttribution = readEconomicsRouteBuildAttribution();
  const {
    manifestJavascript,
    manifestCss,
    manifestAssets,
    ...routeBuild
  } = buildAttribution;
  await page.setViewportSize({ width: 1_280, height: 720 });
  await page.addInitScript(() => {
    const target = window as typeof window & {
      __kpEconomicsPerformanceProbeRequested?: boolean;
      __kpEconomicsTutorialPerformance?: KpTutorialPerformanceProbe;
    };
    const probe: KpTutorialPerformanceProbe = {
      cls: 0,
      geometryReads: 0,
      longTasks: []
    };
    target.__kpEconomicsPerformanceProbeRequested = true;
    target.__kpEconomicsTutorialPerformance = probe;
    if (PerformanceObserver.supportedEntryTypes.includes("layout-shift")) {
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const shift = entry as PerformanceEntry & {
            readonly value: number;
            readonly hadRecentInput: boolean;
          };
          if (!shift.hadRecentInput) probe.cls += shift.value;
        }
      }).observe({ type: "layout-shift", buffered: true });
    }
    if (PerformanceObserver.supportedEntryTypes.includes("longtask")) {
      new PerformanceObserver((list) => {
        probe.longTasks.push(...list.getEntries().map(({ duration }) => duration));
      }).observe({ type: "longtask", buffered: true });
    }
  });

  await page.goto(route, { waitUntil: "networkidle" });
  const root = page.locator("[data-kp-economics-demand-shift-tutorial]");
  await expect(root).toHaveAttribute(
    "data-kp-economics-tutorial-scroll-coordinator",
    "connected"
  );
  await page.evaluate(async () => {
    await document.fonts.ready;
    await new Promise<void>((resolve) => requestAnimationFrame(() =>
      requestAnimationFrame(() => resolve())
    ));
  });

  const initial = await page.evaluate(() => {
    const probe = (window as typeof window & {
      __kpEconomicsTutorialPerformance?: KpTutorialPerformanceProbe;
    }).__kpEconomicsTutorialPerformance!;
    const navigation = performance.getEntriesByType("navigation")[0] as
      PerformanceNavigationTiming;
    const resources = performance.getEntriesByType("resource") as
      PerformanceResourceTiming[];
    const byKind = Object.fromEntries([
      ...new Set(resources.map(({ initiatorType }) => initiatorType))
    ].sort().map((kind) => [kind, resources
      .filter(({ initiatorType }) => initiatorType === kind)
      .reduce((total, { transferSize }) => total + transferSize, 0)]));
    return {
      transferBytes: navigation.transferSize + resources.reduce(
        (total, { transferSize }) => total + transferSize,
        0
      ),
      scriptBytes: resources
        .filter(({ initiatorType }) => initiatorType === "script")
        .reduce((total, { transferSize }) => total + transferSize, 0),
      resourceCount: resources.length,
      resources: resources.map(({ name, initiatorType }) => ({
        name: new URL(name).pathname.split("/").at(-1),
        initiatorType
      })),
      transferByInitiator: byKind,
      cls: probe.cls,
      longTaskCount: probe.longTasks.length,
      longestTaskMs: Math.max(0, ...probe.longTasks)
    };
  });

  const active = await page.evaluate(async () => {
    const target = window as typeof window & {
      __kpEconomicsTutorialPerformance?: KpTutorialPerformanceProbe;
      __kpEconomicsTutorialRuntimePerformance?: KpTutorialRuntimePerformanceApi;
      __kpEconomicsGraphRuntimePerformance?: KpGraphRuntimePerformanceApi;
    };
    const probe = target.__kpEconomicsTutorialPerformance!;
    const runtime = target.__kpEconomicsTutorialRuntimePerformance!;
    const graphRuntime = target.__kpEconomicsGraphRuntimePerformance!;
    probe.cls = 0;
    probe.geometryReads = 0;
    probe.longTasks.length = 0;
    runtime.resetScrollCoordinator();
    graphRuntime.reset();
    const readGeometry = Element.prototype.getBoundingClientRect;
    Element.prototype.getBoundingClientRect = function (): DOMRect {
      probe.geometryReads += 1;
      return readGeometry.call(this);
    };
    const tutorial = document.querySelector<HTMLElement>(
      "[data-kp-economics-demand-shift-tutorial]"
    )!;
    const changedProgressAttributes = new Set<string>();
    let addedNodes = 0;
    let removedNodes = 0;
    let childListMutations = 0;
    let graphAddedNodes = 0;
    let graphRemovedNodes = 0;
    let graphChildListMutations = 0;
    const graphContent = tutorial.querySelector<SVGGElement>(
      "[data-kp-editor-graph-content]"
    )!;
    const childListTargets = new Map<string, number>();
    const observer = new MutationObserver((records) => {
      for (const record of records) {
        if (record.type === "childList") {
          childListMutations += 1;
          addedNodes += record.addedNodes.length;
          removedNodes += record.removedNodes.length;
          if (graphContent.contains(record.target)) {
            graphChildListMutations += 1;
            graphAddedNodes += record.addedNodes.length;
            graphRemovedNodes += record.removedNodes.length;
          }
          const target = record.target as Element;
          const key = target instanceof Element
            ? target.getAttribute("data-kp-economics-screen-space-label") ??
              target.getAttribute("data-kp-economics-math-label") ??
              target.getAttribute("data-kp-economics-equation-role") ??
              target.getAttribute("data-kp-economics-narrative") ??
              target.getAttribute("data-kp-economics-nonvisual-summary") ??
              target.localName
            : record.target.nodeName;
          childListTargets.set(key, (childListTargets.get(key) ?? 0) + 1);
        }
        if (record.attributeName?.includes("-progress")) {
          changedProgressAttributes.add(record.attributeName);
        }
      }
    });
    observer.observe(tutorial, {
      attributes: true,
      childList: true,
      subtree: true,
      attributeFilter: [
        "data-kp-economics-tutorial-demand-progress",
        "data-kp-economics-tutorial-supply-movement-progress"
      ]
    });

    const waitForProjection = (): Promise<void> =>
      new Promise((resolve) => requestAnimationFrame(() =>
        requestAnimationFrame(() => resolve())
      ));
    const frameDurations: number[] = [];
    const changedAttributeCounts: number[] = [];
    const observedOwners: string[] = [];
    for (const blockId of ["demand-shift", "supply-movement"] as const) {
      const boundary = tutorial.querySelector<HTMLElement>(
        `[data-kp-tutorial-motion-block="${blockId}"]`
      )!;
      const anchor = boundary.querySelector<HTMLElement>("p") ?? boundary;
      const anchorDocumentTop = scrollY + anchor.getBoundingClientRect().top;
      for (let index = 0; index <= 12; index += 1) {
        const travel = index / 12;
        const desiredTop = innerHeight * (0.72 - travel * 0.56);
        changedProgressAttributes.clear();
        const startedAt = performance.now();
        scrollTo(0, Math.max(0, anchorDocumentTop - desiredTop));
        await waitForProjection();
        frameDurations.push(performance.now() - startedAt);
        changedAttributeCounts.push(changedProgressAttributes.size);
        observedOwners.push(
          tutorial.dataset["kpEconomicsTutorialScrollActiveBlock"] ?? ""
        );
      }
    }
    observer.disconnect();
    const sorted = [...frameDurations].sort((left, right) => left - right);
    const percentile = (ratio: number): number =>
      sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * ratio))] ?? 0;
    const scrollCoordinator = runtime.snapshotScrollCoordinator();
    const graph = graphRuntime.snapshot();
    const canonicalGeometryReads = probe.geometryReads;
    const canonicalCls = probe.cls;
    const canonicalLongTasks = [...probe.longTasks];
    const cueHost = tutorial.querySelector<HTMLElement>(
      ".kp-economics-tutorial__motion-passage-prose"
    )!;
    const baseCues = [...cueHost.querySelectorAll<HTMLElement>(
      ":scope > [data-kp-scroll-cue]"
    )];
    const cueDensity: Array<{
      cueCount: number;
      executedFrames: number;
      geometryReads: number;
      coordinatorExecutionMs: number;
    }> = [];
    for (const cueCount of [6, 24, 48]) {
      const fixtureNodes: HTMLElement[] = [];
      for (let index = baseCues.length; index < cueCount; index += 1) {
        const clone = baseCues[index % baseCues.length]!.cloneNode(true) as
          HTMLElement;
        clone.dataset["kpEconomicsTutorialPassage"] =
          `performance-cue-${cueCount}-${index}`;
        delete clone.dataset["kpTutorialMotionBlock"];
        delete clone.dataset["kpTutorialDestination"];
        delete clone.dataset["kpTutorialDestinationId"];
        clone.removeAttribute("id");
        for (const identified of clone.querySelectorAll<HTMLElement>("[id]")) {
          identified.removeAttribute("id");
        }
        cueHost.append(clone);
        fixtureNodes.push(clone);
      }
      await waitForProjection();
      probe.geometryReads = 0;
      runtime.resetScrollCoordinator();
      const maximumScrollY = Math.max(0, document.documentElement.scrollHeight - innerHeight);
      scrollTo(0, scrollY < maximumScrollY ? Math.min(maximumScrollY, scrollY + 1) :
        Math.max(0, scrollY - 1));
      await waitForProjection();
      const densityMetrics = runtime.snapshotScrollCoordinator();
      cueDensity.push({
        cueCount,
        executedFrames: densityMetrics.executedFrames,
        geometryReads: probe.geometryReads,
        coordinatorExecutionMs: densityMetrics.totalExecutionMs
      });
      for (const node of fixtureNodes) node.remove();
      await waitForProjection();
    }
    Element.prototype.getBoundingClientRect = readGeometry;
    return {
      samples: frameDurations.length,
      p95FrameMs: percentile(0.95),
      maxFrameMs: Math.max(...frameDurations),
      longTaskCount: canonicalLongTasks.length,
      longestTaskMs: Math.max(0, ...canonicalLongTasks),
      cls: canonicalCls,
      geometryReads: canonicalGeometryReads,
      geometryReadsPerFrame: canonicalGeometryReads /
        Math.max(1, scrollCoordinator.executedFrames),
      scrollCoordinator,
      averageCoordinatorExecutionMs: scrollCoordinator.totalExecutionMs /
        Math.max(1, scrollCoordinator.executedFrames),
      graph,
      domChurn: {
        childListMutations,
        addedNodes,
        removedNodes,
        targets: [...childListTargets.entries()]
          .sort((left, right) => right[1] - left[1])
      },
      graphDomChurn: {
        childListMutations: graphChildListMutations,
        addedNodes: graphAddedNodes,
        removedNodes: graphRemovedNodes
      },
      baseCueCount: baseCues.length,
      cueDensity,
      maxChangedProgressAttributes: Math.max(...changedAttributeCounts),
      demandOwnerSamples: observedOwners.filter((id) => id === "demand-shift").length,
      supplyOwnerSamples: observedOwners.filter((id) => id === "supply-movement").length
    };
  });

  const loadedFiles = new Set(initial.resources.map(({ name }) => name));
  const loadedJavascript = manifestJavascript.filter(({ file }) =>
    loadedFiles.has(basename(file)));
  const loadedCss = manifestCss.filter(({ file }) =>
    loadedFiles.has(basename(file)));
  const loadedAssets = manifestAssets.filter(({ file }) =>
    loadedFiles.has(basename(file)));
  const loadedRouteBuild = {
    javascript: loadedJavascript,
    css: loadedCss,
    assets: loadedAssets,
    totals: routeBuildTotals([...loadedJavascript, ...loadedCss, ...loadedAssets])
  };
  const evidence = { budgets, routeBuild, loadedRouteBuild, initial, active };
  const consoleEvidence = {
    budgets,
    routeBuild: {
      entry: routeBuild.entry,
      javascriptFiles: routeBuild.javascript.length,
      cssFiles: routeBuild.css.length,
      assetFiles: routeBuild.assets.length,
      totals: routeBuild.totals
    },
    loadedRouteBuild: {
      javascriptFiles: loadedRouteBuild.javascript.length,
      cssFiles: loadedRouteBuild.css.length,
      assetFiles: loadedRouteBuild.assets.length,
      totals: loadedRouteBuild.totals
    },
    initial: {
      transferBytes: initial.transferBytes,
      scriptBytes: initial.scriptBytes,
      resourceCount: initial.resourceCount,
      transferByInitiator: initial.transferByInitiator,
      cls: initial.cls,
      longTaskCount: initial.longTaskCount,
      longestTaskMs: initial.longestTaskMs
    },
    active
  };
  console.info("KP economics tutorial performance\n" +
    JSON.stringify(consoleEvidence, null, 2));
  await testInfo.attach("economics-tutorial-performance", {
    body: JSON.stringify(evidence, null, 2),
    contentType: "application/json"
  });

  expect(initial.transferBytes, JSON.stringify(evidence, null, 2))
    .toBeLessThanOrEqual(budgets.initialTransferBytes);
  expect(initial.scriptBytes, JSON.stringify(evidence, null, 2))
    .toBeLessThanOrEqual(budgets.initialScriptBytes);
  expect(initial.resourceCount).toBeLessThanOrEqual(budgets.initialResourceCount);
  expect(initial.cls).toBeLessThanOrEqual(budgets.cumulativeLayoutShift);
  expect(initial.longestTaskMs).toBeLessThanOrEqual(budgets.initialLongestTaskMs);
  expect(loadedRouteNames(loadedRouteBuild.javascript, "catalogue"))
    .toEqual(routeClosureDebt.catalogue);
  expect(loadedRouteNames(loadedRouteBuild.javascript, "runtime-katex-js"))
    .toEqual(routeClosureDebt.runtimeKatex);
  expect(loadedRouteNames(loadedRouteBuild.javascript, "unrelated-graph-domain"))
    .toEqual(routeClosureDebt.unrelatedGraphDomains);
  expect(loadedRouteBuild.javascript
    .filter(({ file }) => /graph-webgl|graph-3d|programming|lisp-function|three-/i
      .test(file))
    .map(({ name, file }) => name ?? file))
    .toEqual([]);
  expect(active.samples).toBe(26);
  expect(active.p95FrameMs, JSON.stringify(evidence, null, 2))
    .toBeLessThanOrEqual(budgets.activeP95FrameMs);
  expect(active.longestTaskMs).toBeLessThanOrEqual(budgets.activeLongestTaskMs);
  expect(active.cls).toBeLessThanOrEqual(budgets.cumulativeLayoutShift);
  expect(active.maxChangedProgressAttributes).toBeLessThanOrEqual(1);
  expect(active.scrollCoordinator.executedFrames).toBeGreaterThanOrEqual(26);
  expect(active.scrollCoordinator.requestedFrames)
    .toBe(active.scrollCoordinator.executedFrames);
  expect(active.scrollCoordinator.layoutReads)
    .toBe(active.scrollCoordinator.registrationReads);
  expect(active.geometryReads).toBeGreaterThan(active.scrollCoordinator.layoutReads);
  expect(active.graph.renderCalls).toBe(active.graph.semanticSamples);
  // The retained economics session samples semantic truth every render, but
  // ordinary progress may no longer rebuild strings or replace its subtree.
  expect(active.graph.svgStringsBuilt).toBe(0);
  expect(active.graph.svgStringCharacters).toBe(0);
  expect(active.graph.subtreeReplacements).toBe(0);
  expect(active.graph.removedElements).toBe(0);
  expect(active.graph.addedElements).toBe(0);
  expect(active.graphDomChurn.childListMutations).toBeLessThan(10);
  expect(active.graphDomChurn.addedNodes).toBeLessThan(10);
  expect(active.graphDomChurn.removedNodes).toBeLessThan(10);
  expect(active.baseCueCount).toBe(6);
  expect(active.cueDensity.map(({ cueCount }) => cueCount)).toEqual([6, 24, 48]);
  expect(active.cueDensity.every(({ executedFrames }) => executedFrames === 1))
    .toBe(true);
  expect(new Set(active.cueDensity.map(({ geometryReads }) => geometryReads)).size)
    .toBe(1);
  expect(active.cueDensity.every(({ geometryReads }) => geometryReads <= 3))
    .toBe(true);
  expect(active.demandOwnerSamples).toBeGreaterThan(0);
  expect(active.supplyOwnerSamples).toBeGreaterThan(0);
});
