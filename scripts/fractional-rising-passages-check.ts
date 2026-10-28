import assert from "node:assert/strict";
import path from "node:path";
import type { Page } from "playwright";
import { inspectPaint } from "./fractional-linear-theme-comparison.ts";

/** One local caption candidate; preserve real document, clock and equation paint. */
export async function checkFractionalRisingPassages(page: Page, baseUrl: string, outputRoot: string) {
  for (const size of [{ width: 1280, height: 900 }, { width: 390, height: 844 }]) {
    await page.setViewportSize(size);
    await page.goto(new URL("/reader/solve-fractional-linear/", baseUrl).toString(), { waitUntil: "networkidle" });
    await page.waitForFunction(() => document.body.dataset["kpCaptionMode"] === "captions");
    const samples = [];
    for (const distance of [0.01, 0.1, 0.3, 0.5, 0.6, 0.3, 0.01]) {
      await page.evaluate((fraction) => {
        const slot = document.querySelector<HTMLElement>('[data-kp-beat="beat.multiply"]')!;
        const header = document.querySelector(".kp-reader-masthead")!.getBoundingClientRect().height;
        const available = innerHeight - header;
        window.dispatchEvent(new WheelEvent("wheel"));
        window.scrollTo(0, scrollY + slot.getBoundingClientRect().top - header - available / 2 + available * fraction);
      }, distance);
      await settle(page);
      const sample = await page.evaluate(() => {
        const passage = document.querySelector<HTMLElement>('[data-kp-rising-beat="beat.multiply"]')!;
        const stage = document.querySelector<HTMLElement>('[data-kp-reader-equation-stage]')!;
        return {
          hidden: passage.getAttribute("hidden"), opacity: getComputedStyle(passage).opacity,
          top: passage.getBoundingClientRect().top,
          active: document.querySelectorAll('[data-kp-caption-active="true"]').length,
          progress: Number(document.body.dataset["kpReaderProgress"]),
          stageBottom: stage.getBoundingClientRect().bottom,
          overflow: document.documentElement.scrollWidth - innerWidth
        };
      });
      assert.equal(sample.opacity, "1", "Captions never fade");
      assert.equal(sample.hidden, distance < .56 ? null : "until-found");
      assert.equal(sample.active, distance < .56 ? 1 : 0);
      if (distance < .56) assert.ok(Math.abs(sample.top - sample.stageBottom - 16) < 1);
      assert.ok(sample.overflow <= 1);
      const ink = (await inspectPaint(page)).glyphs.filter((glyph) => glyph.opacity > 0 && glyph.width > 0 && glyph.height > 0);
      const inkBottom = Math.max(...ink.map((glyph) => glyph.y + glyph.height));
      assert.ok(sample.stageBottom - inkBottom >= 12 && sample.stageBottom - inkBottom < 80);
      samples.push(sample);
      await page.screenshot({ path: path.join(outputRoot, `captions-${size.width}-${samples.length}.png`) });
    }
    assert.equal(samples[0]!.progress, 500);
    assert.equal(samples[1]!.progress, 500);
    assert.ok(samples[2]!.progress > 575 && samples[2]!.progress < 595);
    assert.equal(samples[3]!.progress, 667);
    assert.equal(samples[4]!.progress, 667);
    assert.deepEqual(samples[2], samples[5]);
    assert.deepEqual(samples[0], samples[6]);
    await page.reload({ waitUntil: "networkidle" });
    await settle(page);
    assert.equal(await page.locator("body").getAttribute("data-kp-reader-progress"), "500");
    assert.equal(await page.locator('[data-kp-rising-beat="beat.multiply"]').getAttribute("hidden"), null);

    await page.locator(".kp-rising-navigation summary").click();
    await page.locator('.kp-lesson-toc a[href="#beat.read"]').click();
    await settle(page);
    assert.equal(await page.locator("body").getAttribute("data-kp-reader-progress"), "0");
    await page.evaluate(() => window.scrollBy(0, innerHeight * 1.2));
    await settle(page);
    assert.ok(Number(await page.locator("body").getAttribute("data-kp-reader-progress")) > 0,
      "Native scrolling after a menu jump must release the controlled sample");

    // window.find proves text is indexed, but Chromium's scripting API does
    // not run the Find UI's reveal algorithm. Native fragment navigation does.
    const found = await page.evaluate(() => {
      window.getSelection()?.removeAllRanges();
      return "find" in window && typeof window.find === "function"
        && window.find("A factor of two enters on each side");
    });
    assert.equal(found, true, "Native find must reach an inactive explanation");
    await page.locator(".kp-rising-navigation summary").click();
    await page.locator('.kp-lesson-toc a[href="#beat.read"]').click();
    await settle(page);
    await page.evaluate(() => {
      document.addEventListener("beforematch", () => { document.body.dataset["testBeforematch"] = "true"; }, { once: true });
      location.hash = "caption.beat.multiply";
    });
    await settle(page);
    assert.equal(await page.locator("body").getAttribute("data-test-beforematch"), "true");
    assert.equal(await page.locator('[data-kp-rising-beat="beat.multiply"]').getAttribute("hidden"), null,
      "Native reveal must expose the actual matching text");
    assert.equal(await page.locator("body").getAttribute("data-kp-reader-progress"), "500",
      "Revealing a caption must synchronize its source equation");
    await page.screenshot({ path: path.join(outputRoot, `captions-find-${size.width}.png`) });

    await page.getByRole("button", { name: "Read all", exact: true }).click();
    await settle(page);
    assert.equal(await page.locator(".kp-rising-passage[hidden]").count(), 0);
    assert.equal(await page.locator("body").getAttribute("data-kp-caption-mode"), "document");
    const readingOffset = await page.locator('[data-kp-rising-beat="beat.multiply"]').evaluate((passage) =>
      passage.getBoundingClientRect().top - document.querySelector('[data-kp-reader-equation-stage]')!.getBoundingClientRect().bottom);
    assert.ok(readingOffset >= -2 && readingOffset < 30,
      "Read all must retain the current passage at the reading boundary");
    await page.screenshot({ path: path.join(outputRoot, `captions-document-${size.width}.png`) });
    await page.getByRole("button", { name: "Read all", exact: true }).click();
    await page.keyboard.press("PageDown");
    await settle(page);
    assert.ok(Number(await page.locator("body").getAttribute("data-kp-reader-progress")) > 500);
  }
  await page.emulateMedia({ media: "print" });
  assert.equal(await page.locator("[data-kp-reader-equation-stage]").evaluate((node) => getComputedStyle(node).display), "none");
  assert.ok(await page.locator(".kp-rising-passage").evaluateAll((nodes) => nodes.every((node) => getComputedStyle(node).contentVisibility === "visible")));
  await settle(page);
  await page.emulateMedia({ media: "screen" });
  await settle(page);
  assert.ok(await page.locator("[data-kp-reader-equation-stage]").isVisible());
  const staticContext = await page.context().browser()!.newContext({ javaScriptEnabled: false });
  try {
    const staticPage = await staticContext.newPage();
    await staticPage.goto(new URL("/reader/solve-fractional-linear/", baseUrl).toString());
    assert.equal(await staticPage.locator("body").getAttribute("data-kp-reader-layout"), null);
    assert.ok(await staticPage.locator(".kp-animation-static .katex").first().isVisible());
  } finally {
    await staticContext.close();
  }
  const fallbackContext = await page.context().browser()!.newContext();
  try {
    await fallbackContext.addInitScript(() => {
      // Simulate an older browser without the native reveal capability.
      let prototype = HTMLElement.prototype;
      while (prototype !== null) {
        Reflect.deleteProperty(prototype, "onbeforematch");
        prototype = Object.getPrototypeOf(prototype);
      }
    });
    const fallbackPage = await fallbackContext.newPage();
    await fallbackPage.goto(new URL("/reader/solve-fractional-linear/", baseUrl).toString(), { waitUntil: "networkidle" });
    await fallbackPage.waitForFunction(() => document.body.dataset["kpCaptionMode"] === "document");
    assert.equal(await fallbackPage.locator(".kp-rising-passage[hidden]").count(), 0,
      "Unsupported native reveal must keep every explanation readable and searchable");
    assert.ok(await fallbackPage.getByRole("button", { name: "Read all", exact: true }).isDisabled());
  } finally {
    await fallbackContext.close();
  }
  process.stdout.write("Captions: desktop/phone holds, fixed text, rewind, URL, search indexing, native reveal, document mode, print return and native scrolling passed.\n");
}

async function settle(page: Page) {
  await page.evaluate(async () => {
    await document.fonts.ready;
    await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
  });
  await page.waitForTimeout(220);
}
