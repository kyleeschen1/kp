import { readFile } from "node:fs/promises";

import { expect, test } from "@playwright/test";

import { createKpLispBotanicalPresentationPlan } from "../src/animation/lisp-botanical-presentation-plan.ts";
import { sampleKpLispLambdaApplicationRuntimeFrame } from "../src/animation/lisp-lambda-application-runtime-frame.ts";
import {
  kpLispBotanicalStageCss,
  renderKpLispBotanicalStageHtml
} from "../src/rendering/lisp-botanical-stage-html.ts";
import { createKpLispLambdaApplicationAsset } from "../src/semantic/lisp-lambda-application-asset.ts";
import { compileKpLispFunctionApplicationPublication } from "../src/tutorial/lisp-function-application/lisp-function-application-publication.ts";
import { renderKpLispFunctionApplicationStaticPublication } from "../src/tutorial/lisp-function-application/lisp-function-application-static-publication.ts";

const route = "/tutorials/programming/lisp-function-application/";

test("phone projection keeps stage code controls and reading width usable", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${route}#kp-checkpoint-result-settled`);
  const root = page.locator("[data-kp-lisp-function-application-tutorial]");
  await expect(root).toHaveAttribute("data-kp-lisp-tutorial-progress", "1.0000");
  await expect(root.locator('[data-kp-lisp-native-code="result"]')).toBeVisible();
  await expect(root.locator("kp-tutorial-scrub-bar")).toHaveCount(2);
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
  const scrub = root.locator('[data-kp-tutorial-motion-controls="bind-and-reconstruct"]');
  await scrub.evaluate((element) => {
    window.dispatchEvent(new WheelEvent("wheel", { deltaY: 1 }));
    document.documentElement.style.scrollBehavior = "auto";
    window.scrollTo(0, window.scrollY + element.getBoundingClientRect().top - window.innerHeight * 0.38);
  });
  await page.waitForTimeout(120);
  await expect(root).toHaveAttribute("data-kp-lisp-tutorial-progress", "0.0000");
  await expect(scrub).toHaveAttribute("data-kp-tutorial-scrub-reduced-motion", "true");
  await expect(scrub).toHaveAttribute(
    "aria-label",
    "Animation timeline. Automatic scroll motion is disabled."
  );
  await scrub.getByRole("link", { name: "Next semantic checkpoint" }).click();
  await expect(root).toHaveAttribute("data-kp-lisp-tutorial-progress", "0.3404");
  await expect(root.locator("[data-kp-lisp-botanical-stage]"))
    .toHaveAttribute("data-kp-lisp-botanical-mode", "reduced");
});

test("high contrast replaces attenuation and shadows with system emphasis", async ({ page }) => {
  await page.emulateMedia({ forcedColors: "active" });
  await page.goto(route);
  const root = page.locator("[data-kp-lisp-function-application-tutorial]");
  await expect(root).toHaveAttribute("data-kp-lisp-tutorial-progress", "0.0000");
  const attentionRegion = root.locator(
    '[data-kp-tutorial-attention-passage="expression-as-structure"]'
  );
  await attentionRegion.evaluate((element) => window.scrollTo({
    top: window.scrollY + element.getBoundingClientRect().top -
      window.innerHeight * 0.38
  }));
  await expect(attentionRegion).toHaveAttribute(
    "data-kp-lisp-reading-active",
    "true"
  );
  const projection = await root.evaluate((element) => {
    const target = element.querySelector<HTMLElement>('[data-kp-lisp-salience="target"]')!;
    const passage = element.querySelector<HTMLElement>(
      '[data-kp-tutorial-attention-region][data-kp-lisp-reading-active="true"]'
    )!;
    return {
      targetFilter: getComputedStyle(target).filter,
      passageShadow: getComputedStyle(passage).boxShadow,
      passageOutline: getComputedStyle(passage).outlineStyle
    };
  });
  expect(projection.targetFilter).toBe("none");
  expect(projection.passageShadow).toBe("none");
  expect(projection.passageOutline).not.toBe("none");
});

test("screen-reader projection exposes one current native form plus a live description", async ({ page }) => {
  await page.goto(route);
  const root = page.locator("[data-kp-lisp-function-application-tutorial]");
  await expect(root.locator('[data-kp-lisp-current="true"][aria-hidden="false"]'))
    .toHaveCount(1);
  await expect(root.locator('[data-kp-lisp-accessible-state][role="status"]'))
    .toContainText("applied to four");
  await page.goto(`${route}#kp-checkpoint-result-settled`);
  await expect(root.locator('[data-kp-lisp-current="true"][aria-hidden="false"] code'))
    .toHaveText("5");
  await expect(root.locator('[data-kp-lisp-accessible-state][role="status"]'))
    .toContainText("settled as the native Lisp result five");
});

test("static publication remains readable and navigable with JavaScript disabled", async ({ browser }) => {
  const markdown = await readFile(
    "content/lessons/programming-lisp-function-application.md",
    "utf8"
  );
  const asset = createKpLispLambdaApplicationAsset();
  const publication = compileKpLispFunctionApplicationPublication(markdown);
  const stageHtml = renderKpLispBotanicalStageHtml({
    frame: sampleKpLispLambdaApplicationRuntimeFrame({ asset, progress: 0 }),
    plan: createKpLispBotanicalPresentationPlan(asset)
  });
  const staticHtml = renderKpLispFunctionApplicationStaticPublication({
    publication,
    stageHtml,
    animationId: asset.id
  });
  const context = await browser.newContext({
    javaScriptEnabled: false,
    viewport: { width: 820, height: 700 }
  });
  const page = await context.newPage();
  try {
    await page.setContent(`<!doctype html><html><head>
      <link rel="stylesheet" href="http://127.0.0.1:4173/src/tutorial/kp-tutorial-scrub-bar.css">
      <link rel="stylesheet" href="http://127.0.0.1:4173/src/tutorial/lisp-function-application/lisp-function-application-tutorial.css">
      <style>${kpLispBotanicalStageCss}.kp-lisp-tutorial__layout{display:block;width:760px;padding:1rem}.kp-lisp-tutorial__toc,.kp-lisp-tutorial__stage{position:static;transform:none}</style>
    </head><body>${staticHtml}</body></html>`);
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
        "/tutorials/programming/lisp-function-application/#kp-checkpoint-binding-established"
      );
    await expect(page.locator('[data-kp-lisp-native-code="application"]')).toContainText("lambda");
  } finally {
    await context.close();
  }
});
