import { expect, test, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { example } from "../content/authoring/convergence/matrix-example.ts";
import { compile } from "../src/authoring/matrix-columns/compile.ts";

const route = "/experiments/matrix-column-combinations/?author=1";
const draft = (page: Page) => page.locator("[data-matrix-json]");
const status = (page: Page) => page.locator("[data-matrix-status]");
async function start(page: Page) {
  await page.goto(route);
  await expect(page.locator("#comb-player")).toHaveAttribute("data-ready", "true");
}
async function download(page: Page, name: string) {
  const pending = page.waitForEvent("download"); await page.getByRole("button", { name, exact: true }).click();
  const result = await pending; return readFile((await result.path())!, "utf8");
}
const seek = (page: Page, value: number) => page.locator("[data-scrub]").evaluate((node, value) => {
  if (!(node instanceof HTMLInputElement)) throw new Error("Missing scrubber");
  node.value = String(value); node.dispatchEvent(new Event("input", { bubbles: true }));
}, value);

test("explicit edits, both columns and downloads bind the displayed revision; reload restores starter", async ({ page }) => {
  const errors: string[] = []; page.on("pageerror", error => errors.push(error.message));
  await start(page); const initial = await draft(page).inputValue();
  const source = example(); source.left = [[-2, 3], [4, -1]]; source.right = [[-1, 2], [2, -3]];
  source.reading.title = "Edited source <b>literal</b>";
  await draft(page).fill(JSON.stringify(source)); await seek(page, 0.63);
  expect(JSON.parse(await download(page, "Download displayed source"))).toEqual(JSON.parse(initial));
  await page.getByRole("button", { name: "Apply source", exact: true }).click();
  await expect(page.locator("#comb-player")).toHaveAttribute("data-revision", compile(source).revision);
  await expect(page.locator("h1")).toHaveText(source.reading.title);
  await expect(page.locator("h1 b")).toHaveCount(0);
  await expect(page.getByRole("slider")).toHaveValue("0.63");
  for (const column of [1, 0, 1]) {
    await page.locator("[data-column-navigation] a").nth(column).focus();
    await page.locator("[data-column-navigation] a").nth(column).press("Enter");
    await expect(page.locator("#comb-player")).toHaveAttribute("data-column", String(column));
    await expect(page.locator("[data-column-navigation] a").nth(column)).toBeFocused();
    await expect(page.getByRole("slider")).toHaveValue("0.63");
    await seek(page, 1); await seek(page, 0); await seek(page, 0.63);
  }
  expect(JSON.parse(await download(page, "Download displayed source"))).toEqual(source);
  await draft(page).fill("{broken"); await page.getByRole("button", { name: "Apply source", exact: true }).click();
  await expect(status(page)).toContainText("at $");
  expect(await download(page, "Download draft")).toBe("{broken");
  expect(JSON.parse(await download(page, "Download displayed source"))).toEqual(source);
  await page.reload(); await expect(page.locator("#comb-player")).toHaveAttribute("data-ready", "true");
  expect(await draft(page).inputValue()).toBe(initial); expect(errors).toEqual([]);
});

test("file import is bounded, explicit and round trips through the displayed download", async ({ page }) => {
  await start(page); const source = { ...example(), id: "imported" }; source.reading.title = "Imported";
  const file = page.locator("[data-matrix-file]");
  await file.setInputFiles({ name: "source.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify(source)) });
  await expect(status(page)).toContainText("File loaded");
  await expect(page.locator("h1")).not.toHaveText("Imported");
  await page.getByRole("button", { name: "Apply source", exact: true }).click();
  await expect(page.locator("h1")).toHaveText("Imported");
  const exported = await download(page, "Download displayed source");
  await file.setInputFiles({ name: "large.json", mimeType: "application/json", buffer: Buffer.alloc(100001, 32) });
  await expect(status(page)).toContainText("100,000");
  await file.setInputFiles({ name: "invalid.json", mimeType: "application/json", buffer: Buffer.from([0xff]) });
  await expect(status(page)).toContainText("File not loaded");
  await page.reload(); await expect(page.locator("#comb-player")).toHaveAttribute("data-ready", "true");
  await file.setInputFiles({ name: "roundtrip.json", mimeType: "application/json", buffer: Buffer.from(exported) });
  await expect(status(page)).toContainText("File loaded");
  await page.getByRole("button", { name: "Apply source", exact: true }).click();
  await expect(page.locator("#comb-player")).toHaveAttribute("data-revision", compile(source).revision);
});

test("typing supersedes a slow file read and a pending preview", async ({ page }) => {
  await start(page);
  await page.evaluate(() => {
    const read = File.prototype.arrayBuffer;
    File.prototype.arrayBuffer = async function () {
      document.documentElement.dataset["filePending"] = "true";
      await new Promise<void>(resolve => window.addEventListener("release-file", () => resolve(), { once: true }));
      const bytes = await read.call(this);
      document.documentElement.dataset["fileReadDone"] = "true";
      return bytes;
    };
  });
  await page.locator("[data-matrix-file]").setInputFiles({ name: "old.json", mimeType: "application/json", buffer: Buffer.from("old file") });
  await expect(page.locator("html")).toHaveAttribute("data-file-pending", "true");
  await draft(page).fill("new typing"); await page.evaluate(() => window.dispatchEvent(new Event("release-file")));
  await expect(page.locator("html")).toHaveAttribute("data-file-read-done", "true");
  await expect(draft(page)).toHaveValue("new typing");
  await expect(page.locator("[data-matrix-file]")).toHaveValue("");
  const before = await page.locator("#comb-player").getAttribute("data-revision");
  await page.evaluate(() => {
    const observe = ResizeObserver.prototype.observe;
    ResizeObserver.prototype.observe = function (target, options) {
      document.documentElement.dataset["preparedCandidate"] = "true";
      observe.call(this, target, options);
    };
    const load = document.fonts.load.bind(document.fonts);
    document.fonts.load = async (...args) => {
      await new Promise<void>(resolve => window.addEventListener("release-fonts", () => resolve(), { once: true }));
      return load(...args);
    };
  });
  const source = { ...example(), id: "superseded" };
  await draft(page).fill(JSON.stringify(source)); await page.getByRole("button", { name: "Apply source", exact: true }).click();
  await expect(status(page)).toHaveText("Preparing preview…");
  await draft(page).fill("newer"); await page.evaluate(() => window.dispatchEvent(new Event("release-fonts")));
  await expect(page.locator("html")).toHaveAttribute("data-prepared-candidate", "true");
  await expect(page.locator(".matrix-source-staging")).toHaveCount(0);
  await expect(page.locator("#comb-player")).toHaveAttribute("data-revision", before!);
  await expect(status(page)).toContainText("Draft changed");
});

test("mount failure preserves usable preview; repeated replacements and disposal release owners", async ({ page }) => {
  await page.addInitScript(() => {
    const Native = ResizeObserver, observers = new Set<ResizeObserver>();
    window.ResizeObserver = class extends Native {
      override observe(target: Element, options?: ResizeObserverOptions) {
        observers.add(this); document.documentElement.dataset["observers"] = String(observers.size); super.observe(target, options);
      }
      override disconnect() { observers.delete(this); document.documentElement.dataset["observers"] = String(observers.size); super.disconnect(); }
    };
  });
  await start(page); await seek(page, 0.45);
  await page.evaluate(() => {
    const observe = ResizeObserver.prototype.observe;
    ResizeObserver.prototype.observe = function (target, options) {
      observe.call(this, target, options); ResizeObserver.prototype.observe = observe; throw new Error("Injected mount failure");
    };
  });
  await page.getByRole("button", { name: "Apply source", exact: true }).click();
  await expect(status(page)).toContainText("Injected mount failure");
  await expect(page.getByRole("slider")).toHaveValue("0.45");
  await expect(page.locator("html")).toHaveAttribute("data-observers", "1");
  for (let i = 0; i < 3; i++) {
    await page.getByRole("button", { name: "Apply source", exact: true }).click();
    await expect(status(page)).toContainText("Displayed source is checked");
    await expect(page.locator("html")).toHaveAttribute("data-observers", "1");
    await expect(page.locator("[data-matrix-preview]")).toHaveCount(1);
  }
  await page.evaluate(() => window.dispatchEvent(new PageTransitionEvent("pagehide", { persisted: true })));
  await expect(page.getByRole("slider")).toHaveValue("0.45");
  await page.evaluate(() => window.dispatchEvent(new PageTransitionEvent("pageshow", { persisted: true })));
  await page.evaluate(() => window.dispatchEvent(new PageTransitionEvent("pagehide")));
  await expect(page.locator("html")).toHaveAttribute("data-observers", "0");
  await expect(page.locator("[data-matrix-preview]")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Download displayed source", exact: true })).toBeDisabled();
});

test("ordinary readers never request the optional editor and phone preview stays usable", async ({ page }) => {
  const requests: string[] = []; page.on("request", request => requests.push(request.url()));
  await page.goto("/experiments/matrix-column-combinations/?input=dependent-columns");
  await expect(page.locator("#comb-player")).toHaveAttribute("data-ready", "true");
  expect(requests.some(url => url.includes("/author.ts") || url.includes("/matrix-columns/compile.ts") || url.includes("/matrix-columns/session.ts"))).toBe(false);
  await page.setViewportSize({ width: 390, height: 844 }); await start(page);
  await page.getByRole("button", { name: "Apply source", exact: true }).click();
  await expect(status(page)).toContainText("Displayed source is checked");
  await seek(page, 1); await seek(page, 0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
});
