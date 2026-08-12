import { expect, test, type Page, type Route } from "@playwright/test";

const route = "/tutorials/economics/demand-shift/";
const endpoint = "**/api/dev/article-sources/economics-demand-shift";
const sourcePath = "content/lessons/economics-demand-shift.kp.md";

async function openEditor(page: Page): Promise<void> {
  await page.getByRole("complementary", { name: "Development tools" })
    .getByRole("button", { name: "Edit article" }).click();
  await expect(page.locator("[data-kp-article-source-editor]")).toHaveAttribute(
    "data-kp-article-source-editor-enhanced",
    "true",
    { timeout: 15_000 }
  );
}

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

async function fulfillSave(routeRequest: Route): Promise<void> {
  await routeRequest.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({
      schemaVersion: "kp.article-source-save-result.v1",
      sourcePath,
      changed: true
    })
  });
}

for (const view of [
  "reader",
  "deck",
  "attention-stage",
  "split",
  "inline-sticky",
  "two-column-scroll"
] as const) {
  test(`whole-file editing is available from the ${view} projection`, async ({
    page
  }) => {
    await page.goto(`${route}?view=${view}`);
    await openEditor(page);
    const editor = page.locator("[data-kp-article-source-editor]");
    await expect(editor.locator("[data-kp-article-source-editor-modeline]"))
      .toContainText("economics-demand-shift.kp.md");
    expect(await editor.locator("textarea").inputValue())
      .toContain("schema: kp.article.v1");
    await runExCommand(page, "q");
    await expect(editor).toHaveCount(0);
  });
}

test("valid edits reproject in place while invalid edits retain the last valid view", async ({
  page
}) => {
  await page.goto(`${route}?view=two-column-scroll`);
  await openEditor(page);
  const editor = page.locator("[data-kp-article-source-editor]");
  const source = await editor.locator("textarea").inputValue();
  const valid = source.replace(
    "Kicker: Supply, demand, and equilibrium",
    "Kicker: A route-owned Article preview"
  );
  await editor.locator(".cm-content").fill(valid);
  await expect(page.getByText("A route-owned Article preview", { exact: true }))
    .toBeAttached();
  const lastValidTitle = await page.locator("h1").first().textContent();

  await editor.locator(".cm-content").fill(
    valid.replace("stage=market", "stage=missing")
  );
  await expect(editor).toHaveAttribute(
    "data-kp-article-source-editor-status",
    "invalid"
  );
  await expect(page.locator("h1").first()).toHaveText(lastValidTitle ?? "");
});

test("shared Vim commands save and close without reloading the route", async ({
  page
}) => {
  const requests: unknown[] = [];
  await page.route(endpoint, async (request) => {
    requests.push(request.request().postDataJSON());
    await fulfillSave(request);
  });
  await page.goto(`${route}?view=reader`);
  await openEditor(page);
  const editor = page.locator("[data-kp-article-source-editor]");
  const source = await editor.locator("textarea").inputValue();
  await editor.locator(".cm-content").fill(
    source.replace("The puzzle in the starting market", "The starting-market puzzle")
  );
  const sentinel = await page.evaluate(() => {
    const value = crypto.randomUUID();
    (window as typeof window & { __kpEconomicsEditorSentinel?: string })
      .__kpEconomicsEditorSentinel = value;
    return value;
  });

  await runExCommand(page, "q");
  await expect(editor).toBeVisible();
  await expect(editor.locator("[data-kp-article-source-editor-source-status]"))
    .toContainText("No write since last change");
  await runExCommand(page, "wq");
  await expect(editor).toHaveCount(0);
  expect(requests).toHaveLength(1);
  expect(requests[0]).toMatchObject({ sourceId: sourcePath });
  expect(await page.evaluate(() =>
    (window as typeof window & { __kpEconomicsEditorSentinel?: string })
      .__kpEconomicsEditorSentinel
  )).toBe(sentinel);
});

for (const viewport of [
  { name: "phone", width: 390, height: 844 },
  { name: "short", width: 900, height: 420 }
] as const) {
  test(`the shared editor remains contained in a ${viewport.name} viewport`, async ({
    page
  }) => {
    await page.setViewportSize(viewport);
    await page.goto(`${route}?view=inline-sticky`);
    await openEditor(page);
    const bounds = await page.locator("[data-kp-article-source-editor]")
      .boundingBox();
    expect(bounds).not.toBeNull();
    expect(bounds!.x).toBeGreaterThanOrEqual(0);
    expect(bounds!.y).toBeGreaterThanOrEqual(0);
    expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(viewport.width);
    expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(viewport.height);
  });
}
