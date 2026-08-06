import { expect, test } from "@playwright/test";
import { mkdirSync } from "node:fs";

const route =
  "/tutorials/economics/demand-shift/?layout=two-column-scroll";
const storageKey = "kp.economics.demand-shift.lesson-draft.v1";
const evidenceDirectory = "tmp/codex/economics-lesson-editor";

test.beforeAll(() => mkdirSync(evidenceDirectory, { recursive: true }));

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto(route);
});

test("CodeMirror edits one passage at a time and persists a live draft", async ({
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
  const toggle = root.locator("[data-kp-economics-lesson-editor-toggle]");

  await expect(passages).toHaveCount(6);
  await expect(root.locator("[data-kp-economics-lesson-editor]")).toHaveCount(0);
  expect(await page.evaluate(() => performance.getEntriesByType("resource")
    .some(({ name }) => name.toLowerCase().includes("codemirror")))).toBe(false);

  await toggle.click();
  await expect(root).toHaveAttribute(
    "data-kp-economics-lesson-editor-open",
    "true"
  );
  const editor = root.locator("[data-kp-economics-lesson-editor]");
  await expect(editor).toHaveCount(1);
  await expect(editor).toHaveAttribute(
    "data-kp-economics-lesson-editor-enhanced",
    "true"
  );
  expect(await page.evaluate(() => performance.getEntriesByType("resource")
    .some(({ name }) => name.toLowerCase().includes("codemirror")))).toBe(true);

  const content = editor.locator(".cm-content");
  await content.fill(
    "Read [$P$](kp-ref:price-axis-inline), then compare $D_0$ with $S$."
  );
  expect(sourceSaveRequests).toHaveLength(0);
  await expect(root.locator(
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

  await editor.getByRole("button", { name: "Save to source" }).click();
  await expect(root.locator(
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

  await editor.getByRole("button", { name: "Add after" }).click();
  await expect(passages).toHaveCount(7);
  await expect(root).toHaveAttribute(
    "data-kp-economics-lesson-editor-selected",
    /draft-passage-/
  );
  await expect(root.locator(".cm-editor")).toHaveCount(1);
  await root.locator(".cm-content").fill("A short added explanation with $Q$.");

  await root.getByRole("button", { name: "Duplicate" }).click();
  await expect(passages).toHaveCount(8);
  await root.getByRole("button", { name: "Move down" }).click();
  await root.getByRole("button", { name: "Delete" }).click();
  await expect(passages).toHaveCount(7);

  await page.reload();
  await root.locator("[data-kp-economics-lesson-editor-toggle]").click();
  await expect(passages).toHaveCount(7);
  await expect(passages.first()).toContainText("then compare");

  await root.locator("[data-kp-economics-lesson-editor-reset]").click();
  await expect(passages).toHaveCount(6);
  await expect.poll(() => page.evaluate((key) =>
    localStorage.getItem(key), storageKey
  )).toBeNull();
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
  await root.locator("[data-kp-economics-lesson-editor-toggle]").click();
  await root.locator(".cm-content").fill(
    "A locally retained edit with [$P$](kp-ref:price-axis-inline)."
  );
  await root.getByRole("button", { name: "Save to source" }).click();

  await expect(root.locator(
    "[data-kp-economics-lesson-editor-source-status]"
  )).toHaveText("The publication could not be regenerated.");
  await expect.poll(() => page.evaluate((key) => {
    const stored = localStorage.getItem(key);
    return stored === null ? "" : JSON.parse(stored).passages[0].sourceText;
  }, storageKey)).toContain("locally retained edit");
});

test("semantic reference completion exposes only supported authoring IDs", async ({
  page
}) => {
  const root = page.locator("[data-kp-economics-demand-shift-tutorial]");
  await root.locator("[data-kp-economics-lesson-editor-toggle]").click();
  const content = root.locator(".cm-content");
  await content.fill("Follow [$P$](kp-ref:");
  await content.press("Control+Space");

  const completion = page.locator(".cm-tooltip-autocomplete");
  await expect(completion).toBeVisible();
  await expect(completion).toContainText("price-axis-inline");
  await expect(completion).toContainText("axis-price");
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
  await root.locator("[data-kp-economics-lesson-editor-toggle]").click();
  await root.locator(".cm-content").fill("An unfinished $expression");

  await expect(root.locator(
    "[data-kp-economics-lesson-editor-validation]"
  )).toContainText("Unclosed inline math delimiter");
  await expect.poll(() => firstPassage.locator(
    ".kp-economics-tutorial__passage-ink"
  ).evaluate((element) => element.innerHTML)).toBe(initialHtml);
  await expect.poll(() => page.evaluate((key) => {
    const stored = localStorage.getItem(key);
    return stored === null ? "" : JSON.parse(stored).passages[0].sourceText;
  }, storageKey)).toBe("An unfinished $expression");
});
