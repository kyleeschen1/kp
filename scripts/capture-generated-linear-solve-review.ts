import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { chromium, type Browser, type Page } from "playwright";
import { preview, type PreviewServer } from "vite";

const animationId = "animation.generated.linear-solve.linear-68c15d41";
const lessonId = "lesson.generated-solve-x.linear-68c15d41";
const outputRoot = path.resolve("tmp/codex/generated-linear-solve-review");
const desktop = { width: 1440, height: 1000 } as const;
const phone = { width: 390, height: 844 } as const;

await mkdir(outputRoot, { recursive: true });
let server: PreviewServer | undefined;

try {
  const baseUrl = await startPreview();
  const browser = await chromium.launch({ headless: true });
  try {
    const result = await captureReview(browser, baseUrl);
    const reportPath = path.join(outputRoot, "review.json");
    await writeFile(reportPath, `${JSON.stringify(result, null, 2)}\n`, "utf8");
    assertReview(result);
    console.log(JSON.stringify({
      output: path.relative(process.cwd(), reportPath),
      captures: result.captures,
      catalogue: result.catalogue,
      reader: result.reader
    }, null, 2));
  } finally {
    await browser.close();
  }
} finally {
  await server?.close();
}

async function captureReview(browser: Browser, baseUrl: string) {
  const captures: string[] = [];
  const desktopContext = await browser.newContext({ viewport: desktop });
  const cataloguePage = await desktopContext.newPage();
  await openCatalogue(cataloguePage, baseUrl);

  const player = cataloguePage.locator("[data-kp-editor-animation-player]");
  const scrubber = player.locator('[data-action="seek-editor-animation"]');
  for (const [name, progress] of [
    ["catalogue-start.png", 0],
    ["catalogue-subtract-operation.png", 0.1],
    ["catalogue-subtract-settled.png", 0.6]
  ] as const) {
    await scrubber.fill(String(progress));
    await settle(cataloguePage);
    captures.push(await capture(cataloguePage, name));
  }

  await cataloguePage.locator(
    '[data-action="select-animation-catalogue-inspector"]'
  ).selectOption("explanation");
  await settle(cataloguePage);
  captures.push(await capture(cataloguePage, "catalogue-explanation.png"));
  const catalogue = await cataloguePage.evaluate((expectedAnimationId) => {
    const shell = document.querySelector<HTMLElement>(
      "[data-kp-animation-catalogue]"
    );
    const explanation = document.querySelector<HTMLElement>(
      "[data-kp-generated-explanation]"
    );
    const staticOutput = document.querySelector<HTMLDetailsElement>(
      "[data-kp-generated-static-output]"
    );
    return {
      selectedAnimationId: shell?.dataset["kpAnimationCatalogueSelection"] ?? null,
      hostOutcome: shell?.dataset["kpAnimationCatalogueHostOutcome"] ?? null,
      native: document.querySelectorAll("iframe").length === 0,
      inlineMathCount: document.querySelectorAll(
        "[data-kp-animation-catalogue-stage] .katex"
      ).length,
      displayMathCount: document.querySelectorAll(
        "[data-kp-animation-catalogue-stage] .katex-display"
      ).length,
      largeHeadingCount: [...document.querySelectorAll<HTMLElement>(
        ".kp-animation-catalogue-shell h1, .kp-animation-catalogue-shell h2"
      )].filter((heading) => {
        const bounds = heading.getBoundingClientRect();
        const style = getComputedStyle(heading);
        return bounds.width > 1 && bounds.height > 1 &&
          style.display !== "none" && style.visibility !== "hidden";
      }).length,
      explanationSectionCount: explanation?.querySelectorAll("h3").length ?? 0,
      explanationCueCount: explanation?.querySelectorAll(
        "[data-kp-generated-explanation-cue]"
      ).length ?? 0,
      explanationDisplayMathCount: explanation?.querySelectorAll(
        ".katex-display"
      ).length ?? 0,
      staticOutputClosed: staticOutput?.open === false,
      reviewDockCount: document.querySelectorAll(
        "[data-kp-animation-catalogue-review-dock]"
      ).length,
      expectedAnimationId
    };
  }, animationId);
  await desktopContext.close();

  const phoneContext = await browser.newContext({ viewport: phone });
  const phonePage = await phoneContext.newPage();
  await openReader(phonePage, baseUrl, 600);
  captures.push(await capture(phonePage, "reader-narrow.png"));
  const narrow = await phonePage.evaluate(() => ({
    documentFits: document.documentElement.scrollWidth <=
      document.documentElement.clientWidth + 1,
    beatCount: document.querySelectorAll("[data-kp-beat]").length,
    native: document.querySelectorAll("iframe").length === 0,
    inlineMathCount: document.querySelectorAll(
      "[data-kp-reader-equation-stage] .katex"
    ).length
  }));
  await phoneContext.close();

  const reducedContext = await browser.newContext({
    viewport: desktop,
    reducedMotion: "reduce"
  });
  const reducedPage = await reducedContext.newPage();
  await openReader(reducedPage, baseUrl, 800);
  captures.push(await capture(reducedPage, "reader-reduced-motion.png"));
  const reduced = await reducedPage.locator("body").evaluate((body) => ({
    progress: (body as HTMLElement).dataset["kpReaderProgress"] ?? null,
    motionMode: (body as HTMLElement).dataset["kpReaderMotionMode"] ?? null
  }));
  await reducedContext.close();

  const staticContext = await browser.newContext({
    viewport: desktop,
    javaScriptEnabled: false
  });
  const staticPage = await staticContext.newPage();
  await staticPage.goto(readerUrl(baseUrl, 0), { waitUntil: "networkidle" });
  await staticPage.evaluate(async () => document.fonts.ready);
  captures.push(await capture(staticPage, "reader-static-no-javascript.png", true));
  const staticDocument = await staticPage.evaluate(() => ({
    bodyTextLength: document.body.innerText.trim().length,
    beatCount: document.querySelectorAll("[data-kp-beat]").length,
    mathMlCount: document.querySelectorAll("math").length,
    containsVerifiedSolution: document.body.innerText.includes(
      "The verified solution is five halves."
    )
  }));
  await staticContext.close();

  return {
    schemaVersion: "kp.generated-linear-solve-review.v1",
    capturedAt: new Date().toISOString(),
    animationId,
    lessonId,
    captures,
    catalogue,
    reader: { narrow, reduced, staticDocument }
  } as const;
}

async function startPreview(): Promise<string> {
  server = await preview({
    logLevel: "error",
    preview: { host: "127.0.0.1", port: 4190, strictPort: false }
  });
  const address = server.httpServer.address();
  if (address === null || typeof address === "string") {
    throw new Error("Generated solve review preview did not expose an address.");
  }
  return `http://127.0.0.1:${address.port}`;
}

async function openCatalogue(page: Page, baseUrl: string): Promise<void> {
  const url = new URL("/", baseUrl);
  url.searchParams.set("artifact", animationId);
  await page.goto(url.toString(), { waitUntil: "networkidle" });
  await page.waitForFunction((expectedAnimationId) => {
    const shell = document.querySelector<HTMLElement>(
      "[data-kp-animation-catalogue]"
    );
    return shell?.dataset["kpAnimationCatalogueSelection"] === expectedAnimationId &&
      shell.dataset["kpAnimationCatalogueHostOutcome"] === "painted";
  }, animationId);
  await settle(page);
}

async function openReader(
  page: Page,
  baseUrl: string,
  progress: number
): Promise<void> {
  await page.goto(readerUrl(baseUrl, progress), { waitUntil: "networkidle" });
  await page.locator('body[data-kp-reader-hydrated="true"]').waitFor();
  await settle(page);
}

function readerUrl(baseUrl: string, progress: number): string {
  const url = new URL("/reader/generated-solve-x/", baseUrl);
  url.searchParams.set("kpLesson", lessonId);
  url.searchParams.set("kpVersion", "1");
  url.searchParams.set("kpProgress", String(progress));
  return url.toString();
}

async function settle(page: Page): Promise<void> {
  await page.evaluate(async () => {
    await document.fonts.ready;
    await new Promise<void>((resolve) => requestAnimationFrame(() =>
      requestAnimationFrame(() => resolve())
    ));
  });
}

async function capture(
  page: Page,
  name: string,
  fullPage = false
): Promise<string> {
  const file = path.join(outputRoot, name);
  await page.screenshot({ path: file, fullPage });
  return path.relative(process.cwd(), file);
}

function assertReview(result: Awaited<ReturnType<typeof captureReview>>): void {
  const { catalogue, reader } = result;
  if (
    catalogue.selectedAnimationId !== animationId ||
    catalogue.hostOutcome !== "painted" ||
    !catalogue.native ||
    catalogue.inlineMathCount === 0 ||
    catalogue.displayMathCount !== 0 ||
    catalogue.largeHeadingCount !== 0 ||
    catalogue.explanationSectionCount !== 4 ||
    catalogue.explanationCueCount !== 8 ||
    catalogue.explanationDisplayMathCount !== 0 ||
    catalogue.staticOutputClosed !== true ||
    catalogue.reviewDockCount !== 1
  ) {
    throw new Error(`Generated solve catalogue review failed: ${JSON.stringify(catalogue)}`);
  }
  if (
    !reader.narrow.documentFits ||
    reader.narrow.beatCount !== 6 ||
    !reader.narrow.native ||
    reader.narrow.inlineMathCount === 0 ||
    reader.reduced.progress !== "800" ||
    reader.reduced.motionMode !== "essential" ||
    reader.staticDocument.bodyTextLength === 0 ||
    reader.staticDocument.beatCount !== 6 ||
    reader.staticDocument.mathMlCount === 0 ||
    !reader.staticDocument.containsVerifiedSolution
  ) {
    throw new Error(`Generated solve reader review failed: ${JSON.stringify(reader)}`);
  }
}
