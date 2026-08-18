import { expect, test, type Locator } from "@playwright/test";

const route = "/tutorials/economics/demand-shift/";

async function openPagesDirectory(toolbar: Locator): Promise<Locator> {
  const pages = toolbar.locator(
    "[data-kp-dev-toolbar-control='kp.dev-toolbar.pages']"
  );
  // The development compiler may replace the shell once after source startup.
  await expect(async () => {
    if (await pages.getAttribute("open") === null) {
      await pages.locator("summary").click();
    }
    await expect(pages).toHaveAttribute("open", "");
  }).toPass({ timeout: 5_000 });
  const navigation = pages.getByRole("navigation", { name: "Development pages" });
  await expect(navigation).toBeVisible();
  return navigation;
}

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

test("the Pages directory fits the accepted wide toolbar surface", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(route);
  const toolbar = page.getByRole("complementary", { name: "Development tools" });
  await expect(toolbar.getByRole("button", { name: "Edit" })).toBeVisible();
  const navigation = await openPagesDirectory(toolbar);
  const geometry = await navigation.evaluate((element) => {
    const bounds = element.getBoundingClientRect();
    const toolbarBounds = element.closest("[data-kp-dev-toolbar]")!
      .getBoundingClientRect();
    return {
      left: bounds.left,
      right: bounds.right,
      top: bounds.top,
      bottom: bounds.bottom,
      toolbarTop: toolbarBounds.top,
      columns: getComputedStyle(element).gridTemplateColumns.split(" ").length
    };
  });

  expect(geometry.left).toBeGreaterThanOrEqual(16);
  expect(geometry.right).toBeLessThanOrEqual(1424);
  expect(geometry.top).toBeGreaterThanOrEqual(16);
  expect(geometry.bottom).toBeLessThan(geometry.toolbarTop);
  expect(geometry.columns).toBe(4);
  await expect(toolbar.getByRole("button", { name: "Review" })).toBeVisible();
  await expect(toolbar.getByRole("button", { name: "Edit" })).toBeVisible();
  await page.screenshot({
    path: "tmp/codex/economics-dev-toolbar-pages-wide.png",
    fullPage: false
  });
});

test("economics opens a real page link without disturbing article state", async ({ page }) => {
  await page.goto(
    `${route}?view=two-column-scroll&theme=light` +
    "#kp-checkpoint-shift-handoff"
  );
  const toolbar = page.getByRole("complementary", { name: "Development tools" });
  await expect(toolbar.getByRole("button", { name: "Edit" })).toBeVisible();
  const controlOrder = await toolbar.locator("[data-kp-dev-toolbar-control]")
    .evaluateAll((controls) => controls.map(
      (control) => control.getAttribute("data-kp-dev-toolbar-control")
    ));
  expect(controlOrder).toEqual([
    "kp.dev-toolbar.review",
    "kp.dev-toolbar.pages",
    "kp.dev-toolbar.copy-link",
    "kp.dev-toolbar.theme",
    "economics.view",
    "economics.edit-article"
  ]);
  const presenter = page.locator("[data-kp-tutorial-review-root]");
  await expect(presenter).toHaveAttribute("data-kp-tutorial-review-progress", "0.7200");
  await presenter.evaluate((element) => {
    element.dataset["kpTestArticleIdentity"] = "retained";
  });

  const navigation = await openPagesDirectory(toolbar);
  await expect(navigation.getByRole("link", {
    name: "Economics · demand shift"
  })).toHaveAttribute("aria-current", "page");
  const destinationLink = navigation.getByRole("link", {
    name: "Programming · Lisp function application"
  });
  const destinationHref = await destinationLink.getAttribute("href");
  expect(destinationHref).toBe("/tutorials/programming/lisp-function-application/");
  const destination = await page.context().newPage();
  await destination.goto(destinationHref!);
  await expect(destination.locator(
    "[data-kp-lisp-function-application-tutorial]"
  )).toBeVisible();
  const destinationToolbar = destination.getByRole("complementary", {
    name: "Development tools"
  });
  const destinationNavigation = await openPagesDirectory(destinationToolbar);
  await expect(destinationNavigation.getByRole("link", {
    name: "Programming · Lisp function application"
  })).toHaveAttribute("aria-current", "page");

  await page.bringToFront();
  await expect(page).toHaveURL(/view=two-column-scroll/u);
  await expect(page).toHaveURL(/theme=light/u);
  await expect(page).toHaveURL(/#kp-checkpoint-shift-handoff$/u);
  await expect(page.locator(
    '[data-kp-tutorial-review-root][data-kp-test-article-identity="retained"]'
  )).toHaveAttribute("data-kp-tutorial-review-progress", "0.7200");
});

for (const viewport of [
  { name: "phone", width: 390, height: 844 },
  { name: "short viewport", width: 900, height: 420 }
] as const) {
  test(`the Pages directory remains reachable in a ${viewport.name}`, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto(route);
    const toolbar = page.getByRole("complementary", { name: "Development tools" });
    await expect(toolbar.getByRole("button", { name: "Edit" })).toBeVisible();
    const navigation = await openPagesDirectory(toolbar);
    const geometry = await navigation.evaluate((element) => {
      const bounds = element.getBoundingClientRect();
      const toolbarBounds = element.closest("[data-kp-dev-toolbar]")!
        .getBoundingClientRect();
      const firstLink = element.querySelector("a")!.getBoundingClientRect();
      return {
        left: bounds.left,
        right: bounds.right,
        top: bounds.top,
        bottom: bounds.bottom,
        toolbarTop: toolbarBounds.top,
        overflowY: getComputedStyle(element).overflowY,
        firstLinkHeight: firstLink.height
      };
    });

    expect(geometry.left).toBeGreaterThanOrEqual(8);
    expect(geometry.right).toBeLessThanOrEqual(viewport.width - 8);
    expect(geometry.top).toBeGreaterThanOrEqual(8);
    expect(geometry.bottom).toBeLessThan(geometry.toolbarTop);
    expect(geometry.overflowY).toBe("auto");
    if (viewport.name === "phone") {
      expect(geometry.firstLinkHeight).toBeGreaterThanOrEqual(44);
      await page.screenshot({
        path: "tmp/codex/economics-dev-toolbar-pages-phone.png",
        fullPage: false
      });
    }

    await page.keyboard.press("Escape");
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
  });
}

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
