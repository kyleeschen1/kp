import { test, expect, type Page, type CDPSession } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
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

test('canonical production pages: cold/warm transfers, fonts and readiness', async ({ browser }) => {
  const reports = [];
  for (const [route, root] of [['dot-product-passage', '#dot-player'], ['matrix-column-product', '#matrix-player'], ['matrix-column-combinations', '#comb-player'], ['matrix-examples', '#dot-player'], ['matrix-column-combinations/?example=composition', '#comb-player']]) {
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
  for (const reading of ['dot', 'rows', 'columns'] as const) {
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
    note: 'Dot uses the full existing player. Rows/columns use the real adapters and clock in a stage-only measurement host. All instances run concurrently, including offscreen ones. CDP heap samples follow forced GC; they are not total process memory. Frame samples are local observations, not fixed performance guarantees.' });
});
