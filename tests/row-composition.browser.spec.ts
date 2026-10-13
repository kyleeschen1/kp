import { test, expect } from '@playwright/test';
import { rowComposition } from '../src/experiments/rectangular-product/row-composition-model.ts';
import { eliminateSecondComposition } from '../src/experiments/rectangular-product/row-composition-variation.ts';
import { eliminationSequenceComposition } from '../src/experiments/rectangular-product/row-composition-sequence.ts';
import { decodePngRgba, normalizedPngRasterDelta } from './helpers/png-raster-diff.ts';

test('multi-operation composition preserves every seam and can seek directly into each operation', async ({ page }, info) => {
  const model = eliminationSequenceComposition, errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/experiments/rectangular-product/?view=row-composition&example=elimination');
  const root = page.locator('#rectangular-player'), stage = root.locator('.row-composition-stage');
  await expect(root).toHaveAttribute('data-ready', 'true');
  const slider = root.getByRole('slider', { name: 'Animation position' });
  await slider.evaluate(n => n.setAttribute('step', 'any'));
  const seek = (p: number) => slider.evaluate((n, p) => {
    if (!(n instanceof HTMLInputElement)) throw new Error('Expected range input');
    n.value = String(p); n.dispatchEvent(new Event('input', { bubbles: true }));
  }, p);
  for (const [i, seam] of model.stops.slice(1, -1).entries()) {
    await seek(seam - .000001);
    const left = await stage.screenshot({ path: info.outputPath(`sequence-seam-${i}-before.png`), scale: 'css' });
    await seek(seam + .000001);
    const right = await stage.screenshot({ path: info.outputPath(`sequence-seam-${i}-after.png`), scale: 'css' });
    expect(normalizedPngRasterDelta(left, right), `continuous seam ${i}`).toBeLessThan(.0002);
  }
  for (const [i, step] of model.steps.entries()) {
    if (step.operation.kind !== 'swap') {
      const opening = step.operation.kind === 'scale' ? .28 : .35;
      await seek(model.stops[i + 1]! + (model.stops[i + 2]! - model.stops[i + 1]!) * opening);
      const active = stage.locator(`[data-operation-index="${i}"]`);
      const groups = await active.evaluate(s => Array.from({ length: 4 }, (_, column) =>
        ['factor', 'dot', 'operand'].map(role => {
          const node = s.querySelector<HTMLElement>(`[data-arithmetic-column="${column}"][data-arithmetic-role="${role}"]`)!;
          const b = node.getBoundingClientRect(); return { left: b.left, right: b.right };
        })));
      for (const group of groups) {
        expect(group[1]!.left - group[0]!.right, 'factor and operator clearance').toBeGreaterThan(3);
        expect(group[2]!.left - group[1]!.right, 'operator and operand clearance').toBeGreaterThan(3);
      }
      for (let column = 1; column < 3; column++)
        expect(groups[column]![0]!.left - groups[column - 1]![2]!.right, 'adjacent arithmetic cells').toBeGreaterThan(3);
    }
    const p = model.stops[i + 1]! + (model.stops[i + 2]! - model.stops[i + 1]!) * .45;
    await seek(p);
    await expect(stage).toHaveAttribute('data-operation-index', String(i));
    await expect(root.locator('[data-cue]')).toHaveText(step.during);
    const active = stage.locator(`[data-operation-index="${i}"]`);
    const styles = () => active.locator('[style]').evaluateAll(ns => ns.map(n => n.getAttribute('style')));
    const first = await styles();
    await root.locator('.matrix-card').screenshot({ path: info.outputPath(`sequence-${step.id}.png`) });
    await seek(1); await seek(0); await seek(p); expect(await styles()).toEqual(first);
    await expect(active.locator('.row-wb-equal')).toHaveCSS('opacity', '1');
    expect(await stage.locator('[data-operation-index]').evaluateAll(ns => ns.filter(n => getComputedStyle(n).opacity === '1').length)).toBe(1);
  }
  await seek(1); await root.locator('.matrix-card').screenshot({ path: info.outputPath('sequence-expanded.png') });
  await expect(root.locator('[data-cue]')).toContainText('Any real z');
  await root.getByRole('combobox', { name: 'Milestone' }).selectOption('3');
  await expect(root.locator('[data-cue]')).toContainText('pivot is now 1');
  await page.reload(); await expect(root).toHaveAttribute('data-milestone', 'normalize');
  await root.getByRole('button', { name: 'Light mode', exact: true }).click();
  await root.locator('.matrix-card').screenshot({ path: info.outputPath('sequence-light.png') });
  await expect(root.locator('[data-cue]')).toContainText('pivot is now 1');
  expect(errors).toEqual([]);
});

for (const example of [
  { id: 'original', model: rowComposition, query: '', retainedRow: 1, retainedRhs: '−1', zero: '0-1' },
  { id: 'eliminate-second', model: eliminateSecondComposition, query: '&example=eliminate-second', retainedRow: 0, retainedRhs: '4', zero: '1-0' },
]) test(`composition ${example.id} has exclusive continuous handoffs and deterministic reversal`, async ({ page }, info) => {
  const rowComposition = example.model, rowCompositionStops = rowComposition.stops;
  const errors: string[] = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto(`/experiments/rectangular-product/?view=row-composition${example.query}`);
  const root = page.locator('#rectangular-player'); await expect(root).toHaveAttribute('data-ready', 'true');
  const stage = root.locator('.row-composition-stage'), slider = root.getByRole('slider', { name: 'Animation position' });
  // Native range snapping is not the sampler's precision. Feed exact seam probes
  // through the same input event, with an unrestricted step for this check.
  await slider.evaluate(n => n.setAttribute('step', 'any'));
  const seek = (p: number) => slider.evaluate((n, value) => {
    if (!(n instanceof HTMLInputElement)) throw new Error('Expected the canonical range input.');
    n.value = String(value); n.dispatchEvent(new Event('input', { bubbles: true }));
  }, p);
  const paint = () => stage.locator('[style]').evaluateAll(ns => ns.map(n => n.getAttribute('style')));
  const bounds = (ids: string[]) => stage.evaluate((s, ids) => {
    const origin = s.getBoundingClientRect();
    return ids.map(id => [...s.querySelectorAll<HTMLElement>('[data-source-id]')].filter(n => n.dataset['sourceId'] === id).flatMap(n => {
      let visible = true;
      for (let p: Element | null = n; p && p !== s; p = p.parentElement) {
        const style = getComputedStyle(p); if (style.visibility === 'hidden' || Number(style.opacity) < .999) visible = false;
      }
      const ink = n.querySelector<HTMLElement>('.row-wb-ink');
      if (ink && Number(getComputedStyle(ink).opacity) < .999) visible = false;
      if (!visible) return [];
      const b = n.getBoundingClientRect(); return [{ x: b.x - origin.x, y: b.y - origin.y, w: b.width, h: b.height }];
    }));
  }, ids);
  const beforeIds = [...rowComposition.step.before.coefficients.rows.flat(), ...rowComposition.step.before.rhs, ...rowComposition.before.inputs].map(v => v.id);
  const afterIds = [...rowComposition.step.after.coefficients.rows.flat(), ...rowComposition.step.after.rhs, ...rowComposition.before.inputs].map(v => v.id);
  for (const [seam, ids] of [[rowCompositionStops[1], beforeIds], [rowCompositionStops[2], afterIds]] as const) {
    await seek(seam - .000001); const left = await bounds(ids);
    const beforePaint = await stage.screenshot({ path: info.outputPath(`seam-${seam}-before.png`), scale: 'css' });
    await seek(seam + .000001); const right = await bounds(ids);
    const afterPaint = await stage.screenshot({ path: info.outputPath(`seam-${seam}-after.png`), scale: 'css' });
    expect(normalizedPngRasterDelta(beforePaint, afterPaint), 'realized native paint at handoff').toBeLessThan(.0002);
    for (const [i, poses] of left.entries()) {
      expect(poses, ids[i]).toHaveLength(1); expect(right[i], ids[i]).toHaveLength(1);
      for (const key of ['x', 'y', 'w', 'h'] as const) expect(Math.abs(poses[0]![key] - right[i]![0]![key]), `${ids[i]} ${key}`).toBeLessThan(.2);
    }
  }
  const operationP = (p: number) => rowCompositionStops[1] + (rowCompositionStops[2] - rowCompositionStops[1]) * p;
  for (const [name, p] of [['initial', 0], ['collect', .3], ['copy', operationP(.2)], ['add', operationP(.46)], ['result', rowCompositionStops[2]], ['expand', .83], ['final', 1]] as const) {
    await seek(p); const first = await paint(); await seek(1); await seek(0); await seek(p);
    // Inactive layers may retain prior styles; only the active paint owner matters.
    const active = stage.locator(`[data-composition-layer="${await stage.getAttribute('data-owner')}"]`);
    const activePaint = () => active.locator('[style]').evaluateAll(ns => ns.map(n => n.getAttribute('style')));
    const a = await activePaint(); await seek(0); await seek(1); await seek(p); expect(await activePaint()).toEqual(a);
    if (name === 'copy') {
      for (const contribution of rowComposition.step.contributions) {
        const source = (await stage.locator(`[data-transient] [data-source-id="${contribution.source.id}"]`).boundingBox())!;
        const target = (await stage.locator(`[data-native] [data-source-id="${contribution.target.id}"]`).boundingBox())!;
        const overlap = Math.min(source.x + source.width, target.x + target.width) - Math.max(source.x, target.x);
        expect(overlap, 'copy must clear the receiving glyph during the outward crossing').toBeLessThan(0);
      }
    }
    expect(first.length).toBeGreaterThan(0);
    const card = root.locator('.matrix-card');
    const raster = decodePngRgba(await card.screenshot({ path: info.outputPath(`composition-${name}.png`), scale: 'css' }));
    if (name === 'final') {
      const rect = await stage.locator(`[data-composition-layer="after"] [data-natural-key="name-${example.retainedRow}"]`).evaluate(n => {
        const b = n.getBoundingClientRect(), c = n.closest('.matrix-card')!.getBoundingClientRect();
        return { x: b.x - c.x, y: b.y - c.y, w: b.width, h: b.height };
      });
      let ink = 0;
      for (let y = Math.ceil(rect.y); y < rect.y + rect.h; y++) for (let x = Math.ceil(rect.x); x < rect.x + rect.w; x++)
        if (raster.pixels[(y * raster.width + x) * 4]! > 100) ink++;
      expect(ink, 'retained RHS must paint in the full frame, without forcing a token recapture').toBeGreaterThan(15);
    }
  }
  await expect(stage).toHaveAttribute('data-owner', 'after');
  await expect(stage.locator(`[data-composition-layer="after"] [data-poly="name-${1 - example.retainedRow}"]`)).toHaveText('6');
  const retainedRhs = stage.locator(`[data-composition-layer="after"] [data-natural-key="name-${example.retainedRow}"]`);
  await expect(retainedRhs).toHaveText(example.retainedRhs);
  const crop = decodePngRgba(await retainedRhs.screenshot({ path: info.outputPath('retained-rhs.png') }));
  const inkPixels = Array.from({ length: crop.width * crop.height }, (_, i) => crop.pixels[i * 4]!).filter(n => n > 100).length;
  expect(inkPixels, 'retained RHS must paint, not only occupy DOM bounds').toBeGreaterThan(15);
  await expect(stage.locator(`[data-composition-layer="after"] [data-poly="coefficient-${example.zero}"]`)).toHaveCSS('opacity', '0');
  await root.getByText('Read the calculation', { exact: true }).click(); await expect(root.locator('details')).toContainText('same solutions');
  expect(errors).toEqual([]);
});

test('composition reuses hash restoration, reduced motion, theme and disposal', async ({ page }, info) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/experiments/rectangular-product/?view=row-composition#changed');
  const root = page.locator('#rectangular-player'); await expect(root).toHaveAttribute('data-ready', 'true');
  await expect(root.locator('.row-composition-stage')).toHaveAttribute('data-owner', 'after');
  await root.getByRole('button', { name: 'Next', exact: true }).click(); await expect(root).toHaveAttribute('data-milestone', 'expanded');
  await page.reload(); await expect(root).toHaveAttribute('data-milestone', 'expanded');
  await root.getByRole('button', { name: 'Light mode', exact: true }).click();
  await root.getByRole('combobox', { name: 'Milestone' }).selectOption('1');
  await root.locator('.matrix-card').screenshot({ path: info.outputPath('composition-light.png') });
  await root.getByRole('slider').focus(); await page.keyboard.press('Home'); await expect(root).toHaveAttribute('data-milestone', 'equations');
  await page.keyboard.press('End'); await expect(root).toHaveAttribute('data-milestone', 'expanded');
  await page.evaluate(() => window.dispatchEvent(new PageTransitionEvent('pagehide', { persisted: false })));
  await expect(root).not.toHaveAttribute('data-ready');
});
