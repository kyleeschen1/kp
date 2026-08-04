import { expect, test } from "@playwright/test";

const route = "/tutorials/programming/lisp-function-application/";

test("phone projection keeps stage code controls and reading width usable", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${route}#kp-checkpoint-result-settled`);
  const root = page.locator("[data-kp-lisp-function-application-tutorial]");
  await expect(root).toHaveAttribute("data-kp-lisp-tutorial-progress", "1.0000");
  await expect(root.locator('[data-kp-lisp-native-code="result"]')).toBeVisible();
  await expect(root.locator("kp-tutorial-scrub-bar")).toHaveCount(3);
  const geometry = await root.evaluate((element) => {
    const stage = element.querySelector<HTMLElement>(".kp-lisp-tutorial__stage")!;
    const rect = stage.getBoundingClientRect();
    return {
      documentWidth: document.documentElement.scrollWidth,
      viewportWidth: window.innerWidth,
      stageLeft: rect.left,
      stageRight: rect.right,
      stageHeight: rect.height,
      stagePosition: getComputedStyle(stage).position
    };
  });
  expect(geometry.documentWidth).toBeLessThanOrEqual(geometry.viewportWidth);
  expect(geometry.stageLeft).toBeGreaterThanOrEqual(0);
  expect(geometry.stageRight).toBeLessThanOrEqual(geometry.viewportWidth);
  expect(geometry.stageHeight).toBeLessThanOrEqual(844 * 0.44 + 1);
  expect(geometry.stagePosition).toBe("sticky");
});

test("reduced motion disables scroll seeking but retains manual semantic steps", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(route);
  const root = page.locator("[data-kp-lisp-function-application-tutorial]");
  await expect(root).toHaveAttribute("data-kp-lisp-tutorial-scroll-timeline", "reduced-motion");
  const scrub = root.locator('[data-kp-tutorial-motion-controls="structure"]');
  await scrub.evaluate((element) => {
    window.dispatchEvent(new WheelEvent("wheel", { deltaY: 1 }));
    document.documentElement.style.scrollBehavior = "auto";
    window.scrollTo(0, window.scrollY + element.getBoundingClientRect().top - window.innerHeight * 0.38);
  });
  await page.waitForTimeout(120);
  await expect(root).toHaveAttribute("data-kp-lisp-tutorial-local-progress", "0.0000");
  await expect(scrub).toHaveAttribute("data-kp-tutorial-scrub-reduced-motion", "true");
  await expect(scrub).toHaveAttribute(
    "aria-label",
    "Animation timeline. Automatic scroll motion is disabled."
  );
  await scrub.getByRole("link", { name: "Next semantic checkpoint" }).click();
  await expect(root).toHaveAttribute("data-kp-lisp-tutorial-local-progress", "0.2708");
  await expect(root.locator("[data-kp-lisp-structural-stage]"))
    .toHaveAttribute("data-kp-lisp-motion-mode", "reduced");
  await expect(root.locator("[data-kp-lisp-structural-stage]"))
    .toHaveAttribute("data-kp-lisp-checkpoint", "leaf-forms-folded");

  await page.goto(`${route}#kp-checkpoint-parameter-bound`);
  await expect(root.locator("[data-kp-lisp-application-stage]"))
    .toHaveAttribute("data-kp-lisp-motion-mode", "reduced");
  await expect(root.locator("[data-kp-lisp-transient-guides]")).toHaveCount(0);
  await expect(root.locator("[data-kp-lisp-binding-box]")).toHaveCount(2);
});

test("high contrast keeps the undimmed stage and system passage emphasis", async ({ page }) => {
  await page.emulateMedia({ forcedColors: "active" });
  await page.goto(route);
  const root = page.locator("[data-kp-lisp-function-application-tutorial]");
  await expect(root).toHaveAttribute("data-kp-lisp-tutorial-progress", "0.0000");
  await expect(root).toHaveAttribute(
    "data-kp-lisp-tutorial-scroll-coordinator",
    "connected"
  );
  const attentionRegion = root.locator(
    '[data-kp-tutorial-attention-passage="structure-before"]'
  );
  await attentionRegion.evaluate((element) => {
    document.documentElement.style.scrollBehavior = "auto";
    window.dispatchEvent(new WheelEvent("wheel", { deltaY: 1 }));
    window.scrollTo({
      top: window.scrollY + element.getBoundingClientRect().top -
        window.innerHeight * 0.38 + 2
    });
  });
  await expect(attentionRegion).toHaveAttribute(
    "data-kp-lisp-reading-active",
    "true"
  );
  const projection = await root.evaluate((element) => {
    const stageNode = element.querySelector<HTMLElement>(
      "[data-kp-lisp-material-id]"
    )!;
    const passage = element.querySelector<HTMLElement>(
      '[data-kp-tutorial-attention-region][data-kp-lisp-reading-active="true"]'
    )!;
    return {
      stageFilter: getComputedStyle(stageNode).filter,
      passageShadow: getComputedStyle(passage).boxShadow,
      passageOutline: getComputedStyle(passage).outlineStyle
    };
  });
  expect(projection.stageFilter).toBe("none");
  expect(projection.passageShadow).toBe("none");
  expect(projection.passageOutline).not.toBe("none");
});

test("screen-reader projection exposes one current native form plus a live description", async ({ page }) => {
  await page.goto(route);
  const root = page.locator("[data-kp-lisp-function-application-tutorial]");
  await expect(root.locator("[data-kp-lisp-native-code]"))
    .toHaveCount(1);
  await expect(root.locator('[data-kp-lisp-accessible-state][role="status"]'))
    .toContainText("complete Lisp expression");
  await page.goto(`${route}#kp-checkpoint-result-settled`);
  await expect(root.locator('[data-kp-lisp-native-code="result"]'))
    .toHaveText("5");
  await expect(root.locator('[data-kp-lisp-accessible-state][role="status"]'))
    .toContainText("result 5");
});

test("keyboard checkpoint commands update one block and its live description", async ({ page }) => {
  await page.goto(`${route}#kp-block-application`);
  const root = page.locator("[data-kp-lisp-function-application-tutorial]");
  await expect(root).toHaveAttribute(
    "data-kp-lisp-tutorial-scroll-coordinator",
    "connected"
  );
  await expect(root).toHaveAttribute(
    "data-kp-lisp-tutorial-active-motion-block",
    "application"
  );
  await page.keyboard.press("Alt+ArrowRight");
  await expect(root).toHaveAttribute("data-kp-lisp-tutorial-local-progress", "0.3817");
  await expect(root.locator('[data-kp-lisp-accessible-state][role="status"]'))
    .not.toBeEmpty();
  await page.keyboard.press("Alt+ArrowLeft");
  await expect(root).toHaveAttribute("data-kp-lisp-tutorial-local-progress", "0.0000");
});

test("the public route remains readable and navigable with JavaScript disabled", async ({ browser }) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    viewport: { width: 820, height: 700 }
  });
  const page = await context.newPage();
  try {
    await page.goto(route);
    await expect(page.locator('[data-kp-lisp-tutorial-projection="static"]'))
      .toBeVisible();
    await expect(page.locator("h3")).toHaveCount(4);
    await expect(page.locator("kp-tutorial-toc")).toHaveAttribute(
      "data-kp-tutorial-toc-enhancement",
      "pending"
    );
    const scrub = page.locator("kp-tutorial-scrub-bar").first();
    await expect(scrub).toHaveAttribute("data-kp-tutorial-scrub-enhancement", "pending");
    await expect(scrub.getByRole("button", { name: "Play" })).toBeDisabled();
    await expect(scrub.getByRole("slider", { name: "Scrub animation progress" }))
      .toBeDisabled();
    await expect(scrub.getByRole("link", { name: "Next semantic checkpoint" }))
      .toHaveAttribute(
        "href",
        "/tutorials/programming/lisp-function-application/#kp-checkpoint-leaf-forms-folded"
      );
    await expect(page.locator('[data-kp-lisp-native-code="application"]')).toContainText("lambda");
    await expect(page.locator("[data-kp-lisp-botanical-stage]")).toHaveCount(0);
  } finally {
    await context.close();
  }
});
