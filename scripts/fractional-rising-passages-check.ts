import assert from "node:assert/strict";
import path from "node:path";
import type { Page } from "playwright";
import { inspectPaint } from "./fractional-linear-theme-comparison.ts";

/** One local caption candidate; preserve real document, clock and equation paint. */
export async function checkFractionalRisingPassages(page: Page, baseUrl: string, outputRoot: string) {
  // The first paint must already be the caption shell, even before hydration.
  const startupContext = await page.context().browser()!.newContext();
  try {
    await startupContext.route('**/*', (route) => route.request().resourceType() === 'script' ? route.abort() : route.continue());
    const startupPage = await startupContext.newPage();
    await startupPage.goto(new URL('/reader/solve-fractional-linear/', baseUrl).toString(), { waitUntil: 'networkidle' });
    assert.equal(await startupPage.locator('body').getAttribute('data-kp-caption-mode'), 'captions');
    assert.equal(await startupPage.locator('body').getAttribute('data-kp-reader-hydrated'), null);
    assert.ok(await startupPage.locator('.kp-caption-document-intro').isVisible());
    assert.ok(await startupPage.locator('[data-kp-rising-beat="beat.read"] .kp-caption-copy').isVisible());
    assert.ok(await startupPage.locator('.kp-animation-static .katex').first().isVisible());
    assert.equal(await startupPage.locator('.kp-animation-static > [data-kp-static-state]:visible').count(), 1,
      'Only the initial equation may paint before hydration');
    const frame = await startupPage.locator('.kp-caption-frame').boundingBox();
    assert.ok(frame && frame.width <= 440);
    const staticState = await startupPage.locator('.kp-animation-static > [data-kp-static-state]:not([hidden])').evaluate((node) => ({
      height: node.getBoundingClientRect().height,
      border: getComputedStyle(node).borderTopWidth,
      background: getComputedStyle(node).backgroundColor
    }));
    assert.deepEqual(staticState, { height: 96, border: '0px', background: 'rgba(0, 0, 0, 0)' },
      'The initial equation must occupy the compact stage without painting an old nested card');
    await startupPage.screenshot({ path: path.join(outputRoot, 'caption-before-hydration.png') });
  } finally {
    await startupContext.close();
  }
  for (const size of [{ width: 1280, height: 900 }, { width: 390, height: 844 }]) {
    await page.setViewportSize(size);
    await page.goto(new URL("/reader/solve-fractional-linear/", baseUrl).toString(), { waitUntil: "networkidle" });
    await page.waitForFunction(() => document.body.dataset["kpCaptionMode"] === "captions");
    await page.waitForFunction(() => document.querySelector('.kp-caption-preview') !== null);
    // A persisted pagehide must retain the live runtime for browser restoration.
    await page.evaluate(() => {
      window.dispatchEvent(new PageTransitionEvent('pagehide', { persisted: true }));
      window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true }));
    });
    assert.equal(await page.locator('.kp-caption-frame').count(), 1);
    assert.equal(await page.locator('.kp-caption-preview').count(), 1);
    await page.screenshot({ path: path.join(outputRoot, `caption-card-initial-${size.width}.png`) });
    const embedding = await page.evaluate(() => {
      const pin = document.querySelector<HTMLElement>('.kp-caption-pin')!;
      const section = document.querySelector('.kp-caption-sequence')!.getBoundingClientRect();
      const target = parseFloat(getComputedStyle(pin).top);
      const paragraph = pin.querySelector('[data-kp-rising-beat="beat.read"] p')!;
      const link = paragraph.querySelector('.kp-semantic-link')!;
      return {
        start: scrollY + section.top - target,
        end: scrollY + section.bottom - pin.getBoundingClientRect().height - target,
        target, initialTop: pin.getBoundingClientRect().top,
        weight: getComputedStyle(paragraph).fontWeight,
        spacing: parseFloat(getComputedStyle(paragraph).letterSpacing),
        linkColor: getComputedStyle(link).color, textColor: getComputedStyle(paragraph).color,
        headingsHidden: [...pin.querySelectorAll('h2')].every((heading) => getComputedStyle(heading).display === 'none')
      };
    });
    assert.ok(embedding.initialTop > embedding.target + 40, 'The card must begin in the document, below its pin position');
    assert.ok(embedding.headingsHidden);
    assert.equal(embedding.weight, '300');
    assert.ok(embedding.spacing > .2);
    assert.notEqual(embedding.linkColor, embedding.textColor, 'Semantic references must retain their palette color');
    for (const [name, y, expectedTop] of [
      ['approach', embedding.start / 2, embedding.initialTop - embedding.start / 2],
      ['pinned', embedding.start + 100, embedding.target],
      ['release', embedding.end + 100, embedding.target - 100],
      ['rewind', embedding.start + 100, embedding.target]
    ] as const) {
      await page.evaluate((top) => { window.dispatchEvent(new WheelEvent('wheel')); scrollTo(0, top); }, y);
      await settle(page);
      const top = await page.locator('.kp-caption-pin').evaluate((node) => node.getBoundingClientRect().top);
      assert.ok(Math.abs(top - expectedTop) < 2, `Document ${name} must follow native sticky geometry: ${top} vs ${expectedTop}`);
      if (name === 'release') {
        assert.equal(await page.locator('body').getAttribute('data-kp-reader-progress'), '1000');
        assert.ok(await page.locator('.kp-caption-document-after').evaluate((node) => node.getBoundingClientRect().top < innerHeight));
      }
      await page.screenshot({ path: path.join(outputRoot, `caption-${name}-${size.width}.png`) });
    }
    const samples = [];
    for (const distance of [.01, .15, .35, .65, .8, .86, .94, 1.01, .94, .35, .01]) {
      await page.evaluate((fraction) => {
        const slot = document.querySelector<HTMLElement>('[data-kp-caption-slot="beat.multiply"]')!;
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
        const preview = document.querySelector<HTMLElement>('.kp-caption-preview')!;
        const card = document.querySelector<HTMLElement>('.kp-caption-frame')!;
        return {
          hidden: passage.getAttribute("hidden"), opacity: getComputedStyle(passage).opacity,
          top: passage.getBoundingClientRect().top,
          nextOpacity: getComputedStyle(preview).opacity,
          copyBottom: passage.firstElementChild!.getBoundingClientRect().bottom,
          textColors: [...passage.querySelectorAll('p')].map((node) => getComputedStyle(node).color),
          foreground: getComputedStyle(document.body).color,
          previewTop: preview.firstElementChild?.getBoundingClientRect().top ?? 0,
          previewBottom: preview.firstElementChild?.getBoundingClientRect().bottom ?? 0,
          active: document.querySelectorAll('[data-kp-caption-active="true"]').length,
          progress: Number(document.body.dataset["kpReaderProgress"]),
          cardWidth: card.getBoundingClientRect().width,
          cardTop: card.getBoundingClientRect().top,
          cardColor: getComputedStyle(card).backgroundColor,
          stageTop: stage.getBoundingClientRect().top,
          stageBottom: stage.getBoundingClientRect().bottom,
          overflow: document.documentElement.scrollWidth - innerWidth
        };
      });
      if (distance < .65) assert.equal(sample.opacity, "1", "Reading and mathematical action keep full-opacity captions");
      assert.ok(sample.active <= 2, "Only current text and its faint preview can paint");
      assert.ok(!(sample.copyBottom > sample.cardTop && Number(sample.opacity) > .5 && Number(sample.nextOpacity) > .5), "Two visible captions must not compete at full reading contrast");
      assert.ok(sample.textColors.every((color) => color === sample.foreground));
      if (distance < .65) assert.ok(sample.stageTop - sample.copyBottom >= 11 && sample.stageTop - sample.copyBottom <= 14,
        "Caption content must rest just above the mathematical region");
      if (sample.hidden === null) assert.ok(sample.top < sample.stageTop);
      assert.ok(sample.cardWidth <= 440 && sample.cardWidth <= size.width - 30);
      assert.equal(sample.cardColor, "rgb(27, 37, 53)");
      assert.ok(sample.overflow <= 1);
      const ink = (await inspectPaint(page)).glyphs.filter((glyph) => glyph.opacity > 0 && glyph.width > 0 && glyph.height > 0);
      const inkBottom = Math.max(...ink.map((glyph) => glyph.y + glyph.height));
      const inkTop = Math.min(...ink.map((glyph) => glyph.y));
      assert.ok(inkBottom <= sample.stageBottom + 1);
      assert.ok(inkTop >= sample.stageTop && inkTop - sample.stageTop < 64,
        `Math must occupy the top of its region: ink=${inkTop}, stage=${sample.stageTop}, progress=${sample.progress}, width=${size.width}`);
      if (sample.previewTop < inkBottom && sample.previewBottom > inkTop) {
        assert.ok(Number(sample.nextOpacity) <= .035001,
          'The rising preview must remain extremely faint while crossing mathematical ink');
      }
      samples.push(sample);
      await page.screenshot({ path: path.join(outputRoot, `captions-${size.width}-${samples.length}.png`) });
    }
    assert.equal(samples[0]!.progress, 500);
    assert.equal(samples[1]!.progress, 500);
    assert.ok(samples[2]!.progress > 575 && samples[2]!.progress < 595);
    assert.equal(samples[3]!.progress, 667);
    assert.ok(samples.slice(3, 8).every((sample) => sample.progress === 667), "Equation holds throughout caption exchange");
    assert.equal(await page.locator(".kp-caption-rail").count(), 0);
    assert.equal(await page.locator(".kp-caption-rule").count(), 0);
    assert.equal(await page.locator(".kp-caption-preview[inert][aria-hidden='true']").count(), 1);
    assert.equal(await page.locator(".kp-caption-preview [id]").count(), 0);
    assert.equal(samples[5]!.opacity, '1', 'The outgoing caption must leave without fading');
    const gaps = samples.slice(4, 7).map((sample) => sample.previewTop - sample.copyBottom);
    assert.ok(Math.max(...gaps) - Math.min(...gaps) < .1,
      'Incoming and outgoing captions must keep a constant distance throughout their shared travel');
    assert.ok(Math.abs(samples[5]!.top - samples[5]!.cardTop) < .1,
      'Departure must clip at the card edge, not an inset caption boundary');
    assert.ok(Number(samples[6]!.nextOpacity) > 0 && Number(samples[6]!.nextOpacity) < 1);
    assert.deepEqual(samples[6], samples[8]);
    assert.deepEqual(samples[2], samples[9]);
    assert.deepEqual(samples[0], samples[10]);
    await page.reload({ waitUntil: "networkidle" });
    await settle(page);
    assert.equal(await page.locator("body").getAttribute("data-kp-reader-progress"), "500");
    assert.equal(await page.locator('[data-kp-rising-beat="beat.multiply"]').getAttribute("hidden"), null);

    await page.evaluate(() => {
      const slot = document.querySelector('[data-kp-caption-slot="beat.multiply"]')!;
      const header = document.querySelector('.kp-reader-masthead')!.getBoundingClientRect().height;
      const span = slot.nextElementSibling!.getBoundingClientRect().top - slot.getBoundingClientRect().top;
      window.scrollTo(0, scrollY + slot.getBoundingClientRect().top - header - (innerHeight - header) / 2 + span * .72);
    });
    await settle(page);
    const hint = await page.locator('.kp-caption-preview').evaluate((node) => ({
      opacity: Number(getComputedStyle(node).opacity), hidden: node.hasAttribute('hidden'),
      bottomGap: document.querySelector('.kp-caption-frame')!.getBoundingClientRect().bottom - node.firstElementChild!.getBoundingClientRect().bottom,
      pairGap: node.firstElementChild!.getBoundingClientRect().top
        - document.querySelector('[data-kp-rising-beat="beat.multiply"] .kp-caption-copy')!.getBoundingClientRect().bottom
    }));
    assert.ok(!hint.hidden && hint.opacity > 0 && hint.opacity <= .035);
    assert.ok(Math.abs(hint.pairGap - gaps[0]!) < .1,
      'The pair spacing must already hold when the preview first enters the card');
    assert.ok(hint.bottomGap >= 17 && hint.bottomGap < 60, 'The hint must enter from the bottom of the card');
    await page.screenshot({ path: path.join(outputRoot, `caption-bottom-preview-${size.width}.png`) });
    assert.equal(await page.locator('[data-kp-rising-beat="beat.multiply"]').evaluate((node) => getComputedStyle(node).opacity), '1',
      'The current caption must retain full opacity while the pair moves');
    const upcomingId = await page.evaluate(() => {
      const slot = document.querySelector('[data-kp-beat="beat.multiply"]')!;
      const next = slot.nextElementSibling!.querySelector<HTMLElement>('.kp-rising-passage')!;
      if (next.getAttribute('hidden') !== 'until-found') throw new Error('Preview exposed its searchable source prematurely');
      document.addEventListener('beforematch', () => { document.body.dataset['testPreviewReveal'] = 'true'; }, { once: true });
      location.hash = next.id;
      return next.id;
    });
    await settle(page);
    assert.equal(await page.locator('body').getAttribute('data-test-preview-reveal'), 'true');
    assert.equal(await page.locator('body').getAttribute('data-kp-reader-progress'), '667');
    assert.equal(await page.locator(`[id="${upcomingId}"]`).getAttribute('hidden'), null,
      'Native search reveal must reach the complete original even during its faint preview');

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
    assert.equal(await page.locator(".kp-rising-passage[hidden]:not([inert])").count(), 0);
    assert.equal(await page.locator("body").getAttribute("data-kp-caption-mode"), "document");
    assert.equal(await page.locator('body').getAttribute('data-kp-reader-progress'), '500',
      'Reading the ordinary transcript must not scrub the held equation');
    assert.ok(await page.locator('[data-kp-rising-beat="beat.multiply"]').evaluate((node) => {
      const rect = node.getBoundingClientRect(); return rect.top >= 0 && rect.bottom <= innerHeight;
    }),
      "Read all must retain the current passage in the reading viewport");
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
    const slot = document.querySelector('[data-kp-caption-slot="beat.multiply"]')!;
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
  assert.equal(await page.locator(".kp-caption-preview").getAttribute("hidden"), "");
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
    assert.equal(await staticPage.locator("body").getAttribute("data-kp-reader-layout"), "rising-passages");
    assert.ok(await staticPage.locator('.kp-rising-passage').evaluateAll((nodes) => nodes.every((node) =>
      getComputedStyle(node).position === 'static' && getComputedStyle(node).contentVisibility === 'visible')));
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
    assert.equal(await fallbackPage.locator(".kp-rising-passage[hidden]:not([inert])").count(), 0,
      "Unsupported native reveal must keep every explanation readable and searchable");
    assert.ok(await fallbackPage.getByRole("button", { name: "Read all", exact: true }).isDisabled());
  } finally {
    await fallbackContext.close();
  }
  process.stdout.write("Caption card: document entry/pin/release/rewind, prose styling, desktop/phone alignment, held-equation previews, URL, search, document mode, reduced motion and static/print fallback passed.\n");
}

async function settle(page: Page) {
  await page.evaluate(async () => {
    await document.fonts.ready;
    await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
  });
  await page.waitForTimeout(220);
}
