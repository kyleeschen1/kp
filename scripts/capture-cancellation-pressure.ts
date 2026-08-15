import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import type { Locator, Page } from "playwright";

import {
  kpWitnessedAnnihilationMotionProfileV1
} from "../src/animation/witnessed-annihilation.ts";
import {
  buildKpVisualContactSheetHtml,
  type KpVisualContactSheetItem
} from "./capture-visual-contact-sheet.ts";
import { createKpVisualReviewHarness } from "./visual-review-harness.ts";

const outputRoot = path.resolve("tmp/codex/cancellation-pressure-checkpoint");
const animationId = "animation.generated.cancellation.additive-inverses";
const bindingSuffix = "generated-additive-inverses-cancel";
const timing = kpWitnessedAnnihilationMotionProfileV1.timing;
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
      timing.contactStart,
      timing.contactEnd,
      timing.witnessReadableAt,
      timing.witnessDwellEnd,
      timing.sourceAbsorptionEnd,
      timing.compactionEnd,
      1
    ]
  }, {
    phase: "return",
    samples: [
      timing.witnessDwellEnd,
      timing.witnessReadableAt,
      timing.contactEnd,
      0
    ]
  }]
} as const);

interface CaptureEvidence {
  readonly id: string;
  readonly phase: "forward" | "return";
  readonly progress: number;
  readonly choreographyPhase: string;
  readonly bindingId: string;
  readonly cancelingSourceOpacity: readonly [number, number];
  readonly protectedRightInverseOpacity: {
    readonly source: number;
    readonly target: number;
  };
  readonly witnessLatex: string;
  readonly witnessOpacity: number;
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
      motionProfileId: kpWitnessedAnnihilationMotionProfileV1.id,
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
  await input.page.waitForFunction(({ progress, bindingSuffix }) => {
    const transition = document.querySelector<HTMLElement>(
      "[data-kp-animation-catalogue-stage] " +
      "[data-kp-editor-equation-transition-id]"
    );
    return transition?.dataset[
      "kpEditorEquationWitnessedAnnihilationBinding"
    ]?.endsWith(bindingSuffix) === true &&
      Number(transition.dataset["kpEditorEquationSemanticProgress"]) ===
        progress;
  }, { progress: input.progress, bindingSuffix });
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
    const witness = root.querySelector<HTMLElement>(
      "[data-kp-editor-annihilation-witness]"
    );
    return {
      choreographyPhase: root.dataset["kpEditorAnnihilationPhase"] ?? "",
      bindingId:
        root.dataset["kpEditorEquationWitnessedAnnihilationBinding"] ?? "",
      cancelingSourceOpacity: [
        opacity('[data-kp-editor-equation-source] [data-kp-motion-id$=".lhs.addend"]'),
        opacity('[data-kp-editor-equation-source] [data-kp-motion-id$=".lhs.subtract"]')
      ] as const,
      protectedRightInverseOpacity: {
        source: opacity(
          '[data-kp-editor-equation-source] [data-kp-motion-id$=".rhs.subtract"]'
        ),
        target: opacity(
          '[data-kp-editor-equation-target] [data-kp-motion-id$=".rhs.subtract"]'
        )
      },
      witnessLatex: witness?.textContent?.trim() ?? "",
      witnessOpacity: witness === null
        ? -1
        : Number(getComputedStyle(witness).opacity),
      nativeEndpointCount: root.querySelectorAll(
        "[data-kp-editor-equation-object-id] .katex"
      ).length
    };
  });
  if (!state.bindingId.endsWith(bindingSuffix)) {
    throw new Error(`${id} lost its typed cancellation binding.`);
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
      const isReady = () => root.dataset[
        "kpEditorEquationWitnessedAnnihilationBinding"
      ]?.endsWith(input.bindingSuffix) === true;
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
      bindingSuffix,
      timeoutMs: cancellationCapturePolicy.preparationTimeoutMs
    });
}

await capture();
