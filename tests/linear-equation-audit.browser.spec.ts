import { expect, test } from "@playwright/test";

const conceptPath = "/concepts/mathematics/linear-equations/solve-with-balance";

test("learner shell keeps one stage, one control row, one rail, and no template chrome", async ({ page }) => {
  await page.goto(conceptPath);
  const shell = page.locator("[data-kp-concept-room-shell]");
  await expect(shell).toBeVisible();
  await expect(shell.locator("[data-kp-concept-room-stage]")).toHaveCount(1);
  await expect(shell.locator("[data-kp-concept-visual-field]")).toHaveCount(1);
  await expect(shell.locator("[data-kp-concept-controls]")).toHaveCount(1);
  await expect(shell.locator("[data-kp-concept-copy-rail]")).toHaveCount(1);
  await expect(shell.locator("[data-kp-concept-checkpoint-sections]")).toHaveCount(1);
  await expect(shell.locator("form, dialog, [role=dialog], [class*=card], [class*=badge], [class*=panel]"))
    .toHaveCount(0);
  await expect(shell.getByRole("button")).toHaveCount(3);
  await expect(shell.getByRole("slider")).toHaveCount(0);
  await expect(shell.getByRole("link", { name: "Ask" })).toHaveCount(0);

  const scrollingContainers = await shell.evaluate((root) => [...root.querySelectorAll<HTMLElement>("*")]
    .filter((element) => {
      const style = getComputedStyle(element);
      return [style.overflow, style.overflowX, style.overflowY].some((value) =>
        value === "auto" || value === "scroll"
      );
    })
    .map((element) => element.dataset["kpConceptCopyRail"] ?? element.tagName));
  expect(scrollingContainers).toEqual([]);

  await shell.getByRole("link", { name: "Review", exact: true }).click();
  await expect(shell.locator("[data-kp-concept-copy-rail]")).toHaveCount(0);
  await expect(shell.locator("[data-kp-concept-review-mode]")).toHaveCount(1);
  await expect(shell.locator("[data-kp-concept-controls]")).toHaveCount(1);
  await expect(shell.getByRole("button")).toHaveCount(1);
});

test("direct seeks keep the stage stable without horizontal layout shift", async ({ page }) => {
  await page.goto(conceptPath);
  const touchHref = await page.getByRole("link", { name: "Touch", exact: true }).getAttribute("href");
  expect(touchHref).not.toBeNull();
  // Enter through the shareable route so this audit isolates seek stability from mode navigation.
  await page.goto(touchHref!);
  const visual = page.locator("[data-kp-concept-visual-field]");
  const coordinated = page.locator("[data-kp-linear-equation-coordinated-stage]");
  // Measure the mounted projection, not the transient shell immediately after mode navigation.
  await expect(coordinated).toBeVisible();
  await page.evaluate(async () => {
    await document.fonts.ready;
    await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
  });

  const initial = await visual.boundingBox();
  expect(initial).not.toBeNull();
  const scrubber = page.getByRole("slider", { name: "Scrub concept timeline" });
  for (const time of [250, 400, 575, 750, 1000, 0]) {
    await scrubber.fill(String(time));
    await expect(coordinated).toHaveAttribute("data-kp-coordinated-settled-time-permille", String(time));
    const bounds = await visual.boundingBox();
    expect(bounds).not.toBeNull();
    expect(Math.abs(bounds!.x - initial!.x)).toBeLessThanOrEqual(1);
    expect(Math.abs(bounds!.width - initial!.width)).toBeLessThanOrEqual(1);
    expect(Math.abs(bounds!.height - initial!.height)).toBeLessThanOrEqual(1);
  }

  expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(false);
});

test("Watch stays within the exemplar frame budget and creates no WebGL context", async ({ page }) => {
  await page.addInitScript(() => {
    const browserWindow = window as typeof window & { __kpWebglContextRequests?: number };
    browserWindow.__kpWebglContextRequests = 0;
    const getContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (
      this: HTMLCanvasElement,
      contextId: string,
      ...options: unknown[]
    ) {
      if (contextId === "webgl" || contextId === "webgl2") browserWindow.__kpWebglContextRequests! += 1;
      return Reflect.apply(getContext, this, [contextId, ...options]);
    } as typeof getContext;
  });
  await page.goto(conceptPath);
  await expect(page.locator("[data-kp-linear-equation-coordinated-stage]")).toBeVisible();

  const sample = await page.evaluate(async () => {
    await document.fonts.ready;
    const deltas: number[] = [];
    const layoutShifts: number[] = [];
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const shift = entry as PerformanceEntry & { value: number; hadRecentInput: boolean };
        if (!shift.hadRecentInput) layoutShifts.push(shift.value);
      }
    });
    observer.observe({ type: "layout-shift", buffered: false });
    let previous: number | undefined;
    const startedAt = performance.now();
    document.querySelector<HTMLButtonElement>('[aria-label="Play concept"]')?.click();
    await new Promise<void>((resolve) => {
      const tick = (now: number): void => {
        if (previous !== undefined) deltas.push(now - previous);
        previous = now;
        if (now - startedAt >= 1_500) resolve();
        else requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
    observer.disconnect();
    const sorted = [...deltas].sort((left, right) => left - right);
    const percentile = (ratio: number): number =>
      sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * ratio))] ?? 0;
    return {
      frameCount: deltas.length,
      p95Ms: percentile(0.95),
      over50Ms: deltas.filter((delta) => delta > 50).length,
      canvasCount: document.querySelectorAll("canvas").length,
      webglContextRequests: (window as typeof window & { __kpWebglContextRequests?: number })
        .__kpWebglContextRequests ?? 0,
      layoutShift: layoutShifts.reduce((sum, value) => sum + value, 0)
    };
  });

  expect(sample.frameCount).toBeGreaterThanOrEqual(45);
  expect(sample.p95Ms).toBeLessThanOrEqual(34);
  expect(sample.over50Ms).toBeLessThanOrEqual(1);
  expect(sample.canvasCount).toBe(0);
  expect(sample.webglContextRequests).toBe(0);
  expect(sample.layoutShift).toBeLessThanOrEqual(0.02);
});
