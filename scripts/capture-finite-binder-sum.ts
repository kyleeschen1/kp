import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import type { Locator, Page } from "playwright";

import {
  buildKpVisualContactSheetHtml,
  type KpVisualContactSheetItem
} from "./capture-visual-contact-sheet.ts";
import { createKpVisualReviewHarness } from "./visual-review-harness.ts";

const outputRoot = path.resolve("tmp/codex/finite-binder-sum-checkpoint");
const animationId = "animation.equation.finite-sum-expansion.v1";
const profiles = [{
  id: "wide",
  viewport: { width: 1_240, height: 760 },
  samples: [0, 0.18, 0.28, 0.44, 0.5, 0.66, 0.72, 0.88, 1, 0.6, 0]
}, {
  id: "phone",
  viewport: { width: 390, height: 844 },
  samples: [0, 0.18, 0.5, 0.72, 1]
}] as const;

interface CaptureEvidence {
  readonly id: string;
  readonly viewportId: "wide" | "phone";
  readonly progress: number;
  readonly visualOwner: string;
  readonly accessibleEndpointCount: number;
  readonly retainedContextVisible: boolean;
  readonly visibleMaterialOwnerCount: number;
  readonly file: string;
}

async function capture(): Promise<void> {
  await mkdir(outputRoot, { recursive: true });
  const harness = createKpVisualReviewHarness();
  const items: KpVisualContactSheetItem[] = [];
  const evidence: CaptureEvidence[] = [];
  try {
    for (const profile of profiles) {
      const page = await harness.page({
        viewport: profile.viewport,
        colorScheme: "dark"
      });
      const url = new URL("/", harness.baseUrl);
      url.searchParams.set("artifact", animationId);
      url.searchParams.set("playhead", "0");
      await page.goto(url.toString(), { waitUntil: "domcontentloaded" });
      const stage = page.locator(
        `[data-kp-animation-catalogue-stage] [data-kp-finite-sum-stage]`
      );
      const seek = page.locator(
        `[data-kp-editor-animation-id="${animationId}"] ` +
        `[data-action="seek-editor-animation"]`
      );
      await waitForReady(stage);
      for (const [ordinal, progress] of profile.samples.entries()) {
        const captured = await captureSample({
          page,
          stage,
          seek,
          viewportId: profile.id,
          ordinal,
          progress
        });
        evidence.push(captured);
        const image = await readFile(path.resolve(captured.file));
        items.push({
          id: captured.id,
          label: `${profile.id} · ${Math.round(progress * 100)}%`,
          progress,
          viewport: profile.viewport,
          file: captured.file,
          dataUrl: `data:image/png;base64,${image.toString("base64")}`
        });
      }
    }
    const htmlSource = buildKpVisualContactSheetHtml(items, {
      title: "Finite sum expansion · mandatory human checkpoint",
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
      schemaVersion: "kp.finite-binder-sum-visual-checkpoint.v1",
      animationId,
      profiles,
      samples: evidence,
      sheet: path.relative(process.cwd(), sheet),
      html: path.relative(process.cwd(), html)
    }, null, 2)}\n`, "utf8");
    console.log(`finite-sum checkpoint: ${path.relative(process.cwd(), sheet)}`);
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
  readonly ordinal: number;
  readonly progress: number;
}): Promise<CaptureEvidence> {
  await input.seek.fill(String(input.progress));
  await input.page.waitForFunction(({ progress }) => {
    const stage = document.querySelector<HTMLElement>(
      "[data-kp-finite-sum-stage]"
    );
    return Number(stage?.dataset["kpFiniteSumProgress"]) === progress;
  }, { progress: input.progress });
  await input.stage.evaluate(async (root) => {
    await root.ownerDocument.fonts.ready;
    await new Promise<void>((resolve) => requestAnimationFrame(() =>
      requestAnimationFrame(() => resolve())
    ));
  });
  const id = `${input.viewportId}-${input.ordinal}-${String(input.progress)
    .replace(".", "-")}`;
  const file = path.join(outputRoot, `${id}.png`);
  await input.stage.screenshot({ path: file, animations: "disabled" });
  const state = await input.stage.evaluate((root) => ({
    visualOwner: root.dataset["kpFiniteSumVisualOwner"] ?? "",
    accessibleEndpointCount: [...root.querySelectorAll<HTMLElement>(
      '.kp-finite-sum-stage__endpoint[aria-hidden="false"]'
    )].length,
    retainedContextVisible: [
      root.querySelector<HTMLElement>(".kp-finite-sum-stage__frozen-source"),
      root.querySelector<HTMLElement>(".kp-finite-sum-stage__relation")
    ].every((element) => element !== null &&
      Number(getComputedStyle(element).opacity) > 0.01),
    visibleMaterialOwnerCount: [...root.querySelectorAll<HTMLElement>(
      "[data-kp-equation-material-owner-id]"
    )].filter((owner) => Number(getComputedStyle(owner).opacity) > 0.01).length
  }));
  const expectedEndpointCount = input.progress === 1 ? 1 : 0;
  if (state.accessibleEndpointCount !== expectedEndpointCount) {
    throw new Error(
      `${id} expected ${expectedEndpointCount} accessible live endpoints.`
    );
  }
  if (!state.retainedContextVisible) {
    throw new Error(`${id} must keep source and equality context visible.`);
  }
  return {
    id,
    viewportId: input.viewportId,
    progress: input.progress,
    ...state,
    file: path.relative(process.cwd(), file)
  };
}

async function waitForReady(stage: Locator): Promise<void> {
  await stage.waitFor();
  await stage.evaluate((root) => new Promise<void>((resolve, reject) => {
    if (root.dataset["kpFiniteSumStage"] === "ready") {
      resolve();
      return;
    }
    const timeout = window.setTimeout(() => {
      observer.disconnect();
      reject(new Error(
        root.dataset["kpFiniteSumError"] ??
        "Timed out preparing finite-sum stage."
      ));
    }, 5_000);
    const observer = new MutationObserver(() => {
      if (root.dataset["kpFiniteSumStage"] === "preparing") return;
      window.clearTimeout(timeout);
      observer.disconnect();
      if (root.dataset["kpFiniteSumStage"] === "ready") resolve();
      else reject(new Error(
        root.dataset["kpFiniteSumError"] ?? "Finite-sum stage failed."
      ));
    });
    observer.observe(root, {
      attributes: true,
      attributeFilter: ["data-kp-finite-sum-stage"]
    });
  }));
}

await capture();
