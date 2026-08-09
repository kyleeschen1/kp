import { expect, test } from "@playwright/test";

const route = "/tutorials/economics/demand-shift/";

test("economics exposes one persistent bottom development toolbar", async ({ page }) => {
  await page.goto(route);
  const toolbar = page.getByRole("complementary", { name: "Development tools" });

  await expect(toolbar).toBeVisible();
  await expect(toolbar.getByRole("button", { name: "Review" })).toBeVisible();
  await expect(toolbar.getByRole("combobox", { name: "Layout" })).toHaveValue("reader");
  await expect(toolbar.getByRole("button", { name: "Dark mode" })).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("[data-kp-dev-toolbar]")).toHaveCount(1);
  await expect(page.locator("[data-kp-dev-review-shell]")).toHaveCount(1);

  const geometry = await toolbar.evaluate((element) => {
    const style = getComputedStyle(element);
    const bounds = element.getBoundingClientRect();
    return {
      position: style.position,
      bottom: Math.round(innerHeight - bounds.bottom),
      bodyPaddingBottom: getComputedStyle(document.body).paddingBottom
    };
  });
  expect(geometry.position).toBe("fixed");
  expect(geometry.bottom).toBe(18);
  expect(geometry.bodyPaddingBottom).toBe("0px");

  await toolbar.getByRole("button", { name: "Review" }).click();
  await expect(page.getByRole("dialog", { name: "Review this moment" })).toBeVisible();
  await page.getByRole("button", { name: "Close visual review" }).click();

  await toolbar.getByRole("combobox", { name: "Layout" }).selectOption("deck");
  await expect(page).toHaveURL(/\?view=deck/u);
  await expect(toolbar.getByRole("combobox", { name: "Layout" })).toHaveValue("deck");
  await expect(page.locator("[data-kp-dev-toolbar]")).toHaveCount(1);

  await page.screenshot({
    path: "tmp/codex/economics-dev-toolbar.png",
    fullPage: false
  });
});

test("toolbar view changes retain semantic state without replay", async ({ page }) => {
  await page.goto(
    `${route}?view=two-column-scroll&theme=light` +
    "#kp-checkpoint-shift-handoff"
  );
  const toolbar = page.getByRole("complementary", { name: "Development tools" });
  const presenter = page.locator("[data-kp-tutorial-review-root]");
  await expect(presenter).toHaveAttribute("data-kp-tutorial-review-progress", "0.7200");
  await expect(presenter).toHaveAttribute(
    "data-kp-tutorial-review-passage",
    "follow-shift"
  );
  const initialAnchorTop = await presenter.locator(
    '[data-kp-economics-tutorial-passage="follow-shift"]'
  ).evaluate((element) => element.getBoundingClientRect().top);
  await page.locator("[data-kp-dev-review-shell]").evaluate((shell) => {
    shell.dataset["kpTestReviewIdentity"] = "retained";
  });

  await toolbar.getByRole("combobox", { name: "Layout" }).selectOption("deck");
  await expect(page).toHaveURL(/view=deck/u);
  await expect(page).toHaveURL(/theme=light/u);
  await expect(page).toHaveURL(/scene=shift-demand/u);
  await expect(page).toHaveURL(/#kp-checkpoint-shift-handoff$/u);
  const publication = page.locator("[data-kp-economics-static-publication]");
  await expect(publication).toHaveAttribute(
    "data-kp-economics-tutorial-motion-progress",
    "0.720"
  );
  const deckAnchor = publication.locator(
    '[data-kp-economics-deck-passage="follow-shift"]'
  );
  await expect(deckAnchor).toHaveAttribute(
    "data-kp-economics-deck-scene-active",
    "true"
  );
  await expect.poll(async () => Math.abs(
    await deckAnchor.evaluate((element) => element.getBoundingClientRect().top) -
      initialAnchorTop
  )).toBeLessThan(8);
  await expect(page.locator(
    '[data-kp-dev-review-shell][data-kp-test-review-identity="retained"]'
  )).toHaveCount(1);

  await toolbar.getByRole("combobox", { name: "Layout" }).selectOption("reader");
  await expect(page).toHaveURL(/view=reader/u);
  await expect(page).toHaveURL(/theme=light/u);
  await expect(page).toHaveURL(/#kp-checkpoint-shift-handoff$/u);
  await expect(page.locator("[data-kp-economics-static-publication]"))
    .toHaveAttribute("data-kp-economics-tutorial-motion-progress", "0.720");
  await expect(page.locator(
    '[data-kp-dev-review-shell][data-kp-test-review-identity="retained"]'
  )).toHaveCount(1);
});
