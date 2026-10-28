import assert from 'node:assert/strict';
import path from 'node:path';
import type { Page } from 'playwright';

export async function checkFractionalPassageSlider(page: Page, outputRoot: string, width: number) {
  assert.equal(await page.locator('.kp-animation-beats .kp-caption-operation-slider').count(), 6);
  assert.equal(await page.locator('[data-kp-rising-beat="beat.read"] input').count(), 0);
  await page.locator('.kp-rising-navigation summary').click();
  await page.locator('.kp-lesson-toc a[href="#beat.multiply"]').click();
  const passage = page.locator('[data-kp-rising-beat="beat.multiply"]');
  const slider = passage.getByRole('slider');
  const value = () => slider.evaluate((node: HTMLInputElement) => node.valueAsNumber);
  const settle = () => page.waitForTimeout(240);
  await settle();
  const box = await slider.boundingBox();
  assert.ok(box && box.height >= 24, 'The thin track must have a usable interaction area');
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.up();
  await settle();
  assert.ok(Math.abs(await value() - 500) < 15, 'Clicking the middle must seek halfway through this operation');
  assert.equal(await passage.evaluate((node) => getComputedStyle(node).backgroundColor), 'rgba(0, 0, 0, 0)',
    'Focused controls must not paint a passage background over the side rails');
  await slider.press('End');
  await settle();
  assert.equal(await value(), 1000);
  assert.equal(await page.locator('body').getAttribute('data-kp-reader-progress'), '667');
  await slider.press('Home');
  await settle();
  assert.equal(await value(), 0);
  assert.equal(await passage.getAttribute('hidden'), null, 'Zero must retain this operation, not the previous result passage');
  assert.equal(await page.locator('body').getAttribute('data-kp-reader-progress'), '500');
  await slider.press('ArrowRight');
  await settle();
  assert.equal(await value(), 1, 'A native keyboard increment must not be lost to rounded URL progress');
  await slider.press('Home');
  await settle();
  await page.reload({ waitUntil: 'networkidle' });
  await settle();
  assert.equal(await passage.getAttribute('hidden'), null, 'Reload must preserve operation ownership at its repeated source state');
  assert.equal(await value(), 0);

  const dragBox = await slider.boundingBox();
  assert.ok(dragBox);
  await page.mouse.move(dragBox.x + 4, dragBox.y + dragBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(dragBox.x + dragBox.width - 4, dragBox.y + dragBox.height / 2, { steps: 5 });
  await page.mouse.up();
  await settle();
  assert.ok(await value() > 980, 'Dragging must seek toward the operation result');
  await page.evaluate(() => { dispatchEvent(new WheelEvent('wheel')); scrollBy(0, -80); });
  await settle();
  const rewound = await value();
  assert.ok(rewound > 0 && rewound < 980, 'Scrolling backward must empty the same operation slider');
  assert.equal(await passage.getAttribute('hidden'), null);
  const progress = Number(await page.locator('body').getAttribute('data-kp-reader-progress'));
  assert.ok(Math.abs(progress - (500 + rewound / 1000 * 167)) <= 1);
  assert.ok(await page.locator('.kp-caption-preview').evaluate((node) => node.hasAttribute('hidden')),
    'An active operation must not overlap approaching prose');
  await page.screenshot({ path: path.join(outputRoot, `passage-slider-rewind-${width}.png`) });
  await slider.press('End');
  await settle();
}
