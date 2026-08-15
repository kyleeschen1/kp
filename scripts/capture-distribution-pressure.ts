import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import type { Locator, Page } from "playwright";

import {
  buildKpVisualContactSheetHtml,
  type KpVisualContactSheetItem
} from "./capture-visual-contact-sheet.ts";
import { createKpVisualReviewHarness } from "./visual-review-harness.ts";

const outputRoot = path.resolve("tmp/codex/distribution-pressure-checkpoint");
const animationId = "animation.generated.distribution.expand-a-sum";
const bindingId = "binding.distribution.expand-a-sum.pressure";
const captureViewport = { width: 420, height: 120 } as const;
const progressions = [
  {
    phase: "forward",
    samples: [0, 0.12, 0.42, 0.6, 0.72, 0.83, 0.94, 1]
  },
  {
    phase: "return",
    samples: [0.72, 0.42, 0]
  }
] as const;

interface CaptureEvidence {
  readonly id: string;
  readonly phase: "forward" | "return";
  readonly progress: number;
  readonly choreographyPhase: string;
  readonly bindingId: string;
  readonly sourceFactorOpacity: number;
  readonly visibleTargetFactorCount: number;
  readonly sourceConnectorOpacity: number;
  readonly targetConnectorOpacity: number;
  readonly nativeKatexEndpointCount: number;
  readonly file: string;
}

async function capture(): Promise<void> {
  await mkdir(outputRoot, { recursive: true });
  const harness = createKpVisualReviewHarness();
  const viewport = { width: 1_240, height: 760 } as const;
  const items: KpVisualContactSheetItem[] = [];
  const evidence: CaptureEvidence[] = [];

  try {
    const page = await harness.page({ viewport, colorScheme: "dark" });
    const url = new URL("/", harness.baseUrl);
    url.searchParams.set("artifact", animationId);
    await page.goto(url.toString(), { waitUntil: "domcontentloaded" });
    await page.addStyleTag({
      content: ".editor-equation-stage__caption { visibility: hidden !important; }"
    });
    const player = page.locator(
      `[data-kp-animation-catalogue-stage] ` +
      `[data-kp-editor-animation-player]` +
      `[data-kp-editor-animation-id="${animationId}"]`
    );
    const stage = player.locator("[data-kp-editor-equation-stage]");
    const transition = stage.locator(
      "[data-kp-editor-equation-transition-id]"
    );
    const seek = player.locator('[data-action="seek-editor-animation"]');
    await waitForReady(transition);

    for (const progression of progressions) {
      for (const progress of progression.samples) {
        const captured = await captureSample({
          page,
          stage,
          transition,
          seek,
          phase: progression.phase,
          progress
        });
        evidence.push(captured);
        const image = await readFile(path.resolve(captured.file));
        items.push({
          id: captured.id,
          label: `${progression.phase} · ${Math.round(progress * 100)}% · ` +
            captured.choreographyPhase,
          progress,
          viewport: captureViewport,
          file: captured.file,
          dataUrl: `data:image/png;base64,${image.toString("base64")}`
        });
      }
    }

    const htmlSource = buildKpVisualContactSheetHtml(items, {
      title: "Distribution pressure · mandatory human checkpoint",
      columns: 3,
      imageFit: "contain",
      imageHeightPx: 150
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
      schemaVersion: "kp.distribution-pressure-visual-checkpoint.v1",
      animationId,
      bindingId,
      viewport,
      samples: evidence,
      sheet: path.relative(process.cwd(), sheet),
      html: path.relative(process.cwd(), html)
    }, null, 2)}\n`, "utf8");
    console.log(
      `distribution checkpoint: ${path.relative(process.cwd(), sheet)}`
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
  readonly transition: Locator;
  readonly seek: Locator;
  readonly phase: "forward" | "return";
  readonly progress: number;
}): Promise<CaptureEvidence> {
  await input.seek.fill(String(input.progress));
  await input.page.waitForFunction(({ progress, bindingId }) => {
    const transition = document.querySelector<HTMLElement>(
      "[data-kp-animation-catalogue-stage] " +
      "[data-kp-editor-equation-transition-id]"
    );
    return transition?.dataset["kpEditorEquationDistributionBinding"] ===
      bindingId &&
      Number(transition.dataset["kpEditorEquationDistributionProgress"]) ===
      progress;
  }, { progress: input.progress, bindingId });
  await input.stage.evaluate(async (root) => {
    await root.ownerDocument.fonts.ready;
    await new Promise<void>((resolve) => requestAnimationFrame(() =>
      requestAnimationFrame(() => resolve())
    ));
  });
  const id = `${input.phase}-${String(input.progress).replace(".", "-")}`;
  const file = path.join(outputRoot, `${id}.png`);
  await captureEquationCrop(input.page, input.stage, file);
  const state = await input.transition.evaluate((root) => {
    const opacity = (selector: string): number => {
      const element = root.querySelector<HTMLElement>(selector);
      return element === null ? -1 : Number(getComputedStyle(element).opacity);
    };
    const visibleCount = (selector: string): number =>
      [...root.querySelectorAll<HTMLElement>(selector)]
        .filter((element) => Number(getComputedStyle(element).opacity) > 0.01)
        .length;
    return {
      choreographyPhase:
        root.dataset["kpEditorEquationDistributionPhase"] ?? "",
      bindingId:
        root.dataset["kpEditorEquationDistributionBinding"] ?? "",
      sourceFactorOpacity: opacity(
        '[data-kp-editor-equation-source] [data-kp-motion-id$=".factored.factor"]'
      ),
      visibleTargetFactorCount: visibleCount(
        '[data-kp-editor-equation-target] [data-kp-motion-id$="-factor"]'
      ),
      sourceConnectorOpacity: opacity(
        '[data-kp-editor-equation-source] [data-kp-motion-id$=".factored.plus"]'
      ),
      targetConnectorOpacity: opacity(
        '[data-kp-editor-equation-target] [data-kp-motion-id$=".expanded.plus"]'
      ),
      nativeKatexEndpointCount: root.querySelectorAll(".katex").length
    };
  });
  if (state.bindingId !== bindingId) {
    throw new Error(`${id} lost its typed distribution binding.`);
  }
  if (state.nativeKatexEndpointCount !== 2) {
    throw new Error(`${id} must retain exactly two native KaTeX endpoints.`);
  }
  return {
    id,
    phase: input.phase,
    progress: input.progress,
    ...state,
    file: path.relative(process.cwd(), file)
  };
}

async function captureEquationCrop(
  page: Page,
  stage: Locator,
  file: string
): Promise<void> {
  const crop = await stage.locator(".katex").evaluateAll((
    endpoints,
    { width, height }
  ) => {
    const rects = endpoints.map((endpoint) => endpoint.getBoundingClientRect());
    const left = Math.min(...rects.map((rect) => rect.left));
    const right = Math.max(...rects.map((rect) => rect.right));
    const top = Math.min(...rects.map((rect) => rect.top));
    const bottom = Math.max(...rects.map((rect) => rect.bottom));
    return {
      x: Math.max(0, (left + right - width) / 2 + window.scrollX),
      y: Math.max(0, (top + bottom - height) / 2 + window.scrollY),
      width,
      height
    };
  }, captureViewport);
  await page.screenshot({
    path: file,
    clip: crop,
    animations: "disabled"
  });
}

async function waitForReady(transition: Locator): Promise<void> {
  await transition.waitFor();
  await transition.evaluate((root, expectedBindingId) =>
    new Promise<void>((resolve, reject) => {
      if (
        root.dataset["kpEditorEquationDistributionBinding"] ===
        expectedBindingId
      ) {
        resolve();
        return;
      }
      const timeout = window.setTimeout(() => {
        observer.disconnect();
        reject(new Error("Timed out preparing the distribution pressure stage."));
      }, 5_000);
      const observer = new MutationObserver(() => {
        if (
          root.dataset["kpEditorEquationDistributionBinding"] !==
          expectedBindingId
        ) return;
        window.clearTimeout(timeout);
        observer.disconnect();
        resolve();
      });
      observer.observe(root, { attributes: true });
    }), bindingId);
}

await capture();
