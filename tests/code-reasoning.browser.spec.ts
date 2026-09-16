import { expect, test } from "@playwright/test";
import { kpTypeScriptFreeShippingRefactorContract as contract } from "../src/semantic/typescript-free-shipping-refactor-contract.ts";
const route = "/experiments/code-reasoning/";

test("persistent code survives continuous inspection, reverse, disclosure and print", async ({ page }, info) => {
  await page.goto(route);
  const root = page.locator("[data-code-reasoning]");
  const records = root.locator("[data-code-record]");
  await expect(records).toHaveCount(2);
  await expect(root.locator("[data-code-stage-host]")).toBeEmpty();
  await root.screenshot({ path: info.outputPath("static-record.png") });
  await page.getByText("Inspect where the rule goes", { exact: true }).click();
  await expect(root).toHaveAttribute("data-code-ready", "true");
  const seek = page.getByRole("slider", { name: "Inspect the refactor" });
  const sample = async (value: number) => {
    await seek.fill(String(value));
    await seek.dispatchEvent("input");
    await expect(root).toHaveAttribute("data-code-progress", String(value));
  };
  await sample(.42);
  const tokens = root.locator("[data-kp-typescript-token-theater]");
  await expect(tokens).toHaveAttribute("data-kp-typescript-token-theater-active", "true");
  // Retained native owners may have a different insertion order after rewind;
  // identity, paint attributes and text must still resolve to the same pose.
  const tokenPose = () => tokens.locator("[data-kp-typescript-token-id]").evaluateAll(nodes => nodes.map(node => node.outerHTML).sort());
  const pose = await tokenPose();
  await root.locator("[data-code-inspection]").screenshot({ path: info.outputPath("inspection.png") });
  await sample(.73); await sample(.42);
  expect(await tokenPose()).toEqual(pose);
  await page.getByText("Why is this allowed? What has been checked?", { exact: true }).click();
  await expect(root).toHaveAttribute("data-code-progress", "0.42");
  await page.getByText("Inspect where the rule goes", { exact: true }).click();
  await page.getByText("Inspect where the rule goes", { exact: true }).click();
  await expect(root).toHaveAttribute("data-code-progress", "0.42");
  await page.mouse.wheel(0, 200);
  await expect(root).toHaveAttribute("data-code-progress", "0.42");
  await seek.press("Home");
  await seek.press("ArrowRight");
  await expect.poll(async () => Number(await root.getAttribute("data-code-progress"))).toBeGreaterThan(0);
  await expect.poll(async () => Number(await root.getAttribute("data-code-progress"))).toBeLessThan(.16);
  await expect(root).toHaveAttribute("data-code-progress", "0.16", { timeout: 5000 });
  await seek.press("End");
  await expect(root.locator("[data-kp-typescript-active-projection]")).toHaveAttribute("data-kp-typescript-active-projection", "projection.typescript.final");
  for (const revision of ["before", "after"] as const) {
    expect(await root.locator(`[data-code-record="${revision}"] code`).textContent()).toBe(contract[revision].source);
  }
  await page.getByText("Why is this allowed? What has been checked?", { exact: true }).click();
  await page.emulateMedia({ media: "print" });
  await expect(root.locator("[data-code-inspection]")).toBeHidden();
  await expect(records.first()).toBeVisible(); await expect(records.last()).toBeVisible();
  await expect(root.locator("tbody tr").first()).toBeVisible();
});

test("no-JS keeps the whole argument and reduced motion keeps endpoints", async ({ browser, page }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const staticPage = await context.newPage();
  await staticPage.goto("http://localhost:8000" + route);
  await expect(staticPage.locator("[data-code-record]")).toHaveCount(2);
  await expect(staticPage.locator("[data-code-inspection]")).toBeHidden();
  await staticPage.getByText("Why is this allowed? What has been checked?", { exact: true }).click();
  await expect(staticPage.locator("tbody tr")).toHaveCount(3);
  await context.close();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(route);
  await page.getByText("Inspect where the rule goes", { exact: true }).click();
  await expect(page.locator("[data-code-reasoning]")).toHaveAttribute("data-code-ready", "true");
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await expect(page.locator("[data-code-reasoning]")).toHaveAttribute("data-code-progress", "0.16");
  await page.getByRole("button", { name: "Previous", exact: true }).click();
  await expect(page.locator("[data-code-reasoning]")).toHaveAttribute("data-code-progress", "0");
});

test("stale source fails closed without removing the record", async ({ page }) => {
  await page.goto(route);
  await page.locator("[data-code-reasoning]").evaluate(node => node.setAttribute("data-code-source-pin", "stale"));
  await page.getByText("Inspect where the rule goes", { exact: true }).click();
  await expect(page.locator("[data-code-reasoning]")).toHaveAttribute("data-code-ready", "repair");
  await expect(page.locator("[data-code-error]")).toContainText("revision mismatch");
  await expect(page.locator("[data-code-record]")).toHaveCount(2);
  await expect(page.locator("[data-code-stage-host]")).toBeEmpty();
});

test("pointer drag holds continuously and narrow reading has no page overflow", async ({ page }) => {
  await page.goto(route);
  await page.getByText("Inspect where the rule goes", { exact: true }).click();
  const root = page.locator("[data-code-reasoning]");
  await expect(root).toHaveAttribute("data-code-ready", "true");
  const slider = page.getByRole("slider", { name: "Inspect the refactor" });
  await slider.scrollIntoViewIfNeeded();
  const box = (await slider.boundingBox())!;
  await page.mouse.move(box.x + 8, box.y + box.height / 2);
  await page.mouse.down();
  for (const fraction of [.2, .45, .7, .43]) {
    await page.mouse.move(box.x + box.width * fraction, box.y + box.height / 2);
    expect(Number(await root.getAttribute("data-code-progress"))).toBeCloseTo(fraction, 1);
  }
  await page.mouse.up();
  const held = await root.getAttribute("data-code-progress");
  await expect(root).toHaveAttribute("data-code-playing", "false");
  await page.mouse.wheel(0, 150);
  await expect(root).toHaveAttribute("data-code-progress", held!);
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});
