import { expect, test } from "@playwright/test";

test("font readiness exposes a stable initial gate and later invalidations", async ({ page }) => {
  await page.goto("/");
  const result = await page.evaluate(async () => {
    // @ts-expect-error Vite resolves this browser-side absolute module specifier.
    const { createKpEquationFontReadiness } = await import("/src/rendering/equation-font-readiness.ts");
    const readiness = createKpEquationFontReadiness(document);
    const reasons: string[] = [];
    const unsubscribe = readiness.subscribe((reason: string) => reasons.push(reason));
    const before = { status: readiness.status, revision: readiness.revision };
    await readiness.whenReady();
    const ready = { status: readiness.status, revision: readiness.revision };
    document.fonts.dispatchEvent(new Event("loadingdone"));
    const changed = { status: readiness.status, revision: readiness.revision };
    unsubscribe();
    readiness.dispose();
    document.fonts.dispatchEvent(new Event("loadingdone"));
    return { before, ready, changed, finalRevision: readiness.revision, reasons };
  });

  expect(["waiting", "ready"]).toContain(result.before.status);
  expect(result.ready.status).toBe("ready");
  expect(result.changed.revision).toBe(result.ready.revision + 1);
  expect(result.finalRevision).toBe(result.changed.revision);
  expect(result.reasons.at(-1)).toBe("loading-done");
});

test('scoped fonts retain unrelated preparation and invalidate current, unknown and detached consumers', async ({ page }) => {
  await page.goto('/');
  const revisions = await page.evaluate(async () => {
    // @ts-expect-error Vite resolves this browser-side absolute module specifier.
    const { createKpEquationFontReadiness } = await import('/src/rendering/equation-font-readiness.ts');
    await document.fonts.ready;
    const root = document.createElement('div');
    root.style.fontFamily = 'KP_current_probe, serif';
    root.textContent = 'Equation'; document.body.append(root);
    const readiness = createKpEquationFontReadiness(document, root);
    await readiness.whenReady();
    const initial = readiness.revision;
    const values = [initial];
    const load = (family: string) => {
      // WebKit delivers font events without exposing their constructor.
      const event = new Event('loadingdone');
      Object.defineProperty(event, 'fontfaces', { value: [new FontFace(family, 'local(Arial)')] });
      document.fonts.dispatchEvent(event);
      values.push(readiness.revision);
    };
    load('KP_unrelated_probe');
    load('KP_current_probe');
    root.style.fontFamily = 'KP_replaced_probe, serif';
    load('KP_current_probe');
    load('KP_replaced_probe');
    document.fonts.dispatchEvent(new Event('loadingdone')); values.push(readiness.revision);
    root.remove(); load('KP_unrelated_probe');
    readiness.dispose(); load('KP_replaced_probe');
    return values.map(value => value - initial);
  });
  expect(revisions).toEqual([0, 0, 1, 1, 2, 3, 4, 4]);
});
