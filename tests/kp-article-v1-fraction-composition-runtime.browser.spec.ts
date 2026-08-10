import { expect, test } from "@playwright/test";

const route = "/tutorials/algebra/fraction-composition/";

test("algebra article keeps its complete static projection during canonical-host recovery", async ({
  page
}) => {
  await page.goto(route, { waitUntil: "domcontentloaded" });
  const host = page.locator("[data-kp-algebra-stage-host]");
  await host.scrollIntoViewIfNeeded();

  await expect(page.locator("[data-kp-editor-animation-player]")).toHaveCount(0);
  await expect(page.locator("[data-kp-algebra-runtime-stage]")).toHaveCount(0);
  await expect(host.locator("[data-kp-algebra-stage-fallback]")).toBeVisible();
  await expect(page.locator(
    "[data-kp-algebra-fraction-composition-publication] svg[role='img']"
  )).toHaveCount(6);
});

test("semantic links remain searchable and pinnable without becoming timeline controls", async ({
  page
}) => {
  await page.goto(route, { waitUntil: "domcontentloaded" });
  const publication = page.locator(
    "[data-kp-algebra-fraction-composition-publication]"
  );
  const factor = page.getByRole("link", { name: "factor", exact: true }).first();

  await factor.hover();
  await expect(publication).toHaveAttribute(
    "data-kp-article-semantic-focus-source",
    "pointer"
  );
  await factor.click();
  await page.locator("h1").click();
  await expect(factor).toHaveAttribute("data-kp-article-semantic-pinned", "");
  await expect(publication).toHaveAttribute(
    "data-kp-article-semantic-focus-source",
    "url"
  );
  await expect(page.locator("[data-kp-editor-animation-player]")).toHaveCount(0);

  await page.keyboard.press("Escape");
  await expect(factor).not.toHaveAttribute("data-kp-article-semantic-pinned", "");
});

test("checkpoint URLs restore static navigation directly across browser history", async ({
  page
}) => {
  await page.goto(`${route}#kp-ref:solve/normalized`, {
    waitUntil: "domcontentloaded"
  });
  const host = page.locator("[data-kp-algebra-stage-host]");
  const normalized = page.locator(
    '[data-kp-algebra-checkpoint-link="normalized"]'
  );
  await expect(host).toHaveAttribute("data-kp-algebra-static-checkpoint", "normalized");
  await expect(normalized).toHaveAttribute("aria-current", "step");

  await page.locator('[data-kp-algebra-checkpoint-link="solved"]').click();
  await expect(page).toHaveURL(/#kp-ref:solve\/solved$/u);
  await expect(host).toHaveAttribute("data-kp-algebra-static-checkpoint", "solved");
  await page.goBack();
  await expect(host).toHaveAttribute("data-kp-algebra-static-checkpoint", "normalized");
  await page.goForward();
  await expect(host).toHaveAttribute("data-kp-algebra-static-checkpoint", "solved");
  await expect(page.locator("[data-kp-editor-animation-player]")).toHaveCount(0);
});

test("reduced motion preserves the same static checkpoint endpoint", async ({
  page
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(`${route}#kp-ref:solve/difference-simplified`, {
    waitUntil: "domcontentloaded"
  });
  await expect(page.locator("[data-kp-algebra-stage-host]")).toHaveAttribute(
    "data-kp-algebra-static-checkpoint",
    "difference-simplified"
  );
  await expect(page.locator("[data-kp-editor-animation-player]")).toHaveCount(0);
});
