import { expect, test } from "@playwright/test";

const route = "/tutorials/economics/demand-shift/";
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
  longTasks: number[];
}

test("production economics tutorial stays inside publication and motion budgets", async ({
  page
}, testInfo) => {
  await page.setViewportSize({ width: 1_280, height: 720 });
  await page.addInitScript(() => {
    const target = window as typeof window & {
      __kpEconomicsTutorialPerformance?: KpTutorialPerformanceProbe;
    };
    const probe: KpTutorialPerformanceProbe = { cls: 0, longTasks: [] };
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
    };
    const probe = target.__kpEconomicsTutorialPerformance!;
    probe.cls = 0;
    probe.longTasks.length = 0;
    const tutorial = document.querySelector<HTMLElement>(
      "[data-kp-economics-demand-shift-tutorial]"
    )!;
    const changedProgressAttributes = new Set<string>();
    const observer = new MutationObserver((records) => {
      for (const record of records) {
        if (record.attributeName?.includes("-progress")) {
          changedProgressAttributes.add(record.attributeName);
        }
      }
    });
    observer.observe(tutorial, {
      attributes: true,
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
      const anchor = tutorial.querySelector<HTMLElement>(
        `[data-kp-tutorial-motion-controls="${blockId}"]`
      )!;
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
    return {
      samples: frameDurations.length,
      p95FrameMs: percentile(0.95),
      maxFrameMs: Math.max(...frameDurations),
      longTaskCount: probe.longTasks.length,
      longestTaskMs: Math.max(0, ...probe.longTasks),
      cls: probe.cls,
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
  expect(active.demandOwnerSamples).toBeGreaterThan(0);
  expect(active.supplyOwnerSamples).toBeGreaterThan(0);
});
