import { expect, test } from "@playwright/test";

import type {
  KpTutorialScrollCoordinatorMetrics
} from "../src/tutorial/kp-tutorial-motion.ts";
import type {
  KpEconomicsGraphRuntimeMetrics
} from "../src/editor/graph-svg-viewport.ts";

const route = "/tutorials/economics/demand-shift/?layout=two-column-scroll";
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

test("production economics tutorial stays inside publication and motion budgets", async ({
  page
}, testInfo) => {
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
    const observer = new MutationObserver((records) => {
      for (const record of records) {
        if (record.type === "childList") {
          childListMutations += 1;
          addedNodes += record.addedNodes.length;
          removedNodes += record.removedNodes.length;
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
        removedNodes
      },
      baseCueCount: baseCues.length,
      cueDensity,
      maxChangedProgressAttributes: Math.max(...changedAttributeCounts),
      demandOwnerSamples: observedOwners.filter((id) => id === "demand-shift").length,
      supplyOwnerSamples: observedOwners.filter((id) => id === "supply-movement").length
    };
  });

  const evidence = { budgets, initial, active };
  console.info("KP economics tutorial performance\n" +
    JSON.stringify(evidence, null, 2));
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
  expect(active.graph.semanticSamples).toBe(active.graph.svgStringsBuilt);
  expect(active.graph.svgStringsBuilt).toBe(active.graph.subtreeReplacements);
  expect(active.graph.removedElements).toBeGreaterThan(0);
  expect(active.graph.addedElements).toBeGreaterThan(0);
  expect(active.domChurn.addedNodes).toBeGreaterThan(0);
  expect(active.domChurn.removedNodes).toBeGreaterThan(0);
  expect(active.baseCueCount).toBe(6);
  expect(active.cueDensity.map(({ cueCount }) => cueCount)).toEqual([6, 24, 48]);
  expect(active.cueDensity.every(({ executedFrames }) => executedFrames === 1))
    .toBe(true);
  expect(active.cueDensity[1]!.geometryReads)
    .toBeGreaterThan(active.cueDensity[0]!.geometryReads);
  expect(active.cueDensity[2]!.geometryReads)
    .toBeGreaterThan(active.cueDensity[1]!.geometryReads);
  expect(active.demandOwnerSamples).toBeGreaterThan(0);
  expect(active.supplyOwnerSamples).toBeGreaterThan(0);
});
