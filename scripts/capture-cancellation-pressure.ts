import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import type { Locator, Page } from "playwright";

import {
  kpCounterOrbitCancellationTiming
} from "../src/animation/counter-orbit-cancellation-timing.ts";
import {
  buildKpVisualContactSheetHtml,
  type KpVisualContactSheetItem
} from "./capture-visual-contact-sheet.ts";
import { createKpVisualReviewHarness } from "./visual-review-harness.ts";

const outputRoot = path.resolve("tmp/codex/cancellation-pressure-checkpoint");
const animationId = "animation.generated.cancellation.additive-inverses";
const timing = kpCounterOrbitCancellationTiming;
const survivorCompactionReviewProgress = 0.9;
const cancellationCapturePolicy = Object.freeze({
  pageViewport: { width: 1_240, height: 760 },
  equationCrop: { width: 520, height: 140 },
  sheetViewport: { width: 1_440, height: 1_100 },
  sheetColumns: 3,
  sheetImageHeightPx: 170,
  preparationTimeoutMs: 5_000,
  progressions: [{
    phase: "forward",
    samples: [
      0,
      timing.meetStart,
      midpoint(timing.meetStart, timing.contactAt),
      timing.contactAt,
      midpoint(timing.contactAt, timing.retirementEnd),
      timing.retirementEnd,
      survivorCompactionReviewProgress,
      1
    ]
  }, {
    phase: "return",
    samples: [
      timing.retirementEnd,
      timing.contactAt,
      midpoint(timing.meetStart, timing.contactAt),
      0
    ]
  }]
} as const);

interface CaptureEvidence {
  readonly id: string;
  readonly phase: "forward" | "return";
  readonly progress: number;
  readonly choreographyPhase: string;
  readonly cancellationRecipe: string;
  readonly cancelingSourceOpacity: readonly [number, number];
  readonly cancelingSourceCenters: readonly [
    { readonly x: number; readonly y: number },
    { readonly x: number; readonly y: number }
  ];
  readonly protectedRightInverseOpacity: {
    readonly source: number;
    readonly target: number;
  };
  readonly witnessCount: number;
  readonly nativeEndpointCount: number;
  readonly file: string;
}

async function capture(): Promise<void> {
  await mkdir(outputRoot, { recursive: true });
  const harness = createKpVisualReviewHarness();
  const items: KpVisualContactSheetItem[] = [];
  const evidence: CaptureEvidence[] = [];

  try {
    const page = await harness.page({
      viewport: cancellationCapturePolicy.pageViewport,
      colorScheme: "dark"
    });
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

    for (const progression of cancellationCapturePolicy.progressions) {
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
          viewport: cancellationCapturePolicy.equationCrop,
          file: captured.file,
          dataUrl: `data:image/png;base64,${image.toString("base64")}`
        });
      }
    }

    const htmlSource = buildKpVisualContactSheetHtml(items, {
      title: "Cancellation pressure · mandatory human checkpoint",
      columns: cancellationCapturePolicy.sheetColumns,
      imageFit: "contain",
      imageHeightPx: cancellationCapturePolicy.sheetImageHeightPx
    });
    const sheetPage = await harness.page({
      viewport: cancellationCapturePolicy.sheetViewport,
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
      schemaVersion: "kp.cancellation-pressure-visual-checkpoint.v1",
      animationId,
      motionProfileId: "counter-orbit-cancellation-v1",
      viewport: cancellationCapturePolicy.pageViewport,
      samples: evidence,
      sheet: path.relative(process.cwd(), sheet),
      html: path.relative(process.cwd(), html)
    }, null, 2)}\n`, "utf8");
    console.log(
      `cancellation checkpoint: ${path.relative(process.cwd(), sheet)}`
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
  await input.page.waitForFunction((progress) => {
    const transition = document.querySelector<HTMLElement>(
      "[data-kp-animation-catalogue-stage] " +
      "[data-kp-editor-equation-transition-id]"
    );
    return transition?.dataset["kpEditorEquationCancellationRecipe"] ===
        "counter-orbit-v1" &&
      transition.dataset["kpEditorEquationZeroWitnessRecipe"] === "none" &&
      Number(transition.dataset["kpEditorEquationSemanticProgress"]) ===
        progress;
  }, input.progress);
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
    const center = (selector: string) => {
      const element = root.querySelector<HTMLElement>(selector);
      if (element === null) return { x: -1, y: -1 };
      const rect = element.getBoundingClientRect();
      return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    };
    const addendSelector =
      '[data-kp-editor-equation-source] [data-kp-motion-id$=".lhs.addend"]';
    const inverseSelector =
      '[data-kp-editor-equation-source] [data-kp-motion-id$=".lhs.subtract"]';
    return {
      cancellationRecipe:
        root.dataset["kpEditorEquationCancellationRecipe"] ?? "",
      cancelingSourceOpacity: [
        opacity(addendSelector),
        opacity(inverseSelector)
      ] as const,
      cancelingSourceCenters: [
        center(addendSelector),
        center(inverseSelector)
      ] as const,
      protectedRightInverseOpacity: {
        source: opacity(
          '[data-kp-editor-equation-source] [data-kp-motion-id$=".rhs.subtract"]'
        ),
        target: opacity(
          '[data-kp-editor-equation-target] [data-kp-motion-id$=".rhs.subtract"]'
        )
      },
      witnessCount: root.querySelectorAll(
        "[data-kp-editor-annihilation-witness]"
      ).length,
      nativeEndpointCount: root.querySelectorAll(
        "[data-kp-editor-equation-object-id] .katex"
      ).length
    };
  });
  if (state.cancellationRecipe !== "counter-orbit-v1") {
    throw new Error(`${id} lost its typed counter-orbit policy.`);
  }
  if (state.witnessCount !== 0) {
    throw new Error(`${id} fabricated a visible identity witness.`);
  }
  if (state.nativeEndpointCount !== 2) {
    throw new Error(
      `${id} must retain two native equation endpoints: ` +
      JSON.stringify(state)
    );
  }
  return {
    id,
    phase: input.phase,
    progress: input.progress,
    choreographyPhase: phaseForProgress(input.progress),
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
  }, cancellationCapturePolicy.equationCrop);
  await page.screenshot({
    path: file,
    clip: crop,
    animations: "disabled"
  });
}

async function waitForReady(transition: Locator): Promise<void> {
  await transition.waitFor();
  await transition.evaluate((root, input) =>
    new Promise<void>((resolve, reject) => {
      const isReady = () =>
        root.dataset["kpEditorEquationCancellationRecipe"] ===
          "counter-orbit-v1" &&
        root.dataset["kpEditorEquationZeroWitnessRecipe"] === "none";
      if (isReady()) {
        resolve();
        return;
      }
      const timeout = window.setTimeout(() => {
        observer.disconnect();
        reject(new Error("Timed out preparing the cancellation pressure stage."));
      }, input.timeoutMs);
      const observer = new MutationObserver(() => {
        if (!isReady()) return;
        window.clearTimeout(timeout);
        observer.disconnect();
        resolve();
      });
      observer.observe(root, { attributes: true });
    }), {
      timeoutMs: cancellationCapturePolicy.preparationTimeoutMs
    });
}

function phaseForProgress(progress: number): string {
  if (progress < timing.meetStart) return "readable pair";
  if (progress < timing.contactAt) return "opposing arcs";
  if (progress === timing.contactAt) return "shared contact";
  if (progress < timing.retirementEnd) return "annihilation";
  if (progress < 1) return "survivor compaction";
  return "native endpoint";
}

function midpoint(start: number, end: number): number {
  return start + (end - start) / 2;
}

await capture();
