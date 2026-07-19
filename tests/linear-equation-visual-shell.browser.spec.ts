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

test("global scrolling replaces checkpoint state without creating an internal rail", async ({ page }) => {
  await page.goto(conceptPath);
  const shell = page.locator("[data-kp-concept-room-shell]");
  const rail = shell.locator("[data-kp-concept-copy-rail]");
  await expect(rail).toHaveCSS("overflow-y", "visible");
  const historyLength = await page.evaluate(() => window.history.length);

  await page.locator('[data-kp-concept-explanation="subtract-three"]').evaluate((section) => {
    section.scrollIntoView({ block: "center" });
  });
  await expect(shell).toHaveAttribute("data-kp-concept-checkpoint", "subtract-three");
  await expect(page).toHaveURL(/checkpoint=subtract-three/);
  expect(await page.evaluate(() => window.history.length)).toBe(historyLength);
});

test("explicit checkpoint navigation pushes and direct URLs restore their section", async ({ page }) => {
  await page.goto(conceptPath);
  const divideLink = page.locator('[data-kp-concept-checkpoints] [data-kp-concept-checkpoint-link="divide-two"]');
  const directUrl = await divideLink.getAttribute("href");
  expect(directUrl).not.toBeNull();

  await divideLink.click();
  await expect(page.locator("[data-kp-concept-room-shell]"))
    .toHaveAttribute("data-kp-concept-checkpoint", "divide-two");
  await page.goBack();
  await expect(page.locator("[data-kp-concept-room-shell]"))
    .toHaveAttribute("data-kp-concept-checkpoint", "start");

  await page.goto(directUrl!);
  const divideSection = page.locator('[data-kp-concept-explanation="divide-two"]');
  await expect(divideSection).toHaveAttribute("aria-current", "step");
  await expect.poll(async () => divideSection.evaluate((section) => {
    const box = section.getBoundingClientRect();
    return box.top < window.innerHeight && box.bottom > 0;
  })).toBe(true);
});

test("reduced motion jumps between sections and disposal disconnects observation", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.addInitScript(() => {
    const browserWindow = window as typeof window & {
      __kpScrollBehavior?: ScrollBehavior;
      __kpObserverDisconnects?: number;
    };
    const scrollIntoView = Element.prototype.scrollIntoView;
    Element.prototype.scrollIntoView = function (options?: boolean | ScrollIntoViewOptions) {
      if (typeof options === "object" && options.behavior !== undefined) {
        browserWindow.__kpScrollBehavior = options.behavior;
      }
      return scrollIntoView.call(this, options);
    };
    const disconnect = IntersectionObserver.prototype.disconnect;
    IntersectionObserver.prototype.disconnect = function () {
      browserWindow.__kpObserverDisconnects = (browserWindow.__kpObserverDisconnects ?? 0) + 1;
      return disconnect.call(this);
    };
  });
  await page.goto(conceptPath);
  await page.locator('[data-kp-concept-checkpoints] [data-kp-concept-checkpoint-link="divide-two"]').click();
  await expect.poll(() => page.evaluate(() => (
    window as typeof window & { __kpScrollBehavior?: ScrollBehavior }
  ).__kpScrollBehavior)).toBe("auto");
  const beforeDispose = await page.evaluate(() => (
    window as typeof window & { __kpObserverDisconnects?: number }
  ).__kpObserverDisconnects ?? 0);
  await page.evaluate(() => window.dispatchEvent(new Event("pagehide")));
  await expect.poll(() => page.evaluate(() => (
    window as typeof window & { __kpObserverDisconnects?: number }
  ).__kpObserverDisconnects ?? 0)).toBeGreaterThan(beforeDispose);
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
