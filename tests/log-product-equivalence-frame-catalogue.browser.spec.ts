import { expect, test, type Locator } from "@playwright/test";

const animationId = "animation.algebra.log-product.equivalence-frame";

test("equivalence frame retains context around the canonical log transition",
  async ({ page }) => {
    const pageErrors: string[] = [];
    page.on("pageerror", (error) => pageErrors.push(error.message));
    await page.goto(`/?artifact=${animationId}`);

    const player = page.locator(
      `[data-kp-editor-animation-player]` +
      `[data-kp-editor-animation-id="${animationId}"]`
    );
    const slot = player.locator(
      '[data-kp-editor-animation-surface-slot="equation"]'
    );
    const stage = slot.locator("[data-kp-log-product-equivalence-stage]");
    const seek = player.locator('[data-action="seek-editor-animation"]');
    const source = stage.locator(
      ".kp-log-product-equivalence-stage__frozen-source"
    );
    const relation = stage.locator(
      ".kp-log-product-equivalence-stage__relation"
    );

    await expect(player).toHaveAttribute(
      "data-kp-editor-animation-pack-id", "log-product", { timeout: 15_000 }
    );
    await expect(slot).toHaveAttribute(
      "data-kp-editor-animation-adapter-id",
      "editor-animation-surface.log-product.equivalence-frame.native-katex"
    );
    await expect(stage).toHaveAttribute(
      "data-kp-log-product-equivalence-stage", "ready"
    );
    await expect(stage).toHaveAttribute(
      "data-kp-state-retention-policy", "equivalence-frame"
    );
    const sourceText = await source.textContent();
    const sourceRect = await source.boundingBox();

    await seek.fill("0");
    await expect(stage).toHaveAttribute(
      "data-kp-log-product-equivalence-progress", "0"
    );
    await expect(relation).toBeHidden();
    await expect(stage.locator(
      ".kp-log-product-stage__material-layer"
    )).toHaveCSS("visibility", "hidden");

    await seek.fill("0.5");
    await expect(stage).toHaveAttribute(
      "data-kp-log-product-equivalence-progress", "0.5"
    );
    await expect(relation).toBeVisible();
    expect(await visibleMaterialOwnerCount(stage)).toBeGreaterThan(0);
    expect(await source.textContent()).toBe(sourceText);
    expect(await source.boundingBox()).toEqual(sourceRect);

    await seek.fill("1");
    await expect(stage).toHaveAttribute(
      "data-kp-log-product-equivalence-visual-owner", "target-native"
    );
    await expect(relation).toBeVisible();
    expect(await source.textContent()).toBe(sourceText);

    await seek.fill("0");
    await expect(stage).toHaveAttribute(
      "data-kp-log-product-equivalence-visual-owner", "source-native"
    );
    await expect(relation).toBeHidden();
    expect(pageErrors).toEqual([]);
  });

test("equivalence frame keeps both expressions within a narrow viewport",
  async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 760 });
    await page.goto(`/?artifact=${animationId}&playhead=0.72`);
    const stage = page.locator(
      `[data-kp-editor-animation-id="${animationId}"] ` +
      "[data-kp-log-product-equivalence-stage]"
    );
    await expect(stage).toHaveAttribute(
      "data-kp-log-product-equivalence-stage", "ready", { timeout: 15_000 }
    );
    await expect(stage).toHaveAttribute(
      "data-kp-log-product-equivalence-progress", "0.72"
    );
    const bounds = await stage.evaluate((element) => ({
      clientWidth: element.clientWidth,
      scrollWidth: element.scrollWidth,
      clientHeight: element.clientHeight,
      scrollHeight: element.scrollHeight
    }));
    expect(bounds.scrollWidth).toBeLessThanOrEqual(bounds.clientWidth + 1);
    expect(bounds.scrollHeight).toBeLessThanOrEqual(bounds.clientHeight + 1);
  });

async function visibleMaterialOwnerCount(stage: Locator): Promise<number> {
  return stage.locator("[data-kp-equation-material-owner-id]").evaluateAll(
    (owners) => owners.filter((owner) => {
      const style = getComputedStyle(owner);
      return style.visibility !== "hidden" && Number(style.opacity) > 0;
    }).length
  );
}
