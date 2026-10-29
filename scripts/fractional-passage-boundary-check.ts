import assert from 'node:assert/strict';
import path from 'node:path';
import type { Page } from 'playwright';

/** First/last captions must withdraw while the theater still holds its place. */
export async function checkFractionalPassageBoundaries(page: Page, baseUrl: string, outputRoot: string, baseline = false) {
  for (const width of [1280, 390]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(new URL('/reader/solve-fractional-linear/', baseUrl).toString(), { waitUntil: 'networkidle' });
    await page.waitForSelector('body[data-kp-reader-hydrated="true"]');
    for (const [id, direction, progress] of [['beat.read', -1, 0], ['beat.solve', 1, 1000]] as const) {
      await page.locator('.kp-rising-navigation > summary').click();
      await page.locator(`.kp-lesson-toc a[href="#${id}"]`).click();
      await page.waitForTimeout(260);
      const boundary = await page.locator(`[data-kp-beat="${id}"]`).evaluate((node, direction) => {
        const passage = node.querySelector('.kp-rising-passage')!;
        const line = parseFloat(document.body.style.getPropertyValue('--kp-flow-line'));
        return scrollY + node.getBoundingClientRect().top + passage.getBoundingClientRect().height - line +
          (direction > 0 ? parseFloat((node as HTMLElement).style.getPropertyValue('--kp-flow-hold')) : 0);
      }, direction);
      const frames = [];
      for (const distance of [0, 12, 24, 48, 24, 12, 0]) {
        await page.evaluate(y => { dispatchEvent(new WheelEvent('wheel')); scrollTo(0, y); }, boundary + direction * distance);
        await page.waitForTimeout(260);
        frames.push(await page.locator(`[data-kp-rising-beat="${id}"]`).evaluate(node => {
          const frame = document.querySelector('.kp-caption-frame')!.getBoundingClientRect();
          return { alpha: Number(getComputedStyle(node).opacity), top: node.getBoundingClientRect().top,
            frame: frame.top, progress: Number(document.body.dataset['kpReaderProgress']) };
        }));
        if (distance === 24) await page.screenshot({ path: path.join(outputRoot, `passage-boundary-${width}-${id}.png`) });
      }
      console.log(JSON.stringify({ width, id, frames }));
      if (baseline) continue;
      assert.ok(frames[0]!.alpha > .98);
      assert.ok(frames[2]!.alpha <= .081, 'Endpoint prose must withdraw as it leaves its hold');
      assert.ok(Math.abs(frames[0]!.frame - frames[2]!.frame) < 1,
        'The theater must stay pinned until its endpoint passage has withdrawn');
      assert.ok(Math.abs(frames[0]!.top - frames[2]!.top) > 20, 'Endpoint passage must actually retreat');
      assert.ok(frames.every(frame => frame.progress === progress), 'Retreat must preserve the endpoint equation');
      assert.deepEqual(frames[1], frames[5], 'Endpoint retreat must reverse deterministically');
    }
  }
}
