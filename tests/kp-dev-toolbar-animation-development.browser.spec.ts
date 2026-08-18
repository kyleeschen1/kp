import { expect, test } from "@playwright/test";

const vectorId = "animation.dot-projection.basic";

test("the development dock preserves exact state across Catalogue and Coverage", async ({
  context,
  page
}) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  const documentRequests: string[] = [];
  page.on("request", (request) => {
    if (request.resourceType() === "document") documentRequests.push(request.url());
  });
  await page.goto(
    `/?artifact=${vectorId}` +
    "&playhead=0.42&style=restrained-editorial&focus=no-depth"
  );

  const toolbar = page.getByRole("complementary", {
    name: "Development tools"
  });
  const theme = toolbar.getByRole("button", { name: "Dark mode" });
  await expect(toolbar.getByRole("button", { name: "Review" })).toBeVisible();
  await expect(toolbar.getByRole("button", { name: "Copy link" })).toBeVisible();
  await expect(theme).toHaveAttribute("aria-pressed", "false");

  await theme.focus();
  await expect(theme).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(theme).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("[data-kp-svelte-catalogue-shell]"))
    .toHaveAttribute("data-kp-animation-catalogue-theme", "dark");
  expect(new URL(page.url()).searchParams.get("theme")).toBe("dark");

  const view = toolbar.locator(
    "[data-kp-dev-toolbar-control='kp.dev-toolbar.pages']"
  );
  await expect(view.locator("summary")).toHaveText("View");
  await view.locator("summary").click();
  await view.getByRole("link", { name: "Transformation coverage" }).click();
  const coverage = page.locator(".kp-transformation-coverage");
  await expect(coverage).toBeVisible();
  await expect(coverage).toHaveAttribute(
    "data-kp-animation-coverage-theme",
    "dark"
  );
  expect(new URL(page.url()).searchParams.get("artifact")).toBe(vectorId);
  expect(new URL(page.url()).searchParams.get("playhead")).toBe("0.42");

  await view.locator("summary").click();
  await expect(view.getByRole("link", {
    name: "Transformation coverage"
  })).toHaveAttribute("aria-current", "page");
  await page.keyboard.press("Escape");

  const copy = toolbar.getByRole("button", { name: "Copy link" });
  await copy.click();
  await expect(toolbar.getByRole("button", { name: "Copied" })).toBeVisible();
  const copied = await page.evaluate(() => navigator.clipboard.readText());
  const copiedUrl = new URL(copied);
  expect(copiedUrl.searchParams.get("view")).toBe("coverage");
  expect(copiedUrl.searchParams.get("theme")).toBe("dark");
  expect(copiedUrl.searchParams.get("style")).toBe("restrained-editorial");
  expect(copiedUrl.searchParams.get("focus")).toBe("no-depth");
  expect(copiedUrl.searchParams.get("artifact")).toBe(vectorId);
  expect(copiedUrl.searchParams.get("playhead")).toBe("0.42");
  expect(documentRequests).toHaveLength(1);
});
