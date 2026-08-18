import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import type { Locator, Page } from "playwright";

import {
  buildKpVisualContactSheetHtml,
  type KpVisualContactSheetItem
} from "./capture-visual-contact-sheet.ts";
import { createKpVisualReviewHarness } from "./visual-review-harness.ts";

const outputRoot = path.resolve(
  "tmp/codex/logarithm-change-of-base-checkpoint"
);
const animationId = "animation.equation.logarithm-change-of-base.v1";
const viewports = [{
  id: "wide",
  viewport: { width: 1_240, height: 760 }
}, {
  id: "phone",
  viewport: { width: 390, height: 844 }
}] as const;
const progressions = [{
  phase: "forward",
  samples: [0, 0.25, 0.5, 0.75, 1]
}, {
  phase: "return",
  samples: [0.75, 0.5, 0.25, 0]
}] as const;

interface CaptureEvidence {
  readonly id: string;
  readonly viewportId: "wide" | "phone";
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
    for (const profile of viewports) {
      const page = await harness.page({
        viewport: profile.viewport,
        colorScheme: "dark"
      });
      const url = new URL("/", harness.baseUrl);
      url.searchParams.set("artifact", animationId);
      await page.goto(url.toString(), { waitUntil: "domcontentloaded" });
      const stage = page.locator(
        `[data-kp-animation-catalogue-stage] ` +
        `[data-kp-logarithm-change-of-base-stage]`
      );
      const seek = page.locator(
        `[data-kp-editor-animation-id="${animationId}"] ` +
        `[data-action="seek-editor-animation"]`
      );
      await waitForReady(stage);
      for (const progression of progressions) {
        for (const progress of progression.samples) {
          const captured = await captureSample({
            page,
            stage,
            seek,
            viewportId: profile.id,
            phase: progression.phase,
            progress
          });
          evidence.push(captured);
          const image = await readFile(path.resolve(captured.file));
          items.push({
            id: captured.id,
            label:
              `${profile.id} · ${progression.phase} · ` +
              `${Math.round(progress * 100)}%`,
            progress,
            viewport: profile.viewport,
            file: captured.file,
            dataUrl: `data:image/png;base64,${image.toString("base64")}`
          });
        }
      }
    }
    const htmlSource = buildKpVisualContactSheetHtml(items, {
      title: "Change logarithm base · mandatory human checkpoint",
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
      schemaVersion:
        "kp.logarithm-change-of-base-visual-checkpoint.v1",
      animationId,
      viewports,
      samples: evidence,
      sheet: path.relative(process.cwd(), sheet),
      html: path.relative(process.cwd(), html)
    }, null, 2)}\n`, "utf8");
    console.log(
      `change-of-base checkpoint: ${path.relative(process.cwd(), sheet)}`
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
  readonly viewportId: "wide" | "phone";
  readonly phase: "forward" | "return";
  readonly progress: number;
}): Promise<CaptureEvidence> {
  await input.seek.fill(String(input.progress));
  await input.page.waitForFunction(({ progress }) => {
    const stage = document.querySelector<HTMLElement>(
      "[data-kp-logarithm-change-of-base-stage]"
    );
    return Number(
      stage?.dataset["kpLogarithmChangeOfBaseProgress"]
    ) === progress;
  }, { progress: input.progress });
  await input.stage.evaluate(async (root) => {
    await root.ownerDocument.fonts.ready;
    await new Promise<void>((resolve) => requestAnimationFrame(() =>
      requestAnimationFrame(() => resolve())
    ));
  });
  const id = [
    input.viewportId,
    input.phase,
    String(input.progress).replace(".", "-")
  ].join("-");
  const file = path.join(outputRoot, `${id}.png`);
  await input.stage.screenshot({ path: file, animations: "disabled" });
  const state = await input.stage.evaluate((root) => ({
    visualOwner:
      root.dataset["kpLogarithmChangeOfBaseVisualOwner"] ?? "",
    activeEndpointCount: [...root.querySelectorAll<HTMLElement>(
      ".kp-logarithm-change-of-base-stage__endpoint"
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
    viewportId: input.viewportId,
    phase: input.phase,
    progress: input.progress,
    ...state,
    file: path.relative(process.cwd(), file)
  };
}

async function waitForReady(stage: Locator): Promise<void> {
  await stage.waitFor();
  await stage.evaluate((root) => new Promise<void>((resolve, reject) => {
    if (root.dataset["kpLogarithmChangeOfBaseStage"] === "ready") {
      resolve();
      return;
    }
    const timeout = window.setTimeout(() => {
      observer.disconnect();
      reject(new Error(
        root.dataset["kpLogarithmChangeOfBaseError"] ??
        "Timed out preparing change-of-base stage."
      ));
    }, 5_000);
    const observer = new MutationObserver(() => {
      if (root.dataset["kpLogarithmChangeOfBaseStage"] === "preparing") {
        return;
      }
      window.clearTimeout(timeout);
      observer.disconnect();
      if (root.dataset["kpLogarithmChangeOfBaseStage"] === "ready") resolve();
      else reject(new Error(
        root.dataset["kpLogarithmChangeOfBaseError"] ??
        "Change-of-base stage failed."
      ));
    });
    observer.observe(root, {
      attributes: true,
      attributeFilter: ["data-kp-logarithm-change-of-base-stage"]
    });
  }));
}

await capture();
