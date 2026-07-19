import { expect, test } from "@playwright/test";

const conceptPath = "/concepts/mathematics/linear-equations/solve-with-balance";

test("linear equation room mounts one themed stage and explanation rail", async ({ page }) => {
  await page.goto(conceptPath);
  const shell = page.locator("[data-kp-concept-room-shell]");
  await expect(shell).toHaveAttribute(
    "data-kp-theme",
    "kp.concept-room.linear-equation-exemplar.v1"
  );
  await expect(page.locator("[data-kp-linear-equation-exemplar-style]"))
    .toHaveCount(1);
  await expect(shell.locator("[data-kp-concept-room-stage]"))
    .toHaveCSS("display", "grid");
  await expect(shell.locator("[data-kp-concept-visual-field]"))
    .toHaveCount(1);
  await expect(shell.locator("[data-kp-concept-copy-rail]"))
    .toHaveCount(1);
  await expect(shell.locator("[data-kp-concept-controls]"))
    .toHaveCount(1);
  await expect(shell.getByRole("heading", { level: 1 }))
    .toHaveText("Solve a linear equation");
  await expect(shell.locator("[data-kp-symbolic-equation] .katex").first())
    .toBeVisible();
  await expect(shell.locator("[data-kp-concept-checkpoint-sections] > section"))
    .toHaveCount(4);
  await expect(shell.locator('[data-kp-concept-semantic-link="operation.subtract-three"]'))
    .toHaveText("Subtract 3 from both sides");
  await expect(shell.locator('[data-kp-concept-explanation="start"]'))
    .toHaveAttribute("aria-current", "step");
});

test("all checkpoint prose remains browser-findable and canonically linked", async ({ page }) => {
  await page.goto(conceptPath);
  const shell = page.locator("[data-kp-concept-room-shell]");
  await expect(shell).toContainText("Whatever changes on one side");
  await expect(shell).toContainText("The +3 and -3 cancel");
  await expect(shell).toContainText("Two copies of x become one");
  await expect(shell).toContainText("Substitution confirms");
  const semanticLink = shell.locator('[data-kp-concept-semantic-link="operation.divide-two"]');
  await expect(semanticLink).toHaveAttribute("href", /checkpoint=divide-two/);
  await expect(semanticLink).toHaveAttribute("href", /focus=operation\.divide-two/);
});

test("route-local exemplar styling does not leak into the legacy root", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("[data-kp-concept-room-shell]"))
    .toHaveCount(0);
  await expect(page.locator("[data-kp-linear-equation-exemplar-style]"))
    .toHaveCount(0);
  await expect(page.locator("[data-kp-editor-animation-player]"))
    .toBeVisible();
});
