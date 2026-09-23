import { expect, test } from "@playwright/test";
import { kpTypeScriptFreeShippingRefactorContract as contract } from "../src/semantic/typescript-free-shipping-refactor-contract.ts";
import { prepareCodeClipboard, copyCodeSelection } from "./code-clipboard-browser-helper.ts";
const route = "/experiments/code-reasoning/";

test("shipping focus transfers one continuous stage with coordinated cues and enlarged-code scrolling", async ({ page }, info) => {
  await page.setViewportSize({ width: 1100, height: 850 });
  await page.goto(`${route}?reading=focus#before`);
  const root = page.locator("[data-code-reasoning]");
  await expect(root).toHaveAttribute("data-code-ready", "true");
  const card = root.locator(".shipping-focus-card");
  const stage = card.locator("[data-kp-typescript-refactor-stage]");
  const slider = card.getByRole("slider");
  await expect(stage).toBeVisible();
  await expect(root.locator("[data-code-source-slot]")).toBeHidden();
  await expect(root.locator("[data-kp-typescript-refactor-stage]")).toHaveCount(1);
  await stage.evaluate(node => { node.dataset["continuityProbe"] = "same"; });
  const box = () => stage.evaluate(node => ({ height: node.getBoundingClientRect().height, top: node.getBoundingClientRect().top + scrollY }));
  const initial = await box();
  await slider.press("ArrowRight");
  await expect.poll(async () => Number(await root.getAttribute("data-code-progress"))).toBeGreaterThan(0);
  expect(Number(await root.getAttribute("data-code-progress"))).toBeLessThan(.16);
  await expect(root).toHaveAttribute("data-code-progress", "0.16");
  await slider.press("ArrowRight");
  await expect(root).toHaveAttribute("data-code-progress", "0.34");
  await expect(card).toHaveAttribute("data-kp-focus-deck-active-beat", "stage.introduce-helper");
  expect(await box()).toEqual(initial);
  await slider.fill("0.42");
  const tokens = stage.locator("[data-kp-typescript-token-theater]");
  await expect(tokens).toHaveAttribute("data-kp-typescript-token-theater-active", "true");
  const pose = () => tokens.locator("[data-kp-typescript-token-id]").evaluateAll(nodes => nodes.map(node => node.outerHTML).sort());
  const held = await pose();
  await card.screenshot({ path: info.outputPath("shipping-focus-desktop.png") });
  await slider.fill("0.73"); await slider.fill("0.42");
  expect(await pose()).toEqual(held);
  for (const viewport of [{ width: 1000, height: 600 }, { width: 390, height: 844 }]) {
    await page.setViewportSize(viewport);
    await page.evaluate(() => { document.documentElement.style.fontSize = "24px"; });
    await expect.poll(() => card.evaluate(node => node.getBoundingClientRect().height)).toBeLessThan(viewport.height - 20);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await stage.evaluate(node => { node.scrollTop = node.scrollHeight; node.scrollLeft = node.scrollWidth; });
    await expect.poll(() => stage.evaluate(node => Math.abs(node.scrollHeight - node.clientHeight - node.scrollTop))).toBeLessThan(2);
    await expect.poll(() => stage.evaluate(node => Math.abs(node.scrollWidth - node.clientWidth - node.scrollLeft))).toBeLessThan(2);
  }
  await card.screenshot({ path: info.outputPath("shipping-focus-enlarged.png") });
  await expect(stage).toHaveAttribute("data-continuity-probe", "same");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await slider.press("End"); await slider.press("ArrowLeft");
  await expect(root).toHaveAttribute("data-code-progress", "0.84");
  await page.emulateMedia({ media: "print" });
  await expect(root.locator("[data-code-inspection]")).toBeHidden();
  await expect(root.locator('[data-code-record="before"]')).toBeVisible();
});

test("shipping copy uses complete projections and native selection survives checkpoint handoffs", async ({ page, context, browserName }) => {
  await prepareCodeClipboard(context, browserName);
  await page.goto(`${route}?reading=focus#before`);
  const root = page.locator("[data-code-reasoning]");
  await expect(root).toHaveAttribute("data-code-ready", "true");
  const card = root.locator(".shipping-focus-card");
  const stage = card.locator("[data-kp-typescript-refactor-stage]");
  const slider = card.getByRole("slider");
  for (const [progress, projection] of [[0, "before"], [.3, "helper-introduced"], [.53, "helper-introduced"], [.69, "cost-replaced"], [.91, "final"]] as const) {
    await slider.fill(String(progress));
    await card.getByRole("button", { name: "Copy code", exact: true }).click();
    await expect(root.locator("[data-shipping-copy-status]")).toContainText("Copied");
    const expected = await stage.locator(`[data-kp-typescript-projection-id="projection.typescript.${projection}"] code`).textContent();
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(expected);
    await expect(root).toHaveAttribute("data-code-progress", String(progress));
  }
  await slider.fill("0.53");
  await stage.dispatchEvent("pointerdown", { pointerType: "touch", button: 0 });
  await expect(root).toHaveAttribute("data-code-progress", "0.53");
  await stage.click({ position: { x: 25, y: 25 } });
  await expect(root).toHaveAttribute("data-code-progress", "0.5");
  await expect(stage.locator("[data-kp-typescript-token-theater]")).toHaveAttribute("data-kp-typescript-token-theater-active", "false");
  const keyword = stage.locator('[data-kp-typescript-projection-id="projection.typescript.helper-introduced"] [data-kp-typescript-syntax-kind="keyword"]').first();
  await keyword.dblclick();
  expect(await page.evaluate(() => getSelection()?.toString())).toBe("function");
  expect(await copyCodeSelection(page, stage, browserName)).toBe("function");
  await slider.fill("0.73");
  await expect(stage.locator("[data-kp-typescript-token-theater]")).toHaveAttribute("data-kp-typescript-token-theater-active", "true");
  await page.evaluate(() => Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: async () => { throw new Error("Denied"); } } }));
  await card.getByRole("button", { name: "Copy code", exact: true }).click();
  const fallback = root.locator("[data-shipping-copy-source]");
  await expect(fallback).toBeVisible();
  expect(await fallback.inputValue()).toBe(await stage.locator('[data-kp-typescript-projection-id="projection.typescript.cost-replaced"] code').textContent());
  await fallback.press("Home");
  await expect(root).toHaveAttribute("data-code-progress", "0.73");
});

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
  await root.locator("#before").screenshot({ path: info.outputPath("inspection.png") });
  await sample(.73); await sample(.42);
  expect(await tokenPose()).toEqual(pose);
  await expect(root.locator("#before [data-code-stage-host]")).toBeVisible();
  await expect(root.locator("#transition [data-code-stage-host]")).toHaveCount(0);
  const frame = await root.locator("[data-code-source-slot]").boundingBox();
  await page.getByRole("button", { name: "Show original", exact: true }).click();
  await expect(root).toHaveAttribute("data-code-view", "original");
  await expect(root.locator("[data-code-stage-host]")).toBeHidden();
  await expect(root).toHaveAttribute("data-code-progress", "0.42");
  expect(await root.locator("[data-code-source-slot]").boundingBox()).toEqual(frame);
  await page.getByRole("button", { name: "Return to inspection", exact: true }).click();
  await expect(root).toHaveAttribute("data-code-view", "inspection");
  expect(await tokenPose()).toEqual(pose);
  await page.locator("summary").filter({ hasText: "Why is this allowed? What has been checked?" }).click();
  await expect(root).toHaveAttribute("data-code-progress", "0.42");
  await page.getByText("Inspect where the rule goes", { exact: true }).click();
  await expect(root.locator("[data-code-stage-host]")).toBeHidden();
  await expect(root.locator('[data-code-record="before"]')).toHaveCSS("opacity", "1");
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
  await page.locator("summary").filter({ hasText: "Why is this allowed? What has been checked?" }).click();
  await page.emulateMedia({ media: "print" });
  await expect(root.locator("[data-code-inspection]")).toBeHidden();
  await expect(records.first()).toBeVisible(); await expect(records.last()).toBeVisible();
  await expect(root.locator(".code-print-disclosure tbody tr").first()).toBeVisible();
});

test("no-JS keeps the whole argument and reduced motion keeps endpoints", async ({ browser, page }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const staticPage = await context.newPage();
  await staticPage.goto("http://localhost:8000" + route);
  await expect(staticPage.locator("[data-code-record]")).toHaveCount(2);
  await expect(staticPage.locator("[data-code-inspection]")).toBeHidden();
  await staticPage.locator("summary").filter({ hasText: "Why is this allowed? What has been checked?" }).click();
  await expect(staticPage.locator(".code-screen-disclosure tbody tr")).toHaveCount(3);
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
