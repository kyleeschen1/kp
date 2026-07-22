import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { parseArgs } from "node:util";

import {
  createKpVisualReviewHarness,
  type KpVisualBrowserProfile
} from "./visual-review-harness.ts";

const desktop = { viewport: { width: 1280, height: 900 } } as const;
const tablet = { viewport: { width: 900, height: 900 } } as const;
const phone = { viewport: { width: 390, height: 844 } } as const;

export type KpVisualContactSheetExemplar = "solve-x" | "distribution-area";

export interface KpVisualContactSheetCheckpoint {
  readonly id: string;
  readonly label: string;
  readonly progress: number;
  readonly profile: KpVisualBrowserProfile;
  readonly direction?: "forward" | "inverse";
  readonly visualProgress?: number;
}

export const kpSolveXContactSheetCheckpoints: readonly KpVisualContactSheetCheckpoint[] = [
  { id: "read-equality", label: "Read equality", progress: 0, profile: desktop },
  { id: "subtract-settled", label: "Subtract settled", progress: 333, profile: desktop },
  { id: "cancel-motion", label: "Cancellation in motion", progress: 500, profile: desktop },
  { id: "cancel-settled", label: "Cancellation settled", progress: 667, profile: desktop },
  { id: "solution-settled", label: "Solution settled", progress: 1_000, profile: desktop },
  { id: "cancel-motion-phone", label: "Cancellation · phone", progress: 500, profile: phone }
];

const distributionMoments = [0, 360, 500, 650, 820, 1_000] as const;
const distributionProfiles = [
  { id: "desktop", label: "Desktop", profile: desktop },
  { id: "tablet", label: "Tablet", profile: tablet },
  { id: "phone", label: "Phone", profile: phone }
] as const;

export const kpDistributionAreaContactSheetCheckpoints: readonly KpVisualContactSheetCheckpoint[] =
  distributionProfiles.flatMap(({ id: profileId, label: profileLabel, profile }) =>
    (["forward", "inverse"] as const).flatMap((direction) =>
      distributionMoments.map((visualProgress) => ({
        id: `${profileId}-${direction}-${String(visualProgress).padStart(4, "0")}`,
        label: `${profileLabel} · ${direction === "forward" ? "Distribute" : "Factor"}`,
        progress: direction === "forward" ? visualProgress : 1_000 - visualProgress,
        visualProgress,
        direction,
        profile
      }))
    )
  );

export interface KpVisualContactSheetItem {
  readonly id: string;
  readonly label: string;
  readonly progress: number;
  readonly direction?: "forward" | "inverse";
  readonly visualProgress?: number;
  readonly viewport: { readonly width: number; readonly height: number };
  readonly file: string;
  readonly dataUrl: string;
}

interface KpVisualContactSheetDescriptor {
  readonly id: string;
  readonly title: string;
  readonly checkpoints: readonly KpVisualContactSheetCheckpoint[];
  readonly waitSelector: string;
  readonly captureSelector?: string;
  readonly url: (baseUrl: string, checkpoint: KpVisualContactSheetCheckpoint) => URL;
}

export async function captureKpVisualContactSheet(input: {
  readonly baseUrl?: string;
  readonly outputRoot: string;
  readonly exemplar?: KpVisualContactSheetExemplar;
}): Promise<{ readonly sheet: string; readonly manifest: string }> {
  const outputRoot = path.resolve(input.outputRoot);
  await mkdir(outputRoot, { recursive: true });
  const descriptor = descriptorFor(input.exemplar ?? "solve-x");
  const harness = createKpVisualReviewHarness(
    input.baseUrl === undefined ? {} : { baseUrl: input.baseUrl }
  );
  const items: KpVisualContactSheetItem[] = [];
  try {
    for (const checkpoint of descriptor.checkpoints) {
      const page = await harness.page(checkpoint.profile);
      const url = descriptor.url(harness.baseUrl, checkpoint);
      await page.goto(url.toString(), { waitUntil: "networkidle" });
      await page.locator(descriptor.waitSelector).waitFor();
      await settle(page);
      const file = path.join(outputRoot, `${checkpoint.id}.png`);
      if (descriptor.captureSelector === undefined) {
        await page.screenshot({ path: file, fullPage: false, animations: "disabled" });
      } else {
        const capture = page.locator(descriptor.captureSelector);
        await capture.scrollIntoViewIfNeeded();
        await capture.screenshot({ path: file, animations: "disabled" });
      }
      const image = await readFile(file);
      items.push({
        id: checkpoint.id,
        label: checkpoint.label,
        progress: checkpoint.progress,
        ...(checkpoint.direction === undefined ? {} : { direction: checkpoint.direction }),
        ...(checkpoint.visualProgress === undefined ? {} : { visualProgress: checkpoint.visualProgress }),
        viewport: checkpoint.profile.viewport ?? desktop.viewport,
        file: path.relative(process.cwd(), file),
        dataUrl: `data:image/png;base64,${image.toString("base64")}`
      });
    }
    const sheetPage = await harness.page({ viewport: { width: 1440, height: 1000 } });
    await sheetPage.setContent(buildKpVisualContactSheetHtml(items, {
      title: descriptor.title,
      columns: descriptor.id === "reader.distribution-area" ? 3 : 2,
      imageFit: descriptor.id === "reader.distribution-area" ? "contain" : "cover"
    }), { waitUntil: "load" });
    const sheet = path.join(outputRoot, "contact-sheet.png");
    await sheetPage.screenshot({ path: sheet, fullPage: true, animations: "disabled" });
    const manifest = path.join(outputRoot, "manifest.json");
    await writeFile(manifest, `${JSON.stringify({
      schemaVersion: "kp.visual-contact-sheet.v1",
      exemplar: descriptor.id,
      ordering: items.map(({ dataUrl: _dataUrl, ...item }) => item),
      sheet: path.relative(process.cwd(), sheet)
    }, null, 2)}\n`, "utf8");
    return { sheet, manifest };
  } finally {
    await harness.close();
  }
}

export function buildKpVisualContactSheetHtml(
  items: readonly KpVisualContactSheetItem[],
  options: {
    readonly title?: string;
    readonly columns?: number;
    readonly imageFit?: "contain" | "cover";
  } = {}
): string {
  const title = options.title ?? "Kinetic Press · solve x";
  const columns = options.columns ?? 2;
  const imageFit = options.imageFit ?? "cover";
  const cards = items.map((item, index) => `
    <figure>
      <img src="${item.dataUrl}" alt="${escapeHtml(item.label)}">
      <figcaption><b>${String(index + 1).padStart(2, "0")}</b><span>${escapeHtml(item.label)}</span><code>${item.visualProgress ?? item.progress}</code></figcaption>
    </figure>`).join("");
  return `<!doctype html>
<html><head><meta charset="utf-8"><style>
  * { box-sizing: border-box; }
  body { margin: 0; padding: 44px; background: #f4f1ea; color: #26231f; font-family: Georgia, 'Times New Roman', serif; }
  header { display: flex; align-items: baseline; justify-content: space-between; margin-bottom: 26px; border-bottom: 1px solid #c9c1b4; padding-bottom: 18px; }
  h1 { font-size: 30px; font-weight: 500; margin: 0; letter-spacing: -0.02em; }
  header p { margin: 0; color: #736b60; font: 13px ui-monospace, SFMono-Regular, Menlo, monospace; }
  main { display: grid; grid-template-columns: repeat(${columns}, minmax(0, 1fr)); gap: 22px; }
  figure { margin: 0; overflow: hidden; border: 1px solid #d4ccbf; border-radius: 12px; background: #fffdf8; box-shadow: 0 8px 24px rgba(53, 44, 31, 0.07); }
  img { display: block; width: 100%; height: 390px; object-fit: ${imageFit}; object-position: top center; background: white; }
  figcaption { display: grid; grid-template-columns: auto 1fr auto; gap: 12px; align-items: center; padding: 13px 16px; border-top: 1px solid #e3ddd3; }
  figcaption b, figcaption code { color: #8a4f3d; font: 12px ui-monospace, SFMono-Regular, Menlo, monospace; }
  figcaption span { font-size: 16px; }
</style></head><body>
  <header><h1>${escapeHtml(title)}</h1><p>deterministic review contact sheet</p></header>
  <main>${cards}</main>
</body></html>`;
}

function descriptorFor(exemplar: KpVisualContactSheetExemplar): KpVisualContactSheetDescriptor {
  if (exemplar === "distribution-area") {
    return {
      id: "reader.distribution-area",
      title: "Kinetic Press · distribution and area",
      checkpoints: kpDistributionAreaContactSheetCheckpoints,
      waitSelector: 'body[data-kp-reader-hydrated="true"][data-kp-reader-font-ready="true"]',
      captureSelector: "[data-kp-distribution-stage]",
      url: (baseUrl, checkpoint) => {
        const url = new URL("/reader/distribution-area/", baseUrl);
        url.searchParams.set("kpLesson", "lesson.algebra.distribution-area");
        url.searchParams.set("kpVersion", "1");
        url.searchParams.set("kpProgress", String(checkpoint.progress));
        url.searchParams.set("kpDirection", checkpoint.direction ?? "forward");
        return url;
      }
    };
  }
  return {
    id: "reader.solve-x.x-plus-3",
    title: "Kinetic Press · solve x",
    checkpoints: kpSolveXContactSheetCheckpoints,
    waitSelector: 'body[data-kp-reader-hydrated="true"]',
    url: (baseUrl, checkpoint) => {
      const url = new URL("/reader/solve-x/", baseUrl);
      url.searchParams.set("kpLesson", "lesson.solve-x.x-plus-3");
      url.searchParams.set("kpVersion", "1");
      url.searchParams.set("kpProgress", String(checkpoint.progress));
      return url;
    }
  };
}

async function settle(page: import("playwright").Page): Promise<void> {
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(() => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const { values } = parseArgs({
    args: process.argv.slice(2),
    strict: true,
    options: {
      "base-url": { type: "string" },
      exemplar: { type: "string", default: "solve-x" },
      output: { type: "string", default: "tmp/codex/visual-contact-sheet" }
    }
  });
  const baseUrl = values["base-url"] ?? process.env["KP_VISUAL_BASE_URL"];
  const exemplar = parseExemplar(values.exemplar);
  const result = await captureKpVisualContactSheet({
    outputRoot: values.output,
    exemplar,
    ...(baseUrl === undefined ? {} : { baseUrl })
  });
  console.log(JSON.stringify({
    sheet: path.relative(process.cwd(), result.sheet),
    manifest: path.relative(process.cwd(), result.manifest),
    captures: descriptorFor(exemplar).checkpoints.length
  }, null, 2));
}

function parseExemplar(value: string | undefined): KpVisualContactSheetExemplar {
  if (value === "solve-x" || value === "distribution-area") return value;
  throw new Error(`Unknown visual contact-sheet exemplar: ${value ?? ""}`);
}
