import { expect, test } from "@playwright/test";

const route = "/tutorials/algebra/fraction-composition/";

test("the first motion passage drives only its named range and settles before its interpretation", async ({
  page
}) => {
  await page.goto(route, { waitUntil: "domcontentloaded" });
  const passage = page.locator(
    '[data-kp-algebra-motion-passage="distribute"]'
  );
  const before = passage.locator('[data-kp-algebra-motion-before="distribute"]');
  const after = passage.locator('[data-kp-algebra-motion-after="distribute"]');
  const beforeText = await before.textContent();
  const afterText = await after.textContent();
  await passage.scrollIntoViewIfNeeded();
  const host = page.locator("[data-kp-algebra-stage-host]");
  await expect(host).toHaveAttribute(
    "data-kp-algebra-runtime-animation",
    "animation.fraction-composition.two-thirds-solve"
  );
  await expect(host).toHaveAttribute("data-kp-algebra-runtime-range-count", "5");
  const player = passage.locator("[data-kp-editor-animation-player]");
  await expect(player).toHaveCount(1);
  await expect(player).toHaveAttribute("data-kp-editor-animation-hydrated", "true");
  await expect(passage.locator(
    '[data-kp-algebra-static-checkpoint="normalized"]'
  )).toBeHidden();
  await expect(player.locator(".editor-equation-stage__caption")).toBeHidden();
  await expect(host).toHaveAttribute("data-kp-algebra-runtime-range", "distribute-and-normalize");
  await expect(host).toHaveAttribute("data-kp-algebra-runtime-checkpoint", "factored");
  const control = passage.getByRole("button", { name: "Play distribution" });
  const scrubber = passage.getByRole("slider", {
    name: "Distribution animation progress"
  });
  await expect(control).toBeEnabled();
  await expect(scrubber).toHaveValue("0");

  await control.click();
  await expect(passage).toHaveAttribute("data-kp-algebra-motion-state", "playing");
  await expect(passage).toHaveAttribute("data-kp-algebra-motion-state", "settled");
  await expect(host).toHaveAttribute("data-kp-algebra-runtime-checkpoint", "normalized");
  await expect(scrubber).toHaveValue("1");
  expect(Number(await player.getAttribute(
    "data-kp-editor-animation-progress"
  ))).toBeLessThan(1);
  expect(await before.textContent()).toBe(beforeText);
  expect(await after.textContent()).toBe(afterText);
});

test("semantic links focus and pin objects without becoming timeline controls", async ({
  page
}) => {
  await page.goto(route, { waitUntil: "domcontentloaded" });
  const host = page.locator("[data-kp-algebra-stage-host]");
  await host.scrollIntoViewIfNeeded();
  await expect(host).toHaveAttribute(
    "data-kp-algebra-runtime-animation",
    "animation.fraction-composition.two-thirds-solve"
  );
  // The player is one durable runtime node whose presenter may move it into the
  // active passage; semantic focus must not depend on that presentation choice.
  const player = page.locator("[data-kp-editor-animation-player]");
  const factor = page.getByRole("link", { name: "factor", exact: true }).first();
  const before = await player.getAttribute("data-kp-editor-animation-progress");

  await factor.hover();
  await expect(host).toHaveAttribute("data-kp-algebra-semantic-focus", "solve/factor");
  await expect.poll(async () => Number(await host.getAttribute(
    "data-kp-algebra-semantic-focus-target-count"
  ))).toBeGreaterThan(0);

  await factor.focus();
  await expect(page.locator("[data-kp-algebra-fraction-composition-publication]"))
    .toHaveAttribute("data-kp-article-semantic-focus-source", "keyboard");
  await factor.click();
  await page.locator("h1").click();
  await expect(factor).toHaveAttribute("data-kp-article-semantic-pinned", "");
  await expect(page.locator("[data-kp-algebra-fraction-composition-publication]"))
    .toHaveAttribute("data-kp-article-semantic-focus-source", "url");
  expect(await player.getAttribute("data-kp-editor-animation-progress")).toBe(before);

  await page.keyboard.press("Escape");
  await expect(factor).not.toHaveAttribute("data-kp-article-semantic-pinned", "");
});

test("explicit checkpoint links seek canonical endpoints directly", async ({ page }) => {
  await page.goto(route, { waitUntil: "domcontentloaded" });
  const host = page.locator("[data-kp-algebra-stage-host]");
  await host.scrollIntoViewIfNeeded();
  await expect(host).toHaveAttribute("data-kp-algebra-runtime-checkpoint", "factored");

  const normalized = page.locator(
    '[data-kp-algebra-checkpoint-link="normalized"]'
  );
  await normalized.click();
  await expect(host).toHaveAttribute(
    "data-kp-algebra-runtime-checkpoint",
    "normalized"
  );
  await expect(normalized).toHaveAttribute("aria-current", "step");
  const progress = Number(await page.locator(
    "[data-kp-editor-animation-player]"
  ).getAttribute("data-kp-editor-animation-progress"));
  expect(progress).toBeGreaterThan(0);
  expect(progress).toBeLessThan(1);
});

test("checkpoint URLs restore directly across rewind and browser history", async ({
  page
}) => {
  await page.goto(`${route}#kp-ref:solve/normalized`, {
    waitUntil: "domcontentloaded"
  });
  const host = page.locator("[data-kp-algebra-stage-host]");
  const player = host.locator("[data-kp-editor-animation-player]");
  await expect(host).toHaveAttribute(
    "data-kp-algebra-runtime-checkpoint",
    "normalized"
  );
  await expect(host).toHaveAttribute("data-kp-algebra-direct-seek-count", "1");
  const normalizedProgress = Number(await player.getAttribute(
    "data-kp-editor-animation-progress"
  ));
  expect(normalizedProgress).toBeGreaterThan(0);
  await expect(player).not.toHaveAttribute(
    "data-kp-editor-animation-status",
    "playing"
  );

  await page.locator('[data-kp-algebra-checkpoint-link="solved"]').click();
  await expect(page).toHaveURL(/#kp-ref:solve\/solved$/u);
  await expect(host).toHaveAttribute("data-kp-algebra-runtime-checkpoint", "solved");
  await expect(host).toHaveAttribute("data-kp-algebra-direct-seek-count", "2");

  await player.focus();
  await page.keyboard.press("r");
  await expect(player).toHaveAttribute(
    "data-kp-editor-animation-direction",
    "rewind"
  );
  await expect.poll(async () => Number(await player.getAttribute(
    "data-kp-editor-animation-progress"
  ))).toBeLessThan(1);
  await player.getByRole("button", { name: "Pause animation" }).click();

  await page.goBack();
  await expect(host).toHaveAttribute(
    "data-kp-algebra-runtime-checkpoint",
    "normalized"
  );
  await expect(host).toHaveAttribute("data-kp-algebra-direct-seek-count", "3");
  expect(Number(await player.getAttribute(
    "data-kp-editor-animation-progress"
  ))).toBe(normalizedProgress);
  await expect(player).not.toHaveAttribute(
    "data-kp-editor-animation-status",
    "playing"
  );

  await page.goForward();
  await expect(host).toHaveAttribute("data-kp-algebra-runtime-checkpoint", "solved");
  await expect(host).toHaveAttribute("data-kp-algebra-direct-seek-count", "4");
  await expect(player).toHaveAttribute("data-kp-editor-animation-progress", "1");
  await expect(player).not.toHaveAttribute(
    "data-kp-editor-animation-status",
    "playing"
  );
});

test("reduced motion uses the same direct checkpoint endpoints", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(`${route}#kp-ref:solve/difference-simplified`, {
    waitUntil: "domcontentloaded"
  });
  const host = page.locator("[data-kp-algebra-stage-host]");
  const player = host.locator("[data-kp-editor-animation-player]");
  await expect(player).toHaveAttribute(
    "data-kp-editor-animation-accessibility-mode",
    "reduced-motion"
  );
  await expect(host).toHaveAttribute(
    "data-kp-algebra-runtime-checkpoint",
    "difference-simplified"
  );
  await page.locator('[data-kp-algebra-checkpoint-link="solved"]').click();
  await expect(host).toHaveAttribute("data-kp-algebra-runtime-checkpoint", "solved");
  await expect(player).toHaveAttribute("data-kp-editor-animation-progress", "1");
  await expect(player).not.toHaveAttribute(
    "data-kp-editor-animation-status",
    "playing"
  );
});

test("the local motion control settles immediately under reduced motion", async ({
  page
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(route, { waitUntil: "domcontentloaded" });
  const passage = page.locator(
    '[data-kp-algebra-motion-passage="distribute"]'
  );
  await passage.scrollIntoViewIfNeeded();
  const control = passage.getByRole("button", { name: "Play distribution" });

  await expect(control).toBeEnabled();
  await control.click();
  await expect(passage).toHaveAttribute("data-kp-algebra-motion-state", "settled");
  await expect(page.locator("[data-kp-algebra-stage-host]")).toHaveAttribute(
    "data-kp-algebra-runtime-checkpoint",
    "normalized"
  );
  await expect(passage.getByRole("slider", {
    name: "Distribution animation progress"
  })).toHaveValue("1");
});
