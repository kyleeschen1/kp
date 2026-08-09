import { expect, test, type Page, type Route } from "@playwright/test";
import { mkdirSync } from "node:fs";

const lessonRoute =
  "/tutorials/economics/demand-shift/?layout=two-column-scroll";
const endpoint = "**/api/dev/article-sources/economics-demand-shift";
const articleStorageKey = "kp.economics.demand-shift.article-draft.v1";
const sourcePath = "content/lessons/economics-demand-shift.kp.md";
const evidenceDirectory = "tmp/codex/economics-lesson-editor";

test.beforeAll(() => mkdirSync(evidenceDirectory, { recursive: true }));

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto(lessonRoute);
});

async function runExCommand(page: Page, command: string): Promise<void> {
  const editor = page.locator("[data-kp-economics-lesson-editor]");
  const content = editor.locator(".cm-content");
  await content.click();
  await content.press("Escape");
  await content.press(":");
  const minibuffer = editor.locator(".cm-vim-panel input");
  await expect(minibuffer).toBeVisible();
  const [modelineBounds, exBounds] = await Promise.all([
    editor.locator("[data-kp-economics-editor-modeline]").boundingBox(),
    editor.locator(".cm-vim-panel").boundingBox()
  ]);
  expect(exBounds!.y).toBeGreaterThanOrEqual(
    modelineBounds!.y + modelineBounds!.height - 1
  );
  await minibuffer.fill(command);
  await minibuffer.press("Enter");
}

async function replaceBufferText(input: {
  readonly page: Page;
  readonly from: string;
  readonly to: string;
}): Promise<string> {
  const editor = input.page.locator("[data-kp-economics-lesson-editor]");
  const source = await editor.locator("textarea").inputValue();
  expect(source).toContain(input.from);
  const next = source.replace(input.from, input.to);
  await editor.locator(".cm-content").fill(next);
  return next;
}

async function openArticleEditing(page: Page): Promise<void> {
  const root = page.locator("[data-kp-economics-demand-shift-tutorial]");
  if (await root.getAttribute("data-kp-economics-lesson-editor-open") === "true") {
    return;
  }
  const toolbar = page.getByRole("complementary", { name: "Development tools" });
  await toolbar.getByRole("button", { name: "Edit article" }).click();
}

async function openFirstPassageEditor(page: Page): Promise<void> {
  await openArticleEditing(page);
  await page.locator(
    "[data-kp-economics-passage-select='graph-at-rest']"
  ).click();
  await expect(page.locator("[data-kp-economics-lesson-editor]")).toHaveAttribute(
    "data-kp-economics-lesson-editor-enhanced",
    "true"
  );
}

function fulfillSave(route: Route, changed = true): Promise<void> {
  return route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({
      schemaVersion: "kp.article-source-save-result.v1",
      sourcePath,
      changed
    })
  });
}

test("CodeMirror edits the canonical RC1 article and implements Vim writes", async ({
  page
}) => {
  const sourceSaveRequests: unknown[] = [];
  await page.route(endpoint, async (route) => {
    sourceSaveRequests.push(route.request().postDataJSON());
    expect(route.request().headers()["x-kp-article-source-write"]).toBe("1");
    await fulfillSave(route);
  });
  const root = page.locator("[data-kp-economics-demand-shift-tutorial]");
  const passages = root.locator("[data-kp-two-column-scroll-paragraph]");
  await expect(passages).toHaveCount(6);
  await expect(root.locator("[data-kp-economics-lesson-editor]")).toHaveCount(0);
  expect(await page.evaluate(() => performance.getEntriesByType("resource")
    .some(({ name }) => name.toLowerCase().includes("codemirror")))).toBe(false);

  await openArticleEditing(page);
  const firstEdit = root.locator(
    "[data-kp-economics-tutorial-passage='graph-at-rest'] " +
      "[data-kp-economics-passage-select='graph-at-rest']"
  );
  const firstPassageText = root.locator(
    "[data-kp-economics-tutorial-passage='graph-at-rest'] p"
  ).first();
  const [editBounds, passageBounds] = await Promise.all([
    firstEdit.boundingBox(),
    firstPassageText.boundingBox()
  ]);
  expect(editBounds!.y).toBeGreaterThanOrEqual(
    passageBounds!.y + passageBounds!.height
  );
  await firstEdit.click();
  const editor = page.locator("[data-kp-economics-lesson-editor]");
  await expect(editor).toBeVisible();
  await expect(editor.locator("[data-kp-economics-editor-modeline]"))
    .toContainText("economics-demand-shift.kp.md");
  await expect(editor.locator("[data-kp-economics-editor-vim-mode]"))
    .toContainText("normal");
  await expect(editor.locator("[data-kp-economics-buffer-command]"))
    .toHaveCount(0);
  await expect(editor.locator(".cm-vim-panel")).toHaveCount(0);
  expect(await editor.locator(".cm-content").evaluate((element) => {
    const style = getComputedStyle(element);
    return { fontSize: style.fontSize, lineHeight: style.lineHeight };
  })).toEqual({ fontSize: "16px", lineHeight: "24px" });

  const initialBuffer = await editor.locator("textarea").inputValue();
  expect(initialBuffer).toContain("schema: kp.article.v1-rc1");
  expect(initialBuffer.match(/:::kp-passage/gu)).toHaveLength(5);
  await replaceBufferText({
    page,
    from: "why do sellers supply more?",
    to: "why do sellers compare $D_0$ with $S$?"
  });
  expect(sourceSaveRequests).toHaveLength(0);
  const firstPassage = root.locator(
    "[data-kp-economics-tutorial-passage='graph-at-rest']"
  );
  await expect(firstPassage).toContainText("compare");
  await expect(firstPassage.locator(
    "[data-kp-tutorial-text-reference='price-axis-inline']"
  )).toHaveCount(1);
  await page.screenshot({
    path: `${evidenceDirectory}/editor-open.png`,
    fullPage: false
  });
  await expect.poll(() => page.evaluate((key) => {
    const stored = localStorage.getItem(key);
    return stored === null ? "" : JSON.parse(stored).source;
  }, articleStorageKey)).toContain("compare $D_0$");

  await runExCommand(page, "q");
  await expect(editor).toBeVisible();
  await expect(editor.locator(
    "[data-kp-economics-lesson-editor-source-status]"
  )).toContainText("No write since last change");

  await runExCommand(page, "w");
  await expect(editor.locator(
    "[data-kp-economics-lesson-editor-source-status]"
  )).toContainText(`Saved to ${sourcePath}`);
  expect(sourceSaveRequests).toHaveLength(1);
  expect(sourceSaveRequests[0]).toMatchObject({
    schemaVersion: "kp.article-source-save.v1",
    sourceId: sourcePath,
    revision: 1
  });
  expect((sourceSaveRequests[0] as { text: string }).text)
    .toContain("compare $D_0$");

  await runExCommand(page, "q");
  await expect(editor).toHaveCount(0);
  await openFirstPassageEditor(page);
  await replaceBufferText({ page, from: "$D_0$ with $S$?", to: "$D_1$ with $S$?" });
  await runExCommand(page, "wq");
  await expect(editor).toHaveCount(0);
  expect(sourceSaveRequests).toHaveLength(2);

  await openFirstPassageEditor(page);
  await replaceBufferText({
    page,
    from: "$D_1$ with $S$?",
    to: "a temporary unsaved sentence."
  });
  await runExCommand(page, "q!");
  await expect(editor).toHaveCount(0);
  await expect(firstPassage).toContainText("D1");
});

test("source-save failures retain the editable local article", async ({ page }) => {
  await page.route(endpoint, (route) => route.fulfill({
    status: 500,
    contentType: "application/json",
    body: JSON.stringify({
      error: "publication_regeneration_failed",
      message: "The publication could not be regenerated."
    })
  }));
  await openFirstPassageEditor(page);
  const editor = page.locator("[data-kp-economics-lesson-editor]");
  await replaceBufferText({
    page,
    from: "why do sellers supply more?",
    to: "a locally retained edit?"
  });
  await runExCommand(page, "wq");

  await expect(editor.locator(
    "[data-kp-economics-lesson-editor-source-status]"
  )).toHaveText("The publication could not be regenerated.");
  await expect(editor).toBeVisible();
  await expect.poll(() => page.evaluate((key) => {
    const stored = localStorage.getItem(key);
    return stored === null ? "" : JSON.parse(stored).source;
  }, articleStorageKey)).toContain("locally retained edit");
});

test("RC1 completion exposes directives and vignette semantic paths", async ({ page }) => {
  await openFirstPassageEditor(page);
  const editor = page.locator("[data-kp-economics-lesson-editor]");
  const content = editor.locator(".cm-content");
  await content.click();
  await content.press("i");
  await content.fill("Follow [$P$](kp-ref:");
  await content.press("Control+Space");
  const completion = page.locator(".cm-tooltip-autocomplete");
  await expect(completion).toBeVisible();
  await expect(completion).toContainText("market/price-axis");
  await expect(completion).toContainText("market/demand");

  await content.press("Escape");
  await content.press("i");
  await content.fill(":::kp-");
  await content.press("Control+Space");
  await expect(completion).toContainText("kp-passage");
  await expect(completion).toContainText("kp-motion");

  await content.press("Escape");
  await content.press("i");
  await content.fill(":::kp-motion{#step stage=market run=market/");
  await content.press("Control+Space");
  await expect(completion).toContainText("market/shift-demand");
});

test("invalid RC1 source preserves the last valid preview", async ({ page }) => {
  const root = page.locator("[data-kp-economics-demand-shift-tutorial]");
  const firstPassage = root.locator(
    "[data-kp-two-column-scroll-paragraph]"
  ).first();
  const initialHtml = await firstPassage.locator(
    ".kp-economics-tutorial__passage-ink"
  ).evaluate((element) => element.innerHTML);
  await openFirstPassageEditor(page);
  const editor = page.locator("[data-kp-economics-lesson-editor]");
  await replaceBufferText({
    page,
    from: "[$P$](kp-ref:market/price-axis)",
    to: "[$P](kp-ref:market/price-axis)"
  });

  await expect(editor).toHaveAttribute(
    "data-kp-economics-lesson-editor-status",
    "invalid"
  );
  await expect(editor.locator(
    "[data-kp-economics-lesson-editor-validation]"
  )).toContainText("Malformed semantic text reference");
  await expect.poll(() => firstPassage.locator(
    ".kp-economics-tutorial__passage-ink"
  ).evaluate((element) => element.innerHTML)).toBe(initialHtml);
});

test("the modal edits title and prose in one searchable source buffer", async ({ page }) => {
  const requests: unknown[] = [];
  await page.route(endpoint, async (route) => {
    requests.push(route.request().postDataJSON());
    await fulfillSave(route);
  });
  await openFirstPassageEditor(page);
  await replaceBufferText({
    page,
    from: "Kicker: Supply, demand, and equilibrium",
    to: "Kicker: A complete market article"
  });
  await runExCommand(page, "w");

  await expect.poll(() => requests.length).toBe(1);
  const text = (requests[0] as { text: string }).text;
  expect(text).toContain("Kicker: A complete market article");
  expect(text).toContain(":::kp-motion{#follow-shift");
  expect(text).toContain("### Check and generalize");
});
