import { expect, test } from "@playwright/test";

import { createCanonicalConceptRoomTrace } from "./fixtures/canonical-concept-room-trace.ts";

test("measured symbolic stage gates on fonts, owns its overlay, invalidates, and settles natively", async ({ page }) => {
  const trace = createCanonicalConceptRoomTrace();
  await page.goto("/concepts/mathematics/linear-equations/solve-with-balance");
  await page.evaluate(async (inputTrace) => {
    // @ts-expect-error This absolute specifier is resolved by the browser's Vite server.
    const projection = await import("/src/projections/linear-equation-symbolic.ts");
    // @ts-expect-error This absolute specifier is resolved by the browser's Vite server.
    const adapter = await import("/src/app-adapters/linear-equation-symbolic-stage.ts");
    const root = document.createElement("div");
    root.id = "symbolic-stage-fixture";
    root.style.width = "640px";
    document.body.append(root);
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

declare global {
  interface Window {
    __kpStageFixture?: {
      stage: { render(projection: unknown): Promise<void>; dispose(): void };
      trace: ReturnType<typeof createCanonicalConceptRoomTrace>;
      options: { operationWindows: Array<{ operationId: string; startPermille: number; endPermille: number }> };
    };
  }
}
