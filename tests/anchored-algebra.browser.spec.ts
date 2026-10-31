import { test, expect } from "@playwright/test";
import source from "../content/authoring/algebra/what-counts.json" with { type: "json" };

const route = "/experiments/reusable-reasoning/?example=anchored-algebra";
test("anchored commentary follows exact native stops and withdraws in transit", async ({ page }, info) => {
  test.setTimeout(120_000);
  const errors: string[] = []; page.on("pageerror", error => errors.push(error.message));
  await page.goto(route);
  const root = page.locator("[data-anchored-algebra]"), card = root.locator("[data-composed-card]"), stage = card.locator("[data-distribution-stage]");
  await expect(root).toHaveAttribute("data-anchored-status", /ready|repair-gap/, { timeout: 90_000 });
  await card.screenshot({ path: info.outputPath("initial.png") });
  expect(await root.locator("[data-anchored-error]").textContent()).toBe("");
  await expect(root).toHaveAttribute("data-anchored-status", "ready");
  await expect(root.locator("[data-anchored-static]")).toBeHidden();
  await expect(stage.locator("[data-kp-canonical-equation-host]")).toHaveCount(1);
  const slider = card.locator("[data-kp-focus-deck-scrubber]");
  const poses = new Map<number, unknown>();
  for (const step of [0, .5, 1, 1.5, 2, 2.5, 3, 2, 1, 0]) {
    await slider.evaluate((node, value) => { (node as HTMLInputElement).value = String(value); node.dispatchEvent(new Event("input")); }, step);
    await expect(root).toHaveAttribute("data-anchored-status", "ready");
    if (!Number.isInteger(step)) { await expect(stage.locator(".anchored-labels")).toBeHidden(); continue; }
    await expect(stage).toHaveAttribute("data-anchored-state", source.states[step]!.id);
    await expect(stage.locator("[data-kp-reader-native-endpoint-passed]")).toHaveAttribute("data-kp-reader-native-endpoint-passed", "true");
    const pose = await stage.evaluate(stage => {
      const bounds = stage.getBoundingClientRect();
      return [...stage.querySelectorAll<HTMLElement>("[data-kp-focus-deck-annotation]")].map(label => {
        const rect = label.getBoundingClientRect();
        return { text: label.textContent, x: rect.x - bounds.x, y: rect.y - bounds.y, width: rect.width, height: rect.height,
          fits: rect.left >= bounds.left && rect.right <= bounds.right && rect.top >= bounds.top && rect.bottom <= bounds.bottom };
      });
    });
    expect(pose).toHaveLength(2); expect(pose.every(label => label.fits)).toBe(true);
    if (poses.has(step)) expect(pose).toEqual(poses.get(step)); else { poses.set(step, pose); await card.screenshot({ path: info.outputPath(`desktop-stop-${step}.png`) }); }
  }
  await card.getByRole("button", { name: "Next step", exact: true }).click();
  await expect(card).toHaveAttribute("data-composed-step", "1", { timeout: 15_000 });
  await expect(stage).toHaveAttribute("data-anchored-state", source.states[1]!.id);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 390, height: 1000 });
  for (let step = 0; step < 4; step++) {
    await root.locator(`[data-anchored-jump="${source.states[step]!.id}"]`).click();
    await expect(stage).toHaveAttribute("data-anchored-state", source.states[step]!.id);
    await expect(root).toHaveAttribute("data-anchored-status", "ready");
    await card.screenshot({ path: info.outputPath(`phone-stop-${step}.png`) });
  }
  await page.reload();
  await expect(stage).toHaveAttribute("data-anchored-state", source.states[3]!.id, { timeout: 90_000 });
  await page.goBack();
  await expect(stage).toHaveAttribute("data-anchored-state", source.states[2]!.id);
  expect(errors).toEqual([]);
});

test("missing or duplicate native anchors withdraw commentary and report a repair", async ({ page }) => {
  test.setTimeout(120_000);
  const errors: string[] = []; page.on("pageerror", error => errors.push(error.message));
  await page.goto(route);
  const root = page.locator("[data-anchored-algebra]"), labels = root.locator(".anchored-labels");
  await expect(root).toHaveAttribute("data-anchored-status", "ready", { timeout: 90_000 });
  for (const defect of ["missing", "duplicate"] as const) {
    await page.evaluate(defect => {
      const selector = document.querySelector<HTMLElement>('[data-kp-reader-transition-active="true"] [data-kp-reader-native="source"] [data-kp-reader-selector-id="state.what-counts.repeated.paint.left-factor"]')!;
      if (defect === "missing") selector.removeAttribute("data-kp-reader-selector-id");
      else {
        // Corrupt this adapter's selector binding without duplicating the
        // compositor's independent measurement/paint ownership attributes.
        const duplicate = document.createElement("span");
        duplicate.dataset["kpReaderSelectorId"] = selector.dataset["kpReaderSelectorId"]!;
        selector.after(duplicate);
      }
      window.dispatchEvent(new Event("resize"));
    }, defect);
    await expect(root).toHaveAttribute("data-anchored-status", "repair-gap");
    await expect(labels).toBeHidden();
    await expect(root.getByRole("alert")).toContainText("exactly one native selector");
    await page.reload(); await expect(root).toHaveAttribute("data-anchored-status", "ready", { timeout: 90_000 });
  }
  expect(errors).toEqual([]);
});

test("static reading and stale direct links stay explicit", async ({ browser, page }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const staticPage = await context.newPage(); await staticPage.goto(route);
  await staticPage.getByText("Read the explanation without motion", { exact: true }).click();
  await expect(staticPage.locator(".anchored-reading .katex")).toHaveCount(4);
  await expect(staticPage.getByText("Now look inside one copy.", { exact: true })).toBeVisible();
  await context.close();
  await page.goto(`${route}&revision=stale#state.what-counts.opened`);
  await expect(page.locator("[data-anchored-algebra]")).toHaveAttribute("data-anchored-status", "repair-gap");
  await expect(page.getByRole("alert")).toContainText("different explanation revision");
  await expect(page.locator(".anchored-labels")).toHaveCount(0);
});
