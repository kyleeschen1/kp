import { expect, test } from "@playwright/test";

const animationId = "animation.equation.finite-sum-expansion.v1";
const constrainedFrameP95BudgetMs = 33.4;
const constrainedUpdateP95BudgetMs = 20;
const constrainedUpdateMaximumBudgetMs = 50;
const constrainedSlowFrameBudget = 6;
// Single-run browser scheduling is noisy under 6× throttling. These ceilings
// catch catastrophic stalls; the production matrix retains KP's stricter
// 100 ms maximum-frame and 50 ms long-task product targets.
const catastrophicFrameMaximumMs = 200;
const catastrophicLongTaskMaximumMs = 100;

test("finite sum stays smooth and structurally quiet on a constrained phone", async ({
  context,
  page
}) => {
  test.setTimeout(120_000);
  await page.setViewportSize({ width: 390, height: 844 });
  const cdp = await context.newCDPSession(page);
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: 6 });

  await page.goto(`/?artifact=${animationId}&playhead=0`, {
    waitUntil: "domcontentloaded",
    timeout: 120_000
  });
  const player = page.locator(
    `[data-kp-editor-animation-player]` +
    `[data-kp-editor-animation-id="${animationId}"]`
  );
  const stage = player.locator("[data-kp-finite-sum-stage]");
  await expect(stage).toHaveAttribute(
    "data-kp-finite-sum-stage",
    "ready",
    { timeout: 120_000 }
  );

  const result = await page.evaluate(async () => {
    const player = document.querySelector<HTMLElement>(
      `[data-kp-editor-animation-player]` +
      `[data-kp-editor-animation-id="animation.equation.finite-sum-expansion.v1"]`
    );
    const stage = player?.querySelector<HTMLElement>(
      "[data-kp-finite-sum-stage]"
    );
    const scrubber = player?.querySelector<HTMLInputElement>(
      '[data-action="seek-editor-animation"]'
    );
    if (player === undefined || player === null || stage === undefined ||
        stage === null || scrubber === undefined || scrubber === null) {
      throw new Error("Finite-sum performance probe requires a ready player.");
    }

    let statusMutations = 0;
    let endpointAccessibilityMutations = 0;
    let paintAlignmentMeasurements = 0;
    let materialVisualMutations = 0;
    const mutationObserver = new MutationObserver((records) => {
      for (const record of records) {
        const target = record.target instanceof Element
          ? record.target
          : record.target.parentElement;
        if (target?.closest("[data-kp-finite-sum-status]") !== null) {
          statusMutations += 1;
        }
        if (
          record.type === "attributes" &&
          target?.matches(".kp-finite-sum-stage__endpoint") === true &&
          (record.attributeName === "aria-hidden" ||
            record.attributeName === "inert")
        ) {
          endpointAccessibilityMutations += 1;
        }
        if (
          record.type === "attributes" &&
          record.attributeName ===
            "data-kp-equation-material-paint-alignment-key"
        ) {
          paintAlignmentMeasurements += 1;
        }
        if (
          record.type === "childList" &&
          target?.matches("[data-kp-equation-material-owner-id]") === true
        ) {
          materialVisualMutations += 1;
        }
      }
    });
    mutationObserver.observe(stage, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
      attributeFilter: [
        "aria-hidden",
        "inert",
        "data-kp-equation-material-paint-alignment-key"
      ]
    });

    const longTasks: Array<{ startTime: number; duration: number }> = [];
    const longTaskObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        longTasks.push({ startTime: entry.startTime, duration: entry.duration });
      }
    });
    if (PerformanceObserver.supportedEntryTypes.includes("longtask")) {
      longTaskObserver.observe({ type: "longtask", buffered: false });
    }

    const frameDeltas: number[] = [];
    const updateDurations: number[] = [];
    let previousFrameAt: number | undefined;
    const sampleCount = 120;
    const sampleStartedAt = performance.now();
    for (let index = 0; index <= sampleCount; index += 1) {
      await new Promise<void>((resolve) => requestAnimationFrame((now) => {
        if (previousFrameAt !== undefined) {
          frameDeltas.push(now - previousFrameAt);
        }
        previousFrameAt = now;
        const updateStartedAt = performance.now();
        scrubber.value = String(index / sampleCount);
        scrubber.dispatchEvent(new Event("input", { bubbles: true }));
        updateDurations.push(performance.now() - updateStartedAt);
        resolve();
      }));
    }
    await new Promise<void>((resolve) => requestAnimationFrame(() =>
      requestAnimationFrame(() => resolve())
    ));
    const sampleEndedAt = performance.now();
    mutationObserver.disconnect();
    longTaskObserver.disconnect();

    const sorted = [...frameDeltas].sort((left, right) => left - right);
    const percentile = (ratio: number): number =>
      sorted[Math.min(sorted.length - 1,
        Math.floor(sorted.length * ratio))] ?? 0;
    const sortedUpdates = [...updateDurations].sort(
      (left, right) => left - right
    );
    const updatePercentile = (ratio: number): number =>
      sortedUpdates[Math.min(sortedUpdates.length - 1,
        Math.floor(sortedUpdates.length * ratio))] ?? 0;
    return {
      frames: frameDeltas.length,
      meanMs: frameDeltas.reduce((sum, value) => sum + value, 0) /
        frameDeltas.length,
      p95Ms: percentile(0.95),
      maximumMs: Math.max(...frameDeltas),
      over33Ms: frameDeltas.filter((value) => value > 33.4).length,
      updateMeanMs: updateDurations.reduce((sum, value) => sum + value, 0) /
        updateDurations.length,
      updateP95Ms: updatePercentile(0.95),
      updateMaximumMs: Math.max(...updateDurations),
      longestTaskMs: Math.max(0, ...longTasks.map(({ duration }) => duration)),
      longTasks,
      sampleStartedAt,
      sampleEndedAt,
      lastUpdateDurations: updateDurations.slice(-10),
      statusMutations,
      endpointAccessibilityMutations,
      paintAlignmentMeasurements,
      materialVisualMutations,
      finalProgress: stage.dataset["kpFiniteSumProgress"]
    };
  });

  console.info(`KP finite-sum constrained performance\n${JSON.stringify(
    result,
    null,
  2
  )}`);

  expect(result.frames).toBe(120);
  expect(result.p95Ms).toBeLessThanOrEqual(constrainedFrameP95BudgetMs);
  expect(result.updateP95Ms).toBeLessThanOrEqual(
    constrainedUpdateP95BudgetMs
  );
  expect(result.updateMaximumMs).toBeLessThanOrEqual(
    constrainedUpdateMaximumBudgetMs
  );
  expect(result.over33Ms).toBeLessThanOrEqual(constrainedSlowFrameBudget);
  expect(result.maximumMs).toBeLessThanOrEqual(catastrophicFrameMaximumMs);
  expect(result.longestTaskMs).toBeLessThanOrEqual(
    catastrophicLongTaskMaximumMs
  );
  expect(result.statusMutations).toBeLessThanOrEqual(2);
  expect(result.endpointAccessibilityMutations).toBeLessThanOrEqual(2);
  expect(result.paintAlignmentMeasurements).toBe(0);
  expect(result.materialVisualMutations).toBe(0);
  expect(result.finalProgress).toBe("1");

});
