import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

import {
  buildKpVisualContactSheetHtml,
  type KpVisualContactSheetItem
} from "./capture-visual-contact-sheet.ts";
import {
  kpRadicalCanonicalCheckpointCaptureCount,
  kpRadicalCanonicalCheckpointMoments,
  kpRadicalCanonicalCheckpointProfiles
} from "./radical-canonical-checkpoint-plan.ts";
import {
  createKpVisualReviewHarness
} from "./visual-review-harness.ts";

const outputRoot = path.resolve(
  "tmp/codex/radical-canonical-checkpoint"
);
const radicalRoute = "/reader/radical-succession/";
const fractionRoute = "/reader/split-merge-fractions/";
const routeState = {
  radical: {
    kpLesson: "lesson.exponents.radical-succession",
    kpVersion: "1"
  },
  fraction: {
    kpLesson: "lesson.fractions.numerator-split-merge",
    kpVersion: "1"
  }
} as const;

export async function captureKpRadicalCanonicalCheckpoint() {
  await mkdir(outputRoot, { recursive: true });
  const harness = createKpVisualReviewHarness();
  const items: KpVisualContactSheetItem[] = [];
  try {
    for (const profile of kpRadicalCanonicalCheckpointProfiles) {
      const page = await harness.page({
        viewport: profile.viewport,
        deviceScaleFactor: profile.deviceScaleFactor
      });
      for (const moment of kpRadicalCanonicalCheckpointMoments) {
        const id = `${profile.id}-${moment.id}`;
        const url = new URL(radicalRoute, harness.baseUrl);
        setRouteState(url, routeState.radical);
        url.searchParams.set("kpMotion", moment.motion);
        url.searchParams.set(
          "kpProgress",
          String(moment.progressPermille)
        );
        await page.goto(url.toString(), { waitUntil: "networkidle" });
        await settle(page, moment.progressPermille);
        await assertRadicalCheckpoint(page, moment.progressPermille);
        items.push(await captureStage({
          page,
          id,
          label: `${profile.label} · ${moment.label}`,
          progress: moment.progressPermille,
          viewport: profile.viewport
        }));
      }
    }

    const controlPage = await harness.page({
      viewport: { width: 1_100, height: 800 },
      deviceScaleFactor: 1
    });
    for (const progressPermille of [250, 750]) {
      const url = new URL(fractionRoute, harness.baseUrl);
      setRouteState(url, routeState.fraction);
      url.searchParams.set("kpMotion", "full");
      url.searchParams.set("kpProgress", String(progressPermille));
      await controlPage.goto(url.toString(), { waitUntil: "networkidle" });
      await settle(controlPage, progressPermille);
      items.push(await captureStage({
        page: controlPage,
        id: `fraction-control-${progressPermille}`,
        label:
          `Fraction control · ${progressPermille === 250 ? "split" : "merge"}`,
        progress: progressPermille,
        viewport: { width: 1_100, height: 800 }
      }));
    }

    if (items.length !== kpRadicalCanonicalCheckpointCaptureCount) {
      throw new Error(
        `Radical checkpoint captured ${items.length} of ` +
        `${kpRadicalCanonicalCheckpointCaptureCount} frames.`
      );
    }
    const htmlSource = buildKpVisualContactSheetHtml(items, {
      title: "Kinetic Press · canonical radical checkpoint",
      columns: 4,
      imageFit: "contain"
    });
    const html = path.join(outputRoot, "index.html");
    await writeFile(html, htmlSource, "utf8");
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
    const manifest = path.join(outputRoot, "manifest.json");
    await writeFile(manifest, `${JSON.stringify({
      schemaVersion: "kp.radical-canonical-checkpoint.v1",
      route: radicalRoute,
      captures: items.map(({ dataUrl: _dataUrl, ...item }) => item),
      html: path.relative(process.cwd(), html),
      sheet: path.relative(process.cwd(), sheet)
    }, null, 2)}\n`, "utf8");
    return { html, manifest, sheet, captures: items.length };
  } finally {
    await harness.close();
  }
}

function setRouteState(
  url: URL,
  state: Readonly<Record<string, string>>
): void {
  // Reader progress is restored only when the URL identifies the compiled lesson.
  for (const [name, value] of Object.entries(state)) {
    url.searchParams.set(name, value);
  }
}

async function captureStage(input: {
  readonly page: import("playwright").Page;
  readonly id: string;
  readonly label: string;
  readonly progress: number;
  readonly viewport: { readonly width: number; readonly height: number };
}): Promise<KpVisualContactSheetItem> {
  const file = path.join(outputRoot, `${input.id}.png`);
  const stage = input.page.locator("[data-kp-reader-equation-stage]");
  await stage.scrollIntoViewIfNeeded();
  await stage.screenshot({ path: file, animations: "disabled" });
  const image = await readFile(file);
  return {
    id: input.id,
    label: input.label,
    progress: input.progress,
    viewport: input.viewport,
    file: path.relative(process.cwd(), file),
    dataUrl: `data:image/png;base64,${image.toString("base64")}`
  };
}

async function settle(
  page: import("playwright").Page,
  progressPermille: number
): Promise<void> {
  await page.locator(
    'body[data-kp-reader-hydrated="true"]'
  ).waitFor();
  await page.locator("body").getAttribute("data-kp-reader-progress")
    .then((progress) => {
      if (progress !== String(progressPermille)) {
        throw new Error(
          `Radical checkpoint expected ${progressPermille}, got ${progress}.`
        );
      }
    });
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(() => new Promise<void>((resolve) =>
    requestAnimationFrame(() =>
      requestAnimationFrame(() => resolve())
    )
  ));
}

async function assertRadicalCheckpoint(
  page: import("playwright").Page,
  progressPermille: number
): Promise<void> {
  const overflow = await page.evaluate(() =>
    document.documentElement.scrollWidth - window.innerWidth
  );
  if (overflow > 1) {
    throw new Error(`Radical checkpoint overflowed by ${overflow}px.`);
  }
  const stage = page.locator("[data-kp-reader-equation-stage]");
  const active = stage.locator(
    '[data-kp-reader-transition-active="true"] [data-kp-reader-fit-surface]'
  );
  if (await active.count() !== 1) {
    throw new Error("Radical checkpoint requires one active fit surface.");
  }
  if (
    await stage.getAttribute(
      "data-kp-reader-canonical-equation-session-active"
    ) !== "true"
  ) {
    throw new Error("Radical checkpoint lost canonical ownership.");
  }
  if (await active.locator(
    ".kp-reader-equation-material:not(" +
    ".kp-reader-canonical-equation-session-material) > *"
  ).count() !== 0) {
    throw new Error("Radical checkpoint exposed compatibility paint.");
  }
  const owners = active.locator("[data-kp-native-katex-scene-owner]");
  if (
    progressPermille > 0 &&
    progressPermille < 1_000 &&
    await owners.count() === 0
  ) {
    throw new Error("Radical checkpoint lost material paint.");
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const result = await captureKpRadicalCanonicalCheckpoint();
  console.log(JSON.stringify({
    html: path.relative(process.cwd(), result.html),
    manifest: path.relative(process.cwd(), result.manifest),
    sheet: path.relative(process.cwd(), result.sheet),
    captures: result.captures
  }, null, 2));
}
