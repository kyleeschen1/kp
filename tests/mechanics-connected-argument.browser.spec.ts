import { test, expect } from "@playwright/test";

const route = "/experiments/mechanics-relations/force-without-work/";

test("connected mechanics argument keeps two canonical rails and exact smaller-step return", async ({ page }, info) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  // Endpoint smoke uses the existing reduced-motion seek policy; ordinary End
  // intentionally plays the whole derivation rather than jumping immediately.
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(route + "#energy-from-momentum");
  const energy = page.locator('[data-derivation-namespace="energy"]');
  const handle = energy.locator('[data-derivation-handle]');
  await expect(handle).toBeEnabled({ timeout: 30000 });
  await expect(energy.locator('[data-derivation-stage]')).toHaveAttribute('data-derivation-renderer', 'canonical-native-katex-scene-session');
  await handle.focus(); await handle.press("End");
  await expect(energy).toHaveAttribute("data-derivation-progress", "3");
  const held = await energy.getAttribute("data-derivation-progress");
  await energy.locator('[data-refinement-expand="cancel-mass"]').click();
  await expect(energy.locator('[data-refinement-local-return]').last()).toBeVisible();
  await energy.locator('[data-refinement-local-return]').last().click();
  await expect(energy).toHaveAttribute("data-derivation-progress", held!);
  await handle.focus(); await handle.press("Home");
  await expect(energy).toHaveAttribute("data-derivation-progress", "0");
  await page.locator('#energy-from-momentum').screenshot({ path: info.outputPath("energy-argument.png") });

  const power = page.locator('[data-derivation-namespace="power"]');
  await power.scrollIntoViewIfNeeded();
  const powerHandle = power.locator('[data-derivation-handle]');
  await expect(powerHandle).toBeEnabled({ timeout: 30000 });
  await expect(power.locator('[data-derivation-stage]')).toHaveAttribute('data-derivation-renderer', 'canonical-native-katex-scene-session');
  await powerHandle.focus(); await powerHandle.press("End");
  await expect(power).toHaveAttribute("data-derivation-progress", "1");
  await power.locator('[data-refinement-expand]').first().click();
  await expect(power).toHaveAttribute("data-derivation-detail", "mass-refinement");
  await power.locator('[data-refinement-collapse]').first().click();
  await expect(power).toHaveAttribute("data-derivation-detail", "coarse");
  await expect(power).toHaveAttribute("data-derivation-progress", "1");
  await powerHandle.focus();
  await powerHandle.press("Home");
  await expect(power).toHaveAttribute("data-derivation-progress", "0");
  await page.locator('#force-to-energy').screenshot({ path: info.outputPath("power-argument.png") });
  await page.locator('#sideways-force a[href="#energy-from-momentum"]').click();
  await expect(page).toHaveURL(/#energy-from-momentum$/);
  await expect(page.locator('[data-repair="true"]')).toHaveCount(0);
  expect(errors).toEqual([]);
});

test("connected mechanics argument stays complete without JavaScript and uses shared typography", async ({ browser }, info) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();
  await page.goto(route);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Can a force change motion without changing energy?");
  await expect(page.locator('[data-energy-derivation]')).toHaveCount(2);
  await expect(page.locator('#sideways-force')).toContainText("kinetic energy decreases");
  for (const namespace of ["energy", "power"]) {
    const root = page.locator(`[data-derivation-namespace="${namespace}"]`);
    expect(await root.locator('.energy-derivation-history > li > .energy-derivation-equation math').count()).toBeGreaterThan(1);
    await expect(root.locator('[data-derivation-handle]')).toBeHidden();
  }
  const typography = () => page.locator('main article > p').first().evaluate(el => {
    const style = getComputedStyle(el); return [style.fontFamily, style.fontSize, style.lineHeight];
  });
  const focused = await typography();
  await page.screenshot({ path: info.outputPath("static-argument.png"), fullPage: true });
  await page.goto("/experiments/mechanics-relations/");
  expect(await typography()).toEqual(focused);
  await context.close();
});
