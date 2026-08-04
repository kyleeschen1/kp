import { mkdir } from "node:fs/promises";

import { expect, test, type Page } from "@playwright/test";

const route = "/tutorials/programming/lisp-function-application/";
const evidenceDirectory = "tmp/codex/s-expression-lisp-tutorial";

test("the shared shell preserves the approved reader attention cues", async ({ page }) => {
  await page.setViewportSize({ width: 1_440, height: 900 });
  await page.goto(route);
  const root = page.locator("[data-kp-lisp-function-application-tutorial]");
  const passage = root.locator(
    '[data-kp-lisp-tutorial-passage="application-before"]'
  );
  const attentionRegion = root.locator(
    '[data-kp-tutorial-attention-passage="application-before"]'
  );
  const motion = root.locator(
    '[data-kp-tutorial-motion-block="application"]'
  );

  await expect(motion).toHaveAttribute(
    "data-kp-tutorial-motion-introduction",
    "application-before"
  );
  await expect(motion).toHaveAttribute(
    "aria-describedby",
    "kp-passage-application-before"
  );
  expect(await motion.evaluate((element) =>
    element.previousElementSibling?.id
  )).toBe("kp-passage-application-before");
  const introductionGap = await motion.evaluate((element) => {
    const before = element.previousElementSibling!.getBoundingClientRect();
    return element.getBoundingClientRect().top - before.bottom;
  });
  expect(introductionGap).toBeLessThanOrEqual(24);
  await expect.poll(() => passage.locator("p").first().evaluate((element) =>
    Number.parseFloat(getComputedStyle(element).textIndent)
  )).toBeGreaterThan(0);

  await passage.evaluate((element) => window.scrollTo({
    top: window.scrollY + element.getBoundingClientRect().top -
      window.innerHeight * 0.38
  }));
  await expect(root).toHaveAttribute(
    "data-kp-lisp-tutorial-reading-passage",
    "application-before"
  );
  await expect(attentionRegion).toHaveAttribute(
    "data-kp-lisp-reading-active",
    "true"
  );
  const toc = root.locator("kp-tutorial-toc");
  await expect(toc).toHaveAttribute(
    "data-kp-tutorial-toc-active-id",
    "application"
  );

  const pointer = root.locator("[data-kp-lisp-tutorial-reading-band]");
  await expect(pointer).toHaveAttribute("data-kp-reading-band-state", "crossing");
  const cueProjection = await pointer.evaluate((element) => {
    const bounds = element.getBoundingClientRect();
    const style = getComputedStyle(element);
    const activeRegion = document.querySelector<HTMLElement>(
      '[data-kp-tutorial-attention-region][data-kp-lisp-reading-active="true"]'
    )!;
    const activeBounds = activeRegion.getBoundingClientRect();
    const cursorY = bounds.top + bounds.height / 2;
    return {
      background: style.backgroundColor,
      clipPath: style.clipPath,
      opacity: style.opacity,
      pointerEvents: style.pointerEvents,
      zIndex: Number(style.zIndex),
      width: bounds.width,
      height: bounds.height,
      right: bounds.right,
      passageLeft: activeBounds.left,
      rail: getComputedStyle(activeRegion).borderLeftColor,
      radius: getComputedStyle(activeRegion).borderTopLeftRadius,
      shadow: getComputedStyle(activeRegion).boxShadow,
      transform: getComputedStyle(activeRegion).transform,
      proseOpacities: [...document.querySelectorAll<HTMLElement>(
        ".kp-lisp-tutorial__passage"
      )].map((passage) => getComputedStyle(passage).opacity),
      cursorIsInsideActiveRegion: cursorY >= activeBounds.top &&
        cursorY <= activeBounds.bottom
    };
  });
  expect(cueProjection).toMatchObject({
    opacity: "1",
    pointerEvents: "none"
  });
  expect(cueProjection.background).toBe(cueProjection.rail);
  expect(cueProjection.radius).toBe("0px");
  expect(cueProjection.shadow).toBe("none");
  expect(cueProjection.transform).toBe("none");
  expect(new Set(cueProjection.proseOpacities)).toEqual(new Set(["1"]));
  expect(cueProjection.clipPath).toContain("polygon");
  expect(cueProjection.zIndex).toBeGreaterThan(12);
  expect(cueProjection.width).toBeGreaterThanOrEqual(16);
  expect(cueProjection.height).toBeGreaterThanOrEqual(19);
  expect(cueProjection.right).toBeLessThan(cueProjection.passageLeft);
  expect(cueProjection.cursorIsInsideActiveRegion).toBe(true);
});

test("capture the complete local Lisp tutorial checkpoint story", async ({ page }) => {
  await mkdir(evidenceDirectory, { recursive: true });
  await page.setViewportSize({ width: 1_440, height: 900 });
  for (const [name, hash, block, localProgress, runtimeProgress] of [
    ["wide-structure", "source-readable", "structure", "0.0000", "0.0000"],
    ["wide-leaf-fold", "leaf-forms-folded", "structure", "0.2708", "0.0000"],
    ["wide-binding", "parameter-bound", "application", "0.3817", "0.2824"],
    ["wide-reconstructed", "body-reconstructed", "application", "1.0000", "0.7400"],
    ["wide-evaluation", "inputs-gathered", "evaluation", "0.5000", "0.8700"],
    ["wide-result", "result-settled", "evaluation", "1.0000", "1.0000"]
  ] as const) {
    await page.goto(`${route}#kp-checkpoint-${hash}`);
    await settle(page, block, localProgress, runtimeProgress);
    const nativeBounds = await page.locator(
      '[data-kp-lisp-stage-host] [data-kp-lisp-native-code]'
    ).first().evaluate((element) => {
      const expression = element.getBoundingClientRect();
      const stage = element.closest<HTMLElement>(".kp-lisp-tutorial__stage")!
        .getBoundingClientRect();
      return {
        expressionLeft: expression.left,
        expressionRight: expression.right,
        stageLeft: stage.left,
        stageRight: stage.right
      };
    });
    expect(nativeBounds.expressionLeft).toBeGreaterThanOrEqual(nativeBounds.stageLeft);
    expect(nativeBounds.expressionRight).toBeLessThanOrEqual(nativeBounds.stageRight);
    await page.screenshot({
      path: `${evidenceDirectory}/${name}.png`,
      fullPage: false
    });
  }
});

test("capture the phone lesson with its persistent stage and native result", async ({ page }) => {
  await mkdir(evidenceDirectory, { recursive: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${route}#kp-checkpoint-result-settled`);
  await settle(page, "evaluation", "1.0000", "1.0000");
  await expect(page.locator('[data-kp-lisp-native-code="result"]')).toBeVisible();
  await page.screenshot({
    path: `${evidenceDirectory}/phone-result.png`,
    fullPage: false
  });
});

test("capture the wide phone and reduced-motion promotion contact sheet", async ({
  page
}, testInfo) => {
  await mkdir(evidenceDirectory, { recursive: true });
  const captures: { readonly label: string; readonly dataUrl: string }[] = [];
  const checkpoints = [
    ["source", "source-readable", "structure", "0.0000", "0.0000"],
    ["recursive fold", "leaf-forms-folded", "structure", "0.2708", "0.0000"],
    ["binding", "parameter-bound", "application", "0.3817", "0.2824"],
    ["reconstruction", "body-reconstructed", "application", "1.0000", "0.7400"],
    ["reduction", "inputs-gathered", "evaluation", "0.5000", "0.8700"],
    ["result", "result-settled", "evaluation", "1.0000", "1.0000"]
  ] as const;

  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.setViewportSize({ width: 1_440, height: 900 });
  for (const [label, hash, block, local, runtime] of checkpoints) {
    await capture(page, captures, `wide · ${label}`, hash, block, local, runtime);
  }

  await page.setViewportSize({ width: 390, height: 844 });
  for (const [label, hash, block, local, runtime] of [
    checkpoints[1],
    checkpoints[2],
    checkpoints[5]
  ]) {
    await capture(page, captures, `phone · ${label}`, hash, block, local, runtime);
  }

  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 1_440, height: 900 });
  for (const [label, hash, block, local, runtime] of [
    checkpoints[1],
    checkpoints[2],
    checkpoints[5]
  ]) {
    await capture(
      page,
      captures,
      `reduced motion · ${label}`,
      hash,
      block,
      local,
      runtime,
      true
    );
  }

  await page.setContent(renderContactSheet(captures));
  const path = `${evidenceDirectory}/canonical-promotion-contact-sheet.png`;
  await page.screenshot({ path, fullPage: true });
  await testInfo.attach("s-expression-material-promotion-contact-sheet", {
    path,
    contentType: "image/png"
  });
});

async function capture(
  page: Page,
  captures: { label: string; dataUrl: string }[],
  label: string,
  hash: string,
  block: string,
  localProgress: string,
  runtimeProgress: string,
  reducedMotion = false
): Promise<void> {
  await page.goto(`${route}#kp-checkpoint-${hash}`);
  await settle(page, block, localProgress, runtimeProgress);
  if (reducedMotion) {
    await expect(page.locator(
      "[data-kp-lisp-structural-stage], " +
      "[data-kp-lisp-application-stage], " +
      "[data-kp-lisp-evaluation-stage]"
    )).toHaveAttribute("data-kp-lisp-motion-mode", "reduced");
  }
  const image = await page.screenshot({ fullPage: false });
  captures.push({ label, dataUrl: `data:image/png;base64,${image.toString("base64")}` });
}

function renderContactSheet(
  captures: readonly { readonly label: string; readonly dataUrl: string }[]
): string {
  const cards = captures.map(({ label, dataUrl }) => `<figure>
    <figcaption>${escapeHtml(label)}</figcaption>
    <img src="${dataUrl}" alt="${escapeHtml(label)}">
  </figure>`).join("");
  return `<!doctype html><html><head><style>
    body { margin: 0; padding: 24px; background: #e7e1d5; color: #203b35; font: 600 14px/1.3 system-ui, sans-serif; }
    main { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 18px; }
    figure { margin: 0; padding: 10px; background: #fffdf8; border: 1px solid #cfc6b6; }
    figcaption { margin: 0 0 8px; }
    img { display: block; width: 100%; height: 260px; object-fit: contain; object-position: top center; background: #f4f0e6; }
  </style></head><body><main>${cards}</main></body></html>`;
}

function escapeHtml(value: string): string {
  return value.replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

async function settle(
  page: Page,
  block: string,
  localProgress: string,
  runtimeProgress: string
): Promise<void> {
  const root = page.locator("[data-kp-lisp-function-application-tutorial]");
  await expect(root).toHaveAttribute("data-kp-lisp-tutorial-active-motion-block", block);
  await expect(root).toHaveAttribute("data-kp-lisp-tutorial-local-progress", localProgress);
  await expect(root).toHaveAttribute("data-kp-lisp-tutorial-progress", runtimeProgress);
  await page.evaluate(async () => {
    await document.fonts.ready;
    await new Promise<void>((resolve) => {
      let stableFrames = 0;
      let previous = scrollY;
      const sample = (): void => {
        const current = scrollY;
        stableFrames = Math.abs(current - previous) < 0.5 ? stableFrames + 1 : 0;
        previous = current;
        if (stableFrames >= 5) resolve();
        else requestAnimationFrame(sample);
      };
      requestAnimationFrame(sample);
    });
  });
}
