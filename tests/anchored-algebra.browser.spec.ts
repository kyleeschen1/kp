import { test, expect, type Page } from "@playwright/test";
import source from "../content/authoring/algebra/what-counts.json" with { type: "json" };

const route = "/reader/what-counts/";
async function ready(page: Page) {
  await expect(page.locator('body')).toHaveAttribute('data-kp-animation-host-status', /ready|failed/, { timeout: 90_000 });
  await expect(page.locator('body')).toHaveAttribute('data-kp-animation-host-status', 'ready');
}
async function jump(page: Page, id: string) {
  await page.locator('.kp-rising-navigation > summary').click();
  await page.locator(`.kp-lesson-toc a[href="#${id}"]`).click();
}

async function nativeColor(page: Page, ref: string) {
  return page.locator('[data-kp-reader-equation-stage]').evaluate((stage, ref) => {
    const side = stage.dataset['kpReaderNativeEndpoint'];
    const target = stage.querySelector(`[data-kp-reader-transition-active="true"] [data-kp-reader-native="${side}"] [data-kp-reader-selector-id="${ref}"]`);
    return target ? getComputedStyle(target).color : undefined;
  }, ref);
}

test('annotation fades own their reading interval through reversal and restoration', async ({ page }, info) => {
  test.setTimeout(90_000);
  await page.goto(route); await ready(page);
  for (const width of [1100, 390]) {
    await page.setViewportSize({ width, height: 1000 });
    await jump(page, 'passage.state.what-counts.collected');
    const next = await page.evaluate(() => scrollY);
    await jump(page, source.states[0]!.id);
    const arrival = await page.evaluate(() => scrollY);
    const labels = page.locator('.anchored-labels');
    // Browser scroll quantization may land a fraction of a pixel before arrival.
    await expect.poll(async () => Number(await labels.evaluate(node => getComputedStyle(node).opacity))).toBeGreaterThan(.995);
    for (const [name, position] of [['enter', arrival - 16], ['leave', next - 48], ['reverse', arrival - 16]] as const) {
      await page.evaluate(top => scrollTo(0, top), position);
      await expect.poll(async () => Number(await labels.evaluate(node => getComputedStyle(node).opacity))).toBeGreaterThan(.3);
      await expect.poll(async () => Number(await labels.evaluate(node => getComputedStyle(node).opacity))).toBeLessThan(.7);
      expect(await page.locator('.kp-rising-passage').evaluateAll(nodes => nodes.every(node => getComputedStyle(node).opacity === '0'))).toBe(true);
      await expect(page.locator('.kp-animation-story')).toHaveAttribute('data-anchored-status', 'ready');
      await expect(page.locator('[data-kp-reader-native-endpoint-passed]')).toHaveAttribute('data-kp-reader-native-endpoint-passed', 'true');
      await page.screenshot({ path: info.outputPath(`${width}-annotation-${name}.png`) });
    }
    // Layout invalidation must preserve an in-progress reading handoff, even
    // when the equation's mathematical progress is unchanged across the hold.
    await page.evaluate(() => dispatchEvent(new Event('resize')));
    await expect.poll(async () => Number(await labels.evaluate(node => getComputedStyle(node).opacity))).toBeGreaterThan(.3);
    await expect.poll(async () => Number(await labels.evaluate(node => getComputedStyle(node).opacity))).toBeLessThan(.7);
    // Share is published when scrolling settles, not on every paint frame.
    await page.evaluate(() => dispatchEvent(new Event('scrollend')));
    const share = await page.locator('[data-kp-reader-share]').getAttribute('href');
    // Open a fresh document. Navigating to the current identical fragment asks
    // the browser to scroll its DOM anchor instead of booting URL restoration.
    await page.goto('about:blank');
    await page.goto(share!); await ready(page);
    await expect(labels).toBeVisible();
    await expect.poll(async () => Number(await labels.evaluate(node => getComputedStyle(node).opacity))).toBeGreaterThan(.3);
    await expect.poll(async () => Number(await labels.evaluate(node => getComputedStyle(node).opacity))).toBeLessThan(.7);
    await jump(page, source.states[0]!.id);
    await page.waitForTimeout(250);
    await expect.poll(async () => Number(await labels.evaluate(node => getComputedStyle(node).opacity))).toBeGreaterThan(.995);
  }
});

test('both readers release restored focus and share one replaceable paint policy', async ({ page }) => {
  test.setTimeout(120_000);
  await page.addInitScript(() => document.addEventListener('DOMContentLoaded', () => {
    document.body.style.setProperty('--kp-reader-focus-direct-color', 'rgb(90, 45, 120)');
  }));
  const cases = [
    { route, lesson: 'lesson.algebra.what-counts', version: '2', ref: 'state.what-counts.repeated.paint.left-factor', beat: 'passage.state.what-counts.repeated' },
    { route: '/reader/solve-fractional-linear/', lesson: 'lesson.solve-x.fractional-linear', version: '1', ref: 'equation.fractional-linear.initial.fraction.numerator.x', beat: 'beat.read' }
  ];
  for (const width of [1100, 390]) for (const example of cases) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto(example.route); await ready(page);
    await jump(page, example.beat);
    const neutral = await nativeColor(page, example.ref);
    expect(neutral).toBeTruthy();
    const focused = `${example.route}?kpLesson=${example.lesson}&kpVersion=${example.version}&kpProgress=0&kpFocus=${example.ref}`;
    for (const navigation of ['scroll', 'toc'] as const) {
      await page.goto(focused); await ready(page);
      const stage = page.locator('[data-kp-reader-equation-stage]');
      await expect(stage).toHaveAttribute('data-kp-reader-focus-source', 'url');
      expect(await stage.locator('.kp-reader-semantic-focus').evaluateAll(nodes =>
        nodes.every(node => getComputedStyle(node).transitionDuration === '0s'))).toBe(true);
      // One central policy changes actual native paint in both hosts without
      // editing source equations, selectors, beats or renderer treatments.
      expect(await nativeColor(page, example.ref)).toBe('rgb(90, 45, 120)');
      expect(await nativeColor(page, example.ref)).not.toBe(neutral);
      if (navigation === 'scroll') await page.evaluate(() => scrollBy(0, 40));
      else await jump(page, example.beat);
      await expect(stage).not.toHaveAttribute('data-kp-reader-focus-source', 'url');
      await expect.poll(() => nativeColor(page, example.ref)).toBe(neutral);
    }
  }
});

test('passage focus releases after its hold and pointer and keyboard focus return to prose', async ({ page }) => {
  await page.goto('/reader/solve-fractional-linear/'); await ready(page);
  const stage = page.locator('[data-kp-reader-equation-stage]');
  const link = page.locator('[data-kp-rising-beat="beat.read"] .kp-semantic-link');
  await jump(page, 'beat.read');
  const prose = await link.evaluate(node => getComputedStyle(node.parentElement!).color);
  await expect(link).toHaveCSS('color', prose);
  await link.hover();
  await expect(stage).toHaveAttribute('data-kp-reader-focus-source', 'pointer');
  expect(await link.evaluate(node => getComputedStyle(node).color)).not.toBe(prose);
  await page.mouse.move(2, 2);
  await expect(link).toHaveCSS('color', prose);
  await link.focus();
  await expect(stage).toHaveAttribute('data-kp-reader-focus-source', 'keyboard');
  await page.locator('.kp-rising-navigation > summary').focus();
  await expect(link).toHaveCSS('color', prose);
  await jump(page, 'beat.cancel-additive');
  await expect(stage).toHaveAttribute('data-kp-reader-focus-source', 'story');
  const arrival = await page.evaluate(() => scrollY);
  const hold = await page.locator('[data-kp-beat="beat.cancel-additive"]').evaluate(node => Number.parseFloat(getComputedStyle(node).getPropertyValue('--kp-flow-hold')));
  await page.evaluate(top => scrollTo(0, top), arrival + hold + 32);
  await expect(stage).not.toHaveAttribute('data-kp-reader-focus-source', /.+/);
  await expect(stage.locator('.kp-reader-semantic-focus')).toHaveCount(0);
  await page.evaluate(top => scrollTo(0, top), arrival + 5);
  await expect(stage).toHaveAttribute('data-kp-reader-focus-source', 'story');
});

test("equation remains painted after initial load and reload", async ({ page }, info) => {
  test.setTimeout(90_000);
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  for (const width of [1100, 390]) {
    await page.setViewportSize({ width, height: 900 });
    for (const hash of ['', '#state.what-counts.counted']) {
      await page.goto(route + hash);
      for (const load of ['initial', 'reload']) {
        if (load === 'reload') await page.reload();
        await ready(page);
        const paintedText = () => page.locator('[data-kp-reader-equation-stage]').evaluate(stage => {
          const side = stage.dataset['kpReaderNativeEndpoint'];
          const native = stage.querySelector(`[data-kp-reader-transition-active="true"] [data-kp-reader-native="${side}"] .katex-html`);
          if (!native) return '';
          const walker = document.createTreeWalker(native, NodeFilter.SHOW_TEXT);
          let painted = '';
          for (let node = walker.nextNode(); node; node = walker.nextNode()) {
            if (!node.textContent?.trim()) continue;
            let alpha = 1;
            for (let parent = node.parentElement; parent; parent = parent.parentElement) {
              const css = getComputedStyle(parent);
              if (css.display === 'none' || css.visibility !== 'visible') { alpha = 0; break; }
              alpha *= Number(css.opacity);
            }
            const range = document.createRange(); range.selectNodeContents(node);
            const rect = range.getBoundingClientRect();
            if (alpha > .99 && rect.width > 0 && rect.height > 0) painted += node.textContent;
          }
          return painted.replaceAll(/\s/g, '');
        });
        const expected = hash ? '5(x+y)' : '3(x+y)+2(x+y)';
        await expect.poll(paintedText).toBe(expected);
        // The report was a delayed disappearance after initially readable ink.
        await page.waitForTimeout(750);
        expect(await paintedText()).toBe(expected);
        await page.screenshot({ path: info.outputPath(`${width}-${hash ? 'direct' : 'opening'}-${load}.png`) });
      }
    }
  }
  expect(errors).toEqual([]);
});
test("reader gives native annotations their own moment, reversible and restorable", async ({ page }, info) => {
  test.setTimeout(180_000);
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await page.goto(route); await ready(page);
  const plane = page.locator('.kp-caption-pin'), story = page.locator('.kp-animation-story');
  await expect(page.locator('[data-composed-card], [data-kp-focus-deck-scrubber]')).toHaveCount(0);
  for (const width of [1100, 390]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const index of [0, 1, 2, 3, 2, 1, 0]) {
      const state = source.states[index]!;
      await jump(page, state.id);
      await expect(story).toHaveAttribute('data-anchored-status', 'ready');
      await expect(plane).toHaveAttribute('data-anchored-state', state.id);
      await expect(plane.locator('[data-kp-reader-native-endpoint-passed]')).toHaveAttribute('data-kp-reader-native-endpoint-passed', 'true');
      const labels = await plane.evaluate(plane => {
        const bounds = plane.getBoundingClientRect();
        const proseFamily = getComputedStyle(document.querySelector('.kp-rising-passage p')!).fontFamily;
        return [...plane.querySelectorAll<HTMLElement>('[data-kp-focus-deck-annotation]')].map(label => {
          const rect = label.getBoundingClientRect();
          return { text: label.textContent, fits: rect.left >= bounds.left && rect.right <= bounds.right && rect.top >= bounds.top && rect.bottom <= bounds.bottom,
            proseFamily: [label, ...label.querySelectorAll('[data-kp-focus-deck-type]')].every(node => getComputedStyle(node).fontFamily === proseFamily) };
        });
      });
      expect(labels).toHaveLength(2); expect(labels.every(label => label.fits)).toBe(true);
      expect(labels.every(label => label.proseFamily)).toBe(true);
      expect(await page.locator('.kp-rising-passage').evaluateAll(nodes => nodes.every(node => getComputedStyle(node).opacity === '0'))).toBe(true);
      await plane.screenshot({ path: info.outputPath(`${width}-annotation-${index}.png`) });
      await jump(page, `passage.${state.id}`);
      await expect(plane.locator('.anchored-labels')).toBeHidden();
      await expect(page.locator(`[data-kp-rising-beat="passage.${state.id}"]`)).toHaveCSS('opacity', '1');
      if (index > 0) {
        const travel = await page.evaluate(() => (innerHeight - document.querySelector('.kp-reader-masthead')!.getBoundingClientRect().height) * .28);
        await page.mouse.wheel(0, travel);
        await expect.poll(async () => Number(await page.locator('body').getAttribute('data-kp-reader-progress'))).toBeGreaterThan(Math.round((index - 1) * 1000 / 3));
        const progress = Number(await page.locator('body').getAttribute('data-kp-reader-progress'));
        expect(progress).toBeLessThan(Math.round(index * 1000 / 3));
        await expect(plane.locator('.anchored-labels')).toBeHidden();
        await expect(plane.locator('[data-kp-reader-native-endpoint]')).toHaveCount(0);
      }
    }
  }
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await jump(page, source.states[2]!.id);
  await expect(plane).toHaveAttribute('data-anchored-state', source.states[2]!.id);
  await page.locator('.kp-rising-navigation > summary').click();
  const share = await page.locator('[data-kp-reader-share]').getAttribute('href');
  expect(share).toBeTruthy();
  await page.goto(share!); await ready(page);
  await expect(plane).toHaveAttribute('data-anchored-state', source.states[2]!.id);
  await page.locator(`[data-kp-rising-beat="${source.states[2]!.id}"] p`).evaluate(paragraph => {
    const range = document.createRange(); range.selectNodeContents(paragraph);
    const selection = document.getSelection()!; selection.removeAllRanges(); selection.addRange(range);
  });
  await expect(plane.locator('.anchored-labels')).toBeHidden();
  await expect(page.locator(`[data-kp-rising-beat="${source.states[2]!.id}"]`)).toHaveCSS('opacity', '1');
  await page.evaluate(() => document.getSelection()?.removeAllRanges());
  await expect(plane).toHaveAttribute('data-anchored-state', source.states[2]!.id);
  await page.locator('.kp-rising-navigation > summary').click();
  await page.getByRole('button', { name: 'Read all', exact: true }).click();
  await expect(plane.locator('.anchored-labels')).toBeHidden();
  await expect(page.locator(`[data-kp-rising-beat="${source.states[2]!.id}"]`)).toHaveCSS('opacity', '1');
  expect(errors).toEqual([]);
});

test("missing or duplicate native selectors withdraw commentary with a repair", async ({ page }) => {
  test.setTimeout(150_000);
  await page.goto(route); await ready(page);
  const story = page.locator('.kp-animation-story');
  for (const defect of ['missing', 'duplicate'] as const) {
    await jump(page, source.states[0]!.id);
    await expect(page.locator('.kp-caption-pin')).toHaveAttribute('data-anchored-state', source.states[0]!.id);
    await page.evaluate(defect => {
      const selector = document.querySelector<HTMLElement>('[data-kp-reader-transition-active="true"] [data-kp-reader-native="source"] [data-kp-reader-selector-id="state.what-counts.repeated.paint.left-factor"]')!;
      if (defect === 'missing') selector.removeAttribute('data-kp-reader-selector-id');
      else { const duplicate = document.createElement('span'); duplicate.dataset['kpReaderSelectorId'] = selector.dataset['kpReaderSelectorId']!; selector.after(duplicate); }
      window.dispatchEvent(new Event('resize'));
    }, defect);
    await expect(story).toHaveAttribute('data-anchored-status', 'repair-gap');
    await expect(story.locator('.anchored-labels')).toBeHidden();
    await expect(story.getByRole('alert')).toContainText('exactly one native selector');
    await page.reload(); await ready(page);
  }
});

test("static reading, old links and stale revisions have one explicit destination", async ({ browser, page }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const staticPage = await context.newPage(); await staticPage.goto(route);
  await expect(staticPage.locator('[data-kp-annotation-state]')).toHaveCount(4);
  await expect(staticPage.locator('.kp-annotation-static-equation .katex')).toHaveCount(4);
  await expect(staticPage.getByText(/Now look inside one copy/)).toBeVisible();
  await expect(staticPage.getByText(/Regrouping those additions gives five copies/)).toBeVisible();
  await expect(staticPage.getByText(/This check catches the missing contributions/)).toBeVisible();
  await expect(staticPage.getByText(/Try a changed case/)).toBeVisible();
  await context.close();
  await page.goto('/experiments/reusable-reasoning/?example=anchored-algebra#state.what-counts.opened');
  await ready(page);
  await expect(page).toHaveURL(/\/reader\/what-counts\//);
  await expect(page.locator('.kp-caption-pin')).toHaveAttribute('data-anchored-state', 'state.what-counts.opened');
  const response = await page.goto(`${route}?revision=stale#state.what-counts.opened`);
  expect(response?.status()).toBe(422);
  await expect(page.locator('body')).toContainText('different explanation revision');
  const staleReading = await page.goto(`${route}?kpLesson=lesson.algebra.what-counts&kpVersion=1&kpProgress=500`);
  expect(staleReading?.status()).toBe(422);
  await expect(page.locator('body')).toContainText('location.document');
  await expect(page.locator('body')).toContainText('Open /reader/what-counts/');
  await page.goto('/experiments/reusable-reasoning/?example=anchored-algebra#state.what-counts.missing');
  await ready(page);
  await expect(page.locator('.kp-animation-story')).toHaveAttribute('data-anchored-status', 'repair-gap');
  await expect(page.getByRole('alert')).toContainText('unknown explanation state');
});

test("full reasoning passages fit without shortening or competing annotations", async ({ page }, info) => {
  test.setTimeout(120_000);
  await page.goto(route); await ready(page);
  const ids = await page.locator('[data-kp-beat]:not([data-kp-annotation-state])').evaluateAll(nodes => nodes.map(node => node.id));
  expect(ids).toHaveLength(6);
  for (const width of [1100, 390]) {
    await page.setViewportSize({ width, height: 844 });
    for (const id of ids) {
      await jump(page, id);
      const passage = page.locator(`[data-kp-rising-beat="${id}"]`);
      await expect(passage).toHaveCSS('opacity', '1');
      await expect(page.locator('.anchored-labels')).toBeHidden();
      const fits = await passage.locator('p').evaluate(paragraph => {
        const rect = paragraph.getBoundingClientRect();
        const header = document.querySelector('.kp-reader-masthead')!.getBoundingClientRect();
        return rect.top >= header.bottom && rect.bottom <= innerHeight && rect.left >= 0 && rect.right <= innerWidth
          && paragraph.scrollHeight <= paragraph.clientHeight + 1;
      });
      expect(fits, `${width}px: ${id}`).toBe(true);
      await page.screenshot({ path: info.outputPath(`${width}-${id}.png`) });
    }
  }
  await page.locator('.kp-rising-navigation > summary').click();
  await page.getByRole('button', { name: 'Read all', exact: true }).click();
  await expect(page.getByText(/Regrouping those additions gives five copies/)).toBeVisible();
  await expect(page.getByText(/This check catches the missing contributions/)).toBeVisible();
  await expect(page.getByText(/Try a changed case/)).toBeVisible();
  const share = await page.locator('[data-kp-reader-share]').getAttribute('href');
  expect(new URL(share!, page.url()).searchParams.get('kpVersion')).toBe('2');
});

test("a different question reuses the same reader and preserves its own reading link", async ({ page, browser }, info) => {
  test.setTimeout(120_000);
  const zeroRoute = `${route}?reading=zero`;
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await page.goto(zeroRoute); await ready(page);
  await expect(page.locator('.kp-lesson')).toHaveAttribute('data-kp-version', 'zero.1');
  await expect(page.locator('[data-kp-annotation-state]')).toHaveCount(2);
  for (const width of [1100, 390]) {
    await page.setViewportSize({ width, height: 844 });
    for (const index of [0, 1, 2, 3, 2, 0]) {
      await jump(page, `passage.${source.states[index]!.id}`);
      const paragraph = page.locator(`[data-kp-rising-beat="passage.${source.states[index]!.id}"] p`);
      expect(await paragraph.evaluate(node => {
        const rect = node.getBoundingClientRect();
        return rect.top >= document.querySelector('.kp-reader-masthead')!.getBoundingClientRect().bottom
          && rect.bottom <= innerHeight && rect.left >= 0 && rect.right <= innerWidth;
      })).toBe(true);
      await expect(page.locator('.anchored-labels')).toBeHidden();
    }
    for (const index of [0, 3]) {
      await jump(page, source.states[index]!.id);
      await expect(page.locator('.kp-caption-pin')).toHaveAttribute('data-anchored-state', source.states[index]!.id);
      await expect(page.locator('[data-kp-reader-native-endpoint-passed]')).toHaveAttribute('data-kp-reader-native-endpoint-passed', 'true');
      await page.screenshot({ path: info.outputPath(`${width}-zero-${index}.png`) });
    }
    await page.evaluate(() => dispatchEvent(new Event('scrollend')));
    const share = await page.locator('[data-kp-reader-share]').getAttribute('href');
    const url = new URL(share!, page.url());
    expect(url.searchParams.get('reading')).toBe('zero');
    expect(url.searchParams.get('kpVersion')).toBe('zero.1');
    await page.goto('about:blank'); await page.goto(url.href); await ready(page);
    await expect(page.locator('.kp-caption-pin')).toHaveAttribute('data-anchored-state', source.states[3]!.id);
  }
  await page.locator('.kp-rising-navigation > summary').click();
  await page.getByRole('link', { name: 'Return to the original explanation' }).click(); await ready(page);
  await expect(page.locator('.kp-lesson')).toHaveAttribute('data-kp-version', '2');
  const context = await browser.newContext({ javaScriptEnabled: false });
  const staticPage = await context.newPage(); await staticPage.goto(zeroRoute);
  await expect(staticPage.getByText(/does not need an assumption that the group is nonzero/)).toBeVisible();
  await expect(staticPage.getByText(/Multiplication by zero cannot be reversed/)).toBeVisible();
  await context.close(); expect(errors).toEqual([]);
});

test("a focused follow-up returns to the exact original question context", async ({ page }, info) => {
  test.setTimeout(120_000);
  const ref = 'state.what-counts.repeated.paint.left-factor';
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  for (const width of [1100, 390]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto(route); await ready(page);
    await jump(page, source.states[0]!.id);
    await page.evaluate(() => dispatchEvent(new Event('scrollend')));
    const original = new URL((await page.locator('[data-kp-reader-share]').getAttribute('href'))!, page.url());
    original.searchParams.set('kpFocus', ref);
    await page.goto('about:blank'); await page.goto(original.href); await ready(page);
    await expect(page.locator('.kp-caption-pin')).toHaveAttribute('data-anchored-state', source.states[0]!.id);
    const position = await page.evaluate(() => scrollY), color = await nativeColor(page, ref);
    const originalAddress = original.pathname + original.search + original.hash;
    const response = await page.goto(`${route}?reading=zero&returnTo=${encodeURIComponent(originalAddress)}`);
    expect(response?.status(), await response?.text()).toBe(200); await ready(page);
    await expect(page.locator('.kp-lesson')).toHaveAttribute('data-kp-version', 'zero.1');
    await jump(page, source.states[3]!.id);
    await page.screenshot({ path: info.outputPath(`${width}-situated-response.png`) });
    await page.locator('.kp-rising-navigation > summary').click();
    const link = page.getByRole('link', { name: 'Return to your question' });
    await expect(link).toHaveAttribute('href', originalAddress);
    await link.click(); await ready(page);
    await expect(page.locator('.kp-lesson')).toHaveAttribute('data-kp-version', '2');
    await expect(page.locator('.kp-caption-pin')).toHaveAttribute('data-anchored-state', source.states[0]!.id);
    await expect(page.locator('[data-kp-reader-equation-stage]')).toHaveAttribute('data-kp-reader-focus-source', 'url');
    expect(await nativeColor(page, ref)).toBe(color);
    expect(Math.abs(await page.evaluate(() => scrollY) - position)).toBeLessThanOrEqual(2);
    await page.screenshot({ path: info.outputPath(`${width}-situated-return.png`) });
  }
  expect(errors).toEqual([]);
});
