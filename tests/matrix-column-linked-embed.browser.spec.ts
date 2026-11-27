import { test, expect } from '@playwright/test';
import seed from '../content/notebooks/matrix-object-exemplar.json' with { type: 'json' };

test('shared linked embed preserves independent progress, host ownership and transactional remount', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await page.setViewportSize({ width: 1200, height: 900 });
  await page.goto('/experiments/matrix-reference/?geometry=1');
  await expect(page.locator('.reference-stage')).toHaveAttribute('aria-busy', 'false');
  const result = await page.evaluate(async source => {
    const embedPath = '/src/experiments/matrix-column-combinations/linked-embed.ts';
    const runtimePath = '/src/math-resources/public-api.ts';
    const { mountLinkedColumnExplanation, prepareColumnExplanationFonts } = await import(embedPath);
    const { createMatrixVectorRuntime } = await import(runtimePath);
    await prepareColumnExplanationFonts();
    const runtime = createMatrixVectorRuntime(source), product = runtime.explanation().product;
    const first = document.createElement('section'), second = document.createElement('section');
    first.style.width = '600px'; second.style.width = '1000px';
    const retained = document.createElement('p'); retained.textContent = 'Host-owned sibling'; first.append(retained);
    const attempt = (work: () => void) => { try { work(); return ''; } catch (error) { return String(error); } };
    const detached = attempt(() => mountLinkedColumnExplanation(first, product, 0, () => {}, 'detached'));
    document.body.append(first, second);
    const invalid = attempt(() => mountLinkedColumnExplanation(first, product, 2, () => {}, 'invalid'));
    const untouched = first.childNodes.length === 1;
    const settlements: number[] = [], frames: number[] = [];
    const a = mountLinkedColumnExplanation(first, product, .25, (value: number) => settlements.push(value), 'reuse-first', (value: number) => frames.push(value));
    const b = mountLinkedColumnExplanation(second, product, .5, () => {}, 'reuse-second');
    const duplicate = attempt(() => mountLinkedColumnExplanation(first, product, 0, () => {}, 'duplicate'));
    const value = (root: HTMLElement, selector: string) => root.querySelector<HTMLElement>(selector)!.dataset['progress'];
    a.seek(.75); a.pause(); a.prepare();
    const sampled = {
      first: a.progress(), second: b.progress(),
      firstGraph: value(first, '.reference-geometry'), firstSymbols: value(first, '.comb-stage'),
      secondGraph: value(second, '.reference-geometry'), secondSymbols: value(second, '.comb-stage'),
      lastFrame: frames.at(-1), lastSettlement: settlements.at(-1),
    };
    const columns = (root: HTMLElement) => getComputedStyle(root.querySelector('.reference-comparison')!).gridTemplateColumns.split(' ').length;
    const layout = { narrowColumns: columns(first), wideColumns: columns(second), viewport: innerWidth };
    const countBeforeDispose = document.querySelectorAll('.reference-geometry').length;
    a.dispose(); a.dispose();
    const ownedCleanup = first.childNodes.length === 1 && first.firstChild === retained;
    const retired = attempt(() => a.seek(0));
    const failedSetup = attempt(() => mountLinkedColumnExplanation(first, product, .2, () => {}, 'failed', () => { throw new Error('observer failed'); }));
    const failedCleanup = first.childNodes.length === 1 && first.firstChild === retained;
    const replacement = mountLinkedColumnExplanation(first, product, 1, () => {}, 'replacement');
    const remounted = replacement.progress(); replacement.dispose(); b.dispose();
    const originalCount = document.querySelectorAll('.reference-geometry').length;
    runtime.dispose(); first.remove(); second.remove();
    return { detached, invalid, untouched, duplicate, sampled, layout, countBeforeDispose,
      ownedCleanup, retired, failedSetup, failedCleanup, remounted, originalCount };
  }, seed.matrixResources[0]);
  expect(result.detached).toContain('Attach'); expect(result.invalid).toContain('between 0 and 1');
  expect(result.untouched).toBe(true); expect(result.duplicate).toContain('Dispose');
  expect(result.sampled).toEqual({ first: .75, second: .5, firstGraph: '0.75', firstSymbols: '0.75',
    secondGraph: '0.5', secondSymbols: '0.5', lastFrame: .75, lastSettlement: .75 });
  expect(result.layout).toEqual({ narrowColumns: 1, wideColumns: 2, viewport: 1200 });
  expect(result.countBeforeDispose).toBe(3); expect(result.originalCount).toBe(1);
  expect(result.ownedCleanup).toBe(true); expect(result.retired).toContain('disposed');
  expect(result.failedSetup).toContain('observer failed'); expect(result.failedCleanup).toBe(true);
  expect(result.remounted).toBe(1); expect(errors).toEqual([]);
});
