import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { Locator, Page } from "playwright";

import {
  buildKpVisualContactSheetHtml,
  type KpVisualContactSheetItem
} from "./capture-visual-contact-sheet.ts";
import { createKpVisualReviewHarness } from "./visual-review-harness.ts";

const outputRoot = path.resolve(
  "tmp/codex/fraction-equivalence-checkpoint"
);
const presentations = [{
  mode: "explain-unit-factor",
  animationId: "animation.equation.fraction-equivalence.v1"
}, {
  mode: "compact-paired-operation",
  animationId: "animation.equation.fraction-equivalence.compact.v1"
}] as const;
const viewport = { width: 1_080, height: 720 } as const;
const themes = ["dark", "light"] as const;
const progressions = [{
  phase: "forward",
  samples: [0, 0.25, 0.5, 0.75, 1]
}, {
  phase: "return",
  samples: [0.75, 0.5, 0.25, 0]
}] as const;

interface CaptureEvidence {
  readonly id: string;
  readonly mode: typeof presentations[number]["mode"];
  readonly animationId: string;
  readonly theme: "dark" | "light";
  readonly phase: "forward" | "return";
  readonly progress: number;
  readonly visualOwner: string;
  readonly activeEndpointCount: number;
  readonly visibleMaterialOwnerCount: number;
  readonly file: string;
}

async function capture(): Promise<void> {
  await mkdir(outputRoot, { recursive: true });
  const harness = createKpVisualReviewHarness();
  const items: KpVisualContactSheetItem[] = [];
  const evidence: CaptureEvidence[] = [];
  try {
    for (const presentation of presentations) {
      for (const theme of themes) {
        const page = await harness.page({ viewport, colorScheme: theme });
        const url = new URL("/", harness.baseUrl);
        url.searchParams.set("artifact", presentation.animationId);
        url.searchParams.set("theme", theme);
        await page.goto(url.toString(), { waitUntil: "domcontentloaded" });
        const stage = page.locator(
          `[data-kp-animation-catalogue-stage] ` +
          `[data-kp-fraction-equivalence-stage]`
        );
        const seek = page.locator(
          `[data-kp-editor-animation-id="${presentation.animationId}"] ` +
          `[data-action="seek-editor-animation"]`
        );
        await waitForReady(stage);
        for (const progression of progressions) {
          for (const progress of progression.samples) {
            const captured = await captureSample({
              page,
              stage,
              seek,
              mode: presentation.mode,
              animationId: presentation.animationId,
              theme,
              phase: progression.phase,
              progress
            });
            evidence.push(captured);
            const image = await readFile(path.resolve(captured.file));
            items.push({
              id: captured.id,
              label:
                `${presentation.mode} · ${theme} · ${progression.phase} · ` +
                `${Math.round(progress * 100)}%`,
              progress,
              viewport,
              file: captured.file,
              dataUrl: `data:image/png;base64,${image.toString("base64")}`
            });
          }
        }
      }
    }
    const htmlSource = buildKpVisualContactSheetHtml(items, {
      title: "Fraction equivalence · mandatory human checkpoint",
      columns: 3,
      imageFit: "contain"
    });
    const sheetPage = await harness.page({
      viewport: { width: 1_440, height: 1_000 },
      colorScheme: "dark"
    });
    await sheetPage.setContent(htmlSource, { waitUntil: "load" });
    const sheet = path.join(outputRoot, "contact-sheet.png");
    await sheetPage.screenshot({
      path: sheet,
      fullPage: true,
      animations: "disabled"
    });
    const html = path.join(outputRoot, "index.html");
    await writeFile(html, htmlSource, "utf8");
    const manifest = path.join(outputRoot, "manifest.json");
    await writeFile(manifest, `${JSON.stringify({
      schemaVersion: "kp.fraction-equivalence-visual-checkpoint.v1",
      presentations,
      themes,
      viewport,
      samples: evidence,
      sheet: path.relative(process.cwd(), sheet),
      html: path.relative(process.cwd(), html)
    }, null, 2)}\n`, "utf8");
    console.log(
      `fraction-equivalence checkpoint: ${path.relative(process.cwd(), sheet)}`
    );
    console.log(`review sheet: ${path.relative(process.cwd(), html)}`);
    console.log(`manifest: ${path.relative(process.cwd(), manifest)}`);
  } finally {
    await harness.close();
  }
}

async function captureSample(input: {
  readonly page: Page;
  readonly stage: Locator;
  readonly seek: Locator;
  readonly mode: typeof presentations[number]["mode"];
  readonly animationId: string;
  readonly theme: "dark" | "light";
  readonly phase: "forward" | "return";
  readonly progress: number;
}): Promise<CaptureEvidence> {
  await input.seek.fill(String(input.progress));
  await input.page.waitForFunction(({ progress }) => {
    const stage = document.querySelector<HTMLElement>(
      "[data-kp-fraction-equivalence-stage]"
    );
    return Number(stage?.dataset["kpFractionEquivalenceProgress"]) === progress;
  }, { progress: input.progress });
  await input.stage.evaluate(async (root) => {
    await root.ownerDocument.fonts.ready;
    await new Promise<void>((resolve) => requestAnimationFrame(() =>
      requestAnimationFrame(() => resolve())
    ));
  });
  const id = [
    input.mode,
    input.theme,
    input.phase,
    String(input.progress).replace(".", "-")
  ].join("-");
  const file = path.join(outputRoot, `${id}.png`);
  await input.stage.screenshot({ path: file, animations: "disabled" });
  const state = await input.stage.evaluate((root) => ({
    visualOwner: root.dataset["kpFractionEquivalenceVisualOwner"] ?? "",
    activeEndpointCount: [...root.querySelectorAll<HTMLElement>(
      ".kp-fraction-equivalence-stage__endpoint"
    )].filter((endpoint) => endpoint.getAttribute("aria-hidden") === "false")
      .length,
    visibleMaterialOwnerCount: [...root.querySelectorAll<HTMLElement>(
      "[data-kp-equation-material-owner-id]"
    )].filter((owner) => Number(getComputedStyle(owner).opacity) > 0).length
  }));
  if (state.activeEndpointCount !== 1) {
    throw new Error(`${id} must expose exactly one accessible equation.`);
  }
  return {
    id,
    mode: input.mode,
    animationId: input.animationId,
    theme: input.theme,
    phase: input.phase,
    progress: input.progress,
    ...state,
    file: path.relative(process.cwd(), file)
  };
}

async function waitForReady(stage: Locator): Promise<void> {
  await stage.waitFor();
  await stage.evaluate((root) => new Promise<void>((resolve, reject) => {
    if (root.dataset["kpFractionEquivalenceStage"] === "ready") {
      resolve();
      return;
    }
    const timeout = window.setTimeout(() => {
      observer.disconnect();
      reject(new Error(
        root.dataset["kpFractionEquivalenceError"] ??
        "Timed out preparing fraction-equivalence stage."
      ));
    }, 5_000);
    const observer = new MutationObserver(() => {
      if (root.dataset["kpFractionEquivalenceStage"] === "preparing") return;
      window.clearTimeout(timeout);
      observer.disconnect();
      if (root.dataset["kpFractionEquivalenceStage"] === "ready") resolve();
      else reject(new Error(
        root.dataset["kpFractionEquivalenceError"] ??
        "Fraction-equivalence stage failed."
      ));
    });
    observer.observe(root, {
      attributes: true,
      attributeFilter: ["data-kp-fraction-equivalence-stage"]
    });
  }));
}

await capture();
