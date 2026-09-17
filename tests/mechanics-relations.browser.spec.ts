import { test, expect, type Locator } from "@playwright/test";
import { sampleEnergyDerivationLens } from "../src/tutorial/mechanics-relations/energy-derivation-presentation.ts";

const route = "/experiments/mechanics-relations/";

test('startup preparation profile', async ({ page, browserName }, info) => {
  await page.setViewportSize({ width: 1280, height: 1100 });
  await page.addInitScript(() => {
    const observation = { rail: 0, interactive: 0, longTasks: [] as number[] };
    Object.defineProperty(window, '__derivationStartup', { value: observation });
    if (PerformanceObserver.supportedEntryTypes.includes('longtask'))
      new PerformanceObserver(list => observation.longTasks.push(...list.getEntries().map(entry => entry.duration)))
        .observe({ type: 'longtask', buffered: true });
    const observe = new MutationObserver(() => {
      const root = document.querySelector('[data-derivation-namespace="energy"]');
      const rail = root?.querySelector<HTMLElement>('[data-derivation-rail]');
      const handle = root?.querySelector<HTMLButtonElement>('[data-derivation-handle]');
      if (rail && !rail.hidden && !observation.rail) observation.rail = performance.now();
      if (handle && rail && !rail.hidden && !handle.disabled && root?.querySelector('[data-derivation-renderer]')) {
        observation.interactive = performance.now(); observe.disconnect();
      }
    });
    observe.observe(document, { subtree: true, childList: true, attributes: true, attributeFilter: ['hidden', 'disabled', 'data-derivation-renderer'] });
  });
  const cdp = browserName === 'chromium' ? await page.context().newCDPSession(page) : undefined;
  await cdp?.send('Profiler.enable');
  await cdp?.send('Profiler.start');
  const root = await ready(page);
  const profile = (await cdp?.send('Profiler.stop'))?.profile;
  const samples = new Map<number, number>();
  profile?.samples?.forEach((id, i) => samples.set(id, (samples.get(id) ?? 0) + (profile.timeDeltas?.[i] ?? 0) / 1000));
  const costs = profile?.nodes.map(node => ({ name: node.callFrame.functionName, url: node.callFrame.url,
    line: node.callFrame.lineNumber + 1, ms: Math.round(samples.get(node.id) ?? 0) })).sort((a, b) => b.ms - a.ms).slice(0, 25) ?? [];
  const timing = await page.evaluate(() => Reflect.get(window, '__derivationStartup'));
  const sections = await page.locator('[data-energy-derivation]').evaluateAll(roots => roots.map(root => ({
    namespace: root.getAttribute('data-derivation-namespace'), y: root.getBoundingClientRect().top,
    prepared: root.querySelectorAll('[data-derivation-renderer]').length
  })));
  const report = { browserName, timing, sections, costs };
  if (profile) await info.attach('startup-cpu-profile', { body: JSON.stringify(profile), contentType: 'application/json' });
  await info.attach('startup-costs', { body: JSON.stringify(report, null, 2), contentType: 'application/json' });
  console.log('DERIVATION_STARTUP', JSON.stringify({ ...report, costs: costs.slice(0, 5) }));
  await expect(lens(root)).toBeEnabled();
  // This later section used to start inside a whole-viewport prewarm margin,
  // occupying the main thread before the visible energy rail became usable.
  const later = sections.find(section => section.namespace === 'power')!;
  expect(later.y).toBeGreaterThan(1100);
  expect(later.prepared).toBe(0);
  const power = page.locator('[data-derivation-namespace="power"]');
  await power.scrollIntoViewIfNeeded();
  await expect(lens(power)).toBeEnabled();
  await expect(power).not.toHaveAttribute('data-repair', 'true');
});

for (const parent of ['cancel-mass', 'scale-magnitude']) test(`relationship-map entry honors a detail click while preparing: ${parent}`, async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.addInitScript(() => {
    const fonts = document.fonts;
    Object.defineProperty(document, 'fonts', { configurable: true, value: fonts });
    Object.defineProperty(document.fonts, 'ready', { configurable: true, value: new Promise<void>(resolve => {
      window.addEventListener('test-fonts-ready', () => resolve(), { once: true });
    }) });
  });
  await page.goto(route + '#relationship-map');
  const root = page.locator('[data-energy-derivation][data-derivation-namespace="energy"]');
  const expand = root.locator(`[data-refinement-expand="${parent}"]`);
  await expand.scrollIntoViewIfNeeded();
  const top = (await expand.boundingBox())!.y;
  const immediate = await expand.evaluate((el: HTMLButtonElement) => {
    el.click();
    return el.closest('[data-energy-derivation]')!.getAttribute('data-derivation-detail');
  });
  expect(immediate).toBe('mass-refinement');
  await root.locator('[data-refinement-local-return]').last().click();
  await expect(root).toHaveAttribute('data-derivation-detail', 'coarse');
  await root.locator(`[data-refinement-expand="${parent}"]`).click();
  await expect(root).toHaveAttribute('data-derivation-detail', 'mass-refinement');
  await page.evaluate(() => window.dispatchEvent(new Event('test-fonts-ready')));
  await expect(root).toHaveAttribute('data-derivation-detail', 'mass-refinement');
  await expect(lens(root)).toBeEnabled();
  await expect(root.locator('[data-refinement-status]')).toHaveCount(0);
  const positions = await root.locator('[data-refinement-collapse]').first().evaluate(async el => {
    const positions = [];
    for (let i = 0; i < 12; i++) { await new Promise(requestAnimationFrame); positions.push(el.getBoundingClientRect().top); }
    return positions;
  });
  expect(positions.every(y => Math.abs(y - top) < 2), JSON.stringify({ top, positions })).toBe(true);
  await root.locator('[data-refinement-local-return]').last().click();
  await expect(root).toHaveAttribute('data-derivation-detail', 'coarse');
  await expect(root).toHaveAttribute('data-move', parent === 'cancel-mass' ? '2' : '1');
});

test('cold disclosure gives the published detail a frame before native preparation', async ({ page }) => {
  await page.addInitScript(() => {
    const fonts = document.fonts;
    Object.defineProperty(document, 'fonts', { configurable: true, value: fonts });
    Object.defineProperty(fonts, 'ready', { configurable: true, value: new Promise<void>(resolve => {
      window.addEventListener('test-fonts-ready', () => resolve(), { once: true });
    }) });
  });
  await page.goto(route + '#relationship-map');
  const root = page.locator('[data-energy-derivation][data-derivation-namespace="energy"]');
  await root.locator('[data-refinement-expand="cancel-mass"]').scrollIntoViewIfNeeded();
  // Keep the native module warm while its scene preparation is still blocked.
  // Otherwise a network wait could accidentally provide the first paint.
  await page.evaluate(async () => {
    const modulePath = '/src/rendering/momentum-energy-derivation-session.ts';
    await import(modulePath);
  });
  const firstFrame = await root.evaluate(async el => {
    const start = performance.now();
    let prepared = 0;
    const observer = new MutationObserver(records => { prepared += records.filter(record => record.oldValue !== null).length; });
    observer.observe(el, { subtree: true, attributes: true, attributeOldValue: true, attributeFilter: ['data-derivation-preparing'] });
    el.querySelector<HTMLButtonElement>('[data-refinement-expand="cancel-mass"]')!.click();
    window.dispatchEvent(new Event('test-fonts-ready'));
    await new Promise(requestAnimationFrame);
    observer.disconnect();
    return { detail: el.dataset['derivationDetail'], prepared, elapsed: performance.now() - start,
      controls: el.querySelectorAll('[data-refinement-local-return]').length };
  });
  expect(firstFrame.detail).toBe('mass-refinement');
  expect(firstFrame.controls).toBeGreaterThan(0);
  expect(firstFrame.prepared).toBe(0);
  expect(firstFrame.elapsed).toBeLessThan(100);
  test.info().annotations.push({ type: 'disclosure-first-frame-ms', description: firstFrame.elapsed.toFixed(2) });
  await test.info().attach('disclosure-first-frame', { body: JSON.stringify(firstFrame), contentType: 'application/json' });
  await expect.poll(() => root.evaluate(el => ({
    enabled: !el.querySelector<HTMLButtonElement>('[data-derivation-handle]')!.disabled,
    repair: el.getAttribute('data-repair'), fonts: document.fonts.status,
    stages: [...el.querySelectorAll<HTMLElement>('.energy-derivation-stage')].map(stage => ({
      preparing: stage.hasAttribute('data-derivation-preparing'), hidden: stage.hidden,
      renderer: stage.dataset['derivationRenderer'],
      entity: stage.querySelector('[data-kp-semantic-entity-id]')?.getAttribute('data-kp-semantic-entity-id')
    }))
  })).then(value => JSON.stringify(value))).toContain('"enabled":true');
});

test('relationship-map published detail survives disposal without late animation writes', async ({ page }) => {
  await page.addInitScript(() => {
    const fonts = document.fonts;
    Object.defineProperty(document, 'fonts', { configurable: true, value: fonts });
    Object.defineProperty(document.fonts, 'ready', { configurable: true, value: new Promise<void>(resolve => {
      window.addEventListener('test-fonts-ready', () => resolve(), { once: true });
    }) });
  });
  await page.goto(route + '#relationship-map');
  const root = page.locator('[data-energy-derivation][data-derivation-namespace="energy"]');
  await root.locator('[data-refinement-expand="cancel-mass"]').click();
  await expect(root).toHaveAttribute('data-derivation-detail', 'mass-refinement');
  await page.evaluate(async () => {
    window.dispatchEvent(new PageTransitionEvent('pagehide'));
    window.dispatchEvent(new Event('test-fonts-ready'));
    for (let i = 0; i < 12; i++) await new Promise(requestAnimationFrame);
  });
  await expect(root).toHaveAttribute('data-derivation-detail', 'mass-refinement');
  await expect(root.locator('[data-refinement-status], [data-disclosure-paint], [data-derivation-preparing]')).toHaveCount(0);
});

test('first disclosure keeps a usable handle from the click onward', async ({ page }) => {
  await page.setViewportSize({ width: 1000, height: 700 });
  const root = await ready(page);
  await root.locator('[data-derivation-entry="2"]').click();
  await dragTo(page, root, 2.55);
  const frames = await root.evaluate(async el => {
    const handle = el.querySelector<HTMLButtonElement>('[data-derivation-handle]')!;
    const top = handle.getBoundingClientRect().top, start = performance.now();
    el.querySelector<HTMLButtonElement>('[data-refinement-expand="cancel-mass"]')!.click();
    const frames = [];
    for (let i = 0; i < 12; i++) {
      await new Promise(requestAnimationFrame);
      frames.push({ elapsed: Math.round(performance.now() - start), disabled: handle.disabled,
        delta: Math.round(handle.getBoundingClientRect().top - top), move: el.dataset['move'] });
    }
    return frames;
  });
  expect(frames.filter(frame => frame.disabled || Math.abs(frame.delta) > 2)).toEqual([]);
  await root.locator('[data-derivation-entry="4"]').click();
  await dragTo(page, root, 4.55);
  const back = root.locator('[data-refinement-local-return]').last();
  await back.scrollIntoViewIfNeeded();
  const returned = await root.evaluate(async el => {
    const handle = el.querySelector<HTMLButtonElement>('[data-derivation-handle]')!;
    const start = performance.now(), frames = [];
    const buttons = el.querySelectorAll<HTMLButtonElement>('[data-refinement-local-return]');
    buttons[buttons.length - 1]!.click();
    for (let i = 0; i < 12; i++) {
      await new Promise(requestAnimationFrame);
      frames.push({ elapsed: Math.round(performance.now() - start), disabled: handle.disabled,
        y: handle.getBoundingClientRect().top, move: el.dataset['move'], progress: el.dataset['progress'] });
    }
    return frames;
  });
  expect(returned.filter(frame => frame.disabled || frame.move !== '2' || Number(frame.progress) < .5 || frame.y < 0 || frame.y > 670)).toEqual([]);
  expect(Math.max(...returned.map(frame => frame.y)) - Math.min(...returned.map(frame => frame.y))).toBeLessThan(2);
  expect(frames[0]!.elapsed).toBeLessThan(50);
});

test("Back to step 3 returns to its parent without rebuilding or a disabled frame", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 1800 });
  const root = await ready(page);
  const original = await root.evaluateHandle(el => [...el.querySelectorAll('.energy-derivation-chain > .energy-derivation-stage')]);
  // Open step 3's explanation while another edge is selected: the label must
  // not secretly mean return to that unrelated previous selection.
  await root.locator('[data-refinement-expand="cancel-mass"]').click();
  await expect(root).toHaveAttribute('data-derivation-detail', 'mass-refinement');
  await expect(lens(root)).toBeEnabled();
  const frames = await root.evaluate(async el => {
    const button = el.querySelector<HTMLButtonElement>('[data-refinement-local-return]')!;
    button.click();
    const frames: { move: string | undefined; disabled: boolean }[] = [];
    for (let i = 0; i < 20; i++) {
      await new Promise(requestAnimationFrame);
      frames.push({ move: el.dataset['move'], disabled: el.querySelector<HTMLButtonElement>('[data-derivation-handle]')!.disabled });
    }
    return frames;
  });
  expect(frames).toEqual(Array.from({ length: 20 }, () => ({ move: '2', disabled: false })));
  expect(await original.evaluate(scenes => scenes.every(scene => scene.isConnected))).toBe(true);
  await expect(root).toHaveAttribute('data-progress', '0');
  await dragTo(page, root, 2.55);
  const held = await root.getAttribute('data-progress');
  const reopening = await root.evaluate(async el => {
    el.querySelector<HTMLButtonElement>('[data-refinement-expand="cancel-mass"]')!.click();
    await new Promise(requestAnimationFrame);
    return el.querySelector<HTMLButtonElement>('[data-derivation-handle]')!.disabled;
  });
  expect(reopening).toBe(false);
  await expect(lens(root)).toBeEnabled();
  await root.locator('[data-refinement-local-return]').last().click();
  await expect(root).toHaveAttribute('data-move', '2');
  await expect(root).toHaveAttribute('data-progress', held!);
});

test("disclosure preserves the visible handle and real equation paint frame by frame", async ({ page }, info) => {
  await page.setViewportSize({ width: 1280, height: 1800 });
  const root = await ready(page);
  for (const font of ['16px', '24px']) {
    await page.evaluate(size => { document.documentElement.style.fontSize = size; }, font);
    await dragTo(page, root, 1.62);
    for (const selector of ['[data-refinement-expand="scale-magnitude"]', '[data-refinement-collapse]']) {
      const continuity = await root.evaluate(async (el, selector) => {
        const handle = el.querySelector<HTMLElement>('[data-derivation-handle]')!;
        const grip = handle.getBoundingClientRect();
        const sample = () => {
          const owners = [...el.querySelectorAll<HTMLElement>('[data-derivation-stage], [data-disclosure-paint]')]
            .filter(stage => stage.checkVisibility({ checkVisibilityCSS: true, checkOpacity: true }));
          const ink = owners.flatMap(stage => [...stage.querySelectorAll<HTMLElement>('[data-kp-equation-material-semantic-entity-id$=".prefix"]')])
            .filter(node => node.checkVisibility({ checkVisibilityCSS: true, checkOpacity: true }));
          const box = ink[0]?.getBoundingClientRect();
          const paint = owners.flatMap(stage => [...stage.querySelectorAll<HTMLElement>('[data-kp-equation-material-owner-id]')])
            .filter(node => node.checkVisibility({ checkVisibilityCSS: true, checkOpacity: true }))
            .map(node => { const rect = node.getBoundingClientRect(); return {
              id: node.dataset['kpEquationMaterialSemanticEntityId'], x: rect.x, y: rect.y, width: rect.width, height: rect.height
            }; }).sort((a, b) => (a.id ?? '').localeCompare(b.id ?? ''));
          return { count: ink.length, x: box?.x ?? NaN, y: box?.y ?? NaN, grip: handle.getBoundingClientRect().top, paint };
        };
        const before = sample(), frames = [];
        el.querySelector<HTMLButtonElement>(selector)!.click();
        const start = performance.now();
        while (performance.now() - start < 900) {
          await new Promise(requestAnimationFrame); frames.push(sample());
        }
        return { before, frames, grip: grip.top };
      }, selector);
      expect(continuity.before.count).toBe(1);
      for (const frame of continuity.frames) {
        expect(frame.count).toBe(1);
        expect(Math.abs(frame.grip - continuity.grip)).toBeLessThan(2);
        expect(Math.abs(frame.x - continuity.before.x)).toBeLessThan(2);
        expect(Math.abs(frame.y - continuity.before.y)).toBeLessThan(2);
        expect(frame.paint.map(ink => ink.id)).toEqual(continuity.before.paint.map(ink => ink.id));
        frame.paint.forEach((ink, i) => {
          for (const axis of ['x', 'y', 'width', 'height'] as const)
            expect(Math.abs(ink[axis] - continuity.before.paint[i]![axis])).toBeLessThan(2);
        });
      }
      await expect(root.locator('[data-disclosure-paint]')).toHaveCount(0);
      await page.screenshot({ path: info.outputPath(`handle-continuity-${font}-${selector.includes('expand') ? 'open' : 'return'}.png`) });
    }
  }
});

test("pending disclosure paint yields to input and releases on page disposal", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 1800 });
  const root = await ready(page);
  await dragTo(page, root, 1.62);
  const delay = await page.evaluateHandle(() => {
    let release!: () => void;
    const pending = new Promise<void>(resolve => { release = resolve; });
    Object.defineProperty(document.fonts, 'ready', { configurable: true, value: pending });
    return { release };
  });
  await root.locator('[data-refinement-expand="scale-magnitude"]').click();
  await expect(root.locator('[data-disclosure-paint]')).toHaveCount(1);
  await page.mouse.wheel(0, 100);
  await expect(root.locator('[data-disclosure-paint]')).toHaveCount(0);
  expect(await lens(root).evaluate(el => el.style.position)).toBe('');
  await delay.evaluate(control => control.release());
  await expect(lens(root)).toBeEnabled();
  await expect(root).not.toHaveAttribute('data-disclosure-handoff');
  await root.locator('[data-refinement-collapse]').first().click();
  await expect(root).toHaveAttribute('data-derivation-detail', 'coarse');
  await dragTo(page, root, 1.62);
  await page.evaluate(() => Object.defineProperty(document.fonts, 'ready', { configurable: true, value: new Promise(() => {}) }));
  await root.locator('[data-refinement-expand="scale-magnitude"]').click();
  await expect(root.locator('[data-disclosure-paint]')).toHaveCount(1);
  await page.evaluate(() => window.dispatchEvent(new PageTransitionEvent('pagehide')));
  await expect(root.locator('[data-disclosure-paint]')).toHaveCount(0);
  await expect(root).not.toHaveAttribute('data-disclosure-handoff');
  expect(await lens(root).evaluate(el => el.style.position)).toBe('');
});

test("nonterminal unfolding retains downstream context and exact held return", async ({ page }, info) => {
  await page.setViewportSize({ width: 1280, height: 1800 });
  const root = await ready(page);
  const retained = await root.evaluateHandle(el => ({
    equations: [...el.querySelectorAll('.energy-derivation-equation')],
    prose: el.querySelector('[data-derivation-row="2"] .energy-derivation-interleave-text'),
    grip: el.querySelector('[data-derivation-handle]')
  }));
  for (const font of ['16px', '24px']) {
    await page.evaluate(size => { document.documentElement.style.fontSize = size; }, font);
    await dragTo(page, root, 1.62);
    const held = await root.getAttribute('data-progress');
    const childProgress = Number(await root.locator('[data-derivation-stage]').getAttribute('data-inspection-child-progress'));
    await root.locator('[data-refinement-expand="scale-magnitude"]').click();
    await expect(root).toHaveAttribute('data-refinement-unfolding', 'true');
    await expect(root).toHaveAttribute('data-move', '2');
    await expect(root.locator('[data-transition-number]')).toHaveText(['1', '2', '2.1', '2.2', '3']);
    await expect(root.locator('[data-derivation-row]')).toHaveCount(5);
    expect(await retained.evaluate(saved => [...saved.equations, saved.prose, saved.grip].every(el => el?.isConnected))).toBe(true);
    expect(sampleEnergyDerivationLens(Number(await root.getAttribute('data-progress'))).algebra).toBeCloseTo(childProgress, 8);
    expect(childProgress).toBeGreaterThan(0);
    await page.screenshot({ path: info.outputPath(`nonterminal-open-${font}.png`) });
    await root.locator('[data-derivation-entry="3"]').click();
    await expect(root).toHaveAttribute('data-move', '3');
    await expect(root).not.toHaveAttribute('data-repair', 'true');
    await root.locator('[data-refinement-collapse]').first().click();
    await expect(root).toHaveAttribute('data-progress', held!);
    await expect(root).toHaveAttribute('data-move', '1');
    expect(await retained.evaluate(saved => [...saved.equations, saved.prose, saved.grip].every(el => el?.isConnected))).toBe(true);
    await expect(root.locator('[data-refinement-expand="scale-magnitude"]')).toBeFocused();
  }
  await dragTo(page, root, 2.55);
  const downstreamHeld = await root.getAttribute('data-progress');
  await root.locator('[data-refinement-expand="scale-magnitude"]').click();
  await expect(root).toHaveAttribute('data-move', '3');
  await expect(root).toHaveAttribute('data-progress', downstreamHeld!);
  await root.locator('[data-derivation-entry="0"]').click();
  await expect(root).toHaveAttribute('data-move', '0');
  await root.locator('[data-derivation-entry="3"]').click();
  await expect(root).toHaveAttribute('data-progress', downstreamHeld!);
  await root.locator('[data-refinement-collapse]').first().click();
  await expect(root).toHaveAttribute('data-move', '2');
  await expect(root).toHaveAttribute('data-progress', downstreamHeld!);
});

for (const parentId of ['cancel-mass', 'scale-magnitude']) test(`rail jumps directly and reveals endpoint ink at both viewport edges: ${parentId}`, async ({ page }) => {
  await page.setViewportSize({ width: 1000, height: 650 });
  const root = await ready(page);
  for (const font of ['16px', '24px']) {
    await page.evaluate(size => { document.documentElement.style.fontSize = size; }, font);
    for (const index of [3, 0]) {
      const row = root.locator(`[data-derivation-row="${index}"] .energy-derivation-equation`);
      await row.evaluate((el, bottom) => {
        const box = el.getBoundingClientRect(); scrollBy(0, box.top + box.height / 2 - (bottom ? 625 : 20));
      }, index > 0);
      const box = (await row.boundingBox())!, rail = (await root.locator('[data-derivation-rail]').boundingBox())!;
      await page.mouse.click(rail.x + 10, box.y + box.height / 2);
      await expect(lens(root)).toHaveAttribute('aria-valuenow', String(index));
      await expect(root).toHaveAttribute('data-playing', 'false');
      await expect.poll(() => row.evaluate(el => {
        const boxes = [el, ...el.querySelectorAll('.katex-html .base, .katex-html .vlist')].map(n => n.getBoundingClientRect()).filter(b => b.width && b.height);
        return Math.min(...boxes.map(b => b.top)) >= 47 && Math.max(...boxes.map(b => b.bottom)) <= innerHeight - 47;
      })).toBe(true);
    }
  }
  await root.locator(`[data-refinement-expand="${parentId}"]`).click();
  await expect(root).toHaveAttribute('data-derivation-detail', 'mass-refinement');
  await root.locator('[data-refinement-collapse]').first().focus();
  const target = root.locator('[data-derivation-row="4"] .energy-derivation-equation');
  await target.evaluate(el => scrollBy(0, el.getBoundingClientRect().top - 300));
  const b = (await target.boundingBox())!, rail = (await root.locator('[data-derivation-rail]').boundingBox())!;
  await page.mouse.click(rail.x + 10, b.y + b.height / 2);
  await expect(lens(root)).toHaveAttribute('aria-valuenow', '4');
  for (const index of [parentId === 'cancel-mass' ? 5 : 4, 0]) {
    const endpoint = root.locator(`[data-derivation-row="${index}"] .energy-derivation-equation`);
    await endpoint.evaluate((el, end) => {
      const box = el.getBoundingClientRect(); scrollBy(0, box.top + box.height / 2 - (end ? 625 : 20));
    }, index > 0);
    const box = (await endpoint.boundingBox())!, track = (await root.locator('[data-derivation-rail]').boundingBox())!;
    await page.mouse.click(track.x + 10, box.y + box.height / 2);
    await expect(lens(root)).toHaveAttribute('aria-valuenow', String(index));
    await expect.poll(() => endpoint.evaluate(el => {
      const boxes = [el, ...el.querySelectorAll('.katex-html .base, .katex-html .vlist')].map(n => n.getBoundingClientRect()).filter(b => b.width && b.height);
      return Math.min(...boxes.map(b => b.top)) >= 47 && Math.max(...boxes.map(b => b.bottom)) <= innerHeight - 47;
    })).toBe(true);
  }
});

test("rail press seeks a fractional position then continues dragging", async ({ page }) => {
  await page.setViewportSize({ width: 1000, height: 1000 });
  const root = await ready(page);
  await root.locator('[data-derivation-row="1"]').evaluate(el => scrollBy(0, el.getBoundingClientRect().top - 220));
  const a = (await root.locator('[data-derivation-row="1"] .energy-derivation-equation').boundingBox())!;
  const b = (await root.locator('[data-derivation-row="2"] .energy-derivation-equation').boundingBox())!;
  const rail = (await root.locator('[data-derivation-rail]').boundingBox())!;
  const point = (p: number) => a.y + a.height / 2 + (b.y - a.y) * p;
  const timing = await root.evaluateHandle(el => {
    const sample = { milliseconds: -1 };
    el.addEventListener('pointerdown', () => {
      const start = performance.now();
      const observe = () => {
        const p = Number(el.querySelector('[data-derivation-handle]')!.getAttribute('aria-valuenow'));
        if (Math.abs(p - 1.25) < .01) sample.milliseconds = performance.now() - start;
        else if (performance.now() - start < 1000) requestAnimationFrame(observe);
      };
      requestAnimationFrame(observe);
    }, { once: true });
    return sample;
  });
  await page.mouse.move(rail.x - 10, point(.25)); await page.mouse.down();
  await expect.poll(async () => Number(await lens(root).getAttribute('aria-valuenow'))).toBeCloseTo(1.25, 2);
  await expect.poll(() => timing.evaluate(sample => sample.milliseconds)).toBeGreaterThanOrEqual(0);
  console.log('Prepared rail seek to next frame (ms):', await timing.evaluate(sample => sample.milliseconds));
  await page.mouse.move(rail.x - 10, point(.7));
  await expect.poll(async () => Number(await lens(root).getAttribute('aria-valuenow'))).toBeCloseTo(1.7, 2);
  await page.mouse.up();
  await expect(root).toHaveAttribute('data-playing', 'false');
  await expect(root).not.toHaveAttribute('data-derivation-dragging', 'true');
});

test("keyboard navigation reveals selected ink without capturing ordinary scrolling", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 1000, height: 650 });
  const root = await ready(page), handle = lens(root);
  for (const key of ['End', 'Home']) {
    await handle.focus(); await handle.press(key);
    await expect(handle).toHaveAttribute('aria-valuenow', key === 'End' ? '3' : '0');
    const equation = key === 'End' ? root.locator('.energy-derivation-equation').last() : root.locator('.energy-derivation-equation').first();
    await expect.poll(() => equation.evaluate(el => {
      const b = el.getBoundingClientRect(); return b.top >= 47 && b.bottom <= innerHeight - 47;
    })).toBe(true);
  }
  const position = await handle.getAttribute('aria-valuenow');
  const before = await page.evaluate(() => scrollY);
  await page.mouse.wheel(0, 180);
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(before + 100);
  await page.waitForTimeout(200);
  expect(await page.evaluate(() => scrollY)).toBeGreaterThan(before + 100);
  await expect(handle).toHaveAttribute('aria-valuenow', position!);
});

for (const parentId of ['cancel-mass', 'scale-magnitude']) test(`inline refinement repair retains the original reading: ${parentId}`, async ({ page }) => {
  const root = await ready(page);
  const source = await root.locator('[data-refinement-anchor] .energy-derivation-equation').elementHandle();
  await root.locator(`[data-refinement-view="${parentId}"]`).evaluate((el: HTMLTemplateElement) => {
    el.content.querySelector('[data-derivation-template="2"]')!.remove();
  });
  await root.locator(`[data-refinement-expand="${parentId}"]`).click();
  await expect(root.locator('[data-refinement-status]')).toContainText('needs repair');
  await expect(root).toHaveAttribute('data-refinement-unfolding', 'false');
  await expect(root.locator(`[data-refinement-expand="${parentId}"]`)).toBeFocused();
  expect(await source!.evaluate(el => el.isConnected)).toBe(true);
  await expect(root.locator('[data-derivation-row]')).toHaveCount(4);
});

test("inline refinement retains native endpoints parent explanation and grip", async ({ page }, info) => {
  await page.setViewportSize({ width: 1100, height: 1100 });
  const root = await ready(page);
  const parent = root.locator('[data-refinement-anchor]');
  await parent.evaluate(el => scrollBy(0, el.getBoundingClientRect().top - 100));
  const retained = await root.evaluateHandle(el => ({
    root: el,
    source: el.querySelector('[data-refinement-anchor] .energy-derivation-equation'),
    target: el.querySelector('[data-derivation-row]:last-child .energy-derivation-equation'),
    prose: el.querySelector('[data-refinement-anchor] .energy-derivation-interleave-text'),
    grip: el.querySelector('[data-derivation-handle]'),
    button: el.querySelector('[data-refinement-expand]:not([data-refinement-norm])')
  }));
  await page.screenshot({ path: info.outputPath('inline-refinement-before.png') });
  for (let cycle = 0; cycle < 2; cycle++) {
    if (cycle === 1) await page.evaluate(() => { document.documentElement.style.fontSize = '24px'; });
    await root.locator('[data-refinement-expand]:not([data-refinement-norm])').click();
    await expect(root).toHaveAttribute('data-refinement-unfolding', 'true');
    await expect(root.locator('[data-refinement-collapse]').first()).toBeFocused();
    expect(await retained.evaluate(saved => Object.values(saved).every(node => node?.isConnected))).toBe(true);
    await expect(root.locator('[data-refinement-parent]')).toContainText('Cancel');
    await expect(root.locator('[data-derivation-row]')).toHaveCount(6);
    if (cycle === 0) await page.screenshot({ path: info.outputPath('inline-refinement-open.png') });
    await root.locator('[data-derivation-entry="3"]').click();
    await expect(root).toHaveAttribute('data-move', '3');
    await root.locator('[data-refinement-collapse]').first().click();
    await expect(root).toHaveAttribute('data-refinement-unfolding', 'false');
    await expect(root.locator('[data-refinement-expand]:not([data-refinement-norm])')).toBeFocused();
    expect(await retained.evaluate(saved => Object.values(saved).every(node => node?.isConnected))).toBe(true);
    await expect(root.locator('[data-derivation-row]')).toHaveCount(4);
  }
});

for (const parentId of ['cancel-mass', 'scale-magnitude']) test(`smaller steps preserves its anchor from the first replacement frame: ${parentId}`, async ({ page }) => {
  const root = await ready(page);
  const expand = root.locator(`[data-refinement-expand="${parentId}"]`);
  await expand.evaluate(el => scrollBy(0, el.getBoundingClientRect().top - 220));
  for (const entry of [expand, root.locator('[data-refinement-collapse]').first()]) {
    const drift = await entry.evaluate(async el => {
      if (!(el instanceof HTMLButtonElement)) throw new Error('Expected refinement button');
      const top = el.getBoundingClientRect().top;
      const selector = el.hasAttribute('data-refinement-expand') ? '[data-refinement-collapse]' : `[data-refinement-expand="${el.getAttribute('data-refinement-collapse')}"]`;
      const positions: number[] = [];
      el.click();
      const start = performance.now();
      while (performance.now() - start < 1500) {
        await new Promise(requestAnimationFrame);
        const control = document.querySelector<HTMLElement>(`[data-energy-derivation]:not([data-derivation-namespace=power]) ${selector}`);
        if (control) positions.push(control.getBoundingClientRect().top);
      }
      if (!positions.length) throw new Error('Replacement control never appeared');
      return Math.max(...positions.map(y => Math.abs(y - top)));
    });
    expect(drift).toBeLessThan(2);
  }
});

test("disclosure settling releases ownership on keyboard input and page disposal", async ({ page }) => {
  const root = await ready(page);
  const summary = root.locator('[data-derivation-interleave="0"] details > summary').first();
  await summary.click();
  expect(await page.evaluate(() => document.documentElement.style.overflowAnchor)).toBe('none');
  await summary.press('Escape');
  expect(await page.evaluate(() => document.documentElement.style.overflowAnchor)).toBe('');
  await summary.click();
  await root.locator('[data-derivation-recall] > summary').click();
  expect(await page.evaluate(() => document.documentElement.style.overflowAnchor)).toBe('none');
  await page.evaluate(() => window.dispatchEvent(new PageTransitionEvent('pagehide')));
  expect(await page.evaluate(() => document.documentElement.style.overflowAnchor)).toBe('');
});

test("disclosure anchor survives delayed reflow and yields to reader scrolling", async ({ page }) => {
  await page.setViewportSize({ width: 1000, height: 650 });
  const root = await ready(page);
  const summary = root.locator('[data-derivation-interleave="0"] details > summary').first();
  await summary.evaluate(el => scrollBy(0, el.getBoundingClientRect().top - 180));
  const top = (await summary.boundingBox())!.y;
  await summary.click();
  expect(await page.evaluate(() => document.documentElement.style.overflowAnchor)).toBe('none');
  await page.waitForTimeout(250);
  // Model a late toolbar/font reflow after the initial toggle has settled.
  await root.locator('.energy-derivation-local-access').first().evaluate(el => { el.style.paddingBottom = '90px'; });
  await page.waitForTimeout(250);
  expect(Math.abs((await summary.boundingBox())!.y - top)).toBeLessThan(2);
  const before = await page.evaluate(() => scrollY);
  await page.mouse.wheel(0, 140);
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(before + 80);
  await page.waitForTimeout(250);
  expect((await summary.boundingBox())!.y).toBeLessThan(top - 80);
  expect(await page.evaluate(() => document.documentElement.style.overflowAnchor)).toBe('');
});

test("opening smaller steps preserves the visible reading anchor in the viewport", async ({ page }) => {
  await page.setViewportSize({ width: 1000, height: 650 });
  const root = await ready(page);
  // Enter the local move before dragging so release stays inside the viewport.
  await root.locator('[data-derivation-entry="2"]').click();
  await dragTo(page, root, 2.55);
  const progress = await lens(root).getAttribute('aria-valuenow');
  const expand = root.locator('[data-refinement-expand]:not([data-refinement-norm])');
  await expand.evaluate(el => { scrollBy(0, el.getBoundingClientRect().top - 220); });
  const grip = (await lens(root).boundingBox())!;
  const anchoredHandle = grip.y >= 0 && grip.y + grip.height <= 650;
  const top = (await (anchoredHandle ? lens(root) : expand).boundingBox())!.y;
  await expand.click();
  await expect(root).toHaveAttribute('data-derivation-detail', 'mass-refinement');
  const collapse = root.locator('[data-refinement-collapse]').first();
  await expect(collapse).toBeFocused();
  expect(await page.evaluate(() => document.documentElement.style.overflowAnchor)).toBe('none');
  const openAnchor = anchoredHandle ? lens(root) : collapse;
  expect(Math.abs((await openAnchor.boundingBox())!.y - top)).toBeLessThan(2);
  const entryDrift = await openAnchor.evaluate(async el => {
    const start = performance.now(), positions: number[] = [];
    while (performance.now() - start < 1200) { await new Promise(requestAnimationFrame); positions.push(el.getBoundingClientRect().top); }
    return Math.max(...positions) - Math.min(...positions);
  });
  expect(entryDrift).toBeLessThan(2);
  await collapse.click();
  await expect(root).toHaveAttribute('data-derivation-detail', 'coarse');
  await expect(expand).toBeFocused();
  const returnAnchor = anchoredHandle ? lens(root) : expand;
  expect(Math.abs((await returnAnchor.boundingBox())!.y - top)).toBeLessThan(2);
  const returnDrift = await returnAnchor.evaluate(async el => {
    const start = performance.now(), positions: number[] = [];
    while (performance.now() - start < 1200) { await new Promise(requestAnimationFrame); positions.push(el.getBoundingClientRect().top); }
    return Math.max(...positions) - Math.min(...positions);
  });
  expect(returnDrift).toBeLessThan(2);
  await expect(lens(root)).toHaveAttribute('aria-valuenow', progress!);
});

test("explanation disclosure preserves its reading anchor and held inspection", async ({ page }) => {
  await page.setViewportSize({ width: 1000, height: 650 });
  const root = await ready(page), handle = lens(root);
  await dragTo(page, root, .5);
  const summary = root.locator('[data-derivation-interleave="0"] details > summary').first();
  await summary.evaluate(el => { scrollBy(0, el.getBoundingClientRect().top - 120); });
  const progress = await handle.getAttribute('aria-valuenow');
  for (const keyboard of [false, true]) {
    const top = (await summary.boundingBox())!.y;
    if (keyboard) { await summary.focus(); await summary.press('Enter'); } else await summary.click();
    await page.waitForTimeout(100);
    expect(Math.abs((await summary.boundingBox())!.y - top)).toBeLessThan(2);
    await expect(handle).toHaveAttribute('aria-valuenow', progress!);
    await expect(root).toHaveAttribute('data-playing', 'false');
  }
  await page.evaluate(() => { document.documentElement.style.fontSize = '24px'; });
  await expect.poll(async () => Number(await handle.getAttribute('aria-valuenow'))).toBeCloseTo(Number(progress), 5);
  const recall = root.locator('[data-derivation-recall] > summary');
  await recall.evaluate(el => { scrollBy(0, el.getBoundingClientRect().top - 160); });
  const recallTop = (await recall.boundingBox())!.y;
  await recall.click();
  await expect.poll(async () => Math.abs((await recall.boundingBox())!.y - recallTop)).toBeLessThan(2);
  await expect(handle).toHaveAttribute('aria-valuenow', progress!);
});

test("inset fenceposts hand overlapping paint to the moving equation and restore it at docks", async ({ page }, info) => {
  await page.setViewportSize({ width: 1280, height: 1100 });
  const root = await ready(page), records = root.locator('.energy-derivation-equation');
  const opacity = (el: Locator) => el.evaluate(node => Number(getComputedStyle(node).opacity));
  const initial = await documentBoxes(records);
  for (const p of [0, .03, .5, .97, 1, .97, .03, 0]) {
    await dragTo(page, root, p);
    const stage = root.locator('[data-derivation-stage]');
    expect(await opacity(stage)).toBe(p === 0 || p === 1 ? 0 : 1);
    if (p === .03) expect(await opacity(records.nth(0))).toBe(0);
    if (p === .97) expect(await opacity(records.nth(1))).toBe(0);
    if (p === 0 || p === 1 || p === .5) {
      expect(await opacity(records.nth(0))).toBe(1);
      expect(await opacity(records.nth(1))).toBe(1);
    }
    expect(await documentBoxes(records)).toEqual(initial);
    if (p === .5 || p === .97 || p === 1) await root.screenshot({ path: info.outputPath(`inset-${p}.png`) });
  }
  await page.evaluate(() => { document.documentElement.style.fontSize = '24px'; });
  await expect(lens(root)).toBeEnabled();
  await dragTo(page, root, .97);
  expect(await opacity(records.nth(1))).toBe(0);
  expect(await opacity(root.locator('[data-derivation-stage]'))).toBe(1);
  await page.emulateMedia({ media: 'print' });
  for (const record of await records.all()) expect(await opacity(record)).toBe(1);
});

test("equation rail refinement keeps stops and the active move aligned", async ({ page }, info) => {
  await page.setViewportSize({ width: 1280, height: 1100 });
  const root = await ready(page), handle = lens(root), rail = root.locator('[data-derivation-rail]');
  await expect(root).toHaveAttribute('data-rail-position', 'docked');
  const records = root.locator('.energy-derivation-equation');
  const before = await documentBoxes(records);
  const grip = (await handle.boundingBox())!, line = (await rail.boundingBox())!;
  expect(grip.width).toBeGreaterThanOrEqual(44);
  expect(Math.abs(grip.x + grip.width / 2 - line.x - line.width / 2)).toBeLessThan(1);
  await root.screenshot({ path: info.outputPath('rail-docked.png') });
  await dragTo(page, root, .5);
  await expect(root).toHaveAttribute('data-rail-position', 'between');
  await expect(rail.locator('[data-rail-stop="boundary"]')).toHaveCount(2);
  await expect(root.locator('[data-rail-active="true"]')).toHaveAttribute('data-derivation-interleave', '0');
  expect(await documentBoxes(records)).toEqual(before);
  await expect(root.locator('[data-derivation-hint]')).toBeVisible();
  await root.screenshot({ path: info.outputPath('rail-inspecting.png') });
  await dragTo(page, root, 1.5);
  await expect(root.locator('[data-rail-active="true"]')).toHaveAttribute('data-derivation-interleave', '1');
  await dragTo(page, root, .5);
  await expect(root.locator('[data-rail-active="true"]')).toHaveAttribute('data-derivation-interleave', '0');
  await page.emulateMedia({ reducedMotion: 'reduce', forcedColors: 'active' });
  await handle.focus(); await handle.press('Home');
  await expect(root).toHaveAttribute('data-rail-position', 'docked');
  await expect(root.locator('[data-rail-active="true"]')).toHaveCount(0);
  await expect(rail.locator('[data-rail-stop="current"]')).toHaveCount(1);
  await expect(handle).toBeFocused();
  await root.screenshot({ path: info.outputPath('rail-keyboard-contrast.png') });
});

test("equation geometry survives font resizing without a width change", async ({ page }) => {
  await page.setViewportSize({ width: 1100, height: 1100 });
  const root = await ready(page), handle = lens(root);
  await root.evaluate(el => { el.style.width = `${el.getBoundingClientRect().width}px`; });
  await dragTo(page, root, .4);
  const progress = await handle.getAttribute('aria-valuenow');
  const width = (await root.boundingBox())!.width;
  for (const size of [24, 16, 28]) {
    await page.evaluate(value => { document.documentElement.style.fontSize = `${value}px`; }, size);
    // Measure both sides in one layout sample: resize recovery can scroll
    // between independent browser round trips.
    await expect.poll(() => root.evaluate(el => {
      const slots = [...el.querySelectorAll('.energy-derivation-equation')].map(node => { const b = node.getBoundingClientRect(); return b.top + b.height / 2; });
      const b = el.querySelector('[data-derivation-handle]')!.getBoundingClientRect();
      const offset = Math.abs(b.y + b.height / 2 - (slots[0]! + .4 * (slots[1]! - slots[0]!)));
      return { aligned: offset < 1.5, offset, progress: el.dataset['progress'], move: el.dataset['move'],
        disabled: el.querySelector<HTMLButtonElement>('[data-derivation-handle]')!.disabled,
        preparing: el.querySelectorAll('[data-derivation-preparing]').length, fonts: document.fonts.status,
        visibility: document.visibilityState, slots, handleCenter: b.y + b.height / 2 };
    }).then(value => JSON.stringify(value))).toContain('"aligned":true');
    expect((await root.boundingBox())!.width).toBeCloseTo(width, 1);
    await expect(handle).toBeEnabled();
    await expect(handle).toHaveAttribute('aria-valuenow', progress!);
  }
});

test("one held equation drag reaches both readable extremes without keyboard docking", async ({ page }) => {
  await page.setViewportSize({ width: 1000, height: 650 });
  for (const namespace of ['energy', 'power']) {
    await page.goto(`${route}#${namespace === 'energy' ? 'energy-from-momentum' : 'force-to-energy'}`);
    const root = page.locator(`[data-derivation-namespace="${namespace}"]`), handle = lens(root);
    await page.evaluate(() => { document.documentElement.style.fontSize = '24px'; });
    await expect(handle).toBeEnabled();
    await handle.scrollIntoViewIfNeeded();
    const b = (await handle.boundingBox())!, x = b.x + b.width / 2;
    await page.mouse.move(x, b.y + b.height / 2); await page.mouse.down();
    await page.mouse.move(x, 638, { steps: 12 });
    const last = root.locator('.energy-derivation-equation').last();
    await expect.poll(async () => { const box = (await last.boundingBox())!; return box.y + box.height; }, { timeout: 15000 }).toBeLessThanOrEqual(603);
    await expect(handle).toHaveAttribute('aria-valuenow', await handle.getAttribute('aria-valuemax') ?? '');
    await page.mouse.move(x, 10, { steps: 12 });
    await expect.poll(async () => -(await root.boundingBox())!.y, { timeout: 15000 }).toBeLessThanOrEqual(-95);
    await expect(handle).toHaveAttribute('aria-valuenow', '0');
    await page.mouse.up();
  }
});

test("expanded equation font resizing cancels a held drag and rebuilds at the same position", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 1800 });
  const root = await ready(page), handle = lens(root);
  await root.locator('[data-refinement-expand]:not([data-refinement-norm])').click();
  await expect(root).toHaveAttribute('data-derivation-detail', 'mass-refinement');
  await expect(handle).toBeEnabled();
  await dragTo(page, root, 3.5, false);
  await expect(root).toHaveAttribute('data-derivation-dragging', 'true');
  const progress = await handle.getAttribute('aria-valuenow');
  const scenes = await root.evaluateHandle(el => [...el.querySelectorAll('.energy-derivation-stage')]);
  await page.evaluate(() => { document.documentElement.style.fontSize = '24px'; });
  await expect(root).not.toHaveAttribute('data-derivation-dragging', 'true');
  await expect.poll(() => scenes.evaluate(els => els.every(el => !el.isConnected))).toBe(true);
  await expect(handle).toBeEnabled();
  await expect(handle).toHaveAttribute('aria-valuenow', progress!);
  await page.mouse.move(200, 1790);
  const stopped = await page.evaluate(() => scrollY);
  await page.waitForTimeout(160);
  expect(await page.evaluate(() => scrollY)).toBe(stopped);
  await expect(handle).toHaveAttribute('aria-valuenow', progress!);
  await page.mouse.up();
  await dragTo(page, root, 3.2);
  await expect.poll(async () => Number(await handle.getAttribute('aria-valuenow'))).toBeCloseTo(3.2, 2);
  await expect(root.locator('.energy-derivation-stage')).toHaveCount(7);
  await scenes.dispose();
});

test("long graph font resizing cancels edge scrolling and preserves inspection", async ({ page }) => {
  await page.setViewportSize({ width: 1000, height: 650 });
  await page.goto(`${route}#momentum-move`);
  const root = page.locator('[data-momentum-move]'), slider = root.locator('[data-move-seek]');
  for (const detail of await root.locator('[data-move-depth]').all()) await detail.locator('summary').click();
  await root.locator('.momentum-move-layout').evaluate(el => el.scrollIntoView({ block: 'start' }));
  const box = (await slider.boundingBox())!, x = box.x + box.width / 2;
  await page.mouse.move(x, box.y + 10); await page.mouse.down(); await page.mouse.move(x, 635);
  const initial = await page.evaluate(() => scrollY);
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(initial + 40);
  await page.evaluate(() => { document.documentElement.style.fontSize = '24px'; });
  await page.waitForTimeout(160);
  const progress = await slider.inputValue(), stopped = await page.evaluate(() => scrollY);
  await page.mouse.move(x, 638); await page.waitForTimeout(160);
  expect(await page.evaluate(() => scrollY)).toBe(stopped);
  await expect(slider).toHaveValue(progress);
  await page.mouse.up();
  await slider.evaluate(el => { (el as HTMLInputElement).value = '1'; el.dispatchEvent(new Event('input')); const b = el.getBoundingClientRect(); scrollBy(0, b.bottom - 648); });
  const end = (await slider.boundingBox())!;
  await page.mouse.move(end.x + end.width / 2, end.y + end.height - 10); await page.mouse.down();
  await expect.poll(async () => { const b = (await root.locator('.momentum-move-argument').boundingBox())!; return b.y + b.height; }).toBeLessThanOrEqual(603);
  await page.mouse.up();
});

test("long graph argument keeps bounded sticky evidence and extends a held drag with edge scrolling", async ({ page }, info) => {
  await page.setViewportSize({ width: 1000, height: 650 });
  await page.goto(`${route}#momentum-move`);
  const root = page.locator('[data-momentum-move]'), slider = root.locator('[data-move-seek]');
  for (const detail of await root.locator('[data-move-depth]').all()) await detail.locator('summary').click();
  await root.locator('.momentum-move-layout').evaluate(el => el.scrollIntoView({ block: 'start' }));
  await expect(root.locator('figure')).toHaveAttribute('data-sticky-fit', 'true');
  const p = () => slider.inputValue().then(Number);
  const before = await p();
  await page.evaluate(() => scrollBy(0, 180));
  expect(await p()).toBe(before);
  expect((await root.locator('figure').boundingBox())!.y).toBeCloseTo(16, 0);
  await root.locator('.momentum-move-layout').evaluate(el => el.scrollIntoView({ block: 'start' }));
  const box = (await slider.boundingBox())!, x = box.x + box.width / 2;
  expect(box.height).toBeGreaterThan(900);
  await page.mouse.move(x, box.y + 10); await page.mouse.down();
  await page.mouse.move(x, 635);
  const startScroll = await page.evaluate(() => scrollY), startProgress = await p();
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(startScroll + 100);
  expect(await p()).toBeGreaterThan(startProgress);
  const held = await p();
  await page.mouse.move(x, 12);
  const reverseScroll = await page.evaluate(() => scrollY);
  await expect.poll(() => page.evaluate(() => scrollY)).toBeLessThan(reverseScroll - 60);
  expect(await p()).toBeLessThan(held);
  await page.mouse.up();
  const released = await p(), stopped = await page.evaluate(() => scrollY);
  await page.waitForTimeout(160);
  expect(await p()).toBe(released); expect(await page.evaluate(() => scrollY)).toBe(stopped);
  await root.locator('.momentum-move-layout').evaluate(el => el.scrollIntoView({ block: 'start' }));
  await slider.evaluate(el => { (el as HTMLInputElement).value = '0'; el.dispatchEvent(new Event('input')); });
  const reset = (await slider.boundingBox())!;
  await page.mouse.move(x, reset.y + 10); await page.mouse.down(); await page.mouse.move(x, 635);
  await root.locator('[data-move-pointer]').dispatchEvent('pointercancel');
  await page.mouse.up();
  const cancelled = await page.evaluate(() => scrollY);
  await page.waitForTimeout(160); expect(await page.evaluate(() => scrollY)).toBe(cancelled);
  await slider.evaluate(el => { (el as HTMLInputElement).value = '1'; el.dispatchEvent(new Event('input')); const box = el.getBoundingClientRect(); scrollBy(0, box.bottom - 640); });
  const end = (await slider.boundingBox())!;
  await page.mouse.move(x, end.y + end.height - 10); await page.mouse.down();
  await expect.poll(async () => { const b = (await root.locator('.momentum-move-argument').boundingBox())!; return b.y + b.height; }).toBeLessThanOrEqual(603);
  const endpointScroll = await page.evaluate(() => scrollY);
  await page.waitForTimeout(160);
  expect(await page.evaluate(() => scrollY)).toBe(endpointScroll); expect(await p()).toBe(1);
  await page.mouse.up();
  await root.locator('.momentum-move-layout').evaluate(el => { const box = el.getBoundingClientRect(); scrollBy(0, box.bottom - 150); });
  expect((await root.locator('figure').boundingBox())!.y).toBeLessThan(16);
  await root.locator('.momentum-move-layout').evaluate(el => el.scrollIntoView({ block: 'start' }));
  await page.evaluate(() => scrollBy(0, 220));
  await page.screenshot({ path: info.outputPath('sticky-graph-long-text.png') });
});

test("equation edge scrolling resamples a stationary pointer and cancels on release", async ({ page }) => {
  await page.setViewportSize({ width: 1000, height: 650 });
  const root = await ready(page);
  await lens(root).scrollIntoViewIfNeeded();
  const box = (await lens(root).boundingBox())!, x = box.x + box.width / 2;
  await page.mouse.move(x, box.y + box.height / 2); await page.mouse.down();
  await page.mouse.move(x, 635);
  const before = await page.evaluate(() => scrollY);
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(before + 60);
  const handle = (await lens(root).boundingBox())!;
  expect(Math.abs(handle.y + handle.height / 2 - 635)).toBeLessThan(3);
  await page.mouse.move(x, 12);
  const reversed = await page.evaluate(() => scrollY);
  await expect.poll(() => page.evaluate(() => scrollY)).toBeLessThan(reversed - 5);
  await page.mouse.up();
  const stopped = await page.evaluate(() => scrollY);
  await page.waitForTimeout(160); expect(await page.evaluate(() => scrollY)).toBe(stopped);
  await expect(root).not.toHaveAttribute('data-derivation-dragging', 'true');
});

test("equation endpoint ink remains inside viewport margins at both drag extremes", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 1000, height: 650 });
  const root = await ready(page), handle = lens(root);
  const equations = root.locator('.energy-derivation-equation');
  for (const end of [true, false]) {
    await handle.focus(); await handle.press(end ? 'End' : 'Home');
    await expect(handle).toHaveAttribute('aria-valuenow', end ? '3' : '0');
    const equation = end ? equations.last() : equations.first();
    await equation.evaluate((el, bottom) => { const b = el.getBoundingClientRect(); scrollBy(0, b.top + b.height / 2 - (bottom ? 630 : 12)); }, end);
    const b = (await handle.boundingBox())!;
    await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2); await page.mouse.down();
    await expect.poll(async () => { const box = (await equation.boundingBox())!; return end ? box.y + box.height : -box.y; }).toBeLessThanOrEqual(end ? 603 : -47);
    const ink = await equation.locator('.katex-html > .base').evaluateAll(els => els.map(el => {
      const b = el.getBoundingClientRect(); return { top: b.top, bottom: b.bottom };
    }));
    expect(Math.min(...ink.map(b => b.top))).toBeGreaterThanOrEqual(47);
    expect(Math.max(...ink.map(b => b.bottom))).toBeLessThanOrEqual(603);
    if (!end) await expect.poll(async () => -(await root.boundingBox())!.y).toBeLessThanOrEqual(-95);
    await expect(handle).toHaveAttribute('aria-valuenow', end ? '3' : '0');
    await page.mouse.up();
  }
});

test("momentum move keeps its argument in place through forward, reverse, return and print", async ({ page }, info) => {
  await page.setViewportSize({ width: 1000, height: 1000 });
  await page.goto(`${route}#momentum-move`);
  const root = page.locator('[data-momentum-move]'), slider = root.locator('[data-move-seek]');
  const prose = root.locator('.momentum-move-argument');
  const text = await prose.textContent();
  const first = await prose.boundingBox();
  const seek = async (p: number) => slider.evaluate((el, value) => { (el as HTMLInputElement).value = String(value); el.dispatchEvent(new Event('input', { bubbles: true })); }, p);
  const arrow = root.locator('[data-move-arrow]');
  const initial = await arrow.getAttribute('d');
  const track = (await slider.boundingBox())!;
  await root.locator('[data-move-pointer]').click({ position: { x: track.width / 2, y: track.height * .9 } });
  await expect(root).toHaveAttribute('data-move-part', 'energy');
  await seek(0);
  for (const p of [.35, .6, 1, .35, 0]) {
    await seek(p);
    expect(await prose.textContent()).toBe(text);
    expect(await prose.boundingBox()).toEqual(first);
    await expect(root.locator('.momentum-move-argument [data-move-entity]')).toHaveCount(3);
  }
  expect(await arrow.getAttribute('d')).toBe(initial);
  await slider.focus(); await slider.press('End');
  await expect(root).toHaveAttribute('data-move-part', 'energy');
  await slider.press('Home'); await slider.press('ArrowDown');
  await expect(slider).toHaveValue('0.025');
  await seek(.6);
  expect(await root.locator('svg circle[data-move-entity]').evaluate(el => getComputedStyle(el).strokeWidth)).toBe('3px');
  await page.evaluate(() => window.dispatchEvent(new Event('beforeprint')));
  await expect(root).toHaveAttribute('data-move-part', 'energy');
  await page.evaluate(() => window.dispatchEvent(new Event('afterprint')));
  await expect(root).toHaveAttribute('data-move-part', 'magnitude');
  await root.screenshot({ path: info.outputPath('momentum-move-desktop.png') });
  await page.setViewportSize({ width: 390, height: 1000 });
  expect(await root.evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
  await root.screenshot({ path: info.outputPath('momentum-move-phone.png') });
  await root.getByRole('button', { name: 'Return to reading' }).click();
  await expect(root.locator('details').first()).not.toHaveAttribute('open', '');
  await expect(root.locator('summary').first()).toBeFocused();
});

test("momentum storyboard is readable without JavaScript with prose above each compact sketch", async ({ browser }, info) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  for (const width of [1000, 390]) {
    await page.setViewportSize({ width, height: 1100 });
    await page.goto(`http://localhost:8000${route}#momentum-space`);
    const move = page.locator('[data-momentum-move]');
    await move.locator('summary').first().click();
    await expect(move.locator('.momentum-move-argument [data-move-entity]')).toHaveCount(3);
    await expect(move.locator('[data-move-seek]')).toBeHidden();
    const root = page.locator('[data-momentum-space]');
    await expect(root.locator('svg')).toHaveCount(3);
    expect(await root.evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
    for (const figure of await root.locator('figure').all()) {
      const prose = (await figure.locator('figcaption').boundingBox())!;
      const sketch = (await figure.locator('svg').boundingBox())!;
      expect(prose.y + prose.height).toBeLessThanOrEqual(sketch.y + 1);
      expect(sketch.width).toBeLessThanOrEqual(288);
    }
    await root.screenshot({ path: info.outputPath(`momentum-story-${width}.png`) });
  }
  await context.close();
});

test("power meaning inspection compares static reading with reversible term-to-evidence selection", async ({ page }, info) => {
  await page.setViewportSize({ width: 1000, height: 1100 });
  await page.goto(route);
  const link = page.locator('a[href="#power-correspondence"]');
  await link.scrollIntoViewIfNeeded();
  const entryTop = (await link.boundingBox())!.y;
  await link.click();
  const root = page.locator('[data-power-correspondence]');
  await expect(root).toHaveAttribute('open', '');
  await expect(root).toHaveAttribute('data-power-view', 'static');
  await expect(root.locator('[data-power-reason]')).toHaveCount(3);
  for (const reason of await root.locator('[data-power-reason]').all()) await expect(reason).toBeVisible();
  await root.screenshot({ path: info.outputPath('power-meaning-static.png') });
  await root.getByRole('button', { name: 'Inspect connections', exact: true }).click();
  const sketches = root.locator('.power-correspondence-sketches');
  const relativeTop = () => sketches.evaluate(el => el.getBoundingClientRect().top - el.closest('[data-power-correspondence]')!.getBoundingClientRect().top);
  const top = await relativeTop();
  for (const term of ['force', 'energy', 'speed', 'force']) {
    const button = root.locator(`[data-power-term="${term}"]`);
    await button.focus(); await button.press('Enter');
    await expect(button).toHaveAttribute('aria-pressed', 'true');
    await expect(root.locator('[data-power-reason]:not([aria-hidden])')).toHaveAttribute('data-power-reason', term);
    expect(Math.abs(await relativeTop() - top)).toBeLessThan(.5);
    for (const episode of ['straight', 'turning'])
      await expect(root.locator(`[data-power-case="${episode}"] .power-case-reading [data-power-entity="physics.power.${term}.${episode}"]`)).toHaveAttribute('data-power-salience', 'focus');
  }
  await root.screenshot({ path: info.outputPath('power-meaning-force.png') });
  await page.evaluate(() => window.dispatchEvent(new Event('beforeprint')));
  for (const reason of await root.locator('[data-power-reason]').all()) await expect(reason).toBeVisible();
  await page.evaluate(() => window.dispatchEvent(new Event('afterprint')));
  await expect(root.locator('[data-power-term="force"]')).toHaveAttribute('aria-pressed', 'true');
  await root.getByRole('button', { name: 'Read together', exact: true }).click();
  for (const reason of await root.locator('[data-power-reason]').all()) await expect(reason).toBeVisible();
  await root.getByRole('button', { name: 'Return to the argument', exact: true }).click();
  await expect(link).toBeFocused();
  expect(Math.abs((await link.boundingBox())!.y - entryTop)).toBeLessThan(2);
  await expect(root).not.toHaveAttribute('open', '');
  await page.goto(`${route}#power-correspondence-force`);
  await expect(root.locator('[data-power-term="force"]')).toHaveAttribute('aria-pressed', 'true');
  await page.evaluate(() => { location.hash = 'power-correspondence-energy'; });
  await expect(root.locator('[data-power-term="energy"]')).toHaveAttribute('aria-pressed', 'true');
  await page.goBack();
  await expect(root.locator('[data-power-term="force"]')).toHaveAttribute('aria-pressed', 'true');
});

test("power meaning remains a complete static explanation and fits a narrow reading", async ({ browser }, info) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 1100 } });
  const page = await context.newPage();
  await page.goto(`http://localhost:8000${route}#power-correspondence`);
  const root = page.locator('[data-power-correspondence]');
  await root.locator('summary').first().click();
  await expect(root.locator('[data-power-case]')).toHaveCount(2);
  await expect(root.locator('[data-power-modes]')).toBeHidden();
  for (const reason of await root.locator('[data-power-reason]').all()) await expect(reason).toBeVisible();
  await expect(root.locator('[data-power-reason="energy"]')).toContainText('rate');
  expect(await root.evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
  const firstSketch = (await root.locator('[data-power-case]').first().boundingBox())!;
  const lastExplanation = (await root.locator('[data-power-reason]').last().boundingBox())!;
  expect(firstSketch.y).toBeGreaterThan(lastExplanation.y + lastExplanation.height);
  await root.screenshot({ path: info.outputPath('power-meaning-static-narrow.png') });
  await context.close();
});

test("physics readouts keep labels, controls and following prose stationary during seeks", async ({ page }, info) => {
  for (const [width, textSize] of [[1000, 16], [390, 16], [390, 20]] as const) {
    await page.setViewportSize({ width, height: 1100 });
    await page.goto(route);
    await page.evaluate(size => { document.documentElement.style.fontSize = `${size}px`; }, textSize);
    await page.evaluate(() => document.fonts.ready);
    for (const episode of ["straight", "turning"]) {
      const root = page.locator(`[data-episode="${episode}"]`);
      await root.scrollIntoViewIfNeeded();
      await expect(root).toHaveAttribute("data-enhanced", "true");
      const slider = root.locator('input[type="range"]');
      const max = Number(await slider.getAttribute("max"));
      const boxes = () => root.evaluate(element => {
        const origin = element.getBoundingClientRect();
        return Array.from(element.querySelectorAll(".physics-readout-unit, .physics-readout-label, .physics-quantities .kp-focus-deck__annotation, [data-physics-power-explanation], .physics-controls button, .physics-controls input, .physics-after, figcaption")).map(node => {
          const rect = node.getBoundingClientRect();
          return { x: rect.x - origin.x, y: rect.y - origin.y, width: rect.width, height: rect.height };
        });
      });
      await seek(slider, 0);
      const initial = await boxes();
      for (const fraction of [.001, .249, .25, .499, .5, .999, 1, .5, 0]) {
        await seek(slider, fraction * max);
        const current = await boxes();
        expect(current.length).toBe(initial.length);
        current.forEach((box, index) => {
          const before = initial[index]!;
          for (const key of ["x", "y", "width", "height"] as const)
            expect(Math.abs(box[key] - before[key]), `${episode} ${width}px ${fraction}: ${index}.${key}`).toBeLessThan(.5);
        });
        expect(await root.locator('[data-physics-number]').evaluateAll(elements => elements.every(element => {
          const range = document.createRange(); range.selectNodeContents(element);
          return range.getBoundingClientRect().width <= element.getBoundingClientRect().width + .5;
        }))).toBe(true);
        expect(await root.locator('svg').evaluate(svg => {
          if (!(svg instanceof SVGSVGElement)) throw new Error("Expected the native physics SVG");
          const view = svg.viewBox.baseVal;
          return Array.from(svg.querySelectorAll<SVGGraphicsElement>('path, rect, circle')).every(element => {
            const box = element.getBBox(), style = getComputedStyle(element);
            const scale = svg.getBoundingClientRect().width / view.width;
            const padding = style.stroke === "none" ? 0 : parseFloat(style.strokeWidth) / (2 * scale);
            if (!box.width && !box.height) return true;
            return box.x - padding >= view.x && box.y - padding >= view.y &&
              box.x + box.width + padding <= view.x + view.width && box.y + box.height + padding <= view.y + view.height;
          });
        })).toBe(true);
      }
      const activeExplanation = root.locator('[data-physics-explanation]:not([aria-hidden])');
      await expect(activeExplanation).toHaveCount(1);
      await expect(activeExplanation).toBeVisible();
      expect(await root.evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
      const plot = (await root.locator('svg').boundingBox())!;
      // Accepted compact envelope is local to these unit-mass fixtures. A new
      // aesthetic or different caller needs its own review, not a global size.
      expect(plot.width).toBeLessThanOrEqual(24 * textSize + .5);
      expect(plot.height).toBeLessThanOrEqual(plot.width * (episode === 'straight' ? 110 : 180) / 420 + .5);
      // This is a readable-fit floor, not certification of an unreviewed size.
      for (const button of await root.locator('button').all()) expect((await button.boundingBox())!.height).toBeGreaterThanOrEqual(44);
      await root.screenshot({ path: info.outputPath(`stable-${episode}-${width}-${textSize}.png`) });
    }
  }
});

test("graph power correspondence follows one physical sample and reverses without scrolling time", async ({ page }, info) => {
  await page.setViewportSize({ width: 1000, height: 1100 });
  await page.goto(route);
  const turn = page.locator('[data-episode="turning"]');
  await turn.scrollIntoViewIfNeeded();
  await expect(turn).toHaveAttribute('data-enhanced', 'true');
  const slider = turn.locator('input');
  await seek(slider, Math.PI / 4);
  await expect.poll(async () => Number(await turn.getAttribute('data-physical-time'))).toBeCloseTo(Math.PI / 4, 12);
  const marker = await turn.locator('[data-right-angle]').getAttribute('d');
  expect(marker).not.toBe('');
  await expect(turn).toHaveAttribute('data-power', '0');
  await expect(turn.locator('[data-physics-power-calculation]')).toHaveText('1.00 m/s × 0.00 N = 0.00 W');
  await expect(turn.locator('[data-physics-power-explanation]')).toContainText('Momentum turns');
  await seek(slider, Math.PI / 2);
  await expect(turn.locator('[data-right-angle]')).not.toHaveAttribute('d', marker!);
  await expect(turn).toHaveAttribute('data-physical-time', String(Math.PI / 2));
  await seek(slider, Math.PI / 4);
  await expect(turn.locator('[data-right-angle]')).toHaveAttribute('d', marker!);
  await turn.screenshot({ path: info.outputPath('graph-power-turn.png') });
  const heldTime = await turn.getAttribute('data-physical-time');
  await page.mouse.wheel(0, 100);
  await expect(turn).toHaveAttribute('data-physical-time', heldTime!);
  const straight = page.locator('[data-episode="straight"]');
  await straight.scrollIntoViewIfNeeded();
  await expect(straight).toHaveAttribute('data-enhanced', 'true');
  await expect(straight.locator('[data-physics-power-explanation]')).toContainText('no direction');
  await seek(straight.locator('input'), 1);
  await expect(straight.locator('[data-physics-power-calculation]')).toHaveText('2.00 m/s × 2.00 N = 4.00 W');
  await expect(straight).toHaveAttribute('data-energy', '2');
  await expect(straight).toHaveAttribute('data-power', '4');
  await straight.screenshot({ path: info.outputPath('graph-power-straight.png') });
  await seek(straight.locator('input'), 0);
  await expect(straight.locator('[data-physics-power-calculation]')).toHaveText('0.00 m/s × — N = 0.00 W');
});

test("power bridge uses native reversible inspection with expandable product-rule reasoning", async ({ page }, info) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  page.on("console", async message => {
    if (message.type() === "error") errors.push(...await Promise.all(message.args().map(arg => arg.evaluate(value => value instanceof Error ? value.message : String(value)))));
  });
  await page.setViewportSize({ width: 1280, height: 1500 });
  await page.goto(route + "#force-to-energy");
  const root = page.locator('[data-derivation-namespace="power"]');
  try {
    await expect(lens(root)).toBeEnabled();
    await expect(root.locator('[data-derivation-stage]')).toHaveAttribute('data-derivation-renderer', 'canonical-native-katex-scene-session');
    for (const p of [.4, .55, .7, .85, .55]) {
      await dragTo(page, root, p);
      await expect(root).not.toHaveAttribute("data-repair", "true");
      const lane = await root.evaluate(el => {
        const reason = el.querySelector('.energy-derivation-interleave-text')!.getBoundingClientRect();
        const stage = el.querySelector('[data-derivation-stage]')!;
        const paint = [...stage.querySelectorAll<HTMLElement>('[data-kp-equation-material-owner-id]')]
          .filter(owner => owner.getBoundingClientRect().width > 0 && getComputedStyle(owner).visibility !== 'hidden' && Number(getComputedStyle(owner).opacity) > 0)
          .map(owner => owner.getBoundingClientRect().right);
        return { textLeft: reason.left, textRight: reason.right, textWidth: reason.width,
          rootRight: el.getBoundingClientRect().right, inkRight: Math.max(0, ...paint) };
      });
      expect(lane.inkRight).toBeLessThan(lane.textLeft);
      expect(lane.textRight).toBeLessThanOrEqual(lane.rootRight + 1);
      expect(lane.textWidth).toBeGreaterThan(200);
      await root.screenshot({ path: info.outputPath(`power-${p}.png`) });
    }
    await lens(root).press("End");
    await expect(root).toHaveAttribute("data-derivation-progress", "1");
    await lens(root).press("Home");
    await expect(root).toHaveAttribute("data-derivation-progress", "0");
    await root.locator('[data-refinement-expand]:not([data-refinement-norm])').click();
    await expect(root.locator('[data-transition-number]')).toHaveText(['1.1', '1.2', '1.3', '1.4', '1.5']);
    await expect(lens(root)).toBeEnabled();
    await root.screenshot({ path: info.outputPath("power-expanded.png") });
    const consolidation = [];
    for (const position of [2.65, 2.75, 2.65]) {
      await dragTo(page, root, position);
      const sample = await root.locator('[data-derivation-stage]').evaluate(stage => {
        const bounds = stage.getBoundingClientRect();
        const owners = [...stage.querySelectorAll<HTMLElement>('[data-kp-equation-material-owner-id]')];
        // Both merge tracks carry the common target identity; keep their
        // distinct material owner IDs rather than expecting a source-only role.
        const contributors = owners.filter(el => el.dataset['derivationParticipant']?.endsWith('.first-term'))
          .sort((a, b) => a.dataset['kpEquationMaterialOwnerId']!.localeCompare(b.dataset['kpEquationMaterialOwnerId']!));
        if (contributors.length !== 2) throw new Error('Expected both collection contributors');
        const pose = (owner: HTMLElement | undefined) => {
          if (!owner) throw new Error(`Missing consolidation paint owner: ${JSON.stringify(owners.map(el => ({ id: el.dataset['kpEquationMaterialOwnerId'], role: el.dataset['derivationParticipant'] })))}`);
          const box = owner.getBoundingClientRect();
          return { x: box.x - bounds.x, width: box.width, opacity: Number(getComputedStyle(owner).opacity) };
        };
        return {
          first: pose(contributors[0]),
          second: pose(contributors[1]),
          coefficient: pose(owners.find(el => el.dataset['derivationParticipant']?.endsWith('.two')))
        };
      });
      consolidation.push(sample);
    }
    const [early, later, reverse] = consolidation;
    // Measure local paint, excluding the whole-equation carry. Both contributors
    // move while the derived coefficient grows, and rewind restores that pose.
    for (const role of ['first', 'second'] as const)
      expect(Math.abs(later![role].x - early![role].x)).toBeGreaterThan(.1);
    expect(early!.coefficient.width).toBeGreaterThan(.1);
    expect(early!.coefficient.opacity).toBeGreaterThan(0);
    expect(later!.coefficient.width).toBeGreaterThan(early!.coefficient.width + .1);
    for (const role of ['first', 'second', 'coefficient'] as const) {
      expect(Math.abs(reverse![role].x - early![role].x)).toBeLessThan(.25);
      expect(Math.abs(reverse![role].width - early![role].width)).toBeLessThan(.25);
    }
    // Exercise the actual governed tracks in both directions, not just their
    // declared roles. Compilation also checks direct routes and paint contacts.
    for (const position of [2.55, 2.75, 3.55, 3.75, 4.55, 4.75, 3.55, 2.55]) {
      await dragTo(page, root, position);
      await expect(root).not.toHaveAttribute('data-repair', 'true');
      await expect(lens(root)).toBeEnabled();
      await root.screenshot({ path: info.outputPath(`power-local-${position}.png`) });
    }
    await root.locator('[data-refinement-collapse]').first().click();
    await expect(root.locator('[data-transition-number]')).toHaveText(['1']);
    await expect(lens(root)).toBeEnabled();
  } catch (error) { throw new Error(`Power inspection errors: ${errors.join('; ')}`, { cause: error }); }
  expect(errors).toEqual([]);
});

test("power bridge remains a readable static argument without JavaScript", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('http://localhost:8000' + route + '#force-to-energy');
  const section = page.locator('#force-to-energy');
  await expect(section).toContainText('both contribute');
  await expect(section.locator('[data-derivation-row]')).toHaveCount(2);
  await section.locator('[data-refinement-static] summary').click();
  await expect(section).toContainText('Differentiate each factor once');
  await expect(section).toContainText('Newton');
  await page.emulateMedia({ media: 'print' });
  await expect(section.locator('[data-derivation-row]').last()).toBeVisible();
  await context.close();
});
const scalarRoute = "/experiments/scalar-cancellation/?derivation-detail=expandable#remaining-factor";
const seek = (input: Locator, progress: number) => input.evaluate((element: HTMLInputElement, value) => {
  element.value = String(value); element.dispatchEvent(new Event("input", { bubbles: true }));
}, progress);
const lens = (root: Locator) => root.getByRole("slider", { name: "Derivation lens", exact: true });
// Element screenshots may scroll a taller record into view. Compare document
// geometry to detect reflow without mistaking viewport movement for layout.
const documentBoxes = (elements: Locator) => elements.evaluateAll(els => els.map(el => {
  const box = el.getBoundingClientRect();
  return { x: box.x + scrollX, y: box.y + scrollY, width: box.width, height: box.height };
}));
async function dragTo(page: import("@playwright/test").Page, root: Locator, position: number, release = true) {
  const handle = lens(root);
  // Pointer capture can cross viewport edges, but starting a drag must hit a
  // visible handle. Taller approved records can put its previous dock offscreen.
  await handle.scrollIntoViewIfNeeded();
  const box = await handle.boundingBox();
  const total = await root.locator("[data-derivation-row]").count() - 1;
  const move = Math.min(total - 1, Math.floor(position)), fraction = position - move;
  const first = await root.locator(`[data-derivation-row="${move}"] .energy-derivation-equation`).boundingBox();
  const last = await root.locator(`[data-derivation-row="${move + 1}"] .energy-derivation-equation`).boundingBox();
  await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
  await page.mouse.down();
  await page.mouse.move(box!.x + box!.width / 2, first!.y + first!.height / 2 + (last!.y - first!.y) * fraction, { steps: 8 });
  if (release) await page.mouse.up();
}
async function ready(page: import("@playwright/test").Page) {
  const errors: string[] = [];
  page.on("console", async message => {
    if (message.type() === "error") errors.push(...await Promise.all(message.args().map(arg =>
      arg.evaluate(value => value instanceof Error ? `${value.message}\n${value.stack ?? ""}` : String(value)))));
  });
  await page.goto(route + "#energy-from-momentum");
  const root = page.locator("[data-energy-derivation]:not([data-derivation-namespace=power])");
  try {
    await expect(root.locator("[data-derivation-stage]")).toHaveAttribute("data-derivation-renderer", "canonical-native-katex-scene-session");
  } catch (error) {
    throw new Error(`Reader preparation failed: ${errors.join("\n")}`, { cause: error });
  }
  await expect(root.locator("[data-transition-number]")).toHaveText(["1", "2", "3"]);
  await expect(lens(root)).toBeVisible();
  await expect(lens(root)).toBeEnabled();
  return root;
}

test("norm scaling preserves enclosure identity through two reversible checked children", async ({ page }, info) => {
  // Keep both endpoints of this disclosure-expanded drag inside the viewport;
  // Firefox does not synthesize an off-window mouse release like Chromium.
  await page.setViewportSize({ width: 1280, height: 1800 });
  const root = await ready(page);
  const stage = root.locator("[data-derivation-stage]");
  for (const [position, operation] of [[1.5, "extract-norm-scale"], [1.62, "square-quotient"], [1.7, "square-quotient"], [1.5, "extract-norm-scale"]] as const) {
    await dragTo(page, root, position);
    await expect(stage).toHaveAttribute("data-inspection-operation", `physics.energy.${operation}`);
    await expect(stage.locator(":scope > [data-derivation-child]:not([hidden])")).toHaveCount(1);
    await expect(root).not.toHaveAttribute("data-repair", "true");
    await root.screenshot({ path: info.outputPath(`norm-${position}-${operation}.png`) });
  }
  const depth = root.locator("[data-composed-reason]");
  const held = await root.getAttribute("data-progress");
  await depth.locator("summary").click();
  await expect(depth).toContainText("Take scalar scaling outside the norm");
  await expect(depth).toContainText("Square numerator and denominator");
  await expect(root).toHaveAttribute("data-progress", held!);
  await depth.screenshot({ path: info.outputPath("norm-explanation.png") });
  await dragTo(page, root, 2);
  await dragTo(page, root, 1);
  // Pointer rounding differs across engines; exact docking is tested through
  // keyboard input rather than requiring a fractional CSS pixel mouse hit.
  expect(Number(await root.getAttribute("data-derivation-progress"))).toBeCloseTo(1, 2);
  await lens(root).press("Home");
  await expect(root).toHaveAttribute("data-derivation-progress", "0");
});

test("scope penetration follows straight realized paths without clearance detours", async ({ page }, info) => {
  const root = await ready(page);
  const points: { x: number; y: number }[] = [];
  for (const position of [1.70, 1.73, 1.76, 1.79, 1.82, 1.85, 1.88]) {
    await dragTo(page, root, position);
    const child = root.locator('[data-derivation-child]:not([hidden])[data-child-operation="square-quotient"]');
    const power = child.locator('[data-kp-equation-material-owner-id][data-derivation-participant$=".power-bottom"]');
    await expect(power).toHaveCount(1);
    const point = await power.evaluate(el => {
      const box = el.getBoundingClientRect();
      const stage = el.closest('[data-derivation-child]')!.getBoundingClientRect();
      return { x: box.x + box.width / 2 - stage.x, y: box.y + box.height / 2 - stage.y };
    });
    points.push(point);
    if (position === 1.82) await root.screenshot({ path: info.outputPath("scope-penetration.png") });
  }
  const first = points[0]!, last = points.at(-1)!;
  const dx = last.x - first.x, dy = last.y - first.y, length = Math.hypot(dx, dy);
  expect(length).toBeGreaterThan(10);
  let previous = -1;
  for (const point of points) {
    // Measure actual DOM paint-owner travel, subtracting whole-scene carry.
    // A correct routing flag alone did not catch the previous regression.
    expect(Math.abs((point.x - first.x) * dy - (point.y - first.y) * dx) / length).toBeLessThan(.75);
    const along = ((point.x - first.x) * dx + (point.y - first.y) * dy) / (length * length);
    expect(along).toBeGreaterThanOrEqual(previous - .001);
    previous = along;
  }
  await dragTo(page, root, 1.79);
  const child = root.locator('[data-derivation-child]:not([hidden])[data-child-operation="square-quotient"]');
  const power = child.locator('[data-kp-equation-material-owner-id][data-derivation-participant$=".power-bottom"]');
  const reverse = await power.evaluate(el => {
    const box = el.getBoundingClientRect(), stage = el.closest('[data-derivation-child]')!.getBoundingClientRect();
    return { x: box.x + box.width / 2 - stage.x, y: box.y + box.height / 2 - stage.y };
  });
  // Pointer coordinates are rounded by the browser; compare within a quarter
  // pixel rather than imposing finer precision than the input mechanism.
  expect(Math.abs(reverse.x - points[3]!.x)).toBeLessThan(.25);
  expect(Math.abs(reverse.y - points[3]!.y)).toBeLessThan(.25);
});

test("fluent physics cancellation keeps its carriers, omits identity stops and offers local explanation by default", async ({ page }, info) => {
  const root = await ready(page), stage = root.locator("[data-derivation-stage]");
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await expect(root).toHaveAttribute("data-derivation-reading", "fluent");
  await expect(root.locator("[data-refinement-expand]:not([data-refinement-norm])")).toBeVisible();
  await root.locator('[data-derivation-entry="2"]').click();
  await expect(root).toHaveAttribute("data-move", "2");
  const input = root.locator('input[aria-label="Inspect step 3"]');
  const at = async (algebra: number) => {
    await seek(input, .32 + .58 * algebra);
    await expect(root).toHaveAttribute("data-move", "2");
    await expect(root).not.toHaveAttribute("data-repair", "true");
    await expect(stage).toHaveAttribute("data-derivation-renderer", "canonical-native-katex-scene-session");
  };
  const owners = stage.locator("[data-kp-equation-material-owner-id]");
  const carrier = (role: string) => stage.locator(`[data-kp-equation-material-semantic-entity-id$=".${role}"]`);
  await at(.16);
  const record = await documentBoxes(root.locator(".energy-derivation-equation"));
  const retained = await carrier("factor-retain").getAttribute("data-kp-equation-material-owner-id");
  const coefficient = await carrier("two").getAttribute("data-kp-equation-material-owner-id");
  const massWidth = (await carrier("mass").boundingBox())!.width;
  await at(.3);
  expect((await carrier("mass").boundingBox())!.width).toBeLessThan(massWidth);
  await root.screenshot({ path: info.outputPath("fluent-withdrawal.png") });
  for (const p of [.65, .3, .8]) {
    await at(p);
    await expect(carrier("factor-retain")).toHaveCount(1);
    await expect(carrier("two")).toHaveCount(1);
    await expect(carrier("factor-retain")).toHaveAttribute("data-kp-equation-material-owner-id", retained!);
    await expect(carrier("two")).toHaveAttribute("data-kp-equation-material-owner-id", coefficient!);
    for (const role of ["factor-retain", "two", "norm"])
      expect(await carrier(role).evaluate(el => el.checkVisibility({ checkVisibilityCSS: true, checkOpacity: true }))).toBe(true);
    await expect(stage.locator('[data-kp-semantic-entity-id$=".identity"]')).toHaveCount(0);
    expect(await documentBoxes(root.locator(".energy-derivation-equation"))).toEqual(record);
  }
  expect(await carrier("power").evaluate(el => el.checkVisibility({ checkVisibilityCSS: true, checkOpacity: true }))).toBe(false);
  const pose = await owners.evaluateAll(els => els.map(el => (el as HTMLElement).style.cssText));
  await at(.1); await at(.8);
  expect(await owners.evaluateAll(els => els.map(el => (el as HTMLElement).style.cssText))).toEqual(pose);
  await root.screenshot({ path: info.outputPath("fluent-retained-factor.png") });
  const held = await root.getAttribute("data-progress");
  await root.locator('[data-derivation-interleave="2"] details:not([data-refinement-static]) summary').click();
  await expect(root).toHaveAttribute("data-progress", held!);
  await root.locator("[data-refinement-expand]:not([data-refinement-norm])").click();
  await expect(root).toHaveAttribute("data-derivation-detail", "mass-refinement");
  await expect(root.locator("[data-transition-number]")).toHaveText(["1", "2", "3.1", "3.2", "3.3"]);
  await root.locator("[data-refinement-collapse]").first().click();
  await expect(root).toHaveAttribute("data-progress", held!);
  await expect(root).toHaveAttribute("data-derivation-reading", "fluent");
  await seek(input, 0); await expect(root).toHaveAttribute("data-progress", "0");
  await seek(input, 1); await expect(root).toHaveAttribute("data-progress", "1");
  expect(errors).toEqual([]);
});

test("scalar reader reuses canonical motion, 1.1–1.3 outline and local collapse with exact return", async ({ page }, info) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto(scalarRoute);
  const root = page.locator("[data-energy-derivation]:not([data-derivation-namespace=power])");
  const stage = root.locator("[data-derivation-stage]");
  await expect(stage).toHaveAttribute("data-derivation-renderer", "canonical-native-katex-scene-session");
  await expect(root.locator("[data-transition-number]")).toHaveText(["1"]);
  await expect(root.locator("[data-derivation-recall]")).toHaveCount(0);
  await dragTo(page, root, .55);
  const held = await root.getAttribute("data-progress");
  await root.screenshot({ path: info.outputPath("scalar-coarse.png") });
  await root.locator("[data-refinement-expand]:not([data-refinement-norm])").click();
  await expect(root).toHaveAttribute("data-derivation-detail", "mass-refinement");
  await expect(root.locator("[data-transition-number]")).toHaveText(["1.1", "1.2", "1.3"]);
  await expect(root.locator("[data-nested-context]")).toContainText("Inside step 1");
  await expect(lens(root)).toHaveAttribute("aria-valuemax", "3");
  for (const position of [.55, 1.55, 2.55, 3, 2.55, 1.55, .55, 0]) {
    await dragTo(page, root, position);
    await expect(root).toHaveAttribute("data-move", String(Math.max(0, Math.ceil(position) - 1)));
    await expect(root).not.toHaveAttribute("data-repair", "true");
    await expect(stage).toHaveAttribute("data-derivation-renderer", "canonical-native-katex-scene-session");
    await expect(stage.locator("[data-derivation-inspection-context]")).toHaveCount(0);
    await expect(root.locator("[data-derivation-row]")).toHaveCount(4);
    if (position === 1.55) await root.screenshot({ path: info.outputPath("scalar-expanded.png") });
  }
  await root.locator("[data-refinement-local-return]").last().click();
  await expect(root).toHaveAttribute("data-derivation-detail", "coarse");
  await expect(root).toHaveAttribute("data-progress", held!);
  await expect(root.locator("[data-refinement-expand]:not([data-refinement-norm])")).toBeFocused();
  await expect(root.locator("[data-derivation-row]")).toHaveCount(2);
  expect(errors).toEqual([]);
});

test("scalar compact inspection executes checked children with continuous native handoffs", async ({ page }, info) => {
  await page.goto(scalarRoute);
  const root = page.locator("[data-energy-derivation]:not([data-derivation-namespace=power])"), stage = root.locator("[data-derivation-stage]");
  await expect(stage).toHaveAttribute("data-derivation-renderer", "canonical-native-katex-scene-session");
  const input = root.locator('input[aria-label="Inspect step 1"]');
  const at = async (algebra: number) => {
    // Exercise the actual shared input/clock path, not a second test playhead.
    await seek(input, .32 + .58 * algebra);
    await expect(root).not.toHaveAttribute("data-repair", "true");
    await expect(stage.locator("[data-derivation-child]:not([hidden])")).toHaveCount(1);
  };
  const paintGeometry = () => stage.evaluate(element => {
    const parent = element.getBoundingClientRect();
    return [...element.querySelectorAll<HTMLElement>('[data-derivation-child]:not([hidden]) [data-kp-equation-material-owner-id]')]
      // Native ownership uses ancestor opacity, not only visibility. Hidden
      // endpoint scaffolds must not masquerade as simultaneously painted ink.
      .filter(el => el.checkVisibility({ checkVisibilityCSS: true, checkOpacity: true }))
      .map(el => { const box = el.getBoundingClientRect(); return { role: el.dataset["kpEquationMaterialSemanticEntityId"]!.split(".").at(-1)!,
        x: box.x - parent.x, y: box.y - parent.y, width: box.width, height: box.height }; }).sort((a, b) => a.role.localeCompare(b.role));
  });
  const originalRecord = await documentBoxes(root.locator(".energy-derivation-equation"));
  for (const [algebra, operation] of [[.16, "expand-square"], [.5, "cancel-pair"], [.83, "collect-coefficient"], [.5, "cancel-pair"], [.16, "expand-square"]] as const) {
    await at(algebra);
    await expect(stage).toHaveAttribute("data-inspection-operation", `algebra.scalar.${operation}`);
    await expect(root.locator("[data-transition-number]")).toHaveText(["1"]);
    expect(await documentBoxes(root.locator(".energy-derivation-equation"))).toEqual(originalRecord);
    await root.screenshot({ path: info.outputPath(`compact-${operation}.png`) });
  }
  for (const boundary of [1 / 3, 2 / 3]) {
    await at(boundary - .001);
    const before = await paintGeometry();
    await at(boundary + .001);
    const after = await paintGeometry();
    expect(before.length).toBeGreaterThan(3);
    expect(after.map(({ role }) => role)).toEqual(before.map(({ role }) => role));
    for (let i = 0; i < before.length; i++) for (const key of ["x", "y", "width", "height"] as const)
      expect(Math.abs(after[i]![key] - before[i]![key])).toBeLessThan(.25);
    await at(boundary - .001);
    expect(await paintGeometry()).toEqual(before);
  }
  await at(.69);
  const two = stage.locator('[data-derivation-child]:not([hidden]) [data-kp-equation-material-semantic-entity-id$=".two"]');
  await expect(two).toHaveCount(1);
  expect(await two.evaluate(el => el.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true }))).toBe(true);
  const owner = await two.getAttribute("data-kp-equation-material-owner-id");
  await at(.84);
  await expect(two).toHaveCount(1);
  await expect(two).toHaveAttribute("data-kp-equation-material-owner-id", owner!);
  // These native layouts happen to align the coefficient's horizontal
  // position. Role change requires continuous identity, not decorative travel.
  expect(await two.evaluate(el => el.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true }))).toBe(true);
  const pose = await stage.locator('[data-derivation-child]:not([hidden]) [data-kp-equation-material-owner-id]').evaluateAll(els => els.map(el => (el as HTMLElement).style.cssText));
  await at(.1); await at(.84);
  expect(await stage.locator('[data-derivation-child]:not([hidden]) [data-kp-equation-material-owner-id]').evaluateAll(els => els.map(el => (el as HTMLElement).style.cssText))).toEqual(pose);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await root.locator("[data-derivation-next]").click();
  await expect(root).toHaveAttribute("data-progress", "1");
  await expect(stage).toHaveAttribute("data-inspection-child-progress", "1");
});

test("scalar missing compound child rejects enhancement without atomic fallback", async ({ page }) => {
  await page.route("**/experiments/scalar-cancellation/**", async route => {
    if (route.request().resourceType() !== "document") return route.continue();
    const response = await route.fetch();
    await route.fulfill({ response, body: (await response.text()).replace('data-child-operation="cancel-pair"', 'data-child-operation="unknown"') });
  });
  await page.goto(scalarRoute);
  const root = page.locator("[data-energy-derivation]:not([data-derivation-namespace=power])");
  await expect(root).toHaveAttribute("data-repair", "true");
  await expect(root.locator("[data-derivation-stage]")).toBeHidden();
  await expect(root.locator("[data-derivation-row]")).toHaveCount(2);
  for (const row of await root.locator("[data-derivation-row]").all()) await expect(row).toBeVisible();
});

test("scalar source mismatch fails closed while the static argument stays readable", async ({ page }) => {
  await page.route("**/experiments/scalar-cancellation/**", async route => {
    if (route.request().resourceType() !== "document") return route.continue();
    const response = await route.fetch();
    await route.fulfill({ response, body: (await response.text()).replace('"factor":"x"', '"factor":"z"') });
  });
  await page.goto(scalarRoute);
  const root = page.locator("[data-energy-derivation]:not([data-derivation-namespace=power])");
  await expect(root).toHaveAttribute("data-repair", "true");
  await expect(root.locator("[data-derivation-status]")).toContainText("needs repair");
  for (const row of await root.locator("[data-derivation-row]").all()) await expect(row).toBeVisible();
});

test("scalar static reading and shared style repairs work without JavaScript for both callers", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  // Simulate a new shared stylesheet build, not a script-driven page mutation:
  // the proof of repair propagation must also work with scripting disabled.
  await context.route("**/momentum-energy-reader.css*", async route => {
    const response = await route.fetch();
    await route.fulfill({ response, body: (await response.text()) + "\n:root { --derivation-reason-measure: 16rem; }" });
  });
  const page = await context.newPage();
  for (const url of [scalarRoute, route + "#energy-from-momentum"]) {
    await page.goto(url);
    const root = page.locator("[data-energy-derivation]:not([data-derivation-namespace=power])");
    for (const row of await root.locator("[data-derivation-row]").all()) await expect(row).toBeVisible();
    // One presentation token changes both fresh documents. No caller-specific
    // CSS or edits to mathematical source are needed for this repair.
    await expect(root.locator(".energy-derivation-interleave-text").first()).toHaveCSS("max-width", "256px");
    const detail = root.locator("[data-refinement-static]");
    await detail.locator("summary").click();
    await expect(detail.locator("[data-static-transition-number]")).toHaveCount(3);
    await page.emulateMedia({ media: "print" });
    for (const row of await root.locator("[data-derivation-row]").all()) await expect(row).toBeVisible();
    await page.emulateMedia({ media: "screen" });
  }
  await context.close();
});

test("expandable cancellation uses canonical fine steps and restores the compact inspection", async ({ page }, info) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto(route + "?derivation-detail=expandable#energy-from-momentum");
  const root = page.locator("[data-energy-derivation]:not([data-derivation-namespace=power])");
  await expect(root.locator("[data-derivation-stage]")).toHaveAttribute("data-derivation-renderer", "canonical-native-katex-scene-session");
  await root.locator('[data-derivation-entry="2"]').click();
  await dragTo(page, root, 2.55);
  const held = await root.getAttribute("data-progress");
  await root.locator('[data-derivation-interleave="2"] summary').first().click();
  const expand = root.locator("[data-refinement-expand]:not([data-refinement-norm])");
  await expand.scrollIntoViewIfNeeded();
  const offset = await root.locator('[data-derivation-row="2"]').evaluate(el => el.getBoundingClientRect().top);
  await expand.click();
  await expect(root).toHaveAttribute("data-derivation-detail", "mass-refinement");
  await expect(root).toHaveAttribute("data-move", "2");
  await expect(root).toHaveAttribute("data-progress", "0");
  await expect(root.locator("[data-derivation-row]")).toHaveCount(6);
  await expect(lens(root)).toHaveAttribute("aria-valuemax", "5");
  await expect(root.locator("[data-transition-number]")).toHaveText(["1", "2", "3.1", "3.2", "3.3"]);
  await expect(root.locator("[data-nested-context]")).toContainText("Inside step 3 · Cancel one mass factor");
  await expect(root.getByRole("button", { name: "Collapse step 3", exact: true })).toBeVisible();
  await expect(root.locator("[data-nested-step]")).toHaveCount(3);
  await expect(root.locator(".energy-derivation-row-marker")).toHaveCount(0);
  await root.getByRole("button", { name: "Inspect step 3.2", exact: true }).click();
  await expect(lens(root)).toHaveAttribute("aria-valuetext", "Step 3.2, source");
  for (const position of [2.55, 3.55, 4.55, 5, 4.55, 3.55, 2.55]) {
    await dragTo(page, root, position);
    const index = Math.max(0, Math.ceil(position) - 1);
    await expect(root).toHaveAttribute("data-move", String(index));
    await expect(root.locator("[data-derivation-stage]")).toHaveAttribute("data-derivation-renderer", "canonical-native-katex-scene-session");
    await expect(root).not.toHaveAttribute("data-repair", "true");
    await expect(root).toHaveAttribute("data-playing", "false");
    if (position === 3.55) await root.screenshot({ path: info.outputPath("expanded-cancellation.png") });
  }
  await root.getByRole("button", { name: "Collapse step 3", exact: true }).click();
  await expect(root).toHaveAttribute("data-derivation-detail", "coarse");
  await expect(root).toHaveAttribute("data-move", "2");
  await expect(root).toHaveAttribute("data-progress", held!);
  await expect(root.locator("[data-derivation-row]")).toHaveCount(4);
  await expect(root.locator("[data-transition-number]")).toHaveText(["1", "2", "3"]);
  await expect(root.locator('[data-derivation-interleave="2"] details').first()).toHaveAttribute("open", "");
  await expect(root.locator("[data-refinement-expand]:not([data-refinement-norm])")).toBeFocused();
  const restoredOffset = await root.locator('[data-derivation-row="2"]').evaluate(el => el.getBoundingClientRect().top);
  expect(Math.abs(restoredOffset - offset)).toBeLessThan(2);
  await expect(root.locator("[data-derivation-stage]")).toHaveCount(1);
  expect(errors).toEqual([]);
});

test("expanded handle crosses both fine-step boundaries in one held drag without moving its record", async ({ page }) => {
  for (const width of [1280, 521]) {
    await page.setViewportSize({ width, height: 1800 });
    await page.goto("about:blank");
    const root = await ready(page);
    await root.locator("[data-refinement-expand]:not([data-refinement-norm])").click();
    await expect(root).toHaveAttribute("data-derivation-detail", "mass-refinement");
    await expect(root).toHaveAttribute("data-move", "2");
    await lens(root).scrollIntoViewIfNeeded();
    const records = root.locator(".energy-derivation-equation");
    const before = await documentBoxes(records);
    const centers = await records.evaluateAll(els => els.map(el => {
      const box = el.getBoundingClientRect(); return box.top + box.height / 2;
    }));
    const handle = (await lens(root).boundingBox())!;
    const x = handle.x + handle.width / 2;
    await page.mouse.move(x, handle.y + handle.height / 2);
    await page.mouse.down();
    try {
      for (const position of [2.5, 3.5, 4.5, 3.5, 2.5]) {
        const move = Math.floor(position), y = (centers[move]! + centers[move + 1]!) / 2;
        expect(y).toBeGreaterThan(0); expect(y).toBeLessThan(1800);
        await page.mouse.move(x, y, { steps: 16 });
        await expect(root).toHaveAttribute("data-move", String(move));
        await expect.poll(async () => Number(await root.getAttribute("data-progress"))).toBeCloseTo(.5, 2);
        expect(await documentBoxes(records), `record moved at width ${width}, step ${position}`).toEqual(before);
        await expect(root).toHaveAttribute("data-derivation-dragging", "true");
      }
    } finally { await page.mouse.up(); }
  }
});

test("expanded drag follows every pointer sample across boundaries without waiting for a new scene", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 1800 });
  const root = await ready(page);
  // Disclosure preserves the held selection; select this parent explicitly.
  await dragTo(page, root, 2.01);
  await root.locator("[data-refinement-expand]:not([data-refinement-norm])").click();
  await expect(root).toHaveAttribute("data-derivation-detail", "mass-refinement");
  await expect(root).toHaveAttribute("data-move", "2");
  await lens(root).scrollIntoViewIfNeeded();
  const centers = await root.locator(".energy-derivation-equation").evaluateAll(els => els.map(el => {
    const box = el.getBoundingClientRect(); return box.top + box.height / 2;
  }));
  const handle = (await lens(root).boundingBox())!, x = handle.x + handle.width / 2;
  const preparedScenes = await root.evaluateHandle(el => [...el.querySelectorAll(".energy-derivation-stage")]);
  // Five major-stage containers plus the two prebuilt norm-scaling children.
  // Both children must already exist; no mounting is allowed during dragging.
  expect(await preparedScenes.evaluate(scenes => scenes.length)).toBe(7);
  await expect(root.locator("[data-derivation-child]")).toHaveCount(2);
  // Observe after the handle's event handler, before asynchronous preparation
  // could conceal a missed input. Eventual endpoint assertions miss the catch.
  await root.evaluate(element => {
    const errors: number[] = [];
    element.addEventListener("pointermove", event => {
      if (!(event instanceof PointerEvent) || element.getAttribute("data-derivation-dragging") !== "true") return;
      const box = element.querySelector("[data-derivation-handle]")!.getBoundingClientRect();
      errors.push(Math.abs(box.top + box.height / 2 - event.clientY));
      element.setAttribute("data-test-pointer-errors", JSON.stringify(errors));
    });
  });
  await page.mouse.move(x, handle.y + handle.height / 2); await page.mouse.down();
  try {
    for (const [from, to] of [[2, 4.8], [4.8, 2.2]] as const) {
      for (let i = 1; i <= 56; i++) {
        const position = from + (to - from) * i / 56, move = Math.floor(position);
        const y = centers[move]! + (centers[move + 1]! - centers[move]!) * (position - move);
        expect(y).toBeGreaterThan(0); expect(y).toBeLessThan(1800);
        await page.mouse.move(x, y);
      }
    }
  } finally { await page.mouse.up(); }
  const errors = JSON.parse((await root.getAttribute("data-test-pointer-errors"))!) as number[];
  expect(errors.length).toBeGreaterThan(100);
  expect(Math.max(...errors), "handle must track each input, not catch up after a boundary").toBeLessThan(1.5);
  await expect(root).toHaveAttribute("data-playing", "false");
  await expect.poll(async () => Number(await root.getAttribute("data-derivation-progress"))).toBeCloseTo(2.2, 3);
  expect(await preparedScenes.evaluate(scenes => scenes.every(scene => scene.isConnected))).toBe(true);
  await expect(root.locator(".energy-derivation-stage")).toHaveCount(7);
  const preparedWidth = (await root.boundingBox())!.width;
  await page.setViewportSize({ width: 521, height: 1800 });
  expect((await root.boundingBox())!.width).toBeLessThan(preparedWidth);
  await expect.poll(() => preparedScenes.evaluate(scenes => scenes.every(scene => !scene.isConnected))).toBe(true);
  await expect(lens(root)).toBeEnabled();
  await expect(root.locator(".energy-derivation-stage")).toHaveCount(7);
  await expect.poll(async () => Number(await root.getAttribute("data-derivation-progress"))).toBeCloseTo(2.2, 3);
  await preparedScenes.dispose();
});

test("unavailable refinement restores the checked compact inspection without a substitute animation", async ({ page }) => {
  await page.goto(route + "?derivation-detail=expandable#energy-from-momentum");
  const root = page.locator("[data-energy-derivation]:not([data-derivation-namespace=power])");
  await expect(root.locator("[data-derivation-stage]")).toHaveAttribute("data-derivation-renderer", "canonical-native-katex-scene-session");
  await root.locator('[data-derivation-entry="2"]').click();
  // Firefox cannot synthesize mouseup outside the window. Leave room for
  // this local drag so the following click actually enters failed detail.
  await lens(root).evaluate(el => scrollBy(0, el.getBoundingClientRect().top - 240));
  await dragTo(page, root, 2.55);
  const held = await root.getAttribute("data-progress");
  await root.locator("[data-refinement-view]:not([data-refinement-norm])").evaluate((el: HTMLTemplateElement) => {
    el.content.querySelector('[data-derivation-template="2"]')!.remove();
  });
  await root.locator("[data-refinement-expand]:not([data-refinement-norm])").click();
  await expect(root.locator("[data-refinement-status]")).toContainText("needs repair");
  await page.evaluate(() => { document.documentElement.style.fontSize = "24px"; });
  await page.waitForTimeout(500);
  await expect(root.locator("[data-refinement-status]")).toBeVisible();
  await expect(root.locator("[data-refinement-status]")).toContainText("needs repair");
  await expect(root).toHaveAttribute("data-derivation-detail", "coarse");
  await expect(root).toHaveAttribute("data-move", "2");
  await expect(root).toHaveAttribute("data-progress", held!);
  await expect(root.locator("[data-derivation-row]")).toHaveCount(4);
  await expect(root.locator("[data-refinement-expand]:not([data-refinement-norm])")).toBeFocused();
});

test("every substep returns through the whole-refinement collapse with saved progress and focus", async ({ page }, info) => {
  await page.goto(route + "?derivation-detail=expandable#energy-from-momentum");
  const root = page.locator("[data-energy-derivation]:not([data-derivation-namespace=power])");
  await expect(root.locator("[data-derivation-stage]")).toHaveAttribute("data-derivation-renderer", "canonical-native-katex-scene-session");
  await root.locator('[data-derivation-entry="2"]').click();
  await dragTo(page, root, 2.55);
  const held = await root.getAttribute("data-progress");
  for (const index of [2, 3, 4]) {
    await root.locator("[data-refinement-expand]:not([data-refinement-norm])").click();
    await expect(root).toHaveAttribute("data-derivation-detail", "mass-refinement");
    await expect(root.locator("[data-refinement-local-return]")).toHaveCount(3);
    const passage = root.locator(`[data-derivation-interleave="${index}"]`);
    const back = passage.getByRole("button", { name: "Back to step 3", exact: true });
    await expect(back).toBeVisible();
    await passage.locator("[data-derivation-entry]").click();
    await expect(root).toHaveAttribute("data-move", String(index));
    if (index === 4) {
      await passage.screenshot({ path: info.outputPath("local-collapse-affordance.png") });
      await back.focus(); await page.keyboard.press("Enter");
    } else await back.click();
    await expect(root).toHaveAttribute("data-derivation-detail", "coarse");
    await expect(root).toHaveAttribute("data-progress", held!);
    await expect(root).toHaveAttribute("data-move", "2");
    await expect(root.locator("[data-derivation-row]")).toHaveCount(4);
    await expect(root.locator("[data-refinement-expand]:not([data-refinement-norm])")).toBeFocused();
    await expect(root.locator("[data-refinement-expand]:not([data-refinement-norm])")).toBeInViewport();
    await expect(root.locator("[data-refinement-local-return]")).toHaveCount(0);
  }
});

test("local entry preserves edge identity and bookmarks without scrolling or autoplay", async ({ page }, info) => {
  await page.goto(route + "#energy-from-momentum");
  const root = page.locator("[data-energy-derivation]:not([data-derivation-namespace=power])"), entries = root.locator("[data-derivation-entry]");
  await expect(root.locator("[data-derivation-stage]")).toHaveAttribute("data-derivation-renderer", "canonical-native-katex-scene-session");
  await entries.nth(1).scrollIntoViewIfNeeded();
  const scroll = await page.evaluate(() => scrollY);
  await entries.nth(1).click();
  await expect(root).toHaveAttribute("data-move", "1");
  await expect(root).toHaveAttribute("data-progress", "0");
  await expect(root).toHaveAttribute("data-playing", "false");
  expect(await page.evaluate(() => scrollY)).toBe(scroll);
  await dragTo(page, root, 1.55);
  const held = await root.getAttribute("data-progress");
  await entries.nth(2).click();
  await expect(root).toHaveAttribute("data-move", "2");
  await expect(root).toHaveAttribute("data-progress", "0");
  await entries.nth(1).click();
  await expect(root).toHaveAttribute("data-move", "1");
  await expect(root).toHaveAttribute("data-progress", held!);
  // Latest local request wins during preparation; adjacent source endpoints
  // must not silently resolve to the preceding edge's destination.
  await entries.evaluateAll(buttons => { (buttons[2] as HTMLElement).click(); (buttons[1] as HTMLElement).click(); (buttons[0] as HTMLElement).click(); });
  await expect(root).toHaveAttribute("data-move", "0");
  await expect(root).toHaveAttribute("data-progress", "0");
  await entries.nth(1).click();
  await expect(root).toHaveAttribute("data-move", "1");
  await expect(root).toHaveAttribute("data-progress", held!);
  await root.locator('[data-derivation-interleave="1"] [data-derivation-restart]').click();
  await expect(root).toHaveAttribute("data-progress", "0");
  await entries.nth(2).focus();
  await page.keyboard.press("Enter");
  await expect(root).toHaveAttribute("data-move", "2");
  await expect(root).toHaveAttribute("data-progress", "0");
  expect(await root.locator("[data-derivation-stage]").count()).toBe(1);
  await page.mouse.wheel(0, 90);
  await expect(root).toHaveAttribute("data-progress", "0");
  await root.screenshot({ path: info.outputPath("local-entry-desktop.png") });
  const written = root.locator(".energy-derivation-interleave-text").last();
  await written.evaluate(el => { const range = document.createRange(); range.selectNodeContents(el); getSelection()!.removeAllRanges(); getSelection()!.addRange(range); });
  expect(await page.evaluate(() => getSelection()!.toString())).toContain("Cancel one mass factor");
  await expect(root).toHaveAttribute("data-progress", "0");
  await root.evaluate(el => { (el as HTMLElement).dataset["derivationRevision"] = "edited"; });
  await entries.nth(1).click();
  await expect(root.locator("[data-derivation-status]")).toContainText("older revision");
  await expect(root).toHaveAttribute("data-move", "2");
});

test("long-document local access preserves held transitions and exact return after reflow", async ({ page }) => {
  await page.goto(route + "#energy-from-momentum");
  const root = page.locator("[data-energy-derivation]:not([data-derivation-namespace=power])");
  await expect(root.locator("[data-derivation-stage]")).toHaveAttribute("data-derivation-renderer", "canonical-native-katex-scene-session");
  await dragTo(page, root, .55);
  const held = await root.getAttribute("data-progress");
  // Layout pressure only, not fabricated mathematical states or authoring
  // support for a longer proof. Unequal prose intervals reuse all three moves.
  await root.locator(".energy-derivation-interleave-text").evaluateAll(passages => passages.forEach((passage, i) => {
    for (let j = 0; j < [22, 11, 5][i]!; j++) {
      const p = document.createElement("p");
      p.textContent = "Layout fixture: a longer explanation occupies reading space without adding a mathematical state or changing the transition's meaning.";
      passage.append(p);
    }
  }));
  const why = root.locator('[data-derivation-interleave="0"] summary').first();
  await why.click();
  const entry = root.locator('[data-derivation-entry="2"]');
  await entry.scrollIntoViewIfNeeded();
  const before = await page.evaluate(() => scrollY);
  expect(before).toBeGreaterThan(3000);
  expect((await lens(root).boundingBox())!.y).toBeLessThan(0);
  await entry.click();
  await expect(root).toHaveAttribute("data-move", "2");
  await expect(root).toHaveAttribute("data-progress", "0");
  expect(await page.evaluate(() => scrollY)).toBe(before);
  expect((await lens(root).boundingBox())!.y).toBeGreaterThan(0);
  await root.locator('[data-derivation-entry="0"]').click();
  await expect(root).toHaveAttribute("data-move", "0");
  await expect(root).toHaveAttribute("data-progress", held!);
  const recall = root.locator("[data-derivation-recall]");
  await recall.locator(":scope > summary").click();
  const origin = recall.locator("a");
  await origin.scrollIntoViewIfNeeded();
  const offset = await root.locator('[data-derivation-row="0"]').evaluate(el => el.getBoundingClientRect().top);
  await origin.click();
  const back = page.locator("[data-derivation-return]");
  await expect(back).toBeFocused();
  await page.setViewportSize({ width: 960, height: 800 });
  await back.click();
  await expect(origin).toBeFocused();
  await expect(root).toHaveAttribute("data-progress", held!);
  expect(Math.abs(await root.locator('[data-derivation-row="0"]').evaluate(el => el.getBoundingClientRect().top) - offset)).toBeLessThan(2);
  await expect(root).toHaveAttribute("data-playing", "false");
  await expect(root.locator(".energy-derivation-equation")).toHaveCount(4);
});

test("desktop integration preserves enlarged reading and keeps phone presentation opt-in", async ({ page }) => {
  await page.addInitScript(() => document.addEventListener("DOMContentLoaded", () => { document.documentElement.style.fontSize = "24px"; }));
  const root = await ready(page);
  await expect(root.locator("[data-derivation-entry]")).toHaveCount(3);
  await root.locator('[data-derivation-entry="1"]').click();
  await expect(root).toHaveAttribute("data-move", "1");
  await expect(root).toHaveAttribute("data-progress", "0");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(root).toHaveAttribute("data-mobile-candidate", "false");
  await expect(root.locator('[data-derivation-entry="0"]')).toBeHidden();
  await expect(lens(root)).toBeVisible();
  await expect(root.locator(".energy-derivation-mobile-well").first()).toBeHidden();
});

test("phone local inspection keeps normal-width prose and holds a reversible local animation", async ({ page }, info) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(route + "?derivation-access=local#energy-from-momentum");
  const root = page.locator("[data-energy-derivation]:not([data-derivation-namespace=power])"), entry = root.locator('[data-derivation-entry="0"]');
  await expect(root.locator("[data-derivation-stage]")).toHaveAttribute("data-derivation-renderer", "canonical-native-katex-scene-session");
  await expect(lens(root)).toBeHidden();
  const text = root.locator(".energy-derivation-interleave-text").first();
  expect((await text.boundingBox())!.width).toBeGreaterThan(310);
  await entry.scrollIntoViewIfNeeded();
  const before = (await entry.boundingBox())!.y;
  await entry.click();
  await expect(root).toHaveAttribute("data-mobile-inspect", "true");
  expect(Math.abs((await entry.boundingBox())!.y - before)).toBeLessThan(1);
  const range = root.getByRole("slider", { name: "Inspect step 1", exact: true });
  await seek(range, .55);
  await expect(root).toHaveAttribute("data-progress", "0.55");
  await expect(root).toHaveAttribute("data-playing", "false");
  const stage = root.locator("[data-derivation-stage]");
  const stageBox = await stage.boundingBox(), textBox = await text.boundingBox();
  expect(stageBox!.y + stageBox!.height).toBeLessThan(textBox!.y);
  await expect(stage.locator("[data-derivation-inspection-context]")).toHaveCount(0);
  await page.mouse.wheel(0, 100);
  await expect(root).toHaveAttribute("data-progress", "0.55");
  await seek(range, .35);
  await expect(root).toHaveAttribute("data-direction", "rewind");
  await seek(range, .55);
  await root.screenshot({ path: info.outputPath("local-inspection-phone.png") });
  const close = root.locator('[data-derivation-interleave="0"] [data-local-close]');
  await close.click();
  await expect(root).toHaveAttribute("data-mobile-inspect", "false");
  await expect(entry).toBeFocused();
  await entry.click();
  await expect(root).toHaveAttribute("data-progress", "0.55");
  await root.locator('[data-derivation-interleave="0"] [data-local-back]').click();
  await expect.poll(async () => Number(await root.getAttribute("data-progress"))).toBeLessThan(.55);
  await expect(root).toHaveAttribute("data-progress", "0");
  await range.focus();
  await page.keyboard.press("End");
  await expect(root).toHaveAttribute("data-progress", "1");
  await page.keyboard.press("Home");
  await expect(root).toHaveAttribute("data-progress", "0");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.emulateMedia({ media: "print" });
  await expect(stage).toBeHidden();
  await expect(entry).toBeHidden();
  for (const record of await root.locator(".energy-derivation-equation").all()) await expect(record).toBeVisible();
});

test("semantic accent reaches native and material participants without coloring persistent context", async ({ page }, info) => {
  const root = await ready(page);
  const stage = root.locator("[data-derivation-stage]");
  for (const position of [.25, .55, .85, .55, 0, 1]) {
    await dragTo(page, root, position);
    const strength = await stage.evaluate(el => (el as HTMLElement).style.getPropertyValue("--derivation-participant-strength"));
    if (position === 0 || position === 1) expect(strength).toBe("0%");
    else {
      expect(parseFloat(strength)).toBeGreaterThan(90);
      const participants = stage.locator("[data-derivation-participant]");
      expect(await participants.count()).toBeGreaterThanOrEqual(2);
      const ids = await participants.evaluateAll(els => els.map(el => el.getAttribute("data-derivation-participant")));
      expect(ids.every(id => id === "energy.substitute.0.velocity" || id === "energy.substitute.1.replacement")).toBe(true);
      const focal = await participants.first().evaluate(el => getComputedStyle(el).color);
      expect(focal).toBe("color(srgb 0 0.419608 0.568627)");
      const context = await stage.locator('[data-derivation-source] [data-kp-semantic-entity-id$=".prefix"]').evaluate(el => getComputedStyle(el).color);
      expect(focal).not.toBe(context);
      const innerColors = await participants.locator("*").evaluateAll(els => els.map(el => getComputedStyle(el).color));
      expect(innerColors.every(color => color === focal)).toBe(true);
      const inkColors = await participants.locator("*").evaluateAll(els => els.map(el => getComputedStyle(el).webkitTextFillColor));
      expect(inkColors.every(color => color === focal)).toBe(true);
      await root.screenshot({ path: info.outputPath(`semantic-accent-${position}.png`) });
      if (position === .55) {
        const material = stage.locator('[data-kp-equation-material-owner-id][data-derivation-participant]');
        expect(await material.count()).toBeGreaterThan(0);
        expect(await material.first().locator("*").first().evaluate(el => getComputedStyle(el).color)).toBe(focal);
        await root.screenshot({ path: info.outputPath("semantic-accent.png") });
      }
    }
  }
  await page.goto(route + "?derivation-motion=equation&derivation-emphasis=contrast#energy-from-momentum");
  await expect(stage).toHaveAttribute("data-derivation-renderer", "canonical-native-katex-scene-session");
  await dragTo(page, root, .55);
  await expect(stage.locator("[data-derivation-participant]")).toHaveCount(0);
  await root.screenshot({ path: info.outputPath("contrast-only.png") });
});

test("retired participant comparison preserves full context and a working handle", async ({ page }, info) => {
  // Keep the whole scripted chain inside the window: Firefox does not deliver
  // synthetic mouse release outside it. Default-size drag coverage is separate.
  await page.setViewportSize({ width: 1280, height: 1800 });
  const root = await ready(page), stage = root.locator("[data-derivation-stage]");
  await page.goto(route + "?derivation-motion=participants#energy-from-momentum");
  await expect(stage).toHaveAttribute("data-derivation-renderer", "canonical-native-katex-scene-session");
  const records = root.locator(".energy-derivation-equation");
  const initial = await documentBoxes(records);
  await expect(root).toHaveAttribute("data-retired-comparison", "participants");
  await expect(lens(root)).toBeVisible();
  for (const position of [1.25, 1.6, 1.85, 2, 2.25, 2.6, 2.85, 3, 2.6, 1.6, .25]) {
    await dragTo(page, root, position);
    const move = Math.max(0, Math.ceil(position) - 1);
    await expect(root).toHaveAttribute("data-move", String(move));
    await expect(root).toHaveAttribute("data-inspection-extent", "equation");
    expect(await documentBoxes(records)).toEqual(initial);
    await expect(stage.locator("[data-derivation-inspection-context]")).toHaveCount(0);
  }
  await page.goto(route + "?derivation-motion=equation#energy-from-momentum");
  await expect(stage).toHaveAttribute("data-derivation-renderer", "canonical-native-katex-scene-session");
  await dragTo(page, root, .25);
  await expect(root).toHaveAttribute("data-inspection-extent", "equation");
  await expect(stage.locator("[data-derivation-inspection-context]")).toHaveCount(0);
  await root.screenshot({ path: info.outputPath("whole-equation-comparison.png") });
});

test("contextual inspection keeps the complete working equation through forward and reverse handoffs", async ({ page }, info) => {
  await page.goto(route + "?derivation-motion=contextual#energy-from-momentum");
  const root = page.locator("[data-energy-derivation]:not([data-derivation-namespace=power])"), stage = root.locator("[data-derivation-stage]");
  await expect(stage).toHaveAttribute("data-derivation-renderer", "canonical-native-katex-scene-session");
  const records = root.locator(".energy-derivation-equation");
  const geometry = await documentBoxes(records);
  for (const position of [.55, 1, 1.55, 2, 2.55, 3, 2.55, 1.55, .55, 0]) {
    await dragTo(page, root, position);
    await expect(root).toHaveAttribute("data-inspection-extent", "equation");
    await expect(stage.locator("[data-derivation-inspection-context]")).toHaveCount(0);
    await expect(records).toHaveCount(4);
    expect(await documentBoxes(records)).toEqual(geometry);
    const opacity = await stage.evaluate(el => Number(getComputedStyle(el).opacity));
    expect(opacity).toBe(Number.isInteger(position) ? 0 : 1);
    if (!Number.isInteger(position)) {
      const owners = stage.locator("[data-kp-equation-material-owner-id]");
      expect(await owners.count()).toBeGreaterThan(0);
      // Visible contextual material, not merely a hidden native source or an
      // endpoint elsewhere on the page, must accompany the semantic change.
      const context = owners.filter({ hasNot: stage.locator("[data-derivation-participant]") });
      expect(await context.evaluateAll(els => els.some(el => !el.hasAttribute("data-derivation-participant") && getComputedStyle(el).visibility !== "hidden"))).toBe(true);
      expect(await stage.locator("[data-derivation-participant]").count()).toBeGreaterThan(0);
      await root.screenshot({ path: info.outputPath(`contextual-${position}.png`) });
    }
  }
  await page.emulateMedia({ media: "print" });
  await expect(stage).toBeHidden();
  for (const record of await records.all()) await expect(record).toBeVisible();
});

test("recalled result plays only its licensed use and rejects stale references without moving the held state", async ({ page }, info) => {
  await page.goto(route + "?derivation-recall=use#energy-from-momentum");
  const root = page.locator("[data-energy-derivation]:not([data-derivation-namespace=power])"), recall = root.locator("[data-derivation-recall]");
  await expect(lens(root)).toBeEnabled();
  await recall.locator(":scope > summary").click();
  await expect(recall).toContainText("Use here:");
  await expect(root).toHaveAttribute("data-playing", "false");
  const button = recall.getByRole("button", { name: "Show this substitution" });
  await button.click();
  await expect(root).toHaveAttribute("data-move", "0");
  await expect(root).toHaveAttribute("data-playing", "true");
  await expect.poll(async () => Number(await root.getAttribute("data-progress"))).toBeGreaterThan(.1);
  expect(Number(await root.getAttribute("data-progress"))).toBeLessThan(1);
  await expect(root).toHaveAttribute("data-progress", "1", { timeout: 7000 });
  await expect(root).toHaveAttribute("data-playing", "false");
  await expect(root).toHaveAttribute("data-move", "0");
  await dragTo(page, root, .55);
  await root.screenshot({ path: info.outputPath("recall-to-use.png") });
  const held = await root.getAttribute("data-progress");
  const depth = recall.locator("[data-momentum-dependency=division]");
  await depth.locator("summary").click();
  await expect(depth).toContainText("Mass need not be constant over time");
  await expect(root).toHaveAttribute("data-progress", held!);
  await recall.screenshot({ path: info.outputPath("momentum-dependency-depth.png") });
  const link = recall.getByRole("link", { name: "Visit the original definition" });
  await link.click();
  await page.getByRole("button", { name: "Return to your derivation" }).click();
  await expect(link).toBeFocused();
  await expect(root).toHaveAttribute("data-progress", held!);
  await expect(recall).toHaveAttribute("open", "");
  await expect(depth).toHaveAttribute("open", "");
  await button.evaluate(el => { (el as HTMLElement).dataset["derivationUseResult"] = "invented"; });
  await button.click();
  await expect(recall.locator("[data-derivation-use-status]")).toBeVisible();
  await expect(root).toHaveAttribute("data-progress", held!);
  await button.evaluate(el => { (el as HTMLElement).dataset["derivationUseResult"] = "physics.velocity-from-momentum"; });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await button.click();
  await expect(root).toHaveAttribute("data-progress", "1");
  await expect(root).toHaveAttribute("data-playing", "false");
  await page.goto("/experiments/scalar-cancellation/?derivation-recall=use#remaining-factor");
  await expect(page.locator("[data-derivation-use-result]")).toHaveCount(0);
});

test("local provenance returns to the same logical position, disclosures and focus after reflow", async ({ page }, info) => {
  await page.goto(route + "?derivation-motion=contextual&derivation-provenance=local#energy-from-momentum");
  const root = page.locator("[data-energy-derivation]:not([data-derivation-namespace=power])");
  await expect(root.locator("[data-derivation-stage]")).toHaveAttribute("data-derivation-renderer", "canonical-native-katex-scene-session");
  const recall = root.locator("[data-derivation-recall]");
  await recall.locator(":scope > summary").click();
  await root.locator('[data-derivation-interleave="1"] summary').first().click();
  await dragTo(page, root, 1.55);
  const link = recall.getByRole("link", { name: "Visit the original definition" });
  await link.focus();
  const before = await root.evaluate(el => ({ progress: el.getAttribute("data-derivation-progress"),
    offset: el.querySelector('[data-derivation-row="1"]')!.getBoundingClientRect().top,
    disclosures: [...el.querySelectorAll("details")].map(detail => detail.open) }));
  await link.press("Enter");
  const back = page.getByRole("button", { name: "Return to your derivation" });
  await expect(back).toBeFocused();
  await expect(root).toHaveAttribute("data-playing", "false");
  await page.locator("#momentum-definition").evaluate(el => { (el as HTMLElement).style.paddingBottom = "120px"; });
  await page.setViewportSize({ width: 800, height: 900 });
  await back.click();
  await expect(link).toBeFocused();
  await expect(back).toBeHidden();
  await expect(root).toHaveAttribute("data-derivation-progress", before.progress!);
  const after = await root.evaluate(el => ({ offset: el.querySelector('[data-derivation-row="1"]')!.getBoundingClientRect().top,
    disclosures: [...el.querySelectorAll("details")].map(detail => detail.open) }));
  expect(after.disclosures).toEqual(before.disclosures);
  expect(Math.abs(after.offset - before.offset)).toBeLessThan(2);
  await expect(root).toHaveAttribute("data-playing", "false");
  await root.screenshot({ path: info.outputPath("provenance-return.png") });
  // Stale publication bookmarks fail without changing the held mathematical state.
  await link.press("Enter");
  await expect(back).toBeFocused();
  await root.evaluate(el => { (el as HTMLElement).dataset["derivationRevision"] = "edited"; });
  await back.click();
  await expect(page.getByText("This return needs repair; your written derivation is unchanged.")).toBeVisible();
  await expect(root).toHaveAttribute("data-derivation-progress", before.progress!);
  await expect(back).toBeVisible();
});

test("accepted context and provenance are defaults with explicit legacy comparisons", async ({ page }, info) => {
  const root = await ready(page);
  await expect(root.locator("[data-derivation-recall]")).toHaveCount(1);
  await expect(root).toHaveAttribute("data-inspection-extent", "equation");
  await page.goto(route + "?derivation-provenance=off#energy-from-momentum");
  await expect(root.locator("[data-derivation-stage]")).toHaveAttribute("data-derivation-renderer", "canonical-native-katex-scene-session");
  await expect(root.locator("[data-derivation-recall]")).toHaveCount(0);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(route + "?derivation-motion=contextual&derivation-provenance=local#energy-from-momentum");
  await expect(root.locator("[data-derivation-stage]")).toHaveAttribute("data-derivation-renderer", "canonical-native-katex-scene-session");
  await root.locator("[data-derivation-recall] > summary").click();
  await dragTo(page, root, .55);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await root.screenshot({ path: info.outputPath("contextual-narrow.png") });
});

test("persistent lens follows the expression, holds interiors and rewinds exactly", async ({ page }, info) => {
  const root = await ready(page);
  await expect(root.getByRole("slider")).toHaveCount(1);
  await expect(root.locator("[data-derivation-local], [data-derivation-select], [data-derivation-play]")).toHaveCount(0);
  await expect(lens(root)).toHaveAttribute("aria-valuenow", "0");
  const slots = await root.locator("[data-derivation-row]").evaluateAll(rows => rows.map(row => (row as HTMLElement).offsetTop));
  await dragTo(page, root, .55, false);
  await expect.poll(async () => Number(await root.getAttribute("data-progress"))).toBeGreaterThan(.5);
  await expect(root).toHaveAttribute("data-playing", "false");
  const cue = root.locator("[data-derivation-interleave]").first(), cueBox = await documentBoxes(cue);
  const expression = await root.locator("[data-derivation-stage]").boundingBox(), knob = await lens(root).boundingBox();
  expect(Math.abs(expression!.y + expression!.height / 2 - knob!.y - knob!.height / 2)).toBeLessThan(2);
  expect(Number(await root.getAttribute("data-algebra-progress"))).toBeGreaterThan(0);
  await page.mouse.up();
  const held = await root.getAttribute("data-derivation-progress");
  await page.waitForTimeout(150);
  await expect(root).toHaveAttribute("data-derivation-progress", held!);
  await root.screenshot({ path: info.outputPath("lens-interior.png") });
  await dragTo(page, root, .4);
  expect(Number(await root.getAttribute("data-derivation-progress"))).toBeLessThan(Number(held));
  expect(await documentBoxes(cue)).toEqual(cueBox);
  await dragTo(page, root, .55);
  await expect(root).toHaveAttribute("data-derivation-progress", held!);
  expect(await root.locator("[data-derivation-row]").evaluateAll(rows => rows.map(row => (row as HTMLElement).offsetTop))).toEqual(slots);
});

test("interleaved reason preserves its endpoints, readable lane and disclosure geometry", async ({ page }, info) => {
  for (const width of [1000, 390]) {
    await page.setViewportSize({ width, height: 844 });
    const root = await ready(page), passage = root.locator("[data-derivation-interleave]").first();
    const source = root.locator('[data-derivation-row="0"] .energy-derivation-equation');
    const target = root.locator('[data-derivation-row="1"] .energy-derivation-equation');
    await expect(root.locator("[data-derivation-cue], [data-derivation-notes]")).toHaveCount(0);
    await expect(root.locator("[data-derivation-interleave]")).toHaveCount(3);
    await expect(root.locator("[data-derivation-rail] span")).toHaveCount(4);
    const textBox = await passage.locator(".energy-derivation-interleave-text").boundingBox();
    expect(textBox!.y).toBeGreaterThan((await source.boundingBox())!.y);
    expect(textBox!.y + textBox!.height).toBeLessThan((await target.boundingBox())!.y);
    await dragTo(page, root, .5);
    await expect(source).toBeVisible(); await expect(target).toBeVisible();
    expect(await passage.locator(".energy-derivation-interleave-text").boundingBox()).toEqual(textBox);
    // The KaTeX display wrapper fills the row; its native bases measure the
    // actual notation span rather than counting unused display width as ink.
    const nativeRight = await root.locator("[data-derivation-stage] [data-derivation-target] .katex-html > .base")
      .evaluateAll(bases => Math.max(...bases.map(base => base.getBoundingClientRect().right)));
    expect(textBox!.x).toBeGreaterThan(nativeRight);
    await passage.getByText("Why is this allowed?", { exact: true }).click();
    await expect(root).toHaveAttribute("data-playing", "false");
    await dragTo(page, root, 1);
    await expect(lens(root)).toHaveAttribute("aria-valuenow", "1");
    const knob = await lens(root).boundingBox(), dock = await target.boundingBox();
    expect(Math.abs(knob!.y + knob!.height / 2 - dock!.y - dock!.height / 2)).toBeLessThan(2);
    await passage.getByText("Why is this allowed?", { exact: true }).click();
    await dragTo(page, root, .5);
    await root.screenshot({ path: info.outputPath(`interleaved-${width}.png`) });
  }
});

test("the audit trail keeps its layout and exact docks have one visible expression", async ({ page }, info) => {
  const root = await ready(page);
  const records = root.locator(".energy-derivation-equation");
  const initial = await documentBoxes(records);
  for (const position of [0, .07, .15, .5, .85, .93, 1, .5, 0]) {
    await dragTo(page, root, position);
    for (const record of await records.all()) await expect(record).toBeVisible();
    expect(await documentBoxes(records)).toEqual(initial);
    for (const reason of await root.locator("[data-derivation-interleave]").all()) await expect(reason).toBeVisible();
    const opacity = Number(await root.locator("[data-derivation-stage]").evaluate(el => getComputedStyle(el).opacity));
    if (position === 0 || position === 1) {
      expect(opacity).toBe(0);
      await expect(root).toHaveAttribute("data-inspection-owner", "docked");
      await expect(root.locator('[data-derivation-row="2"]')).toHaveAttribute("data-trace-role", "prospective");
    } else if (position === .5) expect(opacity).toBe(1);
    else expect(opacity).toBeGreaterThan(0);
    if (position === .07 || position === .5 || position === 1)
      await root.screenshot({ path: info.outputPath("retained-record-" + position + ".png") });
  }
});

test("fast cross-edge dragging keeps the latest sample and cancels without autoplay", async ({ page }, info) => {
  const errors: string[] = [];
  page.on("pageerror", e => errors.push(e.message));
  const root = await ready(page);
  await dragTo(page, root, 2.5);
  await expect(root).toHaveAttribute("data-move", "2");
  await expect.poll(async () => Number(await root.getAttribute("data-progress"))).toBeCloseTo(.5, 1);
  await expect(root.locator("[data-kp-editor-equation-material-layer] [data-kp-equation-material-owner-id]").first()).toBeAttached();
  await dragTo(page, root, .5, false);
  await expect(root).toHaveAttribute("data-move", "0");
  await lens(root).dispatchEvent("pointercancel", { pointerId: 1 });
  await page.mouse.up();
  await expect(root).not.toHaveAttribute("data-derivation-dragging", "true");
  await expect(root).toHaveAttribute("data-playing", "false");
  for (const position of [1.02, 2.02, 3, 0]) {
    await dragTo(page, root, position);
    await expect.poll(async () => Number(await lens(root).getAttribute("aria-valuenow"))).toBeCloseTo(position, 2);
  }
  await root.screenshot({ path: info.outputPath("lens-source.png") });
  expect(errors).toEqual([]);
});

test("explicit next and previous animate through continuous native handoffs", async ({ page }) => {
  const root = await ready(page);
  await dragTo(page, root, .5);
  await root.locator("[data-derivation-next]").click();
  await expect(root).toHaveAttribute("data-playing", "true");
  await expect(root).toHaveAttribute("data-progress", "1", { timeout: 10000 });
  const result = await root.evaluate(el => new Promise<{ originFlash: boolean; shift: number }>(resolve => {
    const old = el.querySelector<HTMLElement>('[data-derivation-stage] [data-derivation-target] [data-kp-semantic-entity-id$=".prefix"]')!.getBoundingClientRect();
    const top = el.querySelector("[data-derivation-stage]")!.getBoundingClientRect().top;
    let originFlash = false;
    const observer = new MutationObserver(() => {
      const current = el.querySelector("[data-derivation-stage]")!;
      originFlash ||= current.getBoundingClientRect().top < top - .5;
      if (el.getAttribute("data-move") === "1") {
        const fresh = current.querySelector('[data-derivation-source] [data-kp-semantic-entity-id$=".prefix"]')!.getBoundingClientRect();
        observer.disconnect(); clearTimeout(timeout);
        resolve({ originFlash, shift: Math.max(Math.abs(fresh.x - old.x), Math.abs(fresh.y - old.y)) });
      }
    });
    observer.observe(el, { subtree: true, attributes: true, childList: true });
    const timeout = setTimeout(() => { observer.disconnect(); resolve({ originFlash, shift: 999 }); }, 10000);
    el.querySelector<HTMLButtonElement>("[data-derivation-next]")!.click();
  }));
  expect(result.originFlash).toBe(false); expect(result.shift).toBeLessThan(.5);
  await expect(root).toHaveAttribute("data-playing", "true");
  await root.locator("[data-derivation-previous]").click();
  await expect(root).toHaveAttribute("data-direction", "rewind");
  await expect(root).toHaveAttribute("data-progress", "0", { timeout: 10000 });
});

test("narrow keyboard lens, reduced motion, ordinary scroll and print preserve reading", async ({ page }, info) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  const root = await ready(page), handle = lens(root);
  await handle.focus(); await handle.press("End");
  await expect(handle).toHaveAttribute("aria-valuenow", "3");
  await handle.press("ArrowUp");
  await expect(handle).toHaveAttribute("aria-valuenow", "2");
  await handle.press("Home");
  await expect(handle).toHaveAttribute("aria-valuenow", "0");
  await dragTo(page, root, .5);
  const held = await root.getAttribute("data-derivation-progress");
  await page.mouse.wheel(0, 100);
  await expect(root).toHaveAttribute("data-derivation-progress", held!);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await root.screenshot({ path: info.outputPath("lens-narrow.png") });
  await page.emulateMedia({ media: "print" });
  for (const row of await root.locator("[data-derivation-row]").all()) await expect(row).toBeVisible();
  for (const reason of await root.locator("[data-derivation-interleave]").all()) await expect(reason).toBeVisible();
});
test("native reading, continuous local control, exact reverse and held prose", async ({ page }, info) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto(route);
  const straight = page.locator('[data-episode="straight"]'), turning = page.locator('[data-episode="turning"]');
  await straight.scrollIntoViewIfNeeded();
  await expect(straight).toHaveAttribute("data-enhanced", "true");
  const prose = await straight.locator(".physics-cue").innerText();
  await straight.locator("[data-physics-play]").click();
  await expect.poll(async () => Number(await straight.getAttribute("data-physical-time"))).toBeGreaterThan(.05);
  const time = Number(await straight.getAttribute("data-physical-time"));
  expect(time).toBeLessThan(2);
  await straight.locator("[data-physics-play]").click();
  // Compare the same rendered-text representation: KaTeX also carries hidden
  // MathML/source text, so textContent is not equivalent to innerText.
  await expect.poll(() => straight.locator(".physics-cue").innerText()).toBe(prose);
  await seek(straight.locator("input"), 1);
  const midway = await straight.locator("[data-momentum]").getAttribute("d");
  await expect(straight).toHaveAttribute("data-energy", "2");
  await seek(straight.locator("input"), 2);
  await expect(straight).toHaveAttribute("data-energy", "8");
  await seek(straight.locator("input"), 1);
  await expect(straight.locator("[data-momentum]")).toHaveAttribute("d", midway!);
  await straight.locator("input").press("ArrowLeft");
  expect(Number(await straight.getAttribute("data-physical-time"))).toBeLessThan(1);
  await turning.scrollIntoViewIfNeeded();
  await expect(turning).toHaveAttribute("data-enhanced", "true");
  const slider = turning.locator("input"), box = await slider.boundingBox();
  expect(box).not.toBeNull();
  await page.mouse.move(box!.x + box!.width * .2, box!.y + box!.height / 2);
  await page.mouse.down();
  await page.mouse.move(box!.x + box!.width * .7, box!.y + box!.height / 2, { steps: 8 });
  await page.mouse.up();
  expect(Number(await turning.getAttribute("data-physical-time"))).toBeGreaterThan(.5);
  expect(Number(await turning.getAttribute("data-physical-time"))).toBeLessThan(Math.PI / 2);
  await seek(slider, Math.PI / 4);
  await expect(turning).toHaveAttribute("data-energy", "0.5");
  await expect(turning.locator("[data-physics-description]")).toContainText("(-0.71, 0.71)");
  await turning.screenshot({ path: info.outputPath("turning-intermediate.png") });
  const beforeScroll = await turning.getAttribute("data-physical-time");
  await page.mouse.wheel(0, 150);
  await expect(turning).toHaveAttribute("data-physical-time", beforeScroll!);
  await turning.locator("[data-physics-play]").click();
  await page.evaluate(() => window.scrollTo(0, 0));
  await expect(turning).toHaveAttribute("data-playing", "false");
  await page.screenshot({ path: info.outputPath("reading-start.png"), fullPage: true });
  expect(errors).toEqual([]);
});

test("source-owned static reading needs no JavaScript", async ({ browser }, info) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto(`http://localhost:8000${route}`);
  await expect(page.locator("h1")).toContainText("momentum");
  await expect(page.locator("[data-physics-motion] [data-particle]")).toHaveCount(2);
  await expect(page.locator('[data-episode="turning"] [data-kp-focus-deck-annotation="physics.momentum"]')).toContainText("(0.00, 1.00)");
  await expect(page.locator('[data-episode="turning"] [data-physics-power-calculation]')).toHaveText('1.00 m/s × 0.00 N = 0.00 W');
  await expect(page.locator('[data-episode="straight"] [data-physics-power-explanation]')).toContainText('no direction');
  const derivation = page.locator("[data-energy-derivation]:not([data-derivation-namespace=power])");
  await expect(derivation.locator("[data-derivation-row]")).toHaveCount(4);
  const detail = derivation.locator("[data-refinement-static]");
  await detail.locator("summary").click();
  await expect(detail.locator("[data-static-transition-number]")).toHaveText(["3.1", "3.2", "3.3"]);
  await expect(detail.locator(".katex-display")).toHaveCount(2);
  for (const equation of await detail.locator(".katex-display").all()) await expect(equation).toBeVisible();
  await page.emulateMedia({ media: "print" });
  for (const row of await derivation.locator("[data-derivation-row]").all()) await expect(row).toBeVisible();
  await page.emulateMedia({ media: "screen" });
  await page.goto(`http://localhost:8000${route}static.html`);
  const images = page.locator("figure img");
  await expect(images).toHaveCount(4);
  for (const img of await images.all()) await expect.poll(() => img.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0)).toBe(true);
  await page.screenshot({ path: info.outputPath("static-reading.png"), fullPage: true });
  await context.close();
});

test("narrow layout and reduced-motion controls retain explicit endpoints", async ({ page }, info) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(route);
  const turning = page.locator('[data-episode="turning"]');
  await turning.scrollIntoViewIfNeeded();
  await turning.locator("[data-physics-play]").click();
  await expect(turning).toHaveAttribute("data-physical-time", String(Math.PI / 2));
  await expect(turning).toHaveAttribute("data-playing", "false");
  await turning.locator("[data-physics-reset]").click();
  await expect(turning).toHaveAttribute("data-physical-time", "0");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await turning.screenshot({ path: info.outputPath("narrow-turning.png") });
});

test("the algebraic argument is navigable in both editions without playback", async ({ page }, info) => {
  for (const edition of ["", "static.html"]) {
    await page.goto(route + edition);
    await expect(page.locator("h1")).toHaveText("Force, momentum and energy: how the relationships fit together");
    for (const [label, target] of [["Inspect the substitution", "energy-from-momentum"], ["Inspect the differentiation", "force-to-energy"], ["Inspect the accumulation", "impulse-and-work"]]) {
      await page.getByRole("link", { name: label!, exact: true }).click();
      await expect(page).toHaveURL(new RegExp(`#${target}$`));
      await expect(page.locator(`#${target}`)).toBeAttached();
    }
    await page.getByRole("link", { name: "Back to the relationship map", exact: true }).last().click();
    await expect(page).toHaveURL(/#relationship-map$/);
  }
  await page.goto(route + "#relationship-map");
  await page.locator("#relationship-map").screenshot({ path: info.outputPath("algebraic-map.png") });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("link", { name: "Inspect the differentiation", exact: true }).click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.locator("#force-to-energy").screenshot({ path: info.outputPath("algebraic-reason-narrow.png") });
});
