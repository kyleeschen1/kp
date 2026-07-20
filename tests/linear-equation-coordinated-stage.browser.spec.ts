import { expect, test } from "@playwright/test";

const conceptPath = "/concepts/mathematics/linear-equations/solve-with-balance";

test("the front door composes equation and balance on one canonical clock", async ({ page }) => {
  await page.goto(conceptPath);
  const shell = page.locator("[data-kp-concept-room-shell]");
  const stage = shell.locator("[data-kp-linear-equation-coordinated-stage]");
  const symbolicRegion = stage.locator('[data-kp-coordinated-projection="symbolic"]');
  const balanceRegion = stage.locator('[data-kp-coordinated-projection="balance"]');
  await expect(shell).toHaveAttribute("data-kp-concept-projection", "coordinated");
  await expect(shell.getByRole("link", { name: "Together", exact: true })).toHaveAttribute("aria-current", "page");
  await expect(stage).toHaveAttribute("role", "group");
  await expect(symbolicRegion.locator("[data-kp-symbolic-equation] .katex").first()).toBeVisible();
  await expect(balanceRegion.locator("[data-kp-balance-scene]")).toBeVisible();
  await expect(page.locator("canvas")).toHaveCount(0);

  const scrubber = shell.getByRole("slider", { name: "Scrub concept timeline" });
  for (const time of [0, 250, 575, 720, 1000]) {
    await scrubber.fill(String(time));
    await expect(stage).toHaveAttribute("data-kp-coordinated-time-permille", String(time));
    await expect(stage).toHaveAttribute("data-kp-coordinated-settled-time-permille", String(time));
    const clocks = await stage.evaluate((root) => {
      const symbolic = root.querySelector<HTMLElement>('[data-kp-coordinated-projection="symbolic"]');
      const balance = root.querySelector<HTMLElement>('[data-kp-coordinated-projection="balance"]');
      const symbolicEquation = symbolic?.querySelector<HTMLElement>("[data-kp-symbolic-equation]");
      const balanceScene = balance?.querySelector<SVGSVGElement>("[data-kp-balance-scene]");
      return {
        stage: root.dataset["kpCoordinatedTimePermille"],
        symbolicRegion: symbolic?.dataset["kpCoordinatedTimePermille"],
        balanceRegion: balance?.dataset["kpCoordinatedTimePermille"],
        symbolicProjection: symbolicEquation?.dataset["kpProgressPermille"],
        balanceProjection: balanceScene?.dataset["kpProgressPermille"]
      };
    });
    expect(new Set(Object.values(clocks))).toEqual(new Set([String(time)]));
  }
});

test("coordinated, equation-only, and balance-only URLs switch and dispose cleanly", async ({ page }) => {
  await page.goto(conceptPath);
  const shell = page.locator("[data-kp-concept-room-shell]");
  const viewport = shell.locator("[data-kp-concept-viewport]");
  const together = shell.getByRole("link", { name: "Together", exact: true });
  const equation = shell.getByRole("link", { name: "Equation", exact: true });
  const balance = shell.getByRole("link", { name: "Balance", exact: true });
  await expect(together).toHaveAttribute("href", /projection=coordinated/);
  await expect(equation).toHaveAttribute("href", /projection=symbolic/);
  await expect(balance).toHaveAttribute("href", /projection=balance/);

  await equation.click();
  await expect(shell).toHaveAttribute("data-kp-concept-projection", "symbolic");
  await expect(viewport.locator("[data-kp-linear-equation-coordinated-stage]")).toHaveCount(0);
  await expect(viewport.locator("[data-kp-symbolic-equation]")).toHaveCount(1);
  await expect(viewport.locator("[data-kp-balance-scene]")).toHaveCount(0);

  await balance.click();
  await expect(shell).toHaveAttribute("data-kp-concept-projection", "balance");
  await expect(viewport.locator("[data-kp-symbolic-equation]")).toHaveCount(0);
  await expect(viewport.locator("[data-kp-balance-scene]")).toHaveCount(1);

  await together.click();
  await expect(shell).toHaveAttribute("data-kp-concept-projection", "coordinated");
  await expect(viewport.locator("[data-kp-linear-equation-coordinated-stage]")).toHaveCount(1);
  await expect(viewport.locator('[data-kp-coordinated-projection="symbolic"] [data-kp-symbolic-equation]'))
    .toHaveCount(1);
  await expect(viewport.locator('[data-kp-coordinated-projection="balance"] [data-kp-balance-scene]'))
    .toHaveCount(1);

  await page.evaluate(() => window.dispatchEvent(new Event("pagehide")));
  await expect(shell).toHaveCount(0);
});

test("the coordinated field remains bounded at desktop, tablet, and phone widths", async ({ page }) => {
  for (const viewport of [
    { width: 1440, height: 1000 },
    { width: 768, height: 1024 },
    { width: 390, height: 844 }
  ]) {
    await page.setViewportSize(viewport);
    await page.goto(conceptPath);
    const stage = page.locator("[data-kp-linear-equation-coordinated-stage]");
    await expect(stage).toBeVisible();
    const bounds = await stage.evaluate((node) => {
      const stageBox = node.getBoundingClientRect();
      const symbolicBox = node.querySelector('[data-kp-coordinated-projection="symbolic"]')!
        .getBoundingClientRect();
      const balanceBox = node.querySelector('[data-kp-coordinated-projection="balance"]')!
        .getBoundingClientRect();
      return {
        documentOverflow: document.documentElement.scrollWidth > window.innerWidth,
        stageLeft: stageBox.left,
        stageRight: stageBox.right,
        symbolicLeft: symbolicBox.left,
        symbolicRight: symbolicBox.right,
        balanceLeft: balanceBox.left,
        balanceRight: balanceBox.right
      };
    });
    expect(bounds.documentOverflow).toBe(false);
    expect(bounds.stageLeft).toBeGreaterThanOrEqual(0);
    expect(bounds.stageRight).toBeLessThanOrEqual(viewport.width);
    expect(bounds.symbolicLeft).toBeGreaterThanOrEqual(bounds.stageLeft);
    expect(bounds.symbolicRight).toBeLessThanOrEqual(bounds.stageRight);
    expect(bounds.balanceLeft).toBeGreaterThanOrEqual(bounds.stageLeft);
    expect(bounds.balanceRight).toBeLessThanOrEqual(bounds.stageRight);
  }
});
