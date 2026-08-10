import { expect, test, type Page } from "@playwright/test";

const articleRoute = "/tutorials/algebra/fraction-composition/";
const endpoint = "**/api/dev/article-sources/algebra-fraction-composition";
const sourcePath = "content/lessons/algebra-fraction-composition.kp.md";

async function runExCommand(page: Page, command: string): Promise<void> {
  const editor = page.locator("[data-kp-article-source-editor]");
  const content = editor.locator(".cm-content");
  await content.click();
  await content.press("Escape");
  await content.press(":");
  const minibuffer = editor.locator(".cm-vim-panel input");
  await expect(minibuffer).toBeVisible();
  await minibuffer.fill(command);
  await minibuffer.press("Enter");
}

test("algebra reuses whole-file editing, last-valid preview, and Vim writes", async ({
  page
}) => {
  const requests: unknown[] = [];
  await page.route(endpoint, async (route) => {
    requests.push(route.request().postDataJSON());
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        schemaVersion: "kp.article-source-save-result.v1",
        sourcePath,
        changed: true
      })
    });
  });
  await page.goto(articleRoute);
  const toolbar = page.getByRole("complementary", {
    name: "Development tools"
  });
  await toolbar.getByRole("button", { name: "Edit article" }).click();
  const editor = page.locator("[data-kp-article-source-editor]");
  await expect(editor).toHaveAttribute(
    "data-kp-article-source-editor-enhanced",
    "true"
  );
  await expect(editor.locator("[data-kp-article-source-editor-modeline]"))
    .toContainText("algebra-fraction-composition.kp.md");
  const initialSource = await editor.locator("textarea").inputValue();
  expect(initialSource).toContain("schema: kp.article.v1");

  const revised = initialSource.replace(
    "Read the grouped expression first",
    "Read the entire grouped expression first"
  );
  await editor.locator(".cm-content").fill(revised);
  await expect(page.getByRole("heading", {
    name: "Read the entire grouped expression first"
  })).toBeVisible();

  const validPublication = await page.locator(
    "[data-kp-algebra-fraction-composition-publication]"
  ).innerHTML();
  await editor.locator(".cm-content").fill(
    revised.replace(
      "[factor](kp-ref:solve/factor)",
      "[factor](kp-ref:solve/missing)"
    )
  );
  await expect(editor).toHaveAttribute(
    "data-kp-article-source-editor-status",
    "invalid"
  );
  expect(await page.locator(
    "[data-kp-algebra-fraction-composition-publication]"
  ).innerHTML()).toBe(validPublication);

  await editor.locator(".cm-content").fill(revised);
  const sentinel = await page.evaluate(() => {
    const value = crypto.randomUUID();
    (window as typeof window & { __kpAlgebraSaveSentinel?: string })
      .__kpAlgebraSaveSentinel = value;
    return value;
  });
  await runExCommand(page, "wq");
  await expect(editor).toHaveCount(0);
  expect(requests).toHaveLength(1);
  expect(requests[0]).toMatchObject({
    schemaVersion: "kp.article-source-save.v1",
    sourceId: sourcePath
  });
  await page.waitForTimeout(750);
  expect(await page.evaluate(() =>
    (window as typeof window & { __kpAlgebraSaveSentinel?: string })
      .__kpAlgebraSaveSentinel
  )).toBe(sentinel);
});

test(":q refuses a dirty algebra buffer and :q! discards it", async ({ page }) => {
  await page.goto(articleRoute);
  const toolbar = page.getByRole("complementary", {
    name: "Development tools"
  });
  await toolbar.getByRole("button", { name: "Edit article" }).click();
  const editor = page.locator("[data-kp-article-source-editor]");
  await expect(editor).toHaveAttribute(
    "data-kp-article-source-editor-enhanced",
    "true"
  );
  const source = await editor.locator("textarea").inputValue();
  await editor.locator(".cm-content").fill(
    source.replace("The goal is", "Our goal is")
  );
  await runExCommand(page, "q");
  await expect(editor).toBeVisible();
  await expect(editor.locator("[data-kp-article-source-editor-source-status]"))
    .toContainText("No write since last change");
  await runExCommand(page, "q!");
  await expect(editor).toHaveCount(0);
});
