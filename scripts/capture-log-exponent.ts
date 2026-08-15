import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import type { Page } from "playwright";

import {
  buildKpVisualContactSheetHtml,
  type KpVisualContactSheetItem
} from "./capture-visual-contact-sheet.ts";
import { createKpVisualReviewHarness } from "./visual-review-harness.ts";

const outputRoot = path.resolve("tmp/codex/log-exponent-checkpoint");
const animationId = "animation.algebra.log-exponent.solve-two-power-x";
const samples = [
  { id: "source", label: "Source endpoint", progress: 0 },
  { id: "wrap-mid", label: "Balanced log wrappers · entering", progress: 0.16 },
  { id: "logged", label: "Logged endpoint", progress: 0.28 },
  { id: "extract-mid", label: "Exponent transfer · midpoint", progress: 0.4942 },
  { id: "product", label: "Product endpoint", progress: 0.7 },
  { id: "divide-mid", label: "Fraction structure · entering", progress: 0.872 },
  { id: "solved", label: "Solved endpoint", progress: 1 }
] as const;

interface CaptureEvidence {
  readonly id: string;
  readonly progress: number;
  readonly operationId: string;
  readonly attentionStageId: string;
  readonly operationProgress: number;
  readonly visualOwner: string;
  readonly visibleMaterialEntityIds: readonly string[];
  readonly visibleMaterialOwners: readonly {
    readonly entityId: string;
    readonly text: string;
    readonly opacity: number;
    readonly rect: { readonly x: number; readonly y: number; readonly width: number; readonly height: number };
  }[];
  readonly file: string;
}

async function capture(): Promise<void> {
  await mkdir(outputRoot, { recursive: true });
  const harness = createKpVisualReviewHarness();
  const items: KpVisualContactSheetItem[] = [];
  const evidence: CaptureEvidence[] = [];
  const viewport = { width: 1_240, height: 760 } as const;

  try {
    const page = await harness.page({ viewport, colorScheme: "dark" });
    for (const sample of samples) {
      const captured = await captureSample({
        page,
        baseUrl: harness.baseUrl,
        ...sample
      });
      evidence.push(captured);
      const image = await readFile(path.resolve(captured.file));
      items.push({
        id: sample.id,
        label: sample.label,
        progress: sample.progress,
        viewport,
        file: captured.file,
        dataUrl: `data:image/png;base64,${image.toString("base64")}`
      });
    }

    const htmlSource = buildKpVisualContactSheetHtml(items, {
      title: "Log-exponent operation transport · canonical checkpoint",
      columns: 2,
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
      schemaVersion: "kp.log-exponent-visual-checkpoint.v1",
      animationId,
      viewport,
      samples: evidence,
      sheet: path.relative(process.cwd(), sheet),
      html: path.relative(process.cwd(), html)
    }, null, 2)}\n`, "utf8");
    console.log(`log-exponent checkpoint: ${path.relative(process.cwd(), sheet)}`);
    console.log(`review sheet: ${path.relative(process.cwd(), html)}`);
    console.log(`manifest: ${path.relative(process.cwd(), manifest)}`);
  } finally {
    await harness.close();
  }
}

async function captureSample(input: {
  readonly page: Page;
  readonly baseUrl: string;
  readonly id: string;
  readonly label: string;
  readonly progress: number;
}): Promise<CaptureEvidence> {
  const url = new URL("/", input.baseUrl);
  url.searchParams.set("artifact", animationId);
  url.searchParams.set("playhead", String(input.progress));
  await input.page.goto(url.toString(), { waitUntil: "domcontentloaded" });
  const stage = input.page.locator(
    `[data-kp-animation-catalogue-stage] [data-kp-log-exponent-stage]`
  );
  await stage.waitFor();
  await stage.evaluate((root) => new Promise<void>((resolve, reject) => {
    if (root.dataset["kpLogExponentStage"] !== "preparing") {
      resolve();
      return;
    }
    const timeout = window.setTimeout(() => {
      observer.disconnect();
      reject(new Error("Timed out preparing log-exponent stage."));
    }, 5_000);
    const observer = new MutationObserver(() => {
      if (root.dataset["kpLogExponentStage"] === "preparing") return;
      window.clearTimeout(timeout);
      observer.disconnect();
      resolve();
    });
    observer.observe(root, {
      attributes: true,
      attributeFilter: ["data-kp-log-exponent-stage"]
    });
  }));
  await stage.evaluate(async (root) => {
    await root.ownerDocument.fonts.ready;
    await new Promise<void>((resolve) => requestAnimationFrame(() =>
      requestAnimationFrame(() => resolve())
    ));
  });
  if (await stage.getAttribute("data-kp-log-exponent-stage") !== "ready") {
    throw new Error(
      `Log-exponent stage failed at ${input.progress}: ` +
      `${await stage.getAttribute("data-kp-log-exponent-error")}`
    );
  }
  const file = path.join(outputRoot, `${input.id}.png`);
  await stage.screenshot({ path: file, animations: "disabled" });
  const visibleMaterialOwners = await stage.evaluate((root) =>
    [...root.querySelectorAll<HTMLElement>(
      "[data-kp-equation-material-owner-id]"
    )].filter((owner) => Number(getComputedStyle(owner).opacity) > 0.01)
      .map((owner) => {
        const rect = owner.getBoundingClientRect();
        return {
          entityId:
            owner.dataset["kpEquationMaterialSemanticEntityId"] ?? "",
          text: owner.textContent?.trim() ?? "",
          opacity: Number(getComputedStyle(owner).opacity),
          rect: {
            x: rect.x,
            y: rect.y,
            width: rect.width,
            height: rect.height
          }
        };
      })
  );
  const visibleMaterialEntityIds = visibleMaterialOwners
    .map(({ entityId }) => entityId)
    .filter((id) => id !== "");
  return {
    id: input.id,
    progress: input.progress,
    operationId:
      await stage.getAttribute("data-kp-log-exponent-operation-id") ?? "",
    attentionStageId:
      await stage.getAttribute("data-kp-log-exponent-attention-stage-id") ?? "",
    operationProgress: Number(
      await stage.getAttribute("data-kp-log-exponent-operation-progress") ?? "0"
    ),
    visualOwner:
      await stage.getAttribute("data-kp-log-exponent-visual-owner") ?? "",
    visibleMaterialEntityIds,
    visibleMaterialOwners,
    file: path.relative(process.cwd(), file)
  };
}

await capture();
