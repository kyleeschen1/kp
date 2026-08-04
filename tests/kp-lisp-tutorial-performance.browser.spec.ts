import { expect, test } from "@playwright/test";

const route = "/tutorials/programming/lisp-function-application/";
// These ceilings are below the approved economics exemplar because the Lisp
// route has no KaTeX, graph renderer, or parameter exploration capability.
const budgets = Object.freeze({
  initialTransferBytes: 300_000,
  initialScriptBytes: 220_000,
  initialResourceCount: 36,
  cumulativeLayoutShift: 0,
  initialLongestTaskMs: 150,
  activeP95FrameMs: 42,
  activeLongestTaskMs: 100
});

interface KpLispPerformanceProbe {
  cls: number;
  longTasks: number[];
  shiftSources: string[];
}

test("production Lisp tutorial stays inside publication and motion budgets", async ({
  page
}, testInfo) => {
  await page.setViewportSize({ width: 1_280, height: 720 });
  await page.addInitScript(() => {
    const target = window as typeof window & {
      __kpLispPerformance?: KpLispPerformanceProbe;
    };
    const probe: KpLispPerformanceProbe = { cls: 0, longTasks: [], shiftSources: [] };
    target.__kpLispPerformance = probe;
    if (PerformanceObserver.supportedEntryTypes.includes("layout-shift")) {
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const shift = entry as PerformanceEntry & {
            readonly value: number;
            readonly hadRecentInput: boolean;
          };
          if (!shift.hadRecentInput) {
            probe.cls += shift.value;
            const sources = (shift as typeof shift & {
              readonly sources?: readonly { readonly node?: Node | null }[];
            }).sources ?? [];
            probe.shiftSources.push(...sources.map(({ node }) =>
              node instanceof Element
                ? `${node.tagName.toLowerCase()}${node.id ? `#${node.id}` : ""}.${[...node.classList].join(".")}`
                : node?.nodeName ?? "unknown"
            ));
          }
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
    probe.shiftSources.length = 0;
    document.documentElement.style.scrollBehavior = "auto";
    const frameDurations: number[] = [];
    const observedOwners: string[] = [];
    const waitForProjection = (): Promise<void> =>
      new Promise((resolve) => requestAnimationFrame(() =>
        requestAnimationFrame(() => resolve())
      ));
    for (const blockId of ["structure", "application", "evaluation"] as const) {
      const anchor = tutorial.querySelector<HTMLElement>(
        `[data-kp-tutorial-motion-controls="${blockId}"]`
      )!;
      const documentTop = scrollY + anchor.getBoundingClientRect().top;
      for (let index = 0; index <= 12; index += 1) {
        const travel = index / 12;
        const desiredTop = innerHeight * (0.72 - travel * 0.56);
        dispatchEvent(new WheelEvent("wheel", { deltaY: 1 }));
        const startedAt = performance.now();
        scrollTo(0, Math.max(0, documentTop - desiredTop));
        await waitForProjection();
        frameDurations.push(performance.now() - startedAt);
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
      shiftSources: [...probe.shiftSources],
      activeSamplerCount: Number(
        tutorial.dataset["kpLispTutorialActiveSamplers"] ?? "-1"
      ),
      structureOwnerSamples: observedOwners.filter((id) => id === "structure").length,
      applicationOwnerSamples: observedOwners.filter((id) => id === "application").length,
      evaluationOwnerSamples: observedOwners.filter((id) => id === "evaluation").length
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
  expect(active.samples).toBe(39);
  expect(active.p95FrameMs, JSON.stringify(evidence, null, 2))
    .toBeLessThanOrEqual(budgets.activeP95FrameMs);
  expect(active.longestTaskMs).toBeLessThanOrEqual(budgets.activeLongestTaskMs);
  expect(active.cls).toBeLessThanOrEqual(budgets.cumulativeLayoutShift);
  expect(active.activeSamplerCount).toBe(0);
  expect(active.structureOwnerSamples).toBeGreaterThan(0);
  expect(active.applicationOwnerSamples).toBeGreaterThan(0);
  expect(active.evaluationOwnerSamples).toBeGreaterThan(0);
});

test("manual playback owns one sampler and suspends when its stage leaves view", async ({
  page
}) => {
  await page.setViewportSize({ width: 1_280, height: 720 });
  await page.goto(`${route}#kp-block-application`, { waitUntil: "networkidle" });
  const root = page.locator("[data-kp-lisp-function-application-tutorial]");
  const scrub = root.locator(
    '[data-kp-tutorial-motion-controls="application"]'
  );
  await expect(root).toHaveAttribute(
    "data-kp-lisp-tutorial-playback-visibility",
    "visible"
  );
  await scrub.getByRole("button", { name: "Play" }).click();
  await expect(root).toHaveAttribute("data-kp-lisp-tutorial-active-samplers", "1");
  await expect(scrub).toHaveAttribute("playback-status", "playing");

  await root.locator(".kp-lisp-tutorial__stage").evaluate((stage) => {
    stage.style.translate = "200vw 0";
  });
  await expect(root).toHaveAttribute(
    "data-kp-lisp-tutorial-playback-visibility",
    "offscreen"
  );
  await expect(root).toHaveAttribute("data-kp-lisp-tutorial-active-samplers", "0");
  await expect(scrub).toHaveAttribute("playback-status", "paused");
});
