import { expect, test } from "@playwright/test";

const route = "/tutorials/algebra/fraction-composition/";

test("algebra article lazily mounts one canonical player and advances it", async ({
  page
}) => {
  await page.goto(route, { waitUntil: "domcontentloaded" });
  const host = page.locator("[data-kp-algebra-stage-host]");
  await host.scrollIntoViewIfNeeded();
  await expect(host).toHaveAttribute(
    "data-kp-algebra-runtime-animation",
    "animation.fraction-composition.two-thirds-solve"
  );
  await expect(host).toHaveAttribute("data-kp-algebra-runtime-range-count", "5");
  const player = host.locator("[data-kp-editor-animation-player]");
  await expect(player).toHaveCount(1);
  await expect(player).toHaveAttribute("data-kp-editor-animation-hydrated", "true");
  await expect(host.locator("[data-kp-algebra-stage-fallback]")).toBeHidden();

  const before = Number(await player.getAttribute(
    "data-kp-editor-animation-progress"
  ));
  await player.getByRole("button", { name: "Play animation" }).click();
  await expect.poll(async () => Number(await player.getAttribute(
    "data-kp-editor-animation-progress"
  ))).toBeGreaterThan(before);
  await player.getByRole("button", { name: "Pause animation" }).click();
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
  const player = host.locator("[data-kp-editor-animation-player]");
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
  const progress = Number(await host.locator(
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
