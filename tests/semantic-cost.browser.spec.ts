import { test, expect, type Page, type CDPSession } from '@playwright/test';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import type {} from '../src/experiments/semantic-cost/entry.ts';
import budgets from '../scripts/semantic-cost-budgets.json' with { type: 'json' };

// The harness import above supplies types only; never execute its DOM module in Node.
async function resources(page: Page) {
  return (await Promise.all(page.frames().map(frame => frame.evaluate(() => performance.getEntriesByType('resource').map(entry => {
    const e = entry as PerformanceResourceTiming;
    const url = new URL(e.name);
    return { path: url.protocol === 'data:' ? 'data:embedded-resource' : url.pathname,
      transfer: e.transferSize, encoded: e.encodedBodySize, decoded: e.decodedBodySize };
  }))))).flat();
}
async function metrics(cdp: CDPSession) {
  // Let style/layout and canceled animation callbacks settle before asking GC
  // about retention; detached DOM awaiting a frame is not evidence of a leak.
  await cdp.send('Runtime.evaluate', { expression: 'new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))', awaitPromise: true });
  await cdp.send('HeapProfiler.collectGarbage');
  const result = await cdp.send('Performance.getMetrics');
  const dom = await cdp.send('Memory.getDOMCounters');
  return { ...Object.fromEntries(result.metrics.filter(m => m.name === 'JSHeapUsedSize').map(m => [m.name, m.value])),
    Nodes: dom.nodes, Documents: dom.documents, JSEventListeners: dom.jsEventListeners };
}
async function record(name: string, data: unknown) {
  await mkdir('tmp/codex/semantic-cost', { recursive: true });
  await writeFile(`tmp/codex/semantic-cost/${name}.json`, JSON.stringify(data, null, 2) + '\n');
}

test('matrix source navigation loads selected production chunks once and retains one player', async ({ page, context }) => {
  const inventory: { file: string; modules: string[] }[] = JSON.parse(await readFile('dist/matrix-interpretations/module-inventory.json', 'utf8'));
  const sourceFile = (id: string) => {
    const chunk = inventory.find(entry => entry.modules.includes(`content/authoring/linear-algebra/${id}.ts`));
    expect(chunk, `production chunk for ${id}`).toBeDefined(); return `/${chunk!.file}`;
  };
  const projection = sourceFile('projection-loss'), dependent = sourceFile('dependent-columns');
  expect(projection).not.toBe(dependent);
  const requests: string[] = []; let documents = 0;
  page.on('request', request => {
    requests.push(new URL(request.url()).pathname);
    if (request.resourceType() === 'document') documents++;
  });
  const cdp = await context.newCDPSession(page); await cdp.send('Performance.enable');
  await page.goto('/experiments/matrix-column-combinations/');
  const root = page.locator('#comb-player'); await expect(root).toHaveAttribute('data-ready', 'true');
  expect(requests).not.toContain(projection); expect(requests).not.toContain(dependent);
  const select = async (id: string) => {
    await page.locator(`nav[aria-label="Matrix source inputs"] a[href*="input=${id}"]`).click();
    await expect(root).toHaveAttribute('data-source-id', `${id}.AB`);
  };
  await select('projection-loss'); expect(requests).toContain(projection); expect(requests).not.toContain(dependent);
  await select('dependent-columns'); expect(requests).toContain(dependent);
  await select('projection-loss');
  const baseline = await metrics(cdp), warmedRequests = requests.length;
  for (let i = 0; i < 6; i++) { await select('dependent-columns'); await select('projection-loss'); }
  const after = await metrics(cdp);
  expect(documents).toBe(1);
  expect(requests.length).toBe(warmedRequests);
  expect(requests.filter(path => path === projection)).toHaveLength(1);
  expect(requests.filter(path => path === dependent)).toHaveLength(1);
  expect(after['Documents']).toBe(baseline['Documents']);
  expect(after['JSEventListeners']).toBeLessThanOrEqual(baseline['JSEventListeners']! + 2);
  expect(after['Nodes']).toBeLessThanOrEqual(baseline['Nodes']! + 20);
  await record('matrix-navigation', { baseline, after, documentRequests: documents,
    newRequestsAfterWarmup: requests.length - warmedRequests, resources: await resources(page),
    note: 'Production fixture, six source pairs after warmup; post-GC counters are retention evidence, not process memory.' });
});

test('comparison production routes activate only their own player and selected source', async ({ page, context }) => {
  const inventory: { file: string; modules: string[] }[] = JSON.parse(await readFile('dist/matrix-interpretations/module-inventory.json', 'utf8'));
  const paths: string[] = [];
  page.on('request', request => paths.push(new URL(request.url()).pathname));
  const cdp = await context.newCDPSession(page); await cdp.send('Performance.enable');
  const reports = [];
  for (const source of ['ordinary', 'lost', 'distinguished']) {
    paths.length = 0;
    await page.goto(`/experiments/matrix-column-combinations/${source === 'ordinary' ? '' : `?compare=1&case=${source}`}`);
    const root = page.locator('#comb-player'); await expect(root).toHaveAttribute('data-ready', 'true');
    const reached = inventory.filter(chunk => paths.includes(`/${chunk.file}`)).flatMap(chunk => chunk.modules);
    if (source === 'ordinary') {
      expect(reached).toContain('src/experiments/matrix-column-combinations/reader.ts');
      expect(reached.some(path => /comparison-(?:host|source|view)\.ts$/.test(path))).toBe(false);
      continue;
    }
    expect(reached).toContain('src/experiments/matrix-column-combinations/comparison-host.ts');
    expect(reached.some(path => /matrix-column-combinations\/(?:reader|page|player|view|author)\.ts$/.test(path))).toBe(false);
    const selected = source === 'lost' ? 'dependent-columns-comparison' : 'distinguished-inputs-comparison';
    const other = source === 'lost' ? 'distinguished-inputs-comparison' : 'dependent-columns-comparison';
    expect(reached).toContain(`content/authoring/linear-algebra/${selected}.ts`);
    expect(reached).not.toContain(`content/authoring/linear-algebra/${other}.ts`);
    const slider = page.getByRole('slider', { name: 'Comparison position' });
    const cycle = () => slider.evaluate(node => {
        if (!(node instanceof HTMLInputElement)) throw new Error('Expected comparison slider');
        for (const progress of [0, .08, .4, .48, .8, 1, .6, .2, 0]) {
          node.value = String(progress); node.dispatchEvent(new Event('input', { bubbles: true }));
        }
      });
    // Initialize the browser automation's element-evaluation world and visit
    // every cue before measuring retained listeners/DOM, as with source navigation.
    await cycle();
    const baseline = await metrics(cdp), warmedRequests = paths.length;
    for (let repeat = 0; repeat < 8; repeat++) await cycle();
    const after = await metrics(cdp);
    expect(paths.length).toBe(warmedRequests);
    expect(after['JSEventListeners']).toBe(baseline['JSEventListeners']);
    expect(after['Documents']).toBe(baseline['Documents']);
    expect(after['Nodes']).toBeLessThanOrEqual(baseline['Nodes']! + 20);
    await expect(page.locator('.comparison-material > *')).toHaveCount(14);
    reports.push({ source, baseline, after, resources: await resources(page) });
    await page.evaluate(() => window.dispatchEvent(new PageTransitionEvent('pagehide', { persisted: false })));
    await expect(page.locator('.comparison-material > *')).toHaveCount(0);
  }
  await record('matrix-comparison', { reports, note: 'Production requests include fonts; eight seek/reverse cycles per source after warmup. Post-GC counters describe retention, not performance or learner benefit.' });
});

test('visibility ownership shares resources and releases canceled registrations', async ({ page }) => {
  await page.goto('/cost/experiments/semantic-cost/?reading=rows');
  await expect(page.locator('html')).toHaveAttribute('data-ready', 'true');
  const result = await page.evaluate(async () => {
    const watch = window.semanticCost.watchPlayback;
    const original = window.IntersectionObserver;
    const observers: IntersectionObserver[] = [];
    let disconnected = 0, observed = 0, unobserved = 0;
    window.IntersectionObserver = class extends original {
      constructor(callback: IntersectionObserverCallback, options?: IntersectionObserverInit) {
        super(callback, options); observers.push(this);
      }
      override observe(target: Element) { observed++; super.observe(target); }
      override unobserve(target: Element) { unobserved++; super.unobserve(target); }
      override disconnect() { disconnected++; super.disconnect(); }
    };
    const frame = () => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
    const root = document.createElement('div');
    root.style.cssText = 'position:fixed;inset:0;width:20px;height:20px'; document.body.append(root);
    let first = 0, second = 0, canceled = 0;
    const a = new AbortController(), b = new AbortController(), c = new AbortController();
    c.abort(); watch(root, () => canceled++, c.signal);
    watch(root, () => first++, a.signal); watch(root, () => second++, b.signal);
    await frame();
    root.style.top = '200vh'; await frame();
    const exit = { first, second, canceled, owners: observers.length, observed };
    a.abort(); root.style.top = '0'; await frame();
    const reentry = { first, second };
    root.style.top = '200vh'; await frame();
    const afterAbort = { first, second };
    b.abort(); b.abort(); await frame();
    // Rebinding creates a fresh observer; a pending old delivery cannot own it.
    const d = new AbortController(); let remount = 0;
    watch(root, () => remount++, d.signal); d.abort(); await frame();
    const cleanup = { disconnected, unobserved, owners: observers.length, remount };
    window.IntersectionObserver = original; root.remove();
    return { exit, reentry, afterAbort, cleanup };
  });
  expect(result.exit).toEqual({ first: 1, second: 1, canceled: 0, owners: 1, observed: 1 });
  expect(result.reentry).toEqual({ first: 1, second: 1 });
  expect(result.afterAbort).toEqual({ first: 1, second: 2 });
  expect(result.cleanup).toEqual({ disconnected: 2, unobserved: 2, owners: 2, remount: 0 });
});

test('ten real players suspend offscreen, hold on reentry and release after disposal', async ({ browser }) => {
  const reports = [];
  for (const reading of ['dot', 'rows', 'columns', 'collection']) {
    const context = await browser.newContext({ viewport: { width: 1200, height: 950 } });
    const page = await context.newPage();
    const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
    const cdp = await context.newCDPSession(page); await cdp.send('Performance.enable');
    await page.goto(`http://127.0.0.1:4196/cost/experiments/semantic-cost/?reading=${reading}`);
    await expect(page.locator('html')).toHaveAttribute('data-ready', 'true');
    // Overlap benchmark stages so all ten share a visible viewport before exit;
    // this pressures real renderers without an artificial 10-screen viewport.
    await page.addStyleTag({ content: '#cost-instances > div { position:fixed; top:0; left:0; width:1000px; height:800px; overflow:hidden } #cost-instances.offscreen > div { top:200vh }' });
    await page.evaluate(async () => { window.semanticCost.prepare(1, false); await window.semanticCost.mount({ suspendOffscreen: true }); window.semanticCost.dispose(); });
    await page.locator('#cost-instances [data-source-id]').evaluateAll(nodes => nodes.map(node => node.getAttribute('style')));
    const baseline = await metrics(cdp);
    const cycles = [];
    for (let cycle = 0; cycle < 3; cycle++) {
      const mounted = await page.evaluate(async () => {
        const api = window.semanticCost; api.prepare(10, true);
        const result = await api.mount({ suspendOffscreen: true }); api.seek(.25); api.play(); return result;
      });
      await page.evaluate(() => document.querySelector('#cost-instances')!.classList.add('offscreen'));
      await expect.poll(() => page.evaluate(() => window.semanticCost.visibilityPauses())).toBe(10);
      const poses = () => page.locator('#cost-instances [data-source-id]').evaluateAll(nodes => nodes.map(node => node.getAttribute('style')));
      const held = await poses(); expect(held.length).toBeGreaterThan(0);
      const suspended = await metrics(cdp);
      expect(await poses()).toEqual(held);
      await page.evaluate(() => document.querySelector('#cost-instances')!.classList.remove('offscreen'));
      const restored = await metrics(cdp);
      expect(await poses()).toEqual(held);
      await page.evaluate(() => { window.semanticCost.play(); window.semanticCost.dispose(); window.semanticCost.dispose(); });
      await expect(page.locator('#cost-instances > *')).toHaveCount(0);
      const disposed = await metrics(cdp);
      expect(disposed['JSEventListeners']).toBeLessThanOrEqual(baseline['JSEventListeners']! + 3);
      expect(disposed['Nodes']).toBeLessThanOrEqual(baseline['Nodes']! + 20);
      cycles.push({ mounted, suspended, restored, disposed });
    }
    expect(errors).toEqual([]);
    reports.push({ reading, baseline, cycles }); await context.close();
  }
  await record('visibility-browser', { browser: browser.version(), reports,
    note: 'Ten real players per cohort, overlapping visible stages then offscreen exit. Held poses and repeated disposal are acceptance laws; post-GC heap is diagnostic, not process memory. No automatic reentry playback.' });
});

test('document visibility isolates owners and tolerates disposal during notification', async ({ page }) => {
  await page.goto('/cost/experiments/semantic-cost/?reading=rows');
  await expect(page.locator('html')).toHaveAttribute('data-ready', 'true');
  const result = await page.evaluate(() => {
    const watch = window.semanticCost.watchPlayback;
    const root = document.createElement('div'); document.body.append(root);
    const iframe = document.createElement('iframe'); document.body.append(iframe);
    const other = iframe.contentDocument!;
    const a = new AbortController(), b = new AbortController(), c = new AbortController();
    let first = 0, canceled = 0, foreign = 0;
    watch(root, () => { first++; b.abort(); }, a.signal);
    watch(root, () => canceled++, b.signal);
    watch(other.body, () => foreign++, c.signal);
    Object.defineProperty(document, 'hidden', { configurable: true, value: true });
    document.dispatchEvent(new Event('visibilitychange'));
    const hidden = { first, canceled, foreign };
    Object.defineProperty(document, 'hidden', { configurable: true, value: false });
    document.dispatchEvent(new Event('visibilitychange'));
    const visible = { first, canceled, foreign };
    Object.defineProperty(other, 'hidden', { configurable: true, value: true });
    other.dispatchEvent(new Event('visibilitychange'));
    const isolated = { first, canceled, foreign };
    a.abort(); c.abort();
    Object.defineProperty(document, 'hidden', { configurable: true, value: true });
    document.dispatchEvent(new Event('visibilitychange'));
    const disposed = { first, canceled, foreign };
    Reflect.deleteProperty(document, 'hidden'); root.remove(); iframe.remove();
    return { hidden, visible, isolated, disposed };
  });
  expect(result.hidden).toEqual({ first: 1, canceled: 0, foreign: 0 });
  expect(result.visible).toEqual(result.hidden);
  expect(result.isolated).toEqual({ first: 1, canceled: 0, foreign: 1 });
  expect(result.disposed).toEqual(result.isolated);
});

for (const initiallyHidden of [false, true]) test(`one failing pause callback cannot leave another card playing (initially hidden: ${initiallyHidden})`, async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await page.goto('/cost/experiments/semantic-cost/?reading=rows');
  await expect(page.locator('html')).toHaveAttribute('data-ready', 'true');
  const pauses = await page.evaluate(initiallyHidden => {
    const root = document.createElement('div'); document.body.append(root);
    const lifetime = new AbortController(); let pauses = 0;
    if (initiallyHidden) Object.defineProperty(document, 'hidden', { configurable: true, value: true });
    window.semanticCost.watchPlayback(root, () => { throw new Error('intentional pause failure'); }, lifetime.signal);
    window.semanticCost.watchPlayback(root, () => pauses++, lifetime.signal);
    if (!initiallyHidden) {
      Object.defineProperty(document, 'hidden', { configurable: true, value: true });
      document.dispatchEvent(new Event('visibilitychange'));
    }
    lifetime.abort(); Reflect.deleteProperty(document, 'hidden'); root.remove();
    return pauses;
  }, initiallyHidden);
  expect(pauses).toBe(1);
  await expect.poll(() => errors).toEqual(['intentional pause failure']);
});

test('canonical production pages: cold/warm transfers, fonts and readiness', async ({ browser }) => {
  const reports = [];
  for (const [route, root] of [['dot-product-passage', '#dot-player'], ['matrix-column-product', '#matrix-player'], ['matrix-column-combinations', '#comb-player'], ['matrix-examples', '#dot-player'], ['matrix-column-combinations/?example=composition', '#comb-player'], ['rectangular-product/?view=polynomials', '#rectangular-player'], ['rectangular-product/?view=system', '#rectangular-player'], ['rectangular-product/?view=polynomials&example=reordered', '#rectangular-player']]) {
    const context = await browser.newContext({ baseURL: 'http://127.0.0.1:4196', viewport: { width: 1200, height: 950 } });
    const page = await context.newPage();
    const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
    const cdp = await context.newCDPSession(page); await cdp.send('Network.clearBrowserCache'); await cdp.send('Performance.enable');
    const loads = [];
    for (const cache of ['cold', 'warm']) {
      const start = performance.now();
      await page.goto(`/experiments/${route}${route!.includes('?') ? '' : '/'}`);
      await expect(route === 'matrix-examples' ? page.frameLocator('#example-frame').locator(root!) : page.locator(root!)).toHaveAttribute('data-ready', 'true');
      await page.evaluate(() => document.fonts.ready);
      const navigation = await page.evaluate(() => {
        const entry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        return { transfer: entry.transferSize, encoded: entry.encodedBodySize, decoded: entry.decodedBodySize };
      });
      loads.push({ cache, readyMs: performance.now() - start, navigation, resources: await resources(page), metrics: await metrics(cdp) });
    }
    const cold = loads[0]!.resources, warm = loads[1]!.resources;
    expect(cold.some(r => /woff2$/.test(r.path))).toBe(true);
    expect(cold.some(r => /la-graph|three|webgl/i.test(r.path))).toBe(false);
    expect(warm.filter(r => /\.(js|css|woff2)$/.test(r.path)).reduce((sum, r) => sum + r.transfer, 0)).toBeLessThan(1000);
    expect(errors).toEqual([]);
    if (route === 'matrix-examples') {
      for (const value of ['dot-passage', 'dot', 'identity', 'orthonormality', 'composition', 'columns']) {
        await page.locator('#example-menu').selectOption(value);
        const selector = value === 'dot-passage' ? '#dot-player' : value === 'dot' ? '#matrix-player' : '#comb-player';
        await expect(page.frameLocator('#example-frame').locator(selector)).toHaveAttribute('data-ready', 'true');
        await expect(page.locator('iframe')).toHaveCount(1);
        expect(page.frames()).toHaveLength(2);
      }
    }
    reports.push({ route, loads }); await context.close();
  }
  await record('canonical-browser', { browser: browser.version(), reports, note: 'Loopback gzip/cache fixture; readiness includes automation. Resource transferSize includes per-resource overhead and excludes navigation HTML.' });
});

test('one and ten instances: inactive, mounted, playing and disposed', async ({ browser }) => {
  const reports = [];
  for (const reading of ['dot', 'rows', 'columns', 'collection'] as const) {
    const context = await browser.newContext({ baseURL: 'http://127.0.0.1:4196', viewport: { width: 1200, height: 950 } });
    const page = await context.newPage();
    const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
    const cdp = await context.newCDPSession(page); await cdp.send('Performance.enable');
    await page.goto(`/cost/experiments/semantic-cost/?reading=${reading}`);
    await expect(page.locator('html')).toHaveAttribute('data-ready', 'true');
    // Warm font/code caches and initialization before measuring retained growth.
    await page.evaluate(async () => { window.semanticCost.prepare(1, false); await window.semanticCost.mount(); window.semanticCost.dispose(); });
    // Initialize Playwright's array-selector machinery before the baseline;
    // its injected listeners are tooling, not player-owned resources.
    await page.locator('#cost-instances [data-source-id]').evaluateAll(nodes => nodes.map(node => node.getAttribute('style')));
    const baseline = await metrics(cdp);
    const cases = [];
    for (const [count, different] of [[1, false], [10, false], [10, true]] as const) {
      const prepare = await page.evaluate(({ count, different }) => window.semanticCost.prepare(count, different), { count, different });
      expect(await page.locator('#cost-instances > *').count()).toBe(0);
      const inactive = await metrics(cdp);
      const beforeResources = (await resources(page)).length;
      const mount = await page.evaluate(() => window.semanticCost.mount());
      expect(await page.locator('#cost-instances > *').count()).toBe(count);
      expect(mount.nodes).toBeLessThanOrEqual(count * budgets.domElementsPerInstance[reading]);
      const mounted = await metrics(cdp);
      const poses = () => page.locator('#cost-instances [data-source-id]').evaluateAll(nodes => nodes.map(node => node.getAttribute('style')));
      await page.evaluate(() => window.semanticCost.seek(.4)); const before = await poses();
      await page.evaluate(() => { window.semanticCost.seek(1); window.semanticCost.seek(0); window.semanticCost.seek(.4); });
      expect(await poses()).toEqual(before);
      const frame = await page.evaluate(async () => {
        const intervals: number[] = []; let previous = performance.now();
        window.semanticCost.play();
        for (let i = 0; i < 60; i++) await new Promise<void>(resolve => requestAnimationFrame(time => { intervals.push(time - previous); previous = time; resolve(); }));
        window.semanticCost.pause(); intervals.shift(); intervals.sort((a, b) => a - b);
        return { p50Ms: intervals[Math.floor(intervals.length * .5)], p95Ms: intervals[Math.floor(intervals.length * .95)] };
      });
      await page.evaluate(() => { window.semanticCost.dispose(); window.semanticCost.dispose(); });
      await expect(page.locator('#cost-instances > *')).toHaveCount(0);
      const disposed = await metrics(cdp);
      const newResourcesAfterWarmup = (await resources(page)).length - beforeResources;
      expect(newResourcesAfterWarmup).toBe(budgets.newAssetsAfterWarmup);
      cases.push({ count, different, prepare, inactive, mount, mounted, frame, disposed, newResourcesAfterWarmup });
    }
    // Repeated teardown, including during active playback, pressures listeners
    // and retained nodes rather than relying on one lucky cleanup observation.
    for (let cycle = 0; cycle < 3; cycle++) await page.evaluate(async () => {
      window.semanticCost.prepare(10, true); await window.semanticCost.mount(); window.semanticCost.play(); window.semanticCost.dispose();
    });
    const afterCycles = await metrics(cdp);
    await record(`instances-${reading}`, { reading, baseline, cases, afterCycles });
    expect(afterCycles['JSEventListeners']).toBeLessThanOrEqual(baseline['JSEventListeners']! + 3);
    expect(afterCycles['Nodes']).toBeLessThanOrEqual(baseline['Nodes']! + 20);
    expect(errors).toEqual([]);
    reports.push({ reading, baseline, cases, afterCycles }); await context.close();
  }
  await record('instances-browser', { browser: browser.version(), reports,
    note: 'Dot uses the full existing player. Rows/columns/collection use the real adapters and clock in a stage-only measurement host. All instances run concurrently, including offscreen ones. CDP heap samples follow forced GC; they are not total process memory. Frame samples are local observations, not fixed performance guarantees.' });
});
