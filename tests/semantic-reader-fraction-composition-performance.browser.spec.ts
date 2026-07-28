import {
  expect,
  test
} from "@playwright/test";

test("rapid bidirectional scroll emits canonical reader runtime evidence", async ({
  page
}, testInfo) => {
  await page.setViewportSize({ width: 1_100, height: 800 });
  await page.goto(readerRoute(), { waitUntil: "domcontentloaded" });
  const stage = page.locator("[data-kp-reader-equation-stage]");
  await expect(page.locator("body")).toHaveAttribute(
    "data-kp-reader-hydrated",
    "true"
  );
  await expect(stage).toHaveAttribute(
    "data-kp-reader-canonical-equation-session-active",
    "true"
  );

  const evidence = await page.evaluate(async () => {
    const metricsUrl = "/src/reader/runtime/reader-runtime-metrics.ts";
    const metrics = await import(/* @vite-ignore */ metricsUrl);
    await document.fonts.ready;

    const waitForFrames = async (count: number): Promise<void> => {
      for (let index = 0; index < count; index += 1) {
        await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
      }
    };
    const maxScroll = (): number =>
      Math.max(0, document.documentElement.scrollHeight - innerHeight);

    // Warm both directions before measuring so the report separates ordinary
    // scroll work from one-time font and module initialization.
    scrollTo(0, maxScroll());
    await waitForFrames(3);
    scrollTo(0, 0);
    await waitForFrames(3);
    // URL restoration starts with explicit control authority. A navigation key
    // models the first real reader gesture and hands authority back to scroll.
    dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown" }));
    metrics.resetKpReaderRuntimeMetrics(window);

    const longTasks: number[] = [];
    const supportsLongTasks =
      typeof PerformanceObserver !== "undefined" &&
      PerformanceObserver.supportedEntryTypes.includes("longtask");
    const observer = supportsLongTasks
      ? new PerformanceObserver((list) => {
        longTasks.push(...list.getEntries().map((entry) => entry.duration));
      })
      : undefined;
    observer?.observe({ entryTypes: ["longtask"] });

    let materialOwnersAdded = 0;
    let materialOwnersRemoved = 0;
    const equationStage = document.querySelector(
      "[data-kp-reader-equation-stage]"
    );
    if (!(equationStage instanceof HTMLElement)) {
      throw new Error("Performance evidence requires the equation stage.");
    }
    const countOwners = (node: Node): number => {
      if (!(node instanceof Element)) return 0;
      return Number(node.matches("[data-kp-reader-equation-material-owner-id]")) +
        node.querySelectorAll("[data-kp-reader-equation-material-owner-id]").length;
    };
    const mutations = new MutationObserver((records) => {
      for (const record of records) {
        materialOwnersAdded += [...record.addedNodes]
          .reduce((total, node) => total + countOwners(node), 0);
        materialOwnersRemoved += [...record.removedNodes]
          .reduce((total, node) => total + countOwners(node), 0);
      }
    });
    mutations.observe(equationStage, { childList: true, subtree: true });

    const frameDeltas: number[] = [];
    let previous = performance.now();
    const samples = 30;
    for (let index = 0; index < samples; index += 1) {
      scrollTo(0, index % 2 === 0 ? maxScroll() : 0);
      await new Promise<void>((resolve) => requestAnimationFrame((now) => {
        frameDeltas.push(now - previous);
        previous = now;
        resolve();
      }));
    }
    await waitForFrames(3);
    observer?.disconnect();
    mutations.disconnect();

    const sorted = [...frameDeltas].sort((left, right) => left - right);
    const percentile = (value: number): number =>
      sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * value))] ?? 0;
    const nativeVisible = [...equationStage.querySelectorAll<HTMLElement>(
      "[data-kp-reader-native]"
    )].filter((element) => Number(getComputedStyle(element).opacity) > 0.01).length;
    const materialVisible = [...equationStage.querySelectorAll<HTMLElement>(
      "[data-kp-reader-equation-material-owner-id]"
    )].filter((element) => Number(getComputedStyle(element).opacity) > 0.01).length;

    return {
      browser: navigator.userAgent,
      supportsLongTasks,
      frame: {
        samples: frameDeltas.length,
        p50Ms: percentile(0.5),
        p95Ms: percentile(0.95),
        maxMs: Math.max(...frameDeltas),
        over50Ms: frameDeltas.filter((duration) => duration > 50).length
      },
      longTasks: {
        count: longTasks.length,
        maxMs: Math.max(0, ...longTasks)
      },
      runtime: metrics.inspectKpReaderRuntimeMetrics(window),
      materialOwnerChurn: {
        added: materialOwnersAdded,
        removed: materialOwnersRemoved
      },
      authority: {
        nativeVisible,
        materialVisible
      },
      finalScrollY: scrollY,
      maxScrollY: maxScroll()
    };
  });

  await testInfo.attach("rapid-scroll-runtime-evidence", {
    body: JSON.stringify(evidence, null, 2),
    contentType: "application/json"
  });
  expect(evidence.frame.samples).toBe(30);
  expect(
    evidence.runtime.canonicalSessionApplies,
    JSON.stringify(evidence, null, 2)
  ).toBeGreaterThan(0);
  expect(evidence.finalScrollY).toBe(0);
  expect(evidence.maxScrollY).toBeGreaterThan(0);
  // This is the pre-hardening work baseline, not an acceptable performance
  // budget. Later slices deliberately replace it with the zero-recompile
  // product contract while retaining per-engine timing attachments.
  expect(evidence.runtime).toMatchObject({
    scrollGeometryReads: 0,
    scrollAnchorReads: 0,
    canonicalSessionBuilds: 28,
    canonicalSessionReuses: 2,
    canonicalSessionApplies: 30
  });
  expect(evidence.materialOwnerChurn).toEqual({
    added: 0,
    removed: 0
  });
});

function readerRoute(): string {
  return "/reader/fraction-composition/?" + new URLSearchParams({
    kpLesson: "lesson.algebra.fraction-composition",
    kpVersion: "1",
    kpMotion: "full",
    kpProfile: "standard",
    kpFoldMode: "expanded"
  });
}
