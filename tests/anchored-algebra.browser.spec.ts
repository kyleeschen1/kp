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
  await context.close();
  await page.goto('/experiments/reusable-reasoning/?example=anchored-algebra#state.what-counts.opened');
  await ready(page);
  await expect(page).toHaveURL(/\/reader\/what-counts\//);
  await expect(page.locator('.kp-caption-pin')).toHaveAttribute('data-anchored-state', 'state.what-counts.opened');
  const response = await page.goto(`${route}?revision=stale#state.what-counts.opened`);
  expect(response?.status()).toBe(422);
  await expect(page.locator('body')).toContainText('different explanation revision');
  await page.goto('/experiments/reusable-reasoning/?example=anchored-algebra#state.what-counts.missing');
  await ready(page);
  await expect(page.locator('.kp-animation-story')).toHaveAttribute('data-anchored-status', 'repair-gap');
  await expect(page.getByRole('alert')).toContainText('unknown explanation state');
});
