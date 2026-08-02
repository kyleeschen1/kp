import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { chromium } from "playwright";

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
  { id: "wide-row-one", viewport: { width: 1440, height: 1000 }, progress: 0.18 },
  { id: "wide-handoff", viewport: { width: 1440, height: 1000 }, progress: 0.52 },
  { id: "wide-settled", viewport: { width: 1440, height: 1000 }, progress: 1 },
  { id: "narrow-handoff", viewport: { width: 390, height: 844 }, progress: 0.52 }
] as const;

await mkdir(outputRoot, { recursive: true });
const browser = await chromium.launch({ headless: true });
const captures: Array<{
  readonly id: string;
  readonly path: string;
  readonly progress: number;
  readonly viewport: { readonly width: number; readonly height: number };
  readonly activeRow: string;
  readonly resolvedThrough: string;
  readonly documentOverflow: boolean;
}> = [];

try {
  for (const checkpoint of checkpoints) {
    const page = await browser.newPage({ viewport: checkpoint.viewport });
    try {
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
          catalogue.dataset["kpAnimationCatalogueHostOutcome"] === "painted" &&
          player?.dataset["kpEditorAnimationHydrated"] === "true" &&
          Math.abs(Number(player.dataset["kpEditorAnimationProgress"]) -
            expectedProgress) < 0.001;
      }, { expectedId: animationId, expectedProgress: checkpoint.progress });

      const evidence = await page.evaluate(() => {
        const transition = document.querySelector<HTMLElement>(
          "[data-kp-editor-equation-transition-id]"
        );
        if (transition === null) {
          throw new Error("Matrix-vector transition did not paint.");
        }
        return {
          activeRow:
            transition.dataset["kpEditorEquationMatrixVectorActiveRow"] ?? "",
          resolvedThrough:
            transition.dataset[
              "kpEditorEquationMatrixVectorResolvedThrough"
            ] ?? "",
          documentOverflow:
            document.documentElement.scrollWidth > window.innerWidth + 1
        };
      });
      if (evidence.documentOverflow) {
        throw new Error(`${checkpoint.id} overflowed the document horizontally.`);
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
} finally {
  await browser.close();
}

const manifestPath = path.join(outputRoot, "manifest.json");
await writeFile(manifestPath, `${JSON.stringify({
  schemaVersion: "kp.matrix-linear-map-visual-capture.v1",
  animationId,
  disposition: "Unreviewed",
  imagesAreDisposable: true,
  captures
}, null, 2)}\n`, "utf8");
console.log(
  `matrix-linear-map visual capture: ${path.relative(process.cwd(), manifestPath)}`
);
