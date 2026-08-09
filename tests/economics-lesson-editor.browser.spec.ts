import { expect, test, type Page } from "@playwright/test";
import { mkdirSync } from "node:fs";

const route =
  "/tutorials/economics/demand-shift/?layout=two-column-scroll";
const storageKey = "kp.economics.demand-shift.lesson-draft.v1";
const bufferStorageKey = "kp.economics.demand-shift.lesson-buffer.v1";
const evidenceDirectory = "tmp/codex/economics-lesson-editor";

test.beforeAll(() => mkdirSync(evidenceDirectory, { recursive: true }));

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto(route);
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
  const toolbar = page.getByRole("complementary", { name: "Development tools" });
  await toolbar.getByRole("button", { name: "Edit article" }).click();
}

test("CodeMirror edits the whole lesson and persists a live draft", async ({
  page
}) => {
  const sourceSaveRequests: unknown[] = [];
  await page.route(
    "**/api/dev/lesson-sources/economics-demand-shift-two-column",
    async (route) => {
      sourceSaveRequests.push(route.request().postDataJSON());
      expect(route.request().headers()["x-kp-lesson-source-write"]).toBe("1");
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          schemaVersion: "kp.economics-lesson-source-save-result.v1",
          sourcePath:
            "content/lessons/economics-demand-shift-two-column.json",
          changed: true
        })
      });
    }
  );
  const root = page.locator("[data-kp-economics-demand-shift-tutorial]");
  const passages = root.locator("[data-kp-two-column-scroll-paragraph]");
  await expect(passages).toHaveCount(6);
  await expect(root).toHaveAttribute(
    "data-kp-economics-tutorial-layout",
    "two-column-scroll"
  );
  await expect(root.locator("[data-kp-economics-lesson-editor]")).toHaveCount(0);
  expect(await page.evaluate(() => performance.getEntriesByType("resource")
    .some(({ name }) => name.toLowerCase().includes("codemirror")))).toBe(false);

  await openArticleEditing(page);
  await expect(root).toHaveAttribute(
    "data-kp-economics-lesson-editor-open",
    "true"
  );
  await expect(page.locator("[data-kp-economics-lesson-editor]")).toHaveCount(0);
  const firstEdit = root.locator(
    "[data-kp-economics-tutorial-passage='graph-at-rest'] " +
      "[data-kp-economics-passage-select='graph-at-rest']"
  );
  const firstPassageText = root.locator(
    "[data-kp-economics-tutorial-passage='graph-at-rest'] p"
  );
  const [editBounds, passageBounds] = await Promise.all([
    firstEdit.boundingBox(),
    firstPassageText.boundingBox()
  ]);
  expect(editBounds!.y).toBeGreaterThanOrEqual(
    passageBounds!.y + passageBounds!.height
  );
  await firstEdit.click();
  const editor = page.locator("[data-kp-economics-lesson-editor]");
  await expect(editor).toHaveCount(1);
  await expect(editor).toBeVisible();
  await expect(editor).toHaveAttribute(
    "data-kp-economics-lesson-editor-enhanced",
    "true"
  );
  await expect(editor.locator("[data-kp-economics-editor-modeline]"))
    .toContainText("graph-at-rest");
  await expect(editor.locator("[data-kp-economics-editor-vim-mode]"))
    .toContainText("normal");
  await expect(editor.locator(".kp-economics-lesson-editor__toolbar"))
    .toHaveCount(0);
  await expect(editor.locator(".kp-economics-lesson-editor__actions"))
    .toHaveCount(0);
  await expect(editor.locator(".cm-vim-panel")).toHaveCount(0);
  expect(await editor.locator(".cm-content").evaluate((element) => {
    const style = getComputedStyle(element);
    return { fontSize: style.fontSize, lineHeight: style.lineHeight };
  })).toEqual({ fontSize: "16px", lineHeight: "24px" });
  expect(await page.evaluate(() => performance.getEntriesByType("resource")
    .some(({ name }) => name.toLowerCase().includes("codemirror")))).toBe(true);

  const initialBuffer = await editor.locator("textarea").inputValue();
  expect(initialBuffer).toContain("<!-- kp:lesson ");
  expect(initialBuffer.match(/<!-- kp:passage /gu)).toHaveLength(6);
  await replaceBufferText({
    page,
    from: "Begin with the graph at rest. Price, [$P$](kp-ref:price-axis-inline), is vertical and quantity, $Q$, is horizontal. The blue supply schedule, $S$, rises while the red demand schedule, $D_0$, falls. ",
    to: "Read [$P$](kp-ref:price-axis-inline), then compare $D_0$ with $S$."
  });
  expect(sourceSaveRequests).toHaveLength(0);
  await expect(editor.locator(
    "[data-kp-economics-lesson-editor-source-status]"
  )).toContainText("Autosaved locally");
  const firstPassage = root.locator(
    "[data-kp-economics-tutorial-passage='graph-at-rest']"
  );
  await expect(firstPassage).toContainText("Read");
  await expect(firstPassage.locator(
    "[data-kp-tutorial-text-reference='price-axis-inline']"
  )).toHaveCount(1);
  await expect(firstPassage.locator(".katex")).not.toHaveCount(0);
  await firstPassage.scrollIntoViewIfNeeded();
  await page.screenshot({
    path: `${evidenceDirectory}/editor-open.png`,
    fullPage: false
  });
  await expect.poll(() => page.evaluate((key) => {
    const stored = localStorage.getItem(key);
    return stored === null ? "" : JSON.parse(stored).passages[0].sourceText;
  }, storageKey)).toContain("then compare");
  await expect.poll(() => page.evaluate((key) => {
    const stored = localStorage.getItem(key);
    return stored === null ? "" : JSON.parse(stored).source;
  }, bufferStorageKey)).toContain("<!-- kp:motion-passage ");

  await runExCommand(page, "q");
  await expect(editor).toBeVisible();
  await expect(editor.locator(
    "[data-kp-economics-lesson-editor-source-status]"
  )).toContainText("No write since last change");

  await runExCommand(page, "w");
  await expect(editor.locator(
    "[data-kp-economics-lesson-editor-source-status]"
  )).toContainText(
    "Saved to content/lessons/economics-demand-shift-two-column.json"
  );
  expect(sourceSaveRequests).toHaveLength(1);
  expect(sourceSaveRequests[0]).toMatchObject({
    schemaVersion: "kp.economics-lesson-source-save.v1",
    draft: {
      version: 1,
      selectedPassageId: "graph-at-rest"
    }
  });
  const sourceSaveRequest = sourceSaveRequests[0] as {
    draft: { passages: { id: string; sourceText: string }[] };
  };
  expect(sourceSaveRequest.draft.passages[0]).toMatchObject({
    id: "graph-at-rest",
    sourceText:
      "Read [$P$](kp-ref:price-axis-inline), then compare $D_0$ with $S$."
  });

  await root.locator("[data-kp-economics-lesson-editor-toggle]").evaluate(
    (element: HTMLButtonElement) => element.click()
  );
  await expect(editor).toHaveCount(0);
  expect(sourceSaveRequests).toHaveLength(1);

  await openArticleEditing(page);
  await root.locator(
    "[data-kp-economics-passage-select='graph-at-rest']"
  ).click();
  await replaceBufferText({
    page,
    from: "then compare $D_0$ with $S$.",
    to: "then compare $D_1$ with $S$."
  });
  await runExCommand(page, "wq");
  await expect(editor).toHaveCount(0);
  expect(sourceSaveRequests).toHaveLength(2);

  await root.locator(
    "[data-kp-economics-passage-select='graph-at-rest']"
  ).click();
  await replaceBufferText({
    page,
    from: "then compare $D_1$ with $S$.",
    to: "a temporary unsaved sentence."
  });
  await runExCommand(page, "q!");
  await expect(editor).toHaveCount(0);
  expect(sourceSaveRequests).toHaveLength(2);

  await page.reload();
  await openArticleEditing(page);
  await expect(passages).toHaveCount(6);
  await expect(passages.first()).toContainText("D1");
});

test("source-save failures remain visible without losing the local draft", async ({
  page
}) => {
  await page.route(
    "**/api/dev/lesson-sources/economics-demand-shift-two-column",
    (route) => route.fulfill({
      status: 500,
      contentType: "application/json",
      body: JSON.stringify({
        error: "publication_regeneration_failed",
        message: "The publication could not be regenerated."
      })
    })
  );
  const root = page.locator("[data-kp-economics-demand-shift-tutorial]");
  await openArticleEditing(page);
  await root.locator(
    "[data-kp-economics-passage-select='graph-at-rest']"
  ).click();
  const editor = page.locator("[data-kp-economics-lesson-editor]");
  await replaceBufferText({
    page,
    from: "Begin with the graph at rest. Price, [$P$](kp-ref:price-axis-inline), is vertical and quantity, $Q$, is horizontal. The blue supply schedule, $S$, rises while the red demand schedule, $D_0$, falls. ",
    to: "A locally retained edit with [$P$](kp-ref:price-axis-inline)."
  });
  await runExCommand(page, "wq");

  await expect(editor.locator(
    "[data-kp-economics-lesson-editor-source-status]"
  )).toHaveText("The publication could not be regenerated.");
  await expect(editor).toBeVisible();
  await expect.poll(() => page.evaluate((key) => {
    const stored = localStorage.getItem(key);
    return stored === null ? "" : JSON.parse(stored).source;
  }, bufferStorageKey)).toContain("locally retained edit");
});

test("semantic reference completion exposes only supported authoring IDs", async ({
  page
}) => {
  const root = page.locator("[data-kp-economics-demand-shift-tutorial]");
  await openArticleEditing(page);
  await root.locator(
    "[data-kp-economics-passage-select='graph-at-rest']"
  ).click();
  const editor = page.locator("[data-kp-economics-lesson-editor]");
  const content = editor.locator(".cm-content");
  await content.click();
  await content.press("i");
  await expect(editor.locator("[data-kp-economics-editor-vim-mode]"))
    .toContainText("insert");
  await content.fill("Follow [$P$](kp-ref:");
  await content.press("Control+Space");

  const completion = page.locator(".cm-tooltip-autocomplete");
  await expect(completion).toBeVisible();
  await expect(completion).toContainText("price-axis-inline");
  await expect(completion).toContainText("axis-price");

  await content.press("Escape");
  await content.press("i");
  await content.fill("<!-- kp:");
  await content.press("Control+Space");
  await expect(completion).toBeVisible();
  await expect(completion).toContainText("passage");
  await expect(completion).toContainText("semantic-reference");

  await content.press("Escape");
  await content.press("i");
  await content.fill('<!-- kp:motion-block {"id":"');
  await content.press("Control+Space");
  await expect(completion).toBeVisible();
  await expect(completion).toContainText("demand-shift");
});

test("invalid Markdown preserves the last valid preview and reports the error", async ({
  page
}) => {
  const root = page.locator("[data-kp-economics-demand-shift-tutorial]");
  const firstPassage = root.locator(
    "[data-kp-two-column-scroll-paragraph]"
  ).first();
  const initialHtml = await firstPassage.locator(
    ".kp-economics-tutorial__passage-ink"
  ).evaluate((element) => element.innerHTML);
  await openArticleEditing(page);
  await root.locator(
    "[data-kp-economics-passage-select='graph-at-rest']"
  ).click();
  const editor = page.locator("[data-kp-economics-lesson-editor]");
  await replaceBufferText({
    page,
    from: "[$P$](kp-ref:price-axis-inline)",
    to: "[$P](kp-ref:price-axis-inline)"
  });

  await expect(editor.locator(
    "[data-kp-economics-lesson-editor-validation]"
  )).toContainText("Malformed semantic text reference");
  await expect.poll(() => firstPassage.locator(
    ".kp-economics-tutorial__passage-ink"
  ).evaluate((element) => element.innerHTML)).toBe(initialHtml);
  await expect.poll(() => page.evaluate((key) => {
    const stored = localStorage.getItem(key);
    return stored === null ? "" : JSON.parse(stored).passages[0].sourceText;
  }, storageKey)).toContain("Begin with the graph at rest");
  await expect.poll(() => page.evaluate((key) => {
    const stored = localStorage.getItem(key);
    return stored === null ? "" : JSON.parse(stored).source;
  }, bufferStorageKey)).toContain("[$P](kp-ref:price-axis-inline)");
});

test("structural commands share CodeMirror history and survive reload", async ({
  page
}) => {
  const sourceSaveRequests: unknown[] = [];
  await page.route(
    "**/api/dev/lesson-sources/economics-demand-shift-two-column",
    async (route) => {
      sourceSaveRequests.push(route.request().postDataJSON());
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          schemaVersion: "kp.economics-lesson-source-save-result.v1",
          sourcePath:
            "content/lessons/economics-demand-shift-two-column.json",
          changed: true
        })
      });
    }
  );
  const root = page.locator("[data-kp-economics-demand-shift-tutorial]");
  const passages = root.locator("[data-kp-two-column-scroll-paragraph]");
  await openArticleEditing(page);
  await root.locator(
    "[data-kp-economics-passage-select='graph-at-rest']"
  ).click();
  const editor = page.locator("[data-kp-economics-lesson-editor]");
  const command = (name: string) => editor.locator(
    `[data-kp-economics-buffer-command='${name}']`
  );

  await expect(editor).toHaveAttribute(
    "data-kp-economics-lesson-editor-enhanced",
    "true"
  );
  await expect(editor).toHaveAttribute(
    "data-kp-economics-lesson-editor-status",
    "valid"
  );
  await command("add").click();
  await expect(passages).toHaveCount(7);
  await expect(editor).toHaveAttribute(
    "data-kp-economics-lesson-editor-passage",
    /^draft-passage-/u
  );
  await command("undo").click();
  await expect(passages).toHaveCount(6);
  await command("redo").click();
  await expect(passages).toHaveCount(7);

  await command("duplicate").click();
  await expect(passages).toHaveCount(8);
  await command("undo").click();
  await expect(passages).toHaveCount(7);

  await runExCommand(page, "w");
  await expect.poll(() => sourceSaveRequests.length).toBe(1);
  expect(sourceSaveRequests[0]).toMatchObject({
    schemaVersion: "kp.economics-lesson-source-save.v1",
    draft: { version: 1 }
  });
  const saved = sourceSaveRequests[0] as {
    draft: { passages: { id: string }[] };
  };
  expect(saved.draft.passages).toHaveLength(7);

  await runExCommand(page, "q");
  await page.reload();
  await openArticleEditing(page);
  await expect(passages).toHaveCount(7);
});
