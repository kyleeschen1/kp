import { expect, test } from "@playwright/test";

import { createCanonicalConceptRoomTrace } from "./fixtures/canonical-concept-room-trace.ts";

test("measured symbolic stage gates on fonts, owns its overlay, invalidates, and settles natively", async ({ page }) => {
  const trace = createCanonicalConceptRoomTrace();
  await page.goto("/concepts/mathematics/linear-equations/solve-with-balance");
  await expect(page.locator('[data-kp-concept-id="mathematics.linear-equations.solve-with-balance"]')).toHaveCount(1);
  await page.evaluate(async (inputTrace) => {
    // @ts-expect-error This absolute specifier is resolved by the browser's Vite server.
    const projection = await import("/src/projections/linear-equation-symbolic.ts");
    // @ts-expect-error This absolute specifier is resolved by the browser's Vite server.
    const adapter = await import("/src/app-adapters/linear-equation-symbolic-stage.ts");
    const root = document.createElement("div");
    root.id = "symbolic-stage-fixture";
    root.style.width = "640px";
    const host = document.createElement("div");
    host.dataset["kpConceptId"] = "mathematics.linear-equations.solve-with-balance";
    host.append(root);
    document.body.append(host);
    const stage = adapter.createLinearEquationSymbolicStage(root);
    const options = { operationWindows: [
      { operationId: inputTrace.operations[0]!.id, startPermille: 0, endPermille: 400 },
      { operationId: inputTrace.operations[1]!.id, startPermille: 400, endPermille: 750 }
    ] };
    await stage.render(projection.projectLinearEquationTrace(inputTrace, 200, options));
    (window as typeof window & { __kpStageFixture?: { stage: typeof stage; trace: typeof inputTrace; options: typeof options } })
      .__kpStageFixture = { stage, trace: inputTrace, options };
  }, trace);
  const root = page.locator("#symbolic-stage-fixture");
  const stage = root.locator("[data-kp-symbolic-motion-stage]");
  await expect(stage).toHaveAttribute("data-kp-symbolic-measurement-state", "ready");
  await expect(stage.locator('[data-kp-symbolic-stage-layer="overlay"]')).toHaveCount(1);
  await expect(stage).toHaveAttribute("data-kp-symbolic-measurement-count", /[1-9]/);

  await root.evaluate((element) => { (element as HTMLElement).style.width = "520px"; });
  await expect(root).toHaveAttribute("data-kp-symbolic-measurement-state", "invalidated");
  await page.evaluate(async () => {
    const fixture = window.__kpStageFixture!;
    // @ts-expect-error This absolute specifier is resolved by the browser's Vite server.
    const projection = await import("/src/projections/linear-equation-symbolic.ts");
    await fixture.stage.render(projection.projectLinearEquationTrace(fixture.trace, 400, fixture.options));
  });
  await expect(root).toHaveAttribute("data-kp-symbolic-motion-state", "target");
  await expect(root.locator("[data-kp-symbolic-motion-stage]")).toHaveCount(0);
  await expect(root.locator("[data-kp-symbolic-equation]")).toHaveAttribute("data-kp-frame-id", "frame.step.1");
});

test("subtract-both-sides uses paired introduction, cancellation, and causal result tokens", async ({ page }) => {
  const trace = createCanonicalConceptRoomTrace();
  await page.goto("/concepts/mathematics/linear-equations/solve-with-balance");
  await expect(page.locator('[data-kp-concept-id="mathematics.linear-equations.solve-with-balance"]')).toHaveCount(1);
  await page.evaluate(async (inputTrace) => {
    // @ts-expect-error This absolute specifier is resolved by the browser's Vite server.
    const projection = await import("/src/projections/linear-equation-symbolic.ts");
    // @ts-expect-error This absolute specifier is resolved by the browser's Vite server.
    const adapter = await import("/src/app-adapters/linear-equation-symbolic-stage.ts");
    const root = document.createElement("div");
    root.id = "subtract-stage-fixture";
    root.style.width = "640px";
    root.style.maxWidth = "100%";
    const host = document.createElement("div");
    host.dataset["kpConceptId"] = "mathematics.linear-equations.solve-with-balance";
    host.append(root);
    document.body.append(host);
    const stage = adapter.createLinearEquationSymbolicStage(root);
    const options = { operationWindows: [
      { operationId: inputTrace.operations[0]!.id, startPermille: 0, endPermille: 400 },
      { operationId: inputTrace.operations[1]!.id, startPermille: 400, endPermille: 750 }
    ] };
    const render = async (progress: number) => {
      await stage.render(projection.projectLinearEquationTrace(inputTrace, progress, options));
    };
    await render(40);
    (window as typeof window & { __kpSubtractFixture?: { render(progress: number): Promise<void> } })
      .__kpSubtractFixture = { render };
  }, trace);

  const root = page.locator("#subtract-stage-fixture");
  await expect(root.locator('[data-kp-symbolic-choreography="subtract-both-sides"]')).toHaveCount(1);
  await expect(root.locator('[data-kp-symbolic-motion-role="paired-operation-introduction"]')).toHaveCount(4);
  await expect(root.locator('[data-kp-symbolic-layer-opacity-mode="token-owned"]')).toHaveCount(2);

  await page.evaluate(() => window.__kpSubtractFixture!.render(200));
  await expect(root.locator('[data-kp-symbolic-motion-role="meet-and-collapse"]')).toHaveCount(4);
  await expect(root.locator('[data-kp-symbolic-motion-role="causal-derivation-input"]')).toHaveCount(3);
  await expect(root.locator('[data-kp-symbolic-motion-role="causal-derivation-result"]')).toHaveCount(1);
  await expect(root.locator('[data-kp-symbolic-motion-role="persistent-material"]')).toHaveCount(2);
  const layers = await root.locator('[data-kp-symbolic-layer-opacity-mode="token-owned"]').evaluateAll((elements) =>
    elements.map((element) => (element as HTMLElement).style.opacity)
  );
  expect(layers).toEqual(["1", "1"]);
  expect(await root.evaluate((element) => {
    const rootBox = element.getBoundingClientRect();
    return [...element.querySelectorAll<HTMLElement>('[data-kp-symbolic-stage-layer="overlay"] [data-kp-symbolic-token]')]
      .filter((token) => Number(getComputedStyle(token).opacity) > 0.01)
      .every((token) => {
        const box = token.getBoundingClientRect();
        return box.left >= rootBox.left - 1 && box.right <= rootBox.right + 1;
      });
  })).toBe(true);

  await page.evaluate(() => window.__kpSubtractFixture!.render(350));
  const resultOpacity = await root.locator('[data-kp-symbolic-motion-role="causal-derivation-result"]').evaluate((element) =>
    Number((element as HTMLElement).style.opacity)
  );
  expect(resultOpacity).toBeGreaterThan(0.98);

  await page.evaluate(() => window.__kpSubtractFixture!.render(40));
  await expect(root.locator('[data-kp-symbolic-motion-role="paired-operation-introduction"]')).toHaveCount(4);
  await expect(root.locator('[data-kp-symbolic-motion-role="causal-derivation-result"]')).toHaveCount(0);

  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.evaluate(() => window.__kpSubtractFixture!.render(200));
  await expect(root.locator("[data-kp-symbolic-motion-stage]")).toHaveCount(0);
  await expect(root).toHaveAttribute("data-kp-symbolic-motion-state", "native-reduced-motion");
});

declare global {
  interface Window {
    __kpStageFixture?: {
      stage: { render(projection: unknown): Promise<void>; dispose(): void };
      trace: ReturnType<typeof createCanonicalConceptRoomTrace>;
      options: { operationWindows: Array<{ operationId: string; startPermille: number; endPermille: number }> };
    };
    __kpSubtractFixture?: { render(progress: number): Promise<void> };
  }
}
