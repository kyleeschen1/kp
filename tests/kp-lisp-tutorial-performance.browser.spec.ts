import { expect, test } from "@playwright/test";

const route = "/tutorials/programming/lisp-function-application/";
// These ceilings are below the approved economics exemplar because the Lisp
// route has no KaTeX, graph renderer, or parameter exploration capability.
const budgets = Object.freeze({
  initialTransferBytes: 300_000,
  initialScriptBytes: 220_000,
  initialResourceCount: 36,
  cumulativeLayoutShift: 0.02,
  initialLongestTaskMs: 150,
  activeP95FrameMs: 42,
  activeLongestTaskMs: 100
});

interface KpLispPerformanceProbe {
  cls: number;
  longTasks: number[];
}

test("production Lisp tutorial stays inside publication and motion budgets", async ({
  page
}, testInfo) => {
  await page.setViewportSize({ width: 1_280, height: 720 });
  await page.addInitScript(() => {
    const target = window as typeof window & {
      __kpLispPerformance?: KpLispPerformanceProbe;
    };
    const probe: KpLispPerformanceProbe = { cls: 0, longTasks: [] };
    target.__kpLispPerformance = probe;
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
  const root = page.locator("[data-kp-lisp-function-application-tutorial]");
  await expect(root).toHaveAttribute("data-kp-lisp-tutorial-scroll-coordinator", "connected");
  await page.evaluate(async () => {
    await document.fonts.ready;
    await new Promise<void>((resolve) => requestAnimationFrame(() =>
      requestAnimationFrame(() => resolve())
    ));
  });

  const initial = await page.evaluate(() => {
    const probe = (window as typeof window & {
      __kpLispPerformance?: KpLispPerformanceProbe;
    }).__kpLispPerformance!;
    const navigation = performance.getEntriesByType("navigation")[0] as
      PerformanceNavigationTiming;
    const resources = performance.getEntriesByType("resource") as
      PerformanceResourceTiming[];
    return {
      transferBytes: navigation.transferSize + resources.reduce(
        (total, { transferSize }) => total + transferSize,
        0
      ),
      scriptBytes: resources
        .filter(({ initiatorType }) => initiatorType === "script")
        .reduce((total, { transferSize }) => total + transferSize, 0),
      resourceCount: resources.length,
      cls: probe.cls,
      longTaskCount: probe.longTasks.length,
      longestTaskMs: Math.max(0, ...probe.longTasks),
      resourceNames: resources.map(({ name }) => name)
    };
  });

  const active = await page.evaluate(async () => {
    const tutorial = document.querySelector<HTMLElement>(
      "[data-kp-lisp-function-application-tutorial]"
    )!;
    const probe = (window as typeof window & {
      __kpLispPerformance?: KpLispPerformanceProbe;
    }).__kpLispPerformance!;
    probe.cls = 0;
    probe.longTasks.length = 0;
    document.documentElement.style.scrollBehavior = "auto";
    const frameDurations: number[] = [];
    const changedAttributeCounts: number[] = [];
    const observedOwners: string[] = [];
    const waitForProjection = (): Promise<void> =>
      new Promise((resolve) => requestAnimationFrame(() =>
        requestAnimationFrame(() => resolve())
      ));
    for (const blockId of ["bind-and-reconstruct", "evaluate-and-gather"] as const) {
      const anchor = tutorial.querySelector<HTMLElement>(
        `[data-kp-tutorial-motion-controls="${blockId}"]`
      )!;
      const documentTop = scrollY + anchor.getBoundingClientRect().top;
      for (let index = 0; index <= 12; index += 1) {
        const changed = new Set<string>();
        const observer = new MutationObserver((records) => {
          for (const record of records) {
            if (record.attributeName?.includes("progress")) changed.add(record.attributeName);
          }
        });
        observer.observe(tutorial, { attributes: true });
        const travel = index / 12;
        const desiredTop = innerHeight * (0.72 - travel * 0.56);
        dispatchEvent(new WheelEvent("wheel", { deltaY: 1 }));
        const startedAt = performance.now();
        scrollTo(0, Math.max(0, documentTop - desiredTop));
        await waitForProjection();
        frameDurations.push(performance.now() - startedAt);
        observer.disconnect();
        changedAttributeCounts.push(changed.size);
        observedOwners.push(tutorial.dataset["kpLispTutorialScrollActiveBlock"] ?? "");
      }
    }
    const sorted = [...frameDurations].sort((left, right) => left - right);
    const p95 = sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * 0.95))] ?? 0;
    return {
      samples: frameDurations.length,
      p95FrameMs: p95,
      maxFrameMs: Math.max(...frameDurations),
      longTaskCount: probe.longTasks.length,
      longestTaskMs: Math.max(0, ...probe.longTasks),
      cls: probe.cls,
      maxChangedProgressAttributes: Math.max(...changedAttributeCounts),
      bindingOwnerSamples: observedOwners.filter((id) => id === "bind-and-reconstruct").length,
      evaluationOwnerSamples: observedOwners.filter((id) => id === "evaluate-and-gather").length
    };
  });

  const evidence = { budgets, initial, active };
  console.info(`KP Lisp tutorial performance\n${JSON.stringify(evidence, null, 2)}`);
  await testInfo.attach("botanical-lisp-tutorial-performance", {
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
  expect(initial.resourceNames.some((name) => /katex|monaco|three/i.test(name))).toBe(false);
  expect(active.samples).toBe(26);
  expect(active.p95FrameMs, JSON.stringify(evidence, null, 2))
    .toBeLessThanOrEqual(budgets.activeP95FrameMs);
  expect(active.longestTaskMs).toBeLessThanOrEqual(budgets.activeLongestTaskMs);
  expect(active.cls).toBeLessThanOrEqual(budgets.cumulativeLayoutShift);
  expect(active.maxChangedProgressAttributes).toBeLessThanOrEqual(1);
  expect(active.bindingOwnerSamples).toBeGreaterThan(0);
  expect(active.evaluationOwnerSamples).toBeGreaterThan(0);
});
