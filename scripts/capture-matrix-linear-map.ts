import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { chromium } from "playwright";
import {
  buildKpVisualContactSheetHtml,
  type KpVisualContactSheetItem
} from "./capture-visual-contact-sheet.ts";

const animationId =
  "animation.generated.linear-algebra.matrix-vector.two-by-two";
const baseUrl =
  process.env["KP_VISUAL_BASE_URL"] ?? "http://127.0.0.1:8000";
const outputRoot = path.resolve(
  process.env["KP_VISUAL_OUTPUT"] ?? "tmp/codex/matrix-linear-map"
);

// This stable entrypoint grows with the exemplar; disposable captures never
// become visual truth until the human checkpoint promotes a treatment.
const checkpoints = [
  { id: "wide-row-one", label: "Wide · first-row products", viewport: { width: 1440, height: 1000 }, progress: 0.25 },
  { id: "wide-handoff", label: "Wide · row handoff", viewport: { width: 1440, height: 1000 }, progress: 0.52 },
  { id: "wide-gather", label: "Wide · gather and geometry", viewport: { width: 1440, height: 1000 }, progress: 0.8 },
  { id: "wide-settled", label: "Wide · exact settlement", viewport: { width: 1440, height: 1000 }, progress: 1 },
  { id: "narrow-handoff", label: "Phone · row handoff", viewport: { width: 390, height: 844 }, progress: 0.52 },
  { id: "narrow-settled", label: "Phone · exact settlement", viewport: { width: 390, height: 844 }, progress: 1 },
  { id: "reduced-gather", label: "Reduced motion · gather", viewport: { width: 1024, height: 900 }, progress: 0.8, reducedMotion: true },
  { id: "static-row-complete", label: "Static · row completion", viewport: { width: 1024, height: 900 }, progress: 0.92, staticMode: true }
] as const;

await mkdir(outputRoot, { recursive: true });
const browser = await chromium.launch({ headless: true });
const captures: Array<{
  readonly id: string;
  readonly path: string;
  readonly progress: number;
  readonly viewport: { readonly width: number; readonly height: number };
  readonly label: string;
  readonly activeRow: string;
  readonly resolvedThrough: string;
  readonly accessibilityMode: string;
  readonly motionPolicy: string;
  readonly graphAdapterStatus: string;
  readonly stageContained: boolean;
  readonly documentOverflow: boolean;
}> = [];
let contactSheetPath = "";
let contactSheetHtmlPath = "";

try {
  for (const checkpoint of checkpoints) {
    const page = await browser.newPage({ viewport: checkpoint.viewport });
    try {
      if ("reducedMotion" in checkpoint && checkpoint.reducedMotion) {
        await page.emulateMedia({ reducedMotion: "reduce" });
      }
      const url = new URL("/", baseUrl);
      url.searchParams.set("artifact", animationId);
      url.searchParams.set("playhead", String(checkpoint.progress));
      await page.goto(url.toString(), { waitUntil: "networkidle" });
      await page.evaluate(async () => document.fonts.ready);
      await page.waitForFunction(({ expectedId, expectedProgress }) => {
        const catalogue = document.querySelector<HTMLElement>(
          "[data-kp-animation-catalogue]"
        );
        const player = catalogue?.querySelector<HTMLElement>(
          "[data-kp-editor-animation-player]"
        );
        return catalogue?.dataset["kpAnimationCatalogueSelection"] ===
          expectedId &&
          player?.dataset["kpEditorAnimationHydrated"] === "true" &&
          player.querySelector<HTMLElement>(
            '[data-kp-editor-animation-surface-slot="equation"]'
          )?.dataset["kpEditorAnimationAdapterStatus"] === "ready" &&
          Math.abs(Number(player.dataset["kpEditorAnimationProgress"]) -
            expectedProgress) < 0.001;
      }, { expectedId: animationId, expectedProgress: checkpoint.progress });

      if ("staticMode" in checkpoint && checkpoint.staticMode) {
        await page.evaluate(() => {
          const player = document.querySelector<HTMLElement>(
            "[data-kp-editor-animation-player]"
          );
          const scrubber = player?.querySelector<HTMLInputElement>(
            '[data-action="seek-editor-animation"]'
          );
          if (player === null || player === undefined ||
            scrubber === null || scrubber === undefined) {
            throw new Error("Static matrix checkpoint controls are missing.");
          }
          player.dataset["kpEditorAnimationAccessibilityMode"] = "static";
          scrubber.dispatchEvent(new Event("input", { bubbles: true }));
        });
      }
      const expectedAccessibilityMode =
        "staticMode" in checkpoint && checkpoint.staticMode
          ? "static"
          : "reducedMotion" in checkpoint && checkpoint.reducedMotion
            ? "reduced-motion"
            : "full-motion";
      await page.waitForFunction((expectedMode) => {
        const player = document.querySelector<HTMLElement>(
          "[data-kp-editor-animation-player]"
        );
        const view = player?.querySelector<HTMLElement>(
          "[data-kp-matrix-linear-map-view]"
        );
        return player?.dataset["kpEditorAnimationAccessibilityMode"] ===
          expectedMode && view?.dataset["kpMatrixLinearMapMotionPolicy"] ===
          (expectedMode === "reduced-motion" || expectedMode === "static"
            ? "discrete"
            : "continuous");
      }, expectedAccessibilityMode);

      const evidence = await page.evaluate(() => {
        const transition = document.querySelector<HTMLElement>(
          "[data-kp-editor-equation-transition-id]"
        );
        if (transition === null) {
          throw new Error("Matrix-vector transition did not paint.");
        }
        const player = transition.closest<HTMLElement>(
          "[data-kp-editor-animation-player]"
        );
        const stage = player?.querySelector<HTMLElement>(
          "[data-kp-editor-animation-stage]"
        );
        const catalogueStage = player?.closest<HTMLElement>(
          "[data-kp-animation-catalogue-stage]"
        );
        const view = player?.querySelector<HTMLElement>(
          "[data-kp-matrix-linear-map-view]"
        );
        const graphSlot = player?.querySelector<HTMLElement>(
          '[data-kp-editor-animation-surface-slot="graph"]'
        );
        if (player === null || player === undefined || stage === null ||
          stage === undefined || catalogueStage === null ||
          catalogueStage === undefined || view === null || view === undefined ||
          graphSlot === null || graphSlot === undefined) {
          throw new Error("Matrix review geometry targets are missing.");
        }
        const stageRect = stage.getBoundingClientRect();
        const catalogueRect = catalogueStage.getBoundingClientRect();
        return {
          activeRow:
            transition.dataset["kpEditorEquationMatrixVectorActiveRow"] ?? "",
          resolvedThrough:
            transition.dataset[
              "kpEditorEquationMatrixVectorResolvedThrough"
            ] ?? "",
          accessibilityMode:
            player.dataset["kpEditorAnimationAccessibilityMode"] ?? "",
          motionPolicy:
            view.dataset["kpMatrixLinearMapMotionPolicy"] ?? "",
          graphAdapterStatus:
            graphSlot.dataset["kpEditorAnimationAdapterStatus"] ?? "",
          stageContained:
            stageRect.left >= catalogueRect.left - 1 &&
            stageRect.right <= catalogueRect.right + 1 &&
            stageRect.top >= catalogueRect.top - 1 &&
            stageRect.bottom <= catalogueRect.bottom + 1,
          documentOverflow:
            document.documentElement.scrollWidth > window.innerWidth + 1
        };
      });
      if (
        evidence.documentOverflow ||
        !evidence.stageContained ||
        evidence.graphAdapterStatus !== "ready" ||
        evidence.accessibilityMode !== expectedAccessibilityMode
      ) {
        throw new Error(
          `${checkpoint.id} review evidence drifted: ${JSON.stringify(evidence)}`
        );
      }

      const imagePath = path.join(outputRoot, `${checkpoint.id}.png`);
      await page.screenshot({
        path: imagePath,
        fullPage: true,
        animations: "disabled"
      });
      captures.push({
        ...checkpoint,
        path: path.relative(process.cwd(), imagePath),
        ...evidence
      });
    } finally {
      await page.close();
    }
  }

  const contactSheetItems: KpVisualContactSheetItem[] = await Promise.all(
    captures.map(async (capture) => ({
      id: capture.id,
      label: capture.label,
      progress: capture.progress,
      viewport: capture.viewport,
      file: capture.path,
      dataUrl: `data:image/png;base64,${(
        await readFile(path.resolve(capture.path))
      ).toString("base64")}`
    }))
  );
  const contactSheetHtml = buildKpVisualContactSheetHtml(contactSheetItems, {
    title: "Kinetic Press · matrix to linear map",
    columns: 2,
    imageFit: "contain"
  });
  contactSheetHtmlPath = path.join(outputRoot, "index.html");
  await writeFile(contactSheetHtmlPath, contactSheetHtml, "utf8");
  const sheetPage = await browser.newPage({
    viewport: { width: 1440, height: 1000 }
  });
  try {
    await sheetPage.setContent(contactSheetHtml, { waitUntil: "load" });
    contactSheetPath = path.join(outputRoot, "contact-sheet.png");
    await sheetPage.screenshot({
      path: contactSheetPath,
      fullPage: true,
      animations: "disabled"
    });
  } finally {
    await sheetPage.close();
  }
} finally {
  await browser.close();
}

const manifestPath = path.join(outputRoot, "manifest.json");
await writeFile(manifestPath, `${JSON.stringify({
  schemaVersion: "kp.matrix-linear-map-visual-capture.v1",
  animationId,
  disposition: "Unreviewed",
  imagesAreDisposable: true,
  contactSheet: path.relative(process.cwd(), contactSheetPath),
  contactSheetHtml: path.relative(process.cwd(), contactSheetHtmlPath),
  captures
}, null, 2)}\n`, "utf8");
console.log(
  `matrix-linear-map visual capture: ${path.relative(process.cwd(), manifestPath)}`
);
