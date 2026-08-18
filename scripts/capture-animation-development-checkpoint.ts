import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { chromium, type Page } from "playwright";

import {
  buildKpVisualContactSheetHtml,
  type KpVisualContactSheetItem
} from "./capture-visual-contact-sheet.ts";

const baseUrl = "http://127.0.0.1:8000";
const outputRoot = path.resolve("tmp/codex/animation-development-checkpoint");
const exponentArtifactId =
  "animation.algebra.log-exponent.solve-two-power-x";

await mkdir(outputRoot, { recursive: true });
const browser = await chromium.launch({ headless: true });
const items: KpVisualContactSheetItem[] = [];

try {
  await capture({
    id: "catalogue-exponent-motion",
    label: "Catalogue · exponent/log motion at 45%",
    viewport: { width: 1280, height: 900 },
    href: exactHref("animation-catalogue", 0.45)
  });
  await capture({
    id: "coverage-wide",
    label: "Coverage · full ordered capability projection",
    viewport: { width: 1280, height: 900 },
    href: exactHref("coverage", 0.45)
  });
  await capture({
    id: "review-wide",
    label: "Catalogue · exact-state Review, wide",
    viewport: { width: 1280, height: 900 },
    href: exactHref("animation-catalogue", 0.45),
    openReview: true
  });
  await capture({
    id: "catalogue-phone",
    label: "Catalogue · phone transport clearance",
    viewport: { width: 390, height: 844 },
    href: exactHref("animation-catalogue", 0.45)
  });
  await capture({
    id: "review-phone",
    label: "Catalogue · exact-state Review, phone",
    viewport: { width: 390, height: 844 },
    href: exactHref("animation-catalogue", 0.45),
    openReview: true
  });

  const contactSheetHtml = buildKpVisualContactSheetHtml(items, {
    title: "Kinetic Press · animation development checkpoint",
    columns: 2,
    imageFit: "contain",
    imageHeightPx: 430
  });
  const html = path.join(outputRoot, "index.html");
  await writeFile(html, contactSheetHtml, "utf8");
  const sheetPage = await browser.newPage({
    viewport: { width: 1440, height: 1100 }
  });
  await sheetPage.setContent(contactSheetHtml, { waitUntil: "load" });
  const sheet = path.join(outputRoot, "contact-sheet.png");
  await sheetPage.screenshot({
    path: sheet,
    fullPage: true,
    animations: "disabled"
  });
  await sheetPage.close();
  const manifest = path.join(outputRoot, "manifest.json");
  await writeFile(manifest, `${JSON.stringify({
    schemaVersion: "kp.animation-development-checkpoint.v1",
    sourceArtifactId: exponentArtifactId,
    sourcePlayhead: 0.45,
    ordering: items.map(({ dataUrl: _dataUrl, ...item }) => item),
    sheet: path.relative(process.cwd(), sheet),
    html: path.relative(process.cwd(), html)
  }, null, 2)}\n`, "utf8");
  console.log(
    `animation development checkpoint: ${path.relative(process.cwd(), sheet)}`
  );
} finally {
  await browser.close();
}

async function capture(input: {
  readonly id: string;
  readonly label: string;
  readonly viewport: { readonly width: number; readonly height: number };
  readonly href: string;
  readonly openReview?: boolean;
}): Promise<void> {
  const page = await browser.newPage({ viewport: input.viewport });
  try {
    await page.goto(input.href, { waitUntil: "networkidle" });
    await waitForProjection(page, input.href);
    await page.evaluate(async () => document.fonts.ready);
    if (input.openReview === true) {
      await page.waitForFunction(() =>
        document.body.dataset["kpDevReviewReady"] === "true"
      );
      await page.locator(
        '[data-kp-dev-toolbar-control="kp.dev-toolbar.review"]'
      ).click();
      await page.locator(
        '[data-kp-dev-review-shell] [role="dialog"]'
      ).waitFor();
    }
    await page.evaluate(async () => {
      await new Promise<void>((resolve) => requestAnimationFrame(() =>
        requestAnimationFrame(() => resolve())
      ));
    });
    const file = path.join(outputRoot, `${input.id}.png`);
    await page.screenshot({
      path: file,
      fullPage: false,
      animations: "disabled"
    });
    const image = await readFile(file);
    items.push({
      id: input.id,
      label: input.label,
      progress: 0.45,
      viewport: input.viewport,
      file: path.relative(process.cwd(), file),
      dataUrl: `data:image/png;base64,${image.toString("base64")}`
    });
  } finally {
    await page.close();
  }
}

async function waitForProjection(page: Page, href: string): Promise<void> {
  if (new URL(href).searchParams.get("view") === "coverage") {
    await page.locator(".kp-transformation-coverage").waitFor();
    return;
  }
  await page.locator(
    `[data-kp-animation-catalogue-selection="${exponentArtifactId}"]` +
    '[data-kp-animation-catalogue-host-outcome="painted"]'
  ).waitFor();
}

function exactHref(
  view: "animation-catalogue" | "coverage",
  playhead: number
): string {
  const url = new URL("/", baseUrl);
  url.searchParams.set("view", view);
  url.searchParams.set("theme", "dark");
  url.searchParams.set("style", "restrained-editorial");
  url.searchParams.set("focus", "no-depth");
  url.searchParams.set("artifact", exponentArtifactId);
  url.searchParams.set("playhead", String(playhead));
  return url.href;
}
