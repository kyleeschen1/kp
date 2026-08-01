import { chromium } from "playwright";

import {
  kpDevReviewProtocolLimits,
  kpDevReviewScreenshotRequestSchema,
  kpDevReviewScreenshotSchema
} from "../protocols/dev-review-schema.ts";
import {
  KP_DEV_REVIEW_SCREENSHOT_SCHEMA_VERSION,
  type KpDevReviewScreenshotRequestV1,
  type KpDevReviewScreenshotV1
} from "../protocols/dev-review-v1.ts";

export interface KpDevReviewScreenshotService {
  capture(request: unknown): Promise<KpDevReviewScreenshotV1>;
}

export function createKpDevReviewScreenshotService():
KpDevReviewScreenshotService {
  // Arbitrary DOM serialized through SVG foreignObject taints the page canvas.
  // Replaying the typed capture in dev-only Playwright keeps bitmap generation
  // reliable without moving browser automation or filesystem authority client-side.
  return {
    async capture(input) {
      const request = kpDevReviewScreenshotRequestSchema.parse(input);
      const route = restoreCatalogueRoute(request);
      requireLoopbackRoute(route);
      const viewport = request.capture.environment.viewport;
      if (viewport.width > 1_600 || viewport.height > 1_200) {
        throw new RangeError(
          "Review screenshots require a viewport at most 1600 by 1200"
        );
      }
      const browser = await chromium.launch({ headless: true });
      try {
        const context = await browser.newContext({
          viewport: {
            width: Math.round(viewport.width),
            height: Math.round(viewport.height)
          },
          deviceScaleFactor: 1,
          reducedMotion: request.capture.environment.reducedMotion
            ? "reduce"
            : "no-preference",
          colorScheme: request.capture.environment.colorScheme
        });
        const page = await context.newPage();
        await page.goto(route.toString(), { waitUntil: "networkidle" });
        await page.evaluate(async () => document.fonts.ready);
        await page.waitForFunction((animationId) => {
          const shell = document.querySelector<HTMLElement>(
            "[data-kp-animation-catalogue]"
          );
          if (shell === null) return false;
          return shell.dataset["kpAnimationCatalogueSelection"] ===
            animationId && (
              shell.dataset["kpAnimationCatalogueHostOutcome"] !== undefined ||
              shell.dataset["kpAnimationCatalogueState"] === "error"
            );
        }, request.capture.semantic.assetId);
        await restoreCatalogueTransientState(page, request);
        await page.evaluate(async () => {
          await new Promise<void>((resolve) => requestAnimationFrame(() =>
            requestAnimationFrame(() => resolve())
          ));
        });
        await assertRestoredCatalogueState(page, request);

        const stage = page.locator(
          '[data-kp-animation-catalogue-region="stage"]'
        );
        const sourceViewport = await stage.boundingBox();
        if (
          sourceViewport === null ||
          sourceViewport.width < 1 ||
          sourceViewport.height < 1
        ) {
          throw new Error("Catalogue screenshot stage is not visible");
        }
        const jpeg = await stage.screenshot({
          type: "jpeg",
          quality: 64,
          animations: "disabled",
          scale: "css"
        });
        const initial = {
          dataUrl: `data:image/jpeg;base64,${jpeg.toString("base64")}`,
          pixelWidth: Math.max(1, Math.round(sourceViewport.width)),
          pixelHeight: Math.max(1, Math.round(sourceViewport.height))
        };
        const bitmap = initial.dataUrl.length <=
          kpDevReviewProtocolLimits.screenshotDataUrlCharacters
          ? initial
          : await compressScreenshot(page, initial.dataUrl);
        return kpDevReviewScreenshotSchema.parse({
          schemaVersion: KP_DEV_REVIEW_SCREENSHOT_SCHEMA_VERSION,
          kind: "bitmap-data-url",
          scope: "selected-stage",
          mediaType: "image/jpeg",
          ...bitmap,
          sourceViewport: {
            left: sourceViewport.x,
            top: sourceViewport.y,
            width: sourceViewport.width,
            height: sourceViewport.height
          }
        });
      } finally {
        await browser.close();
      }
    }
  };
}

function restoreCatalogueRoute(
  request: KpDevReviewScreenshotRequestV1
): URL {
  const route = new URL(request.capture.route);
  const animationId = request.capture.semantic.assetId;
  if (animationId === undefined) {
    throw new Error("Catalogue screenshot requires an asset ID");
  }
  route.searchParams.set("artifact", animationId);
  const progressPermille =
    request.capture.semantic.animationProgressPermille ??
    request.capture.semantic.progressPermille;
  if (progressPermille === undefined || progressPermille === 0) {
    route.searchParams.delete("playhead");
  } else {
    route.searchParams.set("playhead", String(progressPermille / 1_000));
  }
  return route;
}

function requireLoopbackRoute(route: URL): void {
  // Capture routes are user-controlled review evidence; never turn this
  // development helper into a general server-side URL fetcher.
  if (
    route.protocol !== "http:" ||
    !["127.0.0.1", "localhost", "[::1]"].includes(route.hostname)
  ) {
    throw new Error("Review screenshots may load only a loopback HTTP route");
  }
}

async function restoreCatalogueTransientState(
  page: import("playwright").Page,
  request: KpDevReviewScreenshotRequestV1
): Promise<void> {
  for (const [key, value] of Object.entries(
    request.capture.semantic.parameters ?? {}
  )) {
    const control = page.locator(
      `[data-kp-animation-catalogue-parameter="${key}"]`
    );
    if (await control.count() !== 1) {
      throw new Error(`Catalogue screenshot cannot restore parameter ${key}`);
    }
    await setControlValue(control, value);
  }
  for (const [key, value] of Object.entries(
    request.capture.semantic.tuning ?? {}
  )) {
    const control = page.locator(
      `[data-kp-animation-catalogue-tuning="${key}"]`
    );
    if (await control.count() !== 1) {
      throw new Error(`Catalogue screenshot cannot restore tuning ${key}`);
    }
    await setControlValue(control, value);
  }
}

async function setControlValue(
  control: import("playwright").Locator,
  value: string
): Promise<void> {
  await control.evaluate((element, nextValue) => {
    if (
      element instanceof HTMLSelectElement ||
      element instanceof HTMLInputElement ||
      element instanceof HTMLTextAreaElement
    ) {
      element.value = nextValue;
      if (element.value !== nextValue) {
        throw new Error(`Control cannot accept ${nextValue}`);
      }
      element.dispatchEvent(new Event("input", { bubbles: true }));
      element.dispatchEvent(new Event("change", { bubbles: true }));
      return;
    }
    throw new Error("Catalogue capture state requires a form control");
  }, value);
}

async function assertRestoredCatalogueState(
  page: import("playwright").Page,
  request: KpDevReviewScreenshotRequestV1
): Promise<void> {
  const expectedProgress = (
    request.capture.semantic.animationProgressPermille ??
    request.capture.semantic.progressPermille ??
    0
  ) / 1_000;
  const observed = await page.locator(
    "[data-kp-animation-catalogue] [data-kp-editor-animation-player]"
  ).evaluate((player) => ({
    animationId: (player as HTMLElement)
      .dataset["kpEditorAnimationId"],
    progress: Number((player as HTMLElement)
      .dataset["kpEditorAnimationProgress"] ?? Number.NaN),
    tuning: {
      "gestalt-style": (player as HTMLElement)
        .dataset["kpEditorAnimationGestaltSelectedStyle"],
      "focus-experiment": (player as HTMLElement)
        .dataset["kpEditorAnimationFocusExperiment"]
    }
  }));
  if (
    observed.animationId !== request.capture.semantic.assetId ||
    Math.abs(observed.progress - expectedProgress) > 0.001
  ) {
    throw new Error(
      `Catalogue screenshot state drifted: ${JSON.stringify(observed)}`
    );
  }
  for (const [key, value] of Object.entries(
    request.capture.semantic.tuning ?? {}
  )) {
    if (observed.tuning[key as keyof typeof observed.tuning] !== value) {
      throw new Error(`Catalogue screenshot tuning drifted at ${key}`);
    }
  }
}

async function compressScreenshot(
  page: import("playwright").Page,
  dataUrl: string
): Promise<{
  readonly dataUrl: string;
  readonly pixelWidth: number;
  readonly pixelHeight: number;
}> {
  const result = await page.evaluate(async ({ source, maximum }) => {
    const image = document.createElement("img");
    await new Promise<void>((resolve, reject) => {
      image.addEventListener("load", () => resolve(), { once: true });
      image.addEventListener("error", () => reject(
        new Error("Could not decode catalogue screenshot")
      ), { once: true });
      image.src = source;
    });
    for (const attempt of [
      { scale: 0.82, quality: 0.56 },
      { scale: 0.68, quality: 0.46 },
      { scale: 0.54, quality: 0.36 },
      { scale: 0.42, quality: 0.3 }
    ]) {
      const pixelWidth = Math.max(1, Math.round(image.naturalWidth * attempt.scale));
      const pixelHeight = Math.max(1, Math.round(image.naturalHeight * attempt.scale));
      const canvas = document.createElement("canvas");
      canvas.width = pixelWidth;
      canvas.height = pixelHeight;
      const context = canvas.getContext("2d");
      if (context === null) throw new Error("Screenshot compression needs canvas");
      context.drawImage(image, 0, 0, pixelWidth, pixelHeight);
      const compressed = canvas.toDataURL("image/jpeg", attempt.quality);
      if (compressed.length <= maximum) {
        return { dataUrl: compressed, pixelWidth, pixelHeight };
      }
    }
    return undefined;
  }, {
    source: dataUrl,
    maximum: kpDevReviewProtocolLimits.screenshotDataUrlCharacters
  });
  if (result === undefined) {
    throw new Error("Catalogue screenshot exceeded its bounded payload");
  }
  return result;
}
