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
