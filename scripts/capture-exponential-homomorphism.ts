import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import type { Locator, Page } from "playwright";

import {
  buildKpVisualContactSheetHtml,
  type KpVisualContactSheetItem
} from "./capture-visual-contact-sheet.ts";
import { createKpVisualReviewHarness } from "./visual-review-harness.ts";

const animationId =
  "animation.algebra.exponential-homomorphism.sum-to-product";
const outputRoot = path.resolve(
  "tmp/codex/exponential-homomorphism-checkpoint"
);
const desktopViewport = { width: 1_240, height: 760 } as const;
const narrowViewport = { width: 390, height: 760 } as const;

type CheckpointPhase = "forward" | "direct-seek" | "rewind" | "narrow";

interface Checkpoint {
  readonly id: string;
  readonly label: string;
  readonly phase: CheckpointPhase;
  readonly progress: number;
  readonly viewport: typeof desktopViewport | typeof narrowViewport;
}

const desktopCheckpoints = Object.freeze([
  { id: "forward-000", label: "forward · source", phase: "forward", progress: 0 },
  { id: "forward-019", label: "forward · homomorphism begins resolving", phase: "forward", progress: 0.19 },
  { id: "forward-022", label: "forward · anchor settles", phase: "forward", progress: 0.22 },
  { id: "forward-027", label: "forward · carrier fission and connector release", phase: "forward", progress: 0.27 },
  { id: "forward-030", label: "forward · branches resolved", phase: "forward", progress: 0.3 },
  { id: "forward-100", label: "forward · target", phase: "forward", progress: 1 },
  { id: "seek-073", label: "direct seek · 73%", phase: "direct-seek", progress: 0.73 },
  { id: "seek-027", label: "direct seek · 27%", phase: "direct-seek", progress: 0.27 },
  { id: "rewind-078", label: "rewind · 78%", phase: "rewind", progress: 0.78 },
  { id: "rewind-046", label: "rewind · 46%", phase: "rewind", progress: 0.46 },
  { id: "rewind-018", label: "rewind · 18%", phase: "rewind", progress: 0.18 },
  { id: "rewind-000", label: "rewind · source", phase: "rewind", progress: 0 }
] satisfies readonly Omit<Checkpoint, "viewport">[]);

const narrowCheckpoints = Object.freeze([
  { id: "narrow-000", label: "narrow · source", phase: "narrow", progress: 0 },
  { id: "narrow-050", label: "narrow · midpoint", phase: "narrow", progress: 0.5 },
  { id: "narrow-100", label: "narrow · target", phase: "narrow", progress: 1 }
] satisfies readonly Omit<Checkpoint, "viewport">[]);

interface CaptureEvidence {
  readonly id: string;
  readonly phase: CheckpointPhase;
  readonly progress: number;
  readonly viewport: Checkpoint["viewport"];
  readonly visualOwner: string;
  readonly accessibleLatex: string | null;
  readonly visibleMaterialOwnerCount: number;
  readonly measurementRevision: number;
  readonly file: string;
}

async function capture(): Promise<void> {
  await mkdir(outputRoot, { recursive: true });
  const harness = createKpVisualReviewHarness();
  const items: KpVisualContactSheetItem[] = [];
  const evidence: CaptureEvidence[] = [];

  try {
    const desktopPage = await harness.page({
      viewport: desktopViewport,
      colorScheme: "dark"
    });
    await openExemplar(desktopPage, harness.baseUrl);
    const desktopStage = stageFor(desktopPage);
    const desktopSeek = seekFor(desktopPage);
    await waitForReady(desktopStage);
    for (const checkpoint of desktopCheckpoints) {
      await captureCheckpoint({
        checkpoint: { ...checkpoint, viewport: desktopViewport },
        page: desktopPage,
        stage: desktopStage,
        seek: desktopSeek,
        evidence,
        items
      });
    }

    const narrowPage = await harness.page({
      viewport: narrowViewport,
      colorScheme: "dark"
    });
    await openExemplar(narrowPage, harness.baseUrl);
    const narrowStage = stageFor(narrowPage);
    const narrowSeek = seekFor(narrowPage);
    await waitForReady(narrowStage);
    for (const checkpoint of narrowCheckpoints) {
      await captureCheckpoint({
        checkpoint: { ...checkpoint, viewport: narrowViewport },
        page: narrowPage,
        stage: narrowStage,
        seek: narrowSeek,
        evidence,
        items
      });
    }

    const htmlSource = buildKpVisualContactSheetHtml(items, {
      title: "Exponential sum → product · mandatory human checkpoint",
      columns: 3,
      imageFit: "contain",
      imageHeightPx: 260
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
    const html = path.join(outputRoot, "index.html");
    await writeFile(html, htmlSource, "utf8");
    const manifest = path.join(outputRoot, "manifest.json");
    await writeFile(manifest, `${JSON.stringify({
      schemaVersion: "kp.exponential-homomorphism-visual-checkpoint.v1",
      animationId,
      checkpoints: evidence,
      sheet: path.relative(process.cwd(), sheet),
      html: path.relative(process.cwd(), html)
    }, null, 2)}\n`, "utf8");
    console.log(`exponential checkpoint: ${path.relative(process.cwd(), sheet)}`);
    console.log(`review sheet: ${path.relative(process.cwd(), html)}`);
    console.log(`manifest: ${path.relative(process.cwd(), manifest)}`);
  } finally {
    await harness.close();
  }
}

async function openExemplar(page: Page, baseUrl: string): Promise<void> {
  const url = new URL("/", baseUrl);
  url.searchParams.set("artifact", animationId);
  // The harness owns the final origin, so this evidence command remains
  // independent of whichever local port is available.
  await page.goto(url.toString(), {
    waitUntil: "domcontentloaded"
  });
}

function stageFor(page: Page): Locator {
  return page.locator(
    `[data-kp-animation-catalogue-stage] ` +
    `[data-kp-editor-animation-id="${animationId}"] ` +
    "[data-kp-exponential-homomorphism-stage]"
  );
}

function seekFor(page: Page): Locator {
  return page.locator(
    `[data-kp-editor-animation-id="${animationId}"] ` +
    '[data-action="seek-editor-animation"]'
  );
}

async function captureCheckpoint(input: {
  readonly checkpoint: Checkpoint;
  readonly page: Page;
  readonly stage: Locator;
  readonly seek: Locator;
  readonly evidence: CaptureEvidence[];
  readonly items: KpVisualContactSheetItem[];
}): Promise<void> {
  await input.seek.fill(String(input.checkpoint.progress));
  await input.page.waitForFunction(({ progress }) => {
    const stage = document.querySelector<HTMLElement>(
      "[data-kp-exponential-homomorphism-stage]"
    );
    return Number(stage?.dataset["kpExponentialHomomorphismProgress"]) ===
      progress;
  }, { progress: input.checkpoint.progress });
  await input.stage.evaluate(async (root) => {
    await root.ownerDocument.fonts.ready;
    await new Promise<void>((resolve) => requestAnimationFrame(() =>
      requestAnimationFrame(() => resolve())
    ));
  });

  const file = path.join(outputRoot, `${input.checkpoint.id}.png`);
  await input.stage.screenshot({ path: file, animations: "disabled" });
  const state = await input.stage.evaluate((root) => {
    const active = root.querySelector<HTMLElement>(
      '.kp-exponential-homomorphism-stage__endpoint[aria-hidden="false"]'
    );
    return {
      visualOwner:
        root.dataset["kpExponentialHomomorphismVisualOwner"] ?? "",
      accessibleLatex:
        active?.dataset["kpExponentialHomomorphismLatex"] ?? null,
      visibleMaterialOwnerCount: [...root.querySelectorAll<HTMLElement>(
        "[data-kp-equation-material-owner-id]"
      )].filter((owner) => Number(getComputedStyle(owner).opacity) > 0).length,
      measurementRevision: Number(
        root.dataset["kpExponentialHomomorphismMeasurementRevision"] ?? "0"
      )
    };
  });
  if (state.accessibleLatex === null) {
    throw new Error(`${input.checkpoint.id} has no accessible native endpoint.`);
  }

  const relativeFile = path.relative(process.cwd(), file);
  input.evidence.push({
    id: input.checkpoint.id,
    phase: input.checkpoint.phase,
    progress: input.checkpoint.progress,
    viewport: input.checkpoint.viewport,
    ...state,
    file: relativeFile
  });
  const image = await readFile(file);
  input.items.push({
    id: input.checkpoint.id,
    label: input.checkpoint.label,
    progress: input.checkpoint.progress,
    viewport: input.checkpoint.viewport,
    file: relativeFile,
    dataUrl: `data:image/png;base64,${image.toString("base64")}`
  });
}

async function waitForReady(stage: Locator): Promise<void> {
  await stage.waitFor();
  await stage.evaluate((root) => new Promise<void>((resolve, reject) => {
    if (root.dataset["kpExponentialHomomorphismStage"] === "ready") {
      resolve();
      return;
    }
    const timeout = window.setTimeout(() => {
      observer.disconnect();
      reject(new Error(
        root.dataset["kpExponentialHomomorphismError"] ??
        "Timed out preparing exponential homomorphism stage."
      ));
    }, 5_000);
    const observer = new MutationObserver(() => {
      if (root.dataset["kpExponentialHomomorphismStage"] === "preparing") {
        return;
      }
      window.clearTimeout(timeout);
      observer.disconnect();
      if (root.dataset["kpExponentialHomomorphismStage"] === "ready") {
        resolve();
      } else {
        reject(new Error(
          root.dataset["kpExponentialHomomorphismError"] ??
          "Exponential homomorphism stage failed."
        ));
      }
    });
    observer.observe(root, {
      attributes: true,
      attributeFilter: ["data-kp-exponential-homomorphism-stage"]
    });
  }));
}

await capture();
