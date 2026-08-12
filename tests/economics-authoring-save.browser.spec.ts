import { expect, test, type Page } from "@playwright/test";

const lessonRoute = "/tutorials/economics/demand-shift/?view=reader";

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

test("a canonical wq closes the shared modal without reloading the document", async ({
  page
}) => {
  await page.goto(lessonRoute);
  await page.getByRole("complementary", { name: "Development tools" })
    .getByRole("button", { name: "Edit article" }).click();
  const editor = page.locator("[data-kp-article-source-editor]");
  await expect(editor).toHaveAttribute(
    "data-kp-article-source-editor-enhanced",
    "true",
    { timeout: 15_000 }
  );
  const sentinel = await page.evaluate(() => {
    const value = crypto.randomUUID();
    (window as typeof window & { __kpAuthoringSaveSentinel?: string })
      .__kpAuthoringSaveSentinel = value;
    return value;
  });

  await runExCommand(page, "wq");
  await expect(editor).toHaveCount(0);
  await page.waitForTimeout(500);
  expect(await page.evaluate(() =>
    (window as typeof window & { __kpAuthoringSaveSentinel?: string })
      .__kpAuthoringSaveSentinel
  )).toBe(sentinel);
});
