import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import {
  createKpEquationSurfacePreservationMatrix
} from "../src/architecture/equation-surface-preservation-matrix.ts";
import {
  buildKpVisualContactSheetHtml,
  type KpVisualContactSheetItem
} from "./capture-visual-contact-sheet.ts";
import { createKpVisualReviewHarness } from "./visual-review-harness.ts";

const outputRoot = path.resolve(
  "tmp/codex/equation-surface-preservation"
);
const viewport = { width: 1_200, height: 760 } as const;
const checkpoint = 0.5;

async function capture(): Promise<void> {
  await mkdir(outputRoot, { recursive: true });
  const matrix = createKpEquationSurfacePreservationMatrix();
  const harness = createKpVisualReviewHarness();
  const items: KpVisualContactSheetItem[] = [];

  try {
    const page = await harness.page({ viewport, colorScheme: "dark" });
    for (const family of matrix.families) {
      const entry = matrix.entries.find(({ animationId }) =>
        animationId === family.representativeAnimationId)!;
      await page.goto(new URL(entry.route.href, harness.baseUrl).toString(), {
        waitUntil: "domcontentloaded"
      });
      const player = page.locator(
        `[data-kp-editor-animation-player]` +
        `[data-kp-editor-animation-id="${entry.animationId}"]`
      );
      const slot = player.locator(
        '[data-kp-editor-animation-surface-slot="equation"]'
      );
      await slot.waitFor();
      await page.waitForFunction((animationId) => {
        const selected = document.querySelector<HTMLElement>(
          `[data-kp-editor-animation-id="${animationId}"] ` +
          '[data-kp-editor-animation-surface-slot="equation"]'
        );
        return selected?.dataset["kpEditorAnimationAdapterStatus"] === "ready";
      }, entry.animationId);
      await player.locator(entry.directSeek.controlSelector)
        .fill(String(checkpoint));
      await page.evaluate(() => document.fonts.ready);
      await page.evaluate(() => new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));

      const file = path.join(outputRoot, `${family.familyId}.png`);
      await slot.screenshot({
        path: file,
        animations: "disabled"
      });
      const image = await readFile(file);
      items.push({
        id: family.familyId,
        label: `${family.familyId} · ${entry.animationId}`,
        progress: checkpoint,
        viewport,
        file: path.relative(process.cwd(), file),
        dataUrl: `data:image/png;base64,${image.toString("base64")}`
      });
    }

    const htmlSource = buildKpVisualContactSheetHtml(items, {
      title: "Equation surfaces · preservation matrix",
      columns: 2,
      imageFit: "contain",
      imageHeightPx: 300
    });
    const sheetPage = await harness.page({
      viewport: { width: 1_440, height: 1_000 }
    });
    await sheetPage.setContent(htmlSource, { waitUntil: "load" });
    const sheet = path.join(outputRoot, "contact-sheet.png");
    await sheetPage.screenshot({
      path: sheet,
      fullPage: true,
      animations: "disabled"
    });
    await writeFile(path.join(outputRoot, "index.html"), htmlSource, "utf8");
    await writeFile(path.join(outputRoot, "manifest.json"), `${JSON.stringify({
      schemaVersion: "kp.equation-surface-preservation-evidence.v1",
      checkpoint,
      representatives: matrix.families.map((family) => ({
        familyId: family.familyId,
        animationId: family.representativeAnimationId,
        file: `${family.familyId}.png`
      })),
      sheet: "contact-sheet.png"
    }, null, 2)}\n`, "utf8");
    console.log(`captured ${items.length} equation family representatives`);
    console.log(path.relative(process.cwd(), sheet));
  } finally {
    await harness.close();
  }
}

await capture();
