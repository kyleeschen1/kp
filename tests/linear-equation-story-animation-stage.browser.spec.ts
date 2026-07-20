import { expect, test } from "@playwright/test";

const conceptPath = "/concepts/mathematics/linear-equations/solve-with-balance";

test("symbolic story stage reuses the canonical continuity player without editor controls", async ({
  page
}) => {
  await page.goto(conceptPath);
  const result = await page.evaluate(async () => {
    // @ts-expect-error This absolute specifier is resolved by the browser's Vite server.
    const module = await import("/src/app-adapters/linear-equation-story-animation-stage.ts");
    const host = document.createElement("section");
    host.dataset["kpStoryAdapterProbe"] = "true";
    document.body.append(host);
    const stage = await module.createLinearEquationStoryAnimationStage(host);
    stage.setProgress(0.25);
    return {
      animationId: stage.animationId,
      progress: stage.getProgress(),
      playerId: stage.player.dataset["kpEditorAnimationId"],
      recipe: (stage.player.querySelector(
        "[data-kp-editor-equation-transition-id]"
      ) as HTMLElement | null)?.dataset["kpEditorEquationPresentationRecipe"]
    };
  });

  expect(result).toEqual({
    animationId: "animation.linear-solve.solve-x",
    progress: 0.25,
    playerId: "animation.linear-solve.solve-x",
    recipe: "continuity-v1"
  });
  const host = page.locator("[data-kp-story-adapter-probe]");
  await expect(host.locator("[data-kp-editor-animation-surface-slot=equation]"))
    .toHaveAttribute(
      "data-kp-editor-animation-adapter-id",
      "editor-animation-surface.equation.katex"
    );
  await expect(host.locator(".editor-animation-player__controls")).toBeHidden();
  await expect(host.locator(".katex").first()).toBeAttached();
});
