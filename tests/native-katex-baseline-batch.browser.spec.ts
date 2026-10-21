import { expect, test } from "@playwright/test";

test("batched native baselines preserve nested, scaled and changed typography", async ({ page }) => {
  await page.goto("/experiments/kinetic-figure/supply-tax/#beat.log-exponent.locate-the-unknown");
  await expect(page.locator("[data-kp-log-exponent-focus-card] [data-kp-editor-animation-player]"))
    .toHaveAttribute("data-kp-editor-animation-surface-readiness", "ready");
  const result = await page.evaluate(async () => {
    const geometryPath = "/src/rendering/native-katex-paint-geometry.ts";
    const katexPath = "/node_modules/katex/dist/katex.mjs";
    const { measureKpNativeKatexBaselineY, measureKpNativeKatexBaselines } = await import(geometryPath);
    const { default: katex } = await import(katexPath);
    const stage = document.createElement("div");
    stage.style.cssText = "position:relative;font-size:24px;width:600px;transform-origin:top left";
    document.body.append(stage);
    const residuals: number[] = [];
    let unchanged = true;
    let count = 0;
    try {
      for (const tex of [String.raw`a^2+\frac{x_1}{y}+\sqrt{z}`, String.raw`\begin{pmatrix}1&-2\\x&3\end{pmatrix}`, String.raw`\log_b(a^x)=x\log_b(a)`]) {
        katex.render(tex, stage);
        await document.fonts.ready;
        // Include ancestors as well as leaves to pressure simultaneous nested
        // probes, scripts and line boxes; compare with independent old reads.
        const elements = [...stage.querySelectorAll<HTMLElement>(".katex-html span")];
        for (const [font, transform] of [["24px", "none"], ["31px", "scale(0.7)"], ["19px", "translateY(17px) scale(1.2)"]]) {
          stage.style.fontSize = font!;
          stage.style.transform = transform!;
          const before = stage.innerHTML;
          for (const cohort of [elements, elements.filter(element =>
            element.childElementCount === 0 && element.textContent?.trim())]) {
            const expected = cohort.map(element => measureKpNativeKatexBaselineY(stage, element));
            const actual: readonly number[] = measureKpNativeKatexBaselines(stage, cohort);
            residuals.push(...actual.map((value, index) => Math.abs(value - expected[index]!)));
            count += actual.length;
          }
          unchanged &&= before === stage.innerHTML;
        }
      }
      return { maximumResidual: Math.max(...residuals), unchanged, count };
    } finally { stage.remove(); }
  });
  expect(result.count).toBeGreaterThan(100);
  expect(result.unchanged).toBe(true);
  expect(result.maximumResidual).toBeLessThan(0.1);
});
