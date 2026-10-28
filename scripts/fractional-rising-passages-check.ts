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
    await page.screenshot({ path: path.join(outputRoot, `caption-card-initial-${size.width}.png`) });
    const samples = [];
    for (const distance of [.01, .15, .35, .65, .8, .86, .94, 1.01, .94, .35, .01]) {
      await page.evaluate((fraction) => {
        const slot = document.querySelector<HTMLElement>('[data-kp-beat="beat.multiply"]')!;
        const header = document.querySelector(".kp-reader-masthead")!.getBoundingClientRect().height;
        const available = innerHeight - header;
        const next = slot.nextElementSibling!;
        const span = next.getBoundingClientRect().top - slot.getBoundingClientRect().top;
        window.dispatchEvent(new WheelEvent("wheel"));
        window.scrollTo(0, scrollY + slot.getBoundingClientRect().top - header - available / 2 + span * fraction);
      }, distance);
      await settle(page);
      const sample = await page.evaluate(() => {
        const passage = document.querySelector<HTMLElement>('[data-kp-rising-beat="beat.multiply"]')!;
        const stage = document.querySelector<HTMLElement>('[data-kp-reader-equation-stage]')!;
        const next = passage.closest('[data-kp-beat]')!.nextElementSibling!.querySelector<HTMLElement>('.kp-rising-passage')!;
        const card = document.querySelector<HTMLElement>('.kp-caption-frame')!;
        return {
          hidden: passage.getAttribute("hidden"), opacity: getComputedStyle(passage).opacity,
          top: passage.getBoundingClientRect().top,
          nextOpacity: getComputedStyle(next).opacity,
          active: document.querySelectorAll('[data-kp-caption-active="true"]').length,
          progress: Number(document.body.dataset["kpReaderProgress"]),
          rail: Number(document.querySelector('.kp-caption-rail')!.getAttribute('aria-valuenow')),
          cardWidth: card.getBoundingClientRect().width,
          cardColor: getComputedStyle(card).backgroundColor,
          stageTop: stage.getBoundingClientRect().top,
          stageBottom: stage.getBoundingClientRect().bottom,
          overflow: document.documentElement.scrollWidth - innerWidth
        };
      });
      if (distance < .65) assert.equal(sample.opacity, "1", "Reading and mathematical action keep full-opacity captions");
      assert.ok(sample.active <= 1, "Outgoing and incoming text must not overlap");
      if (sample.hidden === null) assert.ok(sample.top < sample.stageTop);
      assert.ok(sample.cardWidth <= 440 && sample.cardWidth <= size.width - 30);
      assert.equal(sample.cardColor, "rgb(32, 34, 34)");
      assert.ok(sample.overflow <= 1);
      const ink = (await inspectPaint(page)).glyphs.filter((glyph) => glyph.opacity > 0 && glyph.width > 0 && glyph.height > 0);
      const inkBottom = Math.max(...ink.map((glyph) => glyph.y + glyph.height));
      assert.ok(inkBottom <= sample.stageBottom + 1);
      samples.push(sample);
      await page.screenshot({ path: path.join(outputRoot, `captions-${size.width}-${samples.length}.png`) });
    }
    assert.equal(samples[0]!.progress, 500);
    assert.equal(samples[1]!.progress, 500);
    assert.ok(samples[2]!.progress > 575 && samples[2]!.progress < 595);
    assert.equal(samples[3]!.progress, 667);
    assert.ok(samples.slice(3, 8).every((sample) => sample.progress === 667), "Equation holds throughout caption exchange");
    assert.ok(samples[0]!.rail < samples[1]!.rail && samples[1]!.rail < samples[2]!.rail);
    assert.equal(samples[4]!.rail, 100);
    assert.ok(Number(samples[5]!.opacity) > 0 && Number(samples[5]!.opacity) < 1);
    assert.ok(Number(samples[6]!.nextOpacity) > 0 && Number(samples[6]!.nextOpacity) < 1);
    assert.deepEqual(samples[6], samples[8]);
    assert.deepEqual(samples[2], samples[9]);
    assert.deepEqual(samples[0], samples[10]);
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
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.locator(".kp-rising-navigation summary").click();
  await page.locator('.kp-lesson-toc a[href="#beat.multiply"]').click();
  await page.evaluate(() => {
    const slot = document.querySelector('[data-kp-beat="beat.multiply"]')!;
    const span = slot.nextElementSibling!.getBoundingClientRect().top - slot.getBoundingClientRect().top;
    window.scrollBy(0, span * .86);
  });
  await settle(page);
  const reduced = await page.locator('[data-kp-caption-active="true"]').evaluateAll((nodes) =>
    nodes.map((node) => ({ opacity: getComputedStyle(node).opacity, offset: getComputedStyle(node).getPropertyValue("--kp-caption-offset") })));
  assert.deepEqual(reduced, [{ opacity: "1", offset: "0px" }], "Reduced motion replaces captions without sliding or fading");
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.keyboard.press("End");
  await settle(page);
  assert.equal(await page.locator(".kp-caption-rail-label").textContent(), "Done");
  assert.equal(await page.locator("body").getAttribute("data-kp-reader-progress"), "1000");
  await page.screenshot({ path: path.join(outputRoot, "caption-card-complete.png") });
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
  process.stdout.write("Caption card: desktop/phone rail, held-equation exchanges, rewind, URL, search indexing, native reveal, document mode, reduced motion, completion and print return passed.\n");
}

async function settle(page: Page) {
  await page.evaluate(async () => {
    await document.fonts.ready;
    await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
  });
  await page.waitForTimeout(220);
}
