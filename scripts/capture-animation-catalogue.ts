import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { chromium, type Browser, type Page } from "playwright";

import {
  createKpAnimationCatalogueProjection
} from "../src/editor/animation-catalogue-projection.ts";

const animationId = "animation.linear-solve.solve-x";
const generatedLinearSolveExemplarId =
  "animation.generated.linear-solve.linear-68c15d41";
const promotedSiblingId =
  "animation.generated.radical.square-root-as-power";
const distinctCallerId =
  "animation.exact-fraction-quantity.third-plus-sixth";
const economicsExemplarId =
  "animation.economics.supply-demand-equilibrium-shift";
const physicsExemplarId =
  "animation.physics.constant-force-work-energy";
const graph3DExemplarId =
  "animation.graph.surface-mode.mesh-to-donut";
const vectorDotProjectionExemplarId = "animation.dot-projection.basic";
const programmingAdditionExemplarId =
  "animation.programming.add.execution-trace";
const programmingComparisonExemplarId =
  "animation.comparison.linear-solve-programming";
const baseUrl =
  process.env["KP_VISUAL_BASE_URL"] ?? "http://127.0.0.1:8000";
const outputRoot = path.resolve(
  process.env["KP_VISUAL_OUTPUT"] ?? "tmp/codex/animation-catalogue"
);
const viewport = { width: 1440, height: 1000 } as const;
const scopeArgumentIndex = process.argv.indexOf("--scope");
const captureScope = scopeArgumentIndex === -1
  ? "all"
  : process.argv[scopeArgumentIndex + 1];
if (
  captureScope !== "all" &&
  captureScope !== "vector-dot-projection" &&
  captureScope !== "svelte-catalogue-exemplar" &&
  captureScope !== "programming-addition"
) {
  throw new Error(`Unknown catalogue visual scope: ${captureScope ?? "missing"}`);
}

await mkdir(outputRoot, { recursive: true });
const browser = await chromium.launch({ headless: true });

if (captureScope === "vector-dot-projection") {
  try {
    await captureVectorDotProjectionExemplar(browser);
  } finally {
    await browser.close();
  }
} else if (captureScope === "svelte-catalogue-exemplar") {
  try {
    await captureSvelteCatalogueExemplarParity(browser);
  } finally {
    await browser.close();
  }
} else if (captureScope === "programming-addition") {
  try {
    await captureProgrammingAdditionExemplar(browser);
  } finally {
    await browser.close();
  }
} else {
try {
  const page = await browser.newPage({ viewport });
  const url = new URL("/", baseUrl);
  url.searchParams.set("artifact", animationId);

  await page.goto(url.toString(), { waitUntil: "networkidle" });
  await page.evaluate(async () => document.fonts.ready);
  await page.locator(
    `[data-kp-animation-catalogue-state="selected"][data-kp-animation-catalogue-selection="${animationId}"]`
  ).waitFor();
  await page.waitForFunction(() => {
    const player = document.querySelector<HTMLElement>(
      "[data-kp-animation-catalogue-stage] [data-kp-editor-animation-player]"
    );
    const surface = player?.querySelector<HTMLElement>(
      "[data-kp-editor-animation-surface-slot]"
    );
    return player?.dataset["kpEditorAnimationHydrated"] === "true" &&
      surface?.dataset["kpEditorAnimationAdapterStatus"] === "ready";
  });
  const displayMathCount = await page.locator(
    "[data-kp-animation-catalogue-stage] .katex-display"
  ).count();
  if (displayMathCount !== 0) {
    throw new Error(
      `Catalogue stage expected inline KaTeX, found ${displayMathCount} display wrappers.`
    );
  }
  const inlineMathCount = await page.locator(
    "[data-kp-animation-catalogue-stage] .katex"
  ).count();
  if (inlineMathCount === 0) {
    throw new Error("Catalogue stage did not render inline KaTeX.");
  }
  const visibleLargeHeadingCount = await page.locator(
    ".kp-animation-catalogue-shell h1, .kp-animation-catalogue-shell h2"
  ).evaluateAll((headings) => headings.filter((heading) => {
    const bounds = heading.getBoundingClientRect();
    const style = getComputedStyle(heading);
    return bounds.width > 1 && bounds.height > 1 &&
      style.display !== "none" && style.visibility !== "hidden";
  }).length);
  if (visibleLargeHeadingCount !== 0) {
    throw new Error("Catalogue shell exposed a visible h1 or h2 heading.");
  }
  const exemplarGeometry = await page.evaluate(() => {
    const stage = document.querySelector<HTMLElement>(
      "[data-kp-animation-catalogue-stage]"
    );
    if (stage === null) {
      throw new Error("Solve-x exemplar stage is missing.");
    }
    const content = stage.querySelector<HTMLElement>(
      ".editor-equation-stage__content"
    );
    const visualStage = stage.querySelector<HTMLElement>(
      ".editor-animation-player__stage"
    );
    const controls = stage.querySelector<HTMLElement>(
      ".editor-animation-player__controls"
    );
    const stepRects = [...stage.querySelectorAll<HTMLElement>(
      "[data-kp-editor-solve-x-step]"
    )].map((step) => step.getBoundingClientRect());
    if (
      visualStage === null || content === null || controls === null
    ) {
      throw new Error("Solve-x exemplar geometry targets are missing.");
    }
    const stageRect = visualStage.getBoundingClientRect();
    const contentRect = content.getBoundingClientRect();
    const controlsRect = controls.getBoundingClientRect();
    return {
      stage: { width: stageRect.width, height: stageRect.height },
      content: { width: contentRect.width, height: contentRect.height },
      centerDelta: {
        x: contentRect.left + contentRect.width / 2 -
          (stageRect.left + stageRect.width / 2),
        y: contentRect.top + contentRect.height / 2 -
          (stageRect.top + stageRect.height / 2)
      },
      stepCount: stepRects.length,
      maxStepHeight: Math.max(0, ...stepRects.map((rect) => rect.height)),
      controlsVisibleWithoutDocumentScroll:
        controlsRect.bottom <= window.innerHeight + 1 &&
        document.documentElement.scrollHeight <= window.innerHeight + 1
    };
  });
  if (
    Math.abs(exemplarGeometry.centerDelta.x) > 2 ||
    Math.abs(exemplarGeometry.centerDelta.y) > 2 ||
    exemplarGeometry.content.height > 220 ||
    exemplarGeometry.stepCount !== 4 ||
    exemplarGeometry.maxStepHeight > 34 ||
    !exemplarGeometry.controlsVisibleWithoutDocumentScroll
  ) {
    throw new Error(
      `Solve-x catalogue geometry drifted: ${JSON.stringify(exemplarGeometry)}`
    );
  }
  const detailsSectionOrder = await page.locator(
    "[data-kp-animation-catalogue-inspector=\"details\"] " +
    "[data-kp-animation-catalogue-details-section]"
  ).evaluateAll((sections) => sections.map((section) =>
    (section as HTMLElement).dataset["kpAnimationCatalogueDetailsSection"]
  ));
  const expectedDetailsOrder = [
    "identity",
    "semantics",
    "playback",
    "capabilities",
    "health",
    "related-contexts"
  ];
  if (JSON.stringify(detailsSectionOrder) !== JSON.stringify(expectedDetailsOrder)) {
    throw new Error(
      `Catalogue Details order was ${JSON.stringify(detailsSectionOrder)}.`
    );
  }
  if (await page.locator(
    "[data-kp-animation-catalogue-inspector=\"details\"] [role=\"tab\"]"
  ).count() !== 0) {
    throw new Error("Catalogue Details exposed a tab interface.");
  }
  const search = page.locator(
    '[data-action="filter-animation-catalogue"]'
  );
  await page.locator(
    "[data-kp-animation-catalogue-stage] [data-kp-editor-animation-player]"
  ).evaluate((player) => {
    (player as HTMLElement).dataset["kpCataloguePersistenceProbe"] = "mounted";
  });
  await search.fill("slvx");
  const fuzzyResultIds = await page.locator(
    "[data-kp-animation-catalogue-row]"
  ).evaluateAll((rows) => rows.map((row) =>
    (row as HTMLElement).dataset["kpAnimationCatalogueRow"]
  ));
  const expectedFuzzyResultIds = [
    animationId,
    generatedLinearSolveExemplarId
  ];
  if (
    JSON.stringify(fuzzyResultIds) !== JSON.stringify(expectedFuzzyResultIds)
  ) {
    throw new Error(
      `Catalogue fuzzy search returned ${JSON.stringify(fuzzyResultIds)}.`
    );
  }
  const persistenceProbe = await page.locator(
    "[data-kp-animation-catalogue-stage] [data-kp-editor-animation-player]"
  ).getAttribute("data-kp-catalogue-persistence-probe");
  if (persistenceProbe !== "mounted") {
    throw new Error("Catalogue search remounted the selected player.");
  }
  await search.fill("");
  const allResultCount = await page.locator(
    "[data-kp-animation-catalogue-row]"
  ).count();
  if (allResultCount !== 36) {
    throw new Error(
      `Catalogue expected 36 flat asset rows, found ${allResultCount}.`
    );
  }
  const inspectorSelect = page.locator(
    '[data-action="select-animation-catalogue-inspector"]'
  );
  await inspectorSelect.selectOption("parameters");
  if (!await page.locator(
    '[data-kp-animation-catalogue-inspector-panel="parameters"]'
  ).isVisible()) {
    throw new Error("Catalogue Parameters view did not open.");
  }
  await inspectorSelect.selectOption("tuning");
  const styleTuning = page.locator(
    '[data-kp-animation-catalogue-tuning="gestalt-style"]'
  );
  const focusTuning = page.locator(
    '[data-kp-animation-catalogue-tuning="focus-experiment"]'
  );
  await styleTuning.selectOption("kp.restrained-editorial@1.0.0");
  await focusTuning.selectOption("elevated");
  await page.waitForFunction(() => {
    const player = document.querySelector<HTMLElement>(
      "[data-kp-animation-catalogue] [data-kp-editor-animation-player]"
    );
    return player?.dataset["kpEditorAnimationGestaltSelectedStyle"] ===
      "kp.restrained-editorial@1.0.0" &&
      player.dataset["kpEditorAnimationFocusExperiment"] === "elevated";
  });
  const capturedTuning = await page.evaluate(async () => {
    const modulePath =
      "/src/dev-review/animation-catalogue-capture-provider.ts";
    const { createKpAnimationCatalogueCaptureProvider } = await import(
      modulePath
    );
    return (await createKpAnimationCatalogueCaptureProvider(document).capture({
      route: new URL(window.location.href),
      capturedAtMs: performance.now(),
      eventTarget: null
    })).semantic.tuning;
  });
  if (
    capturedTuning?.["gestalt-style"] !==
      "kp.restrained-editorial@1.0.0" ||
    capturedTuning["focus-experiment"] !== "elevated"
  ) {
    throw new Error(
      `Catalogue capture lost tuning state: ${JSON.stringify(capturedTuning)}`
    );
  }
  await styleTuning.selectOption("kp.organic-subtle@1.0.0");
  await focusTuning.selectOption("flat");
  await inspectorSelect.selectOption("details");
  if (new URL(page.url()).searchParams.has("playhead")) {
    throw new Error("Transient inspector and tuning state leaked into the URL.");
  }
  const cataloguePlayer = page.locator(
    "[data-kp-animation-catalogue-stage] [data-kp-editor-animation-player]"
  );
  await cataloguePlayer.focus();
  await page.keyboard.press("ArrowRight");
  await page.waitForFunction(() =>
    new URL(window.location.href).searchParams.get("playhead") === "0.02"
  );
  await page.keyboard.press("End");
  await page.waitForFunction(() =>
    new URL(window.location.href).searchParams.get("playhead") === "1"
  );
  await page.keyboard.press("Home");
  await page.waitForFunction(() =>
    !new URL(window.location.href).searchParams.has("playhead")
  );
  await page.keyboard.press("Space");
  await page.waitForFunction(() =>
    document.querySelector<HTMLElement>(
      "[data-kp-animation-catalogue-stage] [data-kp-editor-animation-player]"
    )?.dataset["kpEditorAnimationStatus"] === "playing"
  );
  await page.keyboard.press("Space");
  await page.waitForFunction(() =>
    document.querySelector<HTMLElement>(
      "[data-kp-animation-catalogue-stage] [data-kp-editor-animation-player]"
    )?.dataset["kpEditorAnimationStatus"] === "paused"
  );
  await page.keyboard.press("Home");
  const review = page.locator("[data-kp-dev-review-shell]");
  await review.waitFor();
  if (await review.getAttribute("data-kp-dev-review-placement") !==
    "catalogue-rail") {
    throw new Error("Catalogue review capture is not docked in its rail.");
  }
  const reviewLauncher = review.locator("button.launcher");
  const railBounds = await page.locator(
    '[data-kp-animation-catalogue-region="rail"]'
  ).boundingBox();
  const launcherBounds = await reviewLauncher.boundingBox();
  if (
    railBounds === null || launcherBounds === null ||
    launcherBounds.x < railBounds.x ||
    launcherBounds.x + launcherBounds.width >
      railBounds.x + railBounds.width + 1 ||
    launcherBounds.y + launcherBounds.height <
      railBounds.y + railBounds.height - 12
  ) {
    throw new Error("Catalogue review launcher escaped the lower-left dock.");
  }
  await page.waitForFunction(() =>
    document.body.dataset["kpDevReviewReady"] === "true"
  );
  await reviewLauncher.click();
  const reviewPanel = review.locator('[role="dialog"]');
  await reviewPanel.waitFor();
  if (
    await reviewPanel.locator("h2").count() !== 0 ||
    await reviewPanel.locator("h3").count() !== 1
  ) {
    throw new Error("Catalogue review panel did not use compact h3 semantics.");
  }
  const screenshotResponsePromise = page.waitForResponse((response) =>
    response.url().endsWith("/api/dev/reviews/v2/screenshots") &&
    response.request().method() === "POST"
  );
  await reviewPanel.locator("textarea").fill("Catalogue capture probe");
  const screenshotResponse = await screenshotResponsePromise;
  if (!screenshotResponse.ok()) {
    throw new Error(
      `Catalogue screenshot service returned ${screenshotResponse.status()}.`
    );
  }
  const screenshotAttachment = await screenshotResponse.json() as {
    dataUrl?: string;
    pixelWidth?: number;
    pixelHeight?: number;
    scope?: string;
    sourceViewport?: {
      width?: number;
      height?: number;
    };
  };
  if (
    !screenshotAttachment.dataUrl?.startsWith("data:image/jpeg;base64,") ||
    screenshotAttachment.dataUrl.length > 75_000 ||
    (screenshotAttachment.pixelWidth ?? 0) < 1 ||
    (screenshotAttachment.pixelHeight ?? 0) < 1 ||
    screenshotAttachment.scope !== "selected-stage" ||
    (screenshotAttachment.sourceViewport?.width ?? 0) < 1 ||
    (screenshotAttachment.sourceViewport?.height ?? 0) < 1
  ) {
    throw new Error("Catalogue screenshot response was not bounded stage evidence.");
  }
  try {
    await page.waitForFunction(() => {
      const host = document.querySelector<HTMLElement>(
        "[data-kp-dev-review-shell]"
      );
      return host?.shadowRoot?.querySelector(".meta")?.textContent
        ?.includes("Locked") === true;
    });
  } catch (error: unknown) {
    const reviewState = await review.evaluate((host) => ({
      meta: host.shadowRoot?.querySelector(".meta")?.textContent,
      status: host.shadowRoot?.querySelector(".status")?.textContent
    }));
    throw new Error(
      `Catalogue review capture did not lock: ${JSON.stringify(reviewState)} ` +
      `${error instanceof Error ? error.message : String(error)}`
    );
  }
  const reviewMeta = await reviewPanel.locator(".meta").textContent();
  if (
    !reviewMeta?.includes("Current frame") ||
    !reviewMeta.includes("0%") ||
    !reviewMeta.includes("Screenshot attached")
  ) {
    throw new Error(
      `Catalogue review did not capture current playhead state: ${reviewMeta}`
    );
  }
  await reviewPanel.locator("button.close").click();

  const screenshot = path.join(outputRoot, "desktop.png");
  await page.screenshot({
    path: screenshot,
    fullPage: true,
    animations: "disabled"
  });
  const midpointScreenshot = path.join(outputRoot, "desktop-midpoint.png");
  const scrubber = page.locator(
    "[data-kp-animation-catalogue-stage] " +
    ".editor-animation-player__scrubber input"
  );
  await scrubber.fill("0.5");
  await page.waitForFunction(() =>
    document.querySelector<HTMLElement>(
      "[data-kp-animation-catalogue-stage] [data-kp-editor-animation-player]"
    )?.dataset["kpEditorAnimationProgress"] === "0.5"
  );
  await page.screenshot({
    path: midpointScreenshot,
    fullPage: true,
    animations: "disabled"
  });
  await scrubber.fill("0");

  const interaction = await captureCatalogueInteractionSelection(
    browser
  );

  const manifest = path.join(outputRoot, "manifest.json");
  await writeFile(
    manifest,
    `${JSON.stringify({
      schemaVersion: "kp.animation-catalogue-visual-capture.v1",
      animationId,
      routeState: "catalogue-explicit-exemplar",
      url: url.toString(),
      viewport,
      screenshot: path.relative(process.cwd(), screenshot),
      midpointScreenshot: path.relative(process.cwd(), midpointScreenshot),
      exemplarGeometry,
      interaction
    }, null, 2)}\n`,
    "utf8"
  );

  console.log(`animation catalogue capture: ${path.relative(process.cwd(), screenshot)}`);
  console.log(`animation catalogue manifest: ${path.relative(process.cwd(), manifest)}`);

  const reducedMotionPage = await browser.newPage({ viewport });
  await reducedMotionPage.emulateMedia({ reducedMotion: "reduce" });
  const reducedMotionUrl = new URL(url);
  reducedMotionUrl.searchParams.set("playhead", "0.5");
  await reducedMotionPage.goto(reducedMotionUrl.toString(), {
    waitUntil: "networkidle"
  });
  await reducedMotionPage.waitForFunction(() => {
    const player = document.querySelector<HTMLElement>(
      "[data-kp-animation-catalogue-stage] [data-kp-editor-animation-player]"
    );
    return player?.dataset["kpEditorAnimationHydrated"] === "true" &&
      player.dataset["kpEditorAnimationAccessibilityPreference"] === "system" &&
      player.dataset["kpEditorAnimationAccessibilityMode"] === "reduced-motion" &&
      player.dataset["kpEditorAnimationProgress"] === "0.5";
  });
  await reducedMotionPage.close();

  const siblingPage = await browser.newPage({ viewport });
  const siblingUrl = new URL("/", baseUrl);
  siblingUrl.searchParams.set("artifact", promotedSiblingId);
  await siblingPage.goto(siblingUrl.toString(), { waitUntil: "networkidle" });
  await siblingPage.waitForFunction((expectedAnimationId) => {
    const shell = document.querySelector<HTMLElement>(
      "[data-kp-animation-catalogue-state=\"selected\"]"
    );
    const player = shell?.querySelector<HTMLElement>(
      "[data-kp-animation-catalogue-stage] [data-kp-editor-animation-player]"
    );
    const surface = player?.querySelector<HTMLElement>(
      "[data-kp-editor-animation-surface-slot]"
    );
    return shell?.dataset["kpAnimationCatalogueSelection"] ===
      expectedAnimationId &&
      player?.dataset["kpEditorAnimationId"] === expectedAnimationId &&
      player.dataset["kpEditorAnimationHydrated"] === "true" &&
      surface?.dataset["kpEditorAnimationAdapterStatus"] === "ready";
  }, promotedSiblingId);
  const equationPressureScreenshot = path.join(
    outputRoot,
    "equation-pressure.png"
  );
  await siblingPage.screenshot({
    path: equationPressureScreenshot,
    fullPage: true,
    animations: "disabled"
  });
  const equationPressureGeometry = await siblingPage.evaluate(() => {
    const visualStage = document.querySelector<HTMLElement>(
      "[data-kp-animation-catalogue-stage] .editor-animation-player__stage"
    );
    const content = visualStage?.querySelector<HTMLElement>(
      ".editor-equation-stage__content"
    );
    const ink = content?.querySelector<HTMLElement>(
      ".editor-equation-stage__object .katex"
    );
    if (visualStage === null || content === null || ink === null ||
      visualStage === undefined || content === undefined || ink === undefined) {
      throw new Error("Equation pressure geometry targets are missing.");
    }
    const stageRect = visualStage.getBoundingClientRect();
    const contentRect = content.getBoundingClientRect();
    const inkRect = ink.getBoundingClientRect();
    return {
      contentDisplay: getComputedStyle(content).display,
      contentHeight: contentRect.height,
      contentCenterDeltaY:
        contentRect.top + contentRect.height / 2 -
        (stageRect.top + stageRect.height / 2),
      inkCenterDeltaX:
        inkRect.left + inkRect.width / 2 -
        (stageRect.left + stageRect.width / 2)
    };
  });
  if (
    equationPressureGeometry.contentDisplay !== "grid" ||
    equationPressureGeometry.contentHeight > 220 ||
    Math.abs(equationPressureGeometry.contentCenterDeltaY) > 2 ||
    Math.abs(equationPressureGeometry.inkCenterDeltaX) > 2
  ) {
    throw new Error(
      `Equation pressure geometry drifted: ${JSON.stringify(equationPressureGeometry)}`
    );
  }
  const equationPressureManifest = path.join(
    outputRoot,
    "equation-pressure.json"
  );
  await writeFile(
    equationPressureManifest,
    `${JSON.stringify({
      schemaVersion: "kp.animation-catalogue-equation-pressure.v1",
      animationId: promotedSiblingId,
      screenshot: path.relative(process.cwd(), equationPressureScreenshot),
      geometry: equationPressureGeometry
    }, null, 2)}\n`,
    "utf8"
  );
  if (await siblingPage.locator("iframe").count() !== 0) {
    throw new Error("Promoted catalogue sibling used an iframe fallback.");
  }
  console.log(
    `animation catalogue equation pressure: ${path.relative(process.cwd(), equationPressureScreenshot)}`
  );
  console.log(
    `animation catalogue equation pressure manifest: ${path.relative(process.cwd(), equationPressureManifest)}`
  );
  await siblingPage.close();

  await pressureDistinctCaller(browser);

  await captureEconomicsExemplar(browser);

  await capturePhysicsExemplar(browser);

  await captureGraph3DExemplar(browser);

  await captureVectorDotProjectionExemplar(browser);

  const hostabilityResults = await captureCatalogueHostability(browser);
  const hostabilityManifest = path.join(outputRoot, "hostability.json");
  await writeFile(
    hostabilityManifest,
    `${JSON.stringify({
      schemaVersion: "kp.animation-catalogue-hostability-capture.v1",
      capturedAt: new Date().toISOString(),
      viewport,
      counts: Object.fromEntries(
        ["painted", "capability-gap", "load-failure"].map((status) => [
          status,
          hostabilityResults.filter((result) => result.outcome === status)
            .length
        ])
      ),
      results: hostabilityResults
    }, null, 2)}\n`,
    "utf8"
  );
  console.log(
    `animation catalogue hostability: ${path.relative(process.cwd(), hostabilityManifest)}`
  );
} finally {
  await browser.close();
}
}

interface VectorDotProjectionCapture {
  readonly id: string;
  readonly path: string;
  readonly staticMarkup?: string | undefined;
  readonly staticMarkupSha256?: string | undefined;
  readonly viewport: { readonly width: number; readonly height: number };
  readonly progress: number;
  readonly beat: string;
  readonly accessibilityMode: string;
  readonly relationLatex: string;
  readonly katexCount: number;
  readonly labelGeometry: {
    readonly inspected: boolean;
    readonly contained: boolean;
    readonly overlaps: boolean;
  };
}

async function captureSvelteCatalogueExemplarParity(
  browser: Browser
): Promise<void> {
  const parityOutput = "svelte-catalogue-exemplar";
  const reference = await captureVectorDotProjectionExemplar(browser, {
    outputDirectory: path.join(parityOutput, "imperative-reference"),
    shell: "imperative"
  });
  const candidate = await captureVectorDotProjectionExemplar(browser, {
    outputDirectory: path.join(parityOutput, "svelte-candidate"),
    shell: "svelte-exemplar"
  });
  const comparisons = candidate.map((candidateCapture) => {
    const referenceCapture = reference.find(
      ({ id }) => id === candidateCapture.id
    );
    if (referenceCapture === undefined) {
      throw new Error(
        `Svelte vector checkpoint ${candidateCapture.id} has no reference.`
      );
    }
    const referenceTruth = comparableVectorTruth(referenceCapture);
    const candidateTruth = comparableVectorTruth(candidateCapture);
    const matches = JSON.stringify(referenceTruth) ===
      JSON.stringify(candidateTruth);
    if (!matches) {
      throw new Error(
        `Svelte vector checkpoint ${candidateCapture.id} changed durable ` +
        `truth: ${JSON.stringify({ referenceTruth, candidateTruth })}`
      );
    }
    return Object.freeze({
      id: candidateCapture.id,
      status: "matched" as const,
      reference: referenceCapture.path,
      candidate: candidateCapture.path,
      truth: candidateTruth
    });
  });
  if (comparisons.length !== reference.length) {
    throw new Error("Svelte vector parity did not cover every reference.");
  }

  const manifestPath = path.join(outputRoot, parityOutput, "manifest.json");
  await writeFile(manifestPath, `${JSON.stringify({
    schemaVersion: "kp.svelte-catalogue-vector-parity-checkpoint.v1",
    animationId: vectorDotProjectionExemplarId,
    reviewState: "awaiting-human-visual-approval",
    canonicalShell: "imperative",
    candidateShell: "svelte-exemplar",
    liveRoute:
      `/?artifact=${vectorDotProjectionExemplarId}` +
      "&catalogueShell=svelte-exemplar",
    promotionBoundary:
      "Do not make Svelte the default until the live exemplar is approved.",
    durableTruthMatched: true,
    comparisons
  }, null, 2)}\n`, "utf8");
  console.log(
    `Svelte catalogue vector parity: ${path.relative(process.cwd(), manifestPath)}`
  );
}

function comparableVectorTruth(
  capture: VectorDotProjectionCapture
): Omit<VectorDotProjectionCapture, "path" | "staticMarkup"> {
  const {
    path: _path,
    staticMarkup: _staticMarkup,
    ...truth
  } = capture;
  return truth;
}

async function captureVectorDotProjectionExemplar(
  browser: Browser,
  input: {
    readonly outputDirectory?: string | undefined;
    readonly shell?: "imperative" | "svelte-exemplar" | undefined;
  } = {}
): Promise<readonly VectorDotProjectionCapture[]> {
  const shell = input.shell ?? "imperative";
  const vectorOutput = path.join(
    outputRoot,
    input.outputDirectory ?? "vector-dot-projection"
  );
  await mkdir(vectorOutput, { recursive: true });
  const checkpoints = [
    {
      id: "start-wide-0",
      progress: 0,
      expectedBeat: "source-pose",
      viewport
    },
    {
      id: "component-pairing-wide-188",
      progress: 0.188,
      expectedBeat: "component-pair-x",
      viewport
    },
    {
      id: "projection-wide-688",
      progress: 0.688,
      expectedBeat: "projection-drop",
      viewport
    },
    {
      id: "settlement-wide-1000",
      progress: 1,
      expectedBeat: "native-settlement",
      viewport,
      inspectLabels: true
    },
    {
      id: "projection-narrow-688",
      progress: 0.688,
      expectedBeat: "projection-drop",
      viewport: { width: 390, height: 844 },
      inspectLabels: true
    },
    {
      id: "projection-reduced-motion-688",
      progress: 0.688,
      expectedBeat: "projection-drop",
      viewport,
      reducedMotion: true
    },
    {
      id: "settlement-static-svg-1000",
      progress: 1,
      expectedBeat: "native-settlement",
      viewport,
      stageOnly: true,
      inspectLabels: true
    }
  ] as const;
  const captures: VectorDotProjectionCapture[] = [];

  for (const checkpoint of checkpoints) {
    const page = await browser.newPage({ viewport: checkpoint.viewport });
    try {
      if ("reducedMotion" in checkpoint && checkpoint.reducedMotion) {
        await page.emulateMedia({ reducedMotion: "reduce" });
      }
      const url = new URL("/", baseUrl);
      url.searchParams.set("artifact", vectorDotProjectionExemplarId);
      if (shell === "imperative") {
        url.searchParams.set("catalogueShell", "imperative-rollback");
      } else {
        url.searchParams.set("catalogueShell", "svelte-exemplar");
      }
      if (checkpoint.progress > 0) {
        url.searchParams.set("playhead", String(checkpoint.progress));
      }
      await page.goto(url.toString(), { waitUntil: "networkidle" });
      await page.evaluate(async () => document.fonts.ready);
      await page.waitForFunction((expected) => {
        const catalogue = document.querySelector<HTMLElement>(
          "[data-kp-animation-catalogue]"
        );
        const player = catalogue?.querySelector<HTMLElement>(
          "[data-kp-editor-animation-player]"
        );
        const slot = player?.querySelector<HTMLElement>(
          '[data-kp-editor-animation-surface-slot="graph"]'
        );
        return catalogue?.dataset["kpAnimationCatalogueSelection"] ===
          expected.animationId &&
          catalogue.dataset["kpAnimationCatalogueHostOutcome"] === "painted" &&
          (expected.shell === "imperative"
            ? !catalogue.hasAttribute("data-kp-svelte-catalogue-shell")
            : catalogue.hasAttribute("data-kp-svelte-catalogue-shell")) &&
          player?.dataset["kpEditorAnimationHydrated"] === "true" &&
          Math.abs(Number(player.dataset["kpEditorAnimationProgress"]) -
            expected.progress) < 0.001 &&
          slot?.dataset["kpEditorAnimationAdapterStatus"] === "ready";
      }, {
        animationId: vectorDotProjectionExemplarId,
        progress: checkpoint.progress,
        shell
      });

      const graph = page.locator("[data-kp-editor-graph-svg]");
      const evidence = await page.evaluate((inspectLabels) => {
        const graphElement = document.querySelector<SVGElement>(
          "[data-kp-editor-graph-svg]"
        );
        const viewElement = graphElement?.querySelector<HTMLElement>(
          "[data-kp-vector-dot-projection-view]"
        );
        const player = document.querySelector<HTMLElement>(
          "[data-kp-editor-animation-player]"
        );
        const relation = graphElement?.querySelector<HTMLElement>(
          "[data-kp-vector-current-relation]"
        );
        if (graphElement === null || graphElement === undefined ||
          viewElement === null || viewElement === undefined ||
          player === null || relation === null || relation === undefined) {
          throw new Error("Vector review capture targets are missing.");
        }
        const graphRect = graphElement.getBoundingClientRect();
        const labelRects = inspectLabels
          ? [...graphElement.querySelectorAll<HTMLElement>(
              '[data-kp-vector-math-label] > div'
            )].map((label) => {
              const rect = label.getBoundingClientRect();
              return {
                left: rect.left,
                right: rect.right,
                top: rect.top,
                bottom: rect.bottom
              };
            })
          : [];
        const contained = labelRects.every((rect) =>
          rect.left >= graphRect.left - 1 &&
          rect.right <= graphRect.right + 1 &&
          rect.top >= graphRect.top - 1 &&
          rect.bottom <= graphRect.bottom + 1
        );
        const overlaps = labelRects.some((left, leftIndex) =>
          labelRects.slice(leftIndex + 1).some((right) =>
            left.left < right.right && left.right > right.left &&
            left.top < right.bottom && left.bottom > right.top
          )
        );
        return {
          beat: viewElement.dataset["kpVectorDotProjectionBeat"] ?? "",
          accessibilityMode:
            player.dataset["kpEditorAnimationAccessibilityMode"] ?? "",
          relationLatex: relation.dataset["kpLatex"] ?? "",
          presentationProfile: graphElement.dataset[
            "kpGraphPresentationProfile"
          ] ?? "",
          languageProfile: graphElement.dataset["kpGraphLanguageProfile"] ?? "",
          katexCount: graphElement.querySelectorAll(".katex").length,
          svgTextCount: graphElement.querySelectorAll("text").length,
          description: graphElement.querySelector("desc")?.textContent ?? "",
          hasRightAngle:
            graphElement.querySelector("[data-kp-vector-right-angle]") !== null,
          labelGeometry: {
            inspected: inspectLabels,
            contained,
            overlaps
          }
        };
      }, "inspectLabels" in checkpoint && checkpoint.inspectLabels);

      const expectedAccessibilityMode =
        "reducedMotion" in checkpoint && checkpoint.reducedMotion
          ? "reduced-motion"
          : "full-motion";
      if (
        evidence.beat !== checkpoint.expectedBeat ||
        evidence.accessibilityMode !== expectedAccessibilityMode ||
        evidence.presentationProfile !==
          "kp.graph.dimensional-continuity.linear-algebra.v1" ||
        evidence.languageProfile !== "kp.graph.dimensional-continuity.v1" ||
        evidence.katexCount !== 17 ||
        evidence.svgTextCount !== 0 ||
        !evidence.description.includes("projection of a onto b is (3, 3)") ||
        (checkpoint.progress === 1 && !evidence.hasRightAngle) ||
        (evidence.labelGeometry.inspected &&
          (!evidence.labelGeometry.contained || evidence.labelGeometry.overlaps))
      ) {
        throw new Error(
          `Vector capture ${checkpoint.id} drifted: ${JSON.stringify(evidence)}`
        );
      }

      const imagePath = path.join(vectorOutput, `${checkpoint.id}.png`);
      let staticMarkup: string | undefined;
      let staticMarkupSha256: string | undefined;
      if ("stageOnly" in checkpoint && checkpoint.stageOnly) {
        await graph.screenshot({
          path: imagePath,
          animations: "disabled"
        });
        const markupPath = path.join(vectorOutput, `${checkpoint.id}.svg`);
        const markup = `${await graph.evaluate((node) => node.outerHTML)}\n`;
        await writeFile(markupPath, markup, "utf8");
        staticMarkup = path.relative(process.cwd(), markupPath);
        staticMarkupSha256 = createHash("sha256").update(markup).digest("hex");
      } else {
        await page.screenshot({
          path: imagePath,
          fullPage: true,
          animations: "disabled"
        });
      }
      captures.push({
        id: checkpoint.id,
        path: path.relative(process.cwd(), imagePath),
        ...(staticMarkup === undefined ? {} : { staticMarkup }),
        ...(staticMarkupSha256 === undefined
          ? {}
          : { staticMarkupSha256 }),
        viewport: checkpoint.viewport,
        progress: checkpoint.progress,
        beat: evidence.beat,
        accessibilityMode: evidence.accessibilityMode,
        relationLatex: evidence.relationLatex,
        katexCount: evidence.katexCount,
        labelGeometry: evidence.labelGeometry
      });
    } finally {
      await page.close();
    }
  }

  const manifestPath = path.join(vectorOutput, "manifest.json");
  await writeFile(manifestPath, `${JSON.stringify({
    schemaVersion: "kp.animation-catalogue-vector-dot-projection-review.v1",
    animationId: vectorDotProjectionExemplarId,
    shellComposition: shell,
    disposition: "Keep",
    promotion: "promoted-rank-5-after-human-approval",
    captureSemantics: {
      staticView: "settled SVG markup with browser animations disabled",
      reducedMotion: "system prefers-reduced-motion projection",
      imagesAreDisposable: true
    },
    captures
  }, null, 2)}\n`, "utf8");
  console.log(
    `animation catalogue vector review: ${path.relative(process.cwd(), manifestPath)}`
  );
  return Object.freeze(captures);
}

async function captureProgrammingAdditionExemplar(
  browser: Browser
): Promise<void> {
  const programmingOutput = path.join(outputRoot, "programming-addition");
  await mkdir(programmingOutput, { recursive: true });
  const checkpoints = [
    {
      id: "start-wide-0",
      animationId: programmingAdditionExemplarId,
      progress: 0,
      expectedStep: "step.programming.add.call",
      expectedFocus: "selector.programming.add.signature",
      expectedLocals: ["a = 2", "b = 2"],
      expectedOutput: [],
      viewport
    },
    {
      id: "statement-focus-wide-400",
      animationId: programmingAdditionExemplarId,
      progress: 0.4,
      expectedStep: "step.programming.add.evaluate-return",
      expectedFocus: "selector.programming.add.return",
      expectedLocals: ["a = 2", "b = 2"],
      expectedOutput: [],
      viewport
    },
    {
      id: "return-local-wide-750",
      animationId: programmingAdditionExemplarId,
      progress: 0.75,
      expectedStep: "step.programming.add.return",
      expectedFocus: "selector.programming.add.return",
      expectedLocals: ["a = 2", "b = 2", "return = 4"],
      expectedOutput: [],
      viewport
    },
    {
      id: "output-settlement-wide-1000",
      animationId: programmingAdditionExemplarId,
      progress: 1,
      expectedStep: "step.programming.add.output",
      expectedFocus: "",
      expectedLocals: [],
      expectedOutput: ["4"],
      viewport
    },
    {
      id: "statement-focus-narrow-400",
      animationId: programmingAdditionExemplarId,
      progress: 0.4,
      expectedStep: "step.programming.add.evaluate-return",
      expectedFocus: "selector.programming.add.return",
      expectedLocals: ["a = 2", "b = 2"],
      expectedOutput: [],
      viewport: { width: 390, height: 844 }
    },
    {
      id: "statement-focus-reduced-motion-400",
      animationId: programmingAdditionExemplarId,
      progress: 0.4,
      expectedStep: "step.programming.add.evaluate-return",
      expectedFocus: "selector.programming.add.return",
      expectedLocals: ["a = 2", "b = 2"],
      expectedOutput: [],
      viewport,
      reducedMotion: true
    },
    {
      id: "output-static-wide-1000",
      animationId: programmingAdditionExemplarId,
      progress: 1,
      expectedStep: "step.programming.add.output",
      expectedFocus: "",
      expectedLocals: [],
      expectedOutput: ["4"],
      viewport,
      staticMode: true
    },
    {
      id: "comparison-settlement-wide-1000",
      animationId: programmingComparisonExemplarId,
      progress: 1,
      expectedStep: "step.programming.add.output",
      expectedFocus: "",
      expectedLocals: [],
      expectedOutput: ["4"],
      viewport,
      comparison: true
    }
  ] as const;
  const captures: Array<{
    readonly id: string;
    readonly path: string;
    readonly animationId: string;
    readonly viewport: { readonly width: number; readonly height: number };
    readonly progress: number;
    readonly step: string;
    readonly focus: string;
    readonly locals: readonly string[];
    readonly output: readonly string[];
    readonly accessibilityMode: string;
    readonly contained: boolean;
    readonly documentOverflow: boolean;
  }> = [];

  for (const checkpoint of checkpoints) {
    const page = await browser.newPage({ viewport: checkpoint.viewport });
    try {
      if ("reducedMotion" in checkpoint && checkpoint.reducedMotion) {
        await page.emulateMedia({ reducedMotion: "reduce" });
      }
      const url = new URL("/", baseUrl);
      url.searchParams.set("artifact", checkpoint.animationId);
      if (checkpoint.progress > 0) {
        url.searchParams.set("playhead", String(checkpoint.progress));
      }
      await page.goto(url.toString(), { waitUntil: "networkidle" });
      await page.waitForFunction((expected) => {
        const catalogue = document.querySelector<HTMLElement>(
          "[data-kp-animation-catalogue]"
        );
        const player = catalogue?.querySelector<HTMLElement>(
          "[data-kp-editor-animation-player]"
        );
        const slot = player?.querySelector<HTMLElement>(
          '[data-kp-editor-animation-surface-slot="programming"]'
        );
        return catalogue?.dataset["kpAnimationCatalogueSelection"] ===
          expected.animationId &&
          catalogue.dataset["kpAnimationCatalogueHostOutcome"] === "painted" &&
          player?.dataset["kpEditorAnimationHydrated"] === "true" &&
          Math.abs(Number(player.dataset["kpEditorAnimationProgress"]) -
            expected.progress) < 0.001 &&
          slot?.dataset["kpEditorAnimationAdapterId"] ===
            "editor-animation-surface.programming.trace";
      }, {
        animationId: checkpoint.animationId,
        progress: checkpoint.progress
      });

      if ("staticMode" in checkpoint && checkpoint.staticMode) {
        await page.evaluate(() => {
          const player = document.querySelector<HTMLElement>(
            "[data-kp-editor-animation-player]"
          );
          const scrubber = player?.querySelector<HTMLInputElement>(
            '[data-action="seek-editor-animation"]'
          );
          if (player === null || player === undefined || scrubber === null ||
            scrubber === undefined) {
            throw new Error("Static programming capture controls are missing.");
          }
          player.dataset["kpEditorAnimationAccessibilityMode"] = "static";
          scrubber.dispatchEvent(new Event("input", { bubbles: true }));
        });
      }

      await page.waitForFunction((expectedStep) =>
        document.querySelector<HTMLElement>(
          "[data-kp-editor-programming-trace]"
        )?.dataset["kpEditorProgrammingStep"] === expectedStep,
      checkpoint.expectedStep);
      const evidence = await page.evaluate(() => {
        const catalogue = document.querySelector<HTMLElement>(
          "[data-kp-animation-catalogue]"
        );
        const stage = catalogue?.querySelector<HTMLElement>(
          "[data-kp-animation-catalogue-stage]"
        );
        const player = stage?.querySelector<HTMLElement>(
          "[data-kp-editor-animation-player]"
        );
        const trace = stage?.querySelector<HTMLElement>(
          "[data-kp-editor-programming-trace]"
        );
        if (stage === null || stage === undefined || player === null ||
          player === undefined || trace === null || trace === undefined) {
          throw new Error("Programming review capture targets are missing.");
        }
        const stageRect = stage.getBoundingClientRect();
        const traceRect = trace.getBoundingClientRect();
        const values = (channel: string) => [...trace.querySelectorAll<HTMLElement>(
          `[data-kp-editor-programming-channel="${channel}"] li`
        )].map((item) => item.textContent?.trim() ?? "");
        return {
          step: trace.dataset["kpEditorProgrammingStep"] ?? "",
          focus: trace.querySelector<HTMLElement>(
            "[data-kp-editor-programming-source-focus]"
          )?.dataset["kpEditorProgrammingSourceFocus"] ?? "",
          locals: values("locals"),
          output: values("output"),
          accessibilityMode:
            player.dataset["kpEditorAnimationAccessibilityMode"] ?? "",
          accessibleDescription: trace.getAttribute("aria-label") ?? "",
          sourceText: trace.querySelector(
            ".editor-programming-trace__source"
          )?.textContent ?? "",
          iframeCount: catalogue?.querySelectorAll("iframe").length ?? -1,
          programmingSlotCount: catalogue?.querySelectorAll(
            '[data-kp-editor-animation-surface-slot="programming"]'
          ).length ?? -1,
          equationSlotCount: catalogue?.querySelectorAll(
            '[data-kp-editor-animation-surface-slot="equation"]'
          ).length ?? -1,
          contained:
            traceRect.left >= stageRect.left - 1 &&
            traceRect.right <= stageRect.right + 1 &&
            traceRect.top >= stageRect.top - 1 &&
            traceRect.bottom <= stageRect.bottom + 1,
          documentOverflow:
            document.documentElement.scrollWidth > window.innerWidth + 1
        };
      });
      const expectedMode =
        "staticMode" in checkpoint && checkpoint.staticMode
          ? "static"
          : "reducedMotion" in checkpoint && checkpoint.reducedMotion
            ? "reduced-motion"
            : "full-motion";
      const comparison = "comparison" in checkpoint && checkpoint.comparison;
      if (
        evidence.step !== checkpoint.expectedStep ||
        evidence.focus !== checkpoint.expectedFocus ||
        JSON.stringify(evidence.locals) !==
          JSON.stringify(checkpoint.expectedLocals) ||
        JSON.stringify(evidence.output) !==
          JSON.stringify(checkpoint.expectedOutput) ||
        evidence.accessibilityMode !== expectedMode ||
        !evidence.sourceText.includes("export function add") ||
        !evidence.accessibleDescription.includes("add") &&
          !evidence.accessibleDescription.includes("final result") ||
        evidence.iframeCount !== 0 ||
        evidence.programmingSlotCount !== 1 ||
        evidence.equationSlotCount !== (comparison ? 1 : 0) ||
        !evidence.contained ||
        evidence.documentOverflow
      ) {
        throw new Error(
          `Programming capture ${checkpoint.id} drifted: ${JSON.stringify(evidence)}`
        );
      }

      const imagePath = path.join(programmingOutput, `${checkpoint.id}.png`);
      await page.screenshot({
        path: imagePath,
        fullPage: true,
        animations: "disabled"
      });
      captures.push({
        id: checkpoint.id,
        path: path.relative(process.cwd(), imagePath),
        animationId: checkpoint.animationId,
        viewport: checkpoint.viewport,
        progress: checkpoint.progress,
        step: evidence.step,
        focus: evidence.focus,
        locals: evidence.locals,
        output: evidence.output,
        accessibilityMode: evidence.accessibilityMode,
        contained: evidence.contained,
        documentOverflow: evidence.documentOverflow
      });
    } finally {
      await page.close();
    }
  }

  const manifestPath = path.join(programmingOutput, "manifest.json");
  await writeFile(manifestPath, `${JSON.stringify({
    schemaVersion: "kp.animation-catalogue-programming-addition-review.v1",
    animationId: programmingAdditionExemplarId,
    comparisonAnimationId: programmingComparisonExemplarId,
    disposition: "Unreviewed",
    promotion: "frozen-pending-consolidated-human-checkpoint",
    captureSemantics: {
      staticView: "exact settled trace with catalogue animations disabled",
      reducedMotion: "system prefers-reduced-motion projection",
      imagesAreDisposable: true
    },
    captures
  }, null, 2)}\n`, "utf8");
  console.log(
    `animation catalogue programming review: ${path.relative(process.cwd(), manifestPath)}`
  );
}

async function captureGraph3DExemplar(browser: Browser): Promise<void> {
  const graph3DOutput = path.join(outputRoot, "graph3d");
  await mkdir(graph3DOutput, { recursive: true });
  const screenshots: Array<{
    readonly id: string;
    readonly path: string;
    readonly viewport: { readonly width: number; readonly height: number };
    readonly progress: number;
    readonly webglStatus: string;
    readonly fallbackMode: string;
  }> = [];

  const capture = async (input: {
    readonly id: string;
    readonly viewport: { readonly width: number; readonly height: number };
    readonly progress: number;
    readonly forceCapabilityFailure?: boolean | undefined;
    readonly loseContext?: boolean | undefined;
  }): Promise<void> => {
    const page = await browser.newPage({ viewport: input.viewport });
    if (input.forceCapabilityFailure === true) {
      await page.route(/graph-webgl-three/, (route) => route.abort());
    }
    const url = new URL("/", baseUrl);
    url.searchParams.set("artifact", graph3DExemplarId);
    try {
      await page.goto(url.toString(), { waitUntil: "networkidle" });
      await waitForGraph3DSelection(page);
      const scrubber = page.locator('[data-action="seek-editor-animation"]');
      await scrubber.fill(String(input.progress));
      const shell = page.locator(".graph-webgl");
      await shell.waitFor();
      if (input.forceCapabilityFailure === true) {
        await shell.waitFor({ state: "visible" });
        await page.waitForFunction(() =>
          document.querySelector<HTMLElement>(".graph-webgl")
            ?.dataset["kpWebglStatus"] === "fallback"
        );
      } else {
        await page.waitForFunction(() =>
          document.querySelector<HTMLElement>(".graph-webgl")
            ?.dataset["kpWebglStatus"] === "ready"
        );
      }
      if (input.loseContext === true) {
        await page.locator(".graph-webgl__canvas").evaluate((canvas) => {
          canvas.dispatchEvent(
            new Event("webglcontextlost", { cancelable: true })
          );
        });
        await page.waitForFunction(() =>
          document.querySelector<HTMLElement>(".graph-webgl")
            ?.dataset["kpWebglStatus"] === "fallback"
        );
      }
      const imagePath = path.join(graph3DOutput, `${input.id}.png`);
      await page.screenshot({ path: imagePath, fullPage: true });
      const evidence = await shell.evaluate((element) => ({
        webglStatus: element.dataset["kpWebglStatus"] ?? "unknown",
        fallbackMode: element.getAttribute(
          "data-kp-editor-graph-3d-fallback-mode"
        ) ?? "unknown",
        progress: Number(
          element.getAttribute("data-kp-editor-graph-3d-progress") ??
            Number.NaN
        )
      }));
      if (
        Math.abs(evidence.progress - input.progress) > 0.001 ||
        (input.progress < 0.5 && evidence.fallbackMode !== "mesh") ||
        (input.progress >= 0.5 && evidence.fallbackMode !== "donut")
      ) {
        throw new Error(
          `Graph3D capture ${input.id} drifted: ${JSON.stringify(evidence)}`
        );
      }
      screenshots.push({
        id: input.id,
        path: path.relative(process.cwd(), imagePath),
        viewport: input.viewport,
        progress: evidence.progress,
        webglStatus: evidence.webglStatus,
        fallbackMode: evidence.fallbackMode
      });
    } finally {
      await page.close();
    }
  };

  await capture({
    id: "wide-webgl-40",
    viewport,
    progress: 0.4
  });
  await capture({
    id: "narrow-webgl-70",
    viewport: { width: 390, height: 844 },
    progress: 0.7
  });
  await capture({
    id: "semantic-svg-fallback-100",
    viewport,
    progress: 1,
    forceCapabilityFailure: true
  });
  await capture({
    id: "context-loss-fallback-70",
    viewport,
    progress: 0.7,
    loseContext: true
  });

  const manifest = path.join(graph3DOutput, "manifest.json");
  await writeFile(
    manifest,
    `${JSON.stringify({
      schemaVersion: "kp.animation-catalogue-graph3d-exemplar.v1",
      animationId: graph3DExemplarId,
      disposition: "Unreviewed",
      paintOwners: {
        ready: "three-webgl",
        pendingAndFallback: "semantic-svg"
      },
      screenshots
    }, null, 2)}\n`,
    "utf8"
  );
  console.log(
    `animation catalogue Graph3D exemplar: ${path.relative(process.cwd(), manifest)}`
  );
}

async function waitForGraph3DSelection(page: Page): Promise<void> {
  await page.waitForFunction((expectedAnimationId) => {
    const catalogue = document.querySelector<HTMLElement>(
      "[data-kp-animation-catalogue]"
    );
    const slot = catalogue?.querySelector<HTMLElement>(
      '[data-kp-editor-animation-surface-slot="graph"]'
    );
    return catalogue?.dataset["kpAnimationCatalogueSelection"] ===
      expectedAnimationId &&
      catalogue.dataset["kpAnimationCatalogueHostOutcome"] === "painted" &&
      slot?.dataset["kpEditorAnimationAdapterId"] ===
        "editor-animation-surface.graph.webgl-3d";
  }, graph3DExemplarId);
}

async function captureEconomicsExemplar(browser: Browser): Promise<void> {
  const checkpoints = [
    {
      name: "start",
      progress: "0",
      stage: "establish",
      demandEquation: "P=14-Q",
      demandDisplay: "P = 14.00 - Q",
      equilibriumDisplay: "E_0 = (6.00, 8.00)",
      equilibriumQuantity: "6",
      equilibriumPrice: "8"
    },
    {
      name: "shift",
      progress: "0.44",
      stage: "shift",
      demandEquation: "P=16-Q",
      demandDisplay: "P \\approx 16.00 - Q",
      equilibriumDisplay: "E_t \\approx (7.00, 9.00)",
      equilibriumQuantity: "7",
      equilibriumPrice: "9"
    },
    {
      name: "settle",
      progress: "1",
      stage: "settle",
      demandEquation: "P=18-Q",
      demandDisplay: "P = 18.00 - Q",
      equilibriumDisplay: "E_1 = (8.00, 10.00)",
      equilibriumQuantity: "8",
      equilibriumPrice: "10"
    }
  ] as const;
  const economicsUrl = new URL("/", baseUrl);
  economicsUrl.searchParams.set("artifact", economicsExemplarId);
  const page = await browser.newPage({ viewport });
  const screenshots: Record<string, string> = {};

  try {
    await page.goto(economicsUrl.toString(), { waitUntil: "networkidle" });
    await page.evaluate(async () => document.fonts.ready);
    await waitForEconomicsExemplar(page);

    const player = page.locator(
      "[data-kp-animation-catalogue-stage] [data-kp-editor-animation-player]"
    );
    const graph = player.locator("[data-kp-editor-graph-svg]");
    const scrubber = player.locator(
      '[data-action="seek-editor-animation"]'
    );
    if (await page.locator("iframe").count() !== 0) {
      throw new Error("Economics exemplar used an iframe fallback.");
    }
    if (await player.locator(".katex-display").count() !== 0 ||
      await player.locator(".katex").count() < 3) {
      throw new Error("Economics exemplar did not keep its equations inline.");
    }
    const presentationProfile = await graph.getAttribute(
      "data-kp-graph-presentation-profile"
    );
    const languageProfile = await graph.getAttribute(
      "data-kp-graph-language-profile"
    );
    const rawSvgTextCount = await graph.locator("text").count();
    const mathLabelCount = await graph.locator(
      "[data-kp-economics-math-label]"
    ).count();
    const pointRadius = await graph.locator(
      "[data-kp-economics-equilibrium-point]"
    ).getAttribute("r");
    if (presentationProfile !==
        "kp.graph.dimensional-continuity.economics.v1" ||
      languageProfile !== "kp.graph.dimensional-continuity.v1" ||
      rawSvgTextCount !== 0 || mathLabelCount < 14 || pointRadius !== "4.5") {
      throw new Error(
        "Economics graph lost its dimensional-continuity or KaTeX contract: " +
        JSON.stringify({
          presentationProfile,
          languageProfile,
          rawSvgTextCount,
          mathLabelCount,
          pointRadius
        })
      );
    }

    const geometry = await page.evaluate(() => {
      const visualStage = document.querySelector<HTMLElement>(
        "[data-kp-animation-catalogue-stage] .editor-animation-player__stage"
      );
      const graph = visualStage?.querySelector<SVGSVGElement>(
        "[data-kp-editor-graph-svg]"
      );
      const controls = document.querySelector<HTMLElement>(
        "[data-kp-animation-catalogue-stage] .editor-animation-player__controls"
      );
      if (visualStage === null || visualStage === undefined ||
        graph === null || graph === undefined || controls === null) {
        throw new Error("Economics geometry targets are missing.");
      }
      const stageRect = visualStage.getBoundingClientRect();
      const graphRect = graph.getBoundingClientRect();
      const controlsRect = controls.getBoundingClientRect();
      return {
        stage: { width: stageRect.width, height: stageRect.height },
        graph: { width: graphRect.width, height: graphRect.height },
        centerDelta: {
          x: graphRect.left + graphRect.width / 2 -
            (stageRect.left + stageRect.width / 2),
          y: graphRect.top + graphRect.height / 2 -
            (stageRect.top + stageRect.height / 2)
        },
        controlsVisibleWithoutDocumentScroll:
          controlsRect.bottom <= window.innerHeight + 1 &&
          document.documentElement.scrollHeight <= window.innerHeight + 1
      };
    });
    if (Math.abs(geometry.centerDelta.x) > 2 ||
      Math.abs(geometry.centerDelta.y) > 2 ||
      !geometry.controlsVisibleWithoutDocumentScroll) {
      throw new Error(
        `Economics catalogue geometry drifted: ${JSON.stringify(geometry)}`
      );
    }

    let stableDynamicWidths:
      | { readonly demand: number; readonly equilibrium: number }
      | undefined;
    for (const checkpoint of checkpoints) {
      await scrubber.fill(checkpoint.progress);
      await page.waitForFunction((expectedProgress) =>
        document.querySelector<HTMLElement>(
          "[data-kp-animation-catalogue-stage] " +
          "[data-kp-editor-animation-player]"
        )?.dataset["kpEditorAnimationProgress"] === expectedProgress,
      checkpoint.progress);
      const equilibriumView = graph.locator(
        "[data-kp-economics-equilibrium-view]"
      );
      const demandLine = graph.locator("[data-kp-economics-demand-line]");
      const equilibriumPoint = graph.locator(
        "[data-kp-economics-equilibrium-point]"
      );
      const demandDisplay = graph.locator(
        '[data-kp-economics-equation-role="demand"]'
      );
      const equilibriumDisplay = graph.locator(
        '[data-kp-economics-math-label="equilibrium-current"] ' +
        "[data-kp-latex]"
      );
      if (await equilibriumView.getAttribute(
        "data-kp-economics-choreography-stage"
      ) !== checkpoint.stage || await demandLine.getAttribute(
        "data-kp-economics-equation"
      ) !== checkpoint.demandEquation || await equilibriumPoint.getAttribute(
        "data-kp-economics-equilibrium-quantity"
      ) !== checkpoint.equilibriumQuantity ||
        await equilibriumPoint.getAttribute(
          "data-kp-economics-equilibrium-price"
        ) !== checkpoint.equilibriumPrice || await equilibriumView.getAttribute(
          "data-kp-economics-display-precision"
        ) !== "2" || await demandDisplay.getAttribute(
          "data-kp-latex"
        ) !== checkpoint.demandDisplay || await equilibriumDisplay.getAttribute(
          "data-kp-latex"
        ) !== checkpoint.equilibriumDisplay) {
        throw new Error(
          `Economics ${checkpoint.name} checkpoint lost frame or display truth.`
        );
      }
      const dynamicWidths = {
        demand: await demandDisplay.evaluate((element) =>
          element.getBoundingClientRect().width
        ),
        equilibrium: await equilibriumDisplay.evaluate((element) =>
          element.getBoundingClientRect().width
        )
      };
      if (stableDynamicWidths === undefined) {
        stableDynamicWidths = dynamicWidths;
      } else if (Math.abs(stableDynamicWidths.demand - dynamicWidths.demand) >
          0.5 || Math.abs(
        stableDynamicWidths.equilibrium - dynamicWidths.equilibrium
      ) > 0.5) {
        throw new Error(
          `Economics ${checkpoint.name} dynamic readouts changed size: ` +
          JSON.stringify({ stableDynamicWidths, dynamicWidths })
        );
      }
      const labels = await page.evaluate(() => {
        const rect = (role: string) => {
          const element = document.querySelector<SVGForeignObjectElement>(
            `[data-kp-economics-math-label="${role}"]`
          );
          if (element === null) return undefined;
          const bounds = element.getBoundingClientRect();
          return {
            left: bounds.left,
            right: bounds.right,
            top: bounds.top,
            bottom: bounds.bottom
          };
        };
        return {
          demand: rect("curve-demand-current"),
          priceAxis: rect("axis-price")
        };
      });
      if (labels.demand === undefined || labels.priceAxis === undefined ||
        rectanglesOverlap(labels.demand, labels.priceAxis)) {
        throw new Error(
          `Economics ${checkpoint.name} labels collided: ${JSON.stringify(labels)}`
        );
      }
      const screenshot = path.join(
        outputRoot,
        `economics-${checkpoint.name}.png`
      );
      await page.screenshot({
        path: screenshot,
        fullPage: true,
        animations: "disabled"
      });
      screenshots[checkpoint.name] = path.relative(process.cwd(), screenshot);
    }

    await page.locator(
      '[data-action="select-animation-catalogue-inspector"]'
    ).selectOption("parameters");
    await page.locator(
      '[data-action="set-economics-demand-intercept"]'
    ).fill("20");
    await scrubber.fill("0.44");
    const customDemand = graph.locator("[data-kp-economics-demand-line]");
    const customPoint = graph.locator(
      "[data-kp-economics-equilibrium-point]"
    );
    if (await customDemand.getAttribute("data-kp-economics-equation") !==
      "P=17-Q" || await customPoint.getAttribute(
        "data-kp-economics-equilibrium-quantity"
      ) !== "15/2" || await customPoint.getAttribute(
        "data-kp-economics-equilibrium-price"
      ) !== "19/2") {
      throw new Error("Economics custom-target checkpoint lost exact truth.");
    }
    if (await graph.locator(
      '[data-kp-economics-equation-role="demand"]'
    ).getAttribute("data-kp-latex") !== "P \\approx 17.00 - Q" ||
      await graph.locator(
        '[data-kp-economics-math-label="equilibrium-current"] ' +
        "[data-kp-latex]"
      ).getAttribute("data-kp-latex") !==
        "E_t \\approx (7.50, 9.50)") {
      throw new Error("Economics custom-target display lost fixed decimals.");
    }
    const customScreenshot = path.join(outputRoot, "economics-custom-20.png");
    await page.screenshot({
      path: customScreenshot,
      fullPage: true,
      animations: "disabled"
    });
    screenshots["custom-20"] = path.relative(
      process.cwd(),
      customScreenshot
    );

    const narrow = await browser.newPage({
      viewport: { width: 720, height: 900 }
    });
    try {
      const narrowUrl = new URL(economicsUrl);
      narrowUrl.searchParams.set("playhead", "0.44");
      await narrow.goto(narrowUrl.toString(), { waitUntil: "networkidle" });
      await narrow.evaluate(async () => document.fonts.ready);
      await waitForEconomicsExemplar(narrow);
      const narrowGeometry = await narrow.evaluate(() => {
        const controls = document.querySelector<HTMLElement>(
          "[data-kp-animation-catalogue-stage] " +
          ".editor-animation-player__controls"
        );
        const reviewHost = document.querySelector<HTMLElement>(
          "[data-kp-dev-review-shell]"
        );
        const launcher = reviewHost?.shadowRoot?.querySelector<HTMLElement>(
          ".launcher"
        );
        const play = controls?.querySelector<HTMLElement>(
          '[data-action="toggle-editor-animation"]'
        );
        const scrubber = controls?.querySelector<HTMLElement>(
          '[data-action="seek-editor-animation"]'
        );
        if (controls === null || reviewHost === null || launcher === null ||
          launcher === undefined || play === null || play === undefined ||
          scrubber === null || scrubber === undefined) {
          throw new Error("Narrow economics control geometry is missing.");
        }
        const controlsRect = controls.getBoundingClientRect();
        const hostRect = reviewHost.getBoundingClientRect();
        const launcherRect = launcher.getBoundingClientRect();
        const playRect = play.getBoundingClientRect();
        const scrubberRect = scrubber.getBoundingClientRect();
        const hostStyle = getComputedStyle(reviewHost);
        const firstTransportLeft = Math.min(
          playRect.left,
          scrubberRect.left
        );
        return {
          controlsTop: controlsRect.top,
          host: {
            top: hostRect.top,
            bottom: hostRect.bottom,
            height: hostRect.height,
            placement: reviewHost.dataset["kpDevReviewPlacement"],
            computedBottom: hostStyle.bottom,
            computedPosition: hostStyle.position,
            viewportWidth: window.innerWidth,
            devicePixelRatio: window.devicePixelRatio
          },
          launcherTop: launcherRect.top,
          launcherBottom: launcherRect.bottom,
          launcherRight: launcherRect.right,
          firstTransportLeft,
          reviewClearsTransport:
            launcherRect.bottom <= controlsRect.top - 2 ||
            launcherRect.right <= firstTransportLeft - 2,
          controlsVisibleWithoutDocumentScroll:
            controlsRect.bottom <= window.innerHeight + 1 &&
            document.documentElement.scrollHeight <= window.innerHeight + 1
        };
      });
      if (!narrowGeometry.reviewClearsTransport ||
        !narrowGeometry.controlsVisibleWithoutDocumentScroll) {
        throw new Error(
          `Narrow economics controls collided: ${JSON.stringify(narrowGeometry)}`
        );
      }
      const narrowScreenshot = path.join(
        outputRoot,
        "economics-narrow-shift.png"
      );
      await narrow.screenshot({
        path: narrowScreenshot,
        fullPage: true,
        animations: "disabled"
      });
      screenshots["narrow-shift"] = path.relative(
        process.cwd(),
        narrowScreenshot
      );
    } finally {
      await narrow.close();
    }

    const manifest = path.join(outputRoot, "economics-exemplar.json");
    await writeFile(
      manifest,
      `${JSON.stringify({
        schemaVersion: "kp.animation-catalogue-economics-exemplar.v1",
        animationId: economicsExemplarId,
        url: economicsUrl.toString(),
        viewport,
        geometry,
        presentation: {
          profile: presentationProfile,
          mathTypography: "katex",
          rawSvgTextCount,
          minimumMathLabelCount: mathLabelCount,
          dynamicDisplayDecimals: 2,
          equilibriumPointRadius: Number(pointRadius)
        },
        screenshots
      }, null, 2)}\n`,
      "utf8"
    );
    console.log(
      `animation catalogue economics exemplar: ${path.relative(process.cwd(), manifest)}`
    );
  } finally {
    await page.close();
  }
}

async function capturePhysicsExemplar(browser: Browser): Promise<void> {
  const checkpoints = [
    {
      name: "start",
      progress: "0",
      stage: "establish",
      position: "0",
      work: "0",
      kineticEnergy: "4",
      workDisplay:
        "W_{\\mathrm{net}} = F_x\\Delta x = 0.00\\,\\mathrm{J}",
      energyDisplay:
        "K = K_0 + W_{\\mathrm{net}} = 4.00\\,\\mathrm{J}",
      displacementDisplay: "\\Delta x = 0.00\\,\\mathrm{m}"
    },
    {
      name: "accumulate",
      progress: "0.46",
      stage: "accumulate",
      position: "2",
      work: "6",
      kineticEnergy: "10",
      workDisplay:
        "W_{\\mathrm{net}} = F_x\\Delta x \\approx 6.00\\,\\mathrm{J}",
      energyDisplay:
        "K = K_0 + W_{\\mathrm{net}} \\approx 10.00\\,\\mathrm{J}",
      displacementDisplay: "\\Delta x \\approx 2.00\\,\\mathrm{m}"
    },
    {
      name: "settle",
      progress: "1",
      stage: "settle",
      position: "4",
      work: "12",
      kineticEnergy: "16",
      workDisplay:
        "W_{\\mathrm{net}} = F_x\\Delta x = 12.00\\,\\mathrm{J}",
      energyDisplay:
        "K = K_0 + W_{\\mathrm{net}} = 16.00\\,\\mathrm{J}",
      displacementDisplay: "\\Delta x = 4.00\\,\\mathrm{m}"
    }
  ] as const;
  const physicsUrl = new URL("/", baseUrl);
  physicsUrl.searchParams.set("artifact", physicsExemplarId);
  const page = await browser.newPage({ viewport });
  const screenshots: Record<string, string> = {};

  try {
    await page.goto(physicsUrl.toString(), { waitUntil: "networkidle" });
    await page.evaluate(async () => document.fonts.ready);
    await waitForPhysicsExemplar(page);

    const player = page.locator(
      "[data-kp-animation-catalogue-stage] [data-kp-editor-animation-player]"
    );
    const graph = player.locator("[data-kp-editor-graph-svg]");
    const scrubber = player.locator('[data-action="seek-editor-animation"]');
    if (await page.locator("iframe").count() !== 0) {
      throw new Error("Physics exemplar used an iframe fallback.");
    }
    if (await player.locator(".katex-display").count() !== 0 ||
      await player.locator(".katex").count() < 12) {
      throw new Error("Physics exemplar did not keep mathematical text inline.");
    }
    const presentationProfile = await graph.getAttribute(
      "data-kp-graph-presentation-profile"
    );
    const languageProfile = await graph.getAttribute(
      "data-kp-graph-language-profile"
    );
    const rawSvgTextCount = await graph.locator("text").count();
    const mathLabelCount = await graph.locator(
      "[data-kp-physics-math-label]"
    ).count();
    if (presentationProfile !==
        "kp.graph.dimensional-continuity.physics.v1" ||
      languageProfile !== "kp.graph.dimensional-continuity.v1" ||
      rawSvgTextCount !== 0 || mathLabelCount < 17) {
      throw new Error(
        "Physics graph lost its dimensional-continuity or KaTeX contract: " +
        JSON.stringify({
          presentationProfile,
          languageProfile,
          rawSvgTextCount,
          mathLabelCount
        })
      );
    }

    const geometry = await page.evaluate(() => {
      const visualStage = document.querySelector<HTMLElement>(
        "[data-kp-animation-catalogue-stage] .editor-animation-player__stage"
      );
      const graph = visualStage?.querySelector<SVGSVGElement>(
        "[data-kp-editor-graph-svg]"
      );
      const controls = document.querySelector<HTMLElement>(
        "[data-kp-animation-catalogue-stage] .editor-animation-player__controls"
      );
      if (visualStage === null || visualStage === undefined ||
        graph === null || graph === undefined || controls === null) {
        throw new Error("Physics geometry targets are missing.");
      }
      const stageRect = visualStage.getBoundingClientRect();
      const graphRect = graph.getBoundingClientRect();
      const controlsRect = controls.getBoundingClientRect();
      return {
        stage: { width: stageRect.width, height: stageRect.height },
        graph: { width: graphRect.width, height: graphRect.height },
        centerDelta: {
          x: graphRect.left + graphRect.width / 2 -
            (stageRect.left + stageRect.width / 2),
          y: graphRect.top + graphRect.height / 2 -
            (stageRect.top + stageRect.height / 2)
        },
        controlsVisibleWithoutDocumentScroll:
          controlsRect.bottom <= window.innerHeight + 1 &&
          document.documentElement.scrollHeight <= window.innerHeight + 1
      };
    });
    if (Math.abs(geometry.centerDelta.x) > 2 ||
      Math.abs(geometry.centerDelta.y) > 2 ||
      !geometry.controlsVisibleWithoutDocumentScroll) {
      throw new Error(
        `Physics catalogue geometry drifted: ${JSON.stringify(geometry)}`
      );
    }

    let stableDynamicWidths:
      | { readonly work: number; readonly energy: number; readonly displacement: number }
      | undefined;
    for (const checkpoint of checkpoints) {
      await scrubber.fill(checkpoint.progress);
      await page.waitForFunction((expectedProgress) =>
        document.querySelector<HTMLElement>(
          "[data-kp-animation-catalogue-stage] " +
          "[data-kp-editor-animation-player]"
        )?.dataset["kpEditorAnimationProgress"] === expectedProgress,
      checkpoint.progress);
      const view = graph.locator("[data-kp-physics-work-energy-view]");
      const workArea = graph.locator("[data-kp-physics-work-area]");
      const object = graph.locator("[data-kp-physics-object-position]");
      const energy = graph.locator("[data-kp-physics-energy-total]");
      const workDisplay = graph.locator(
        '[data-kp-physics-equation-role="work"]'
      );
      const energyDisplay = graph.locator(
        '[data-kp-physics-equation-role="energy"]'
      );
      const displacementDisplay = graph.locator(
        '[data-kp-physics-math-label="diagram-displacement"] [data-kp-latex]'
      );
      if (await view.getAttribute("data-kp-physics-choreography-stage") !==
          checkpoint.stage ||
        await view.getAttribute("data-kp-physics-position") !==
          checkpoint.position ||
        await workArea.getAttribute("data-kp-physics-work-area") !==
          checkpoint.work ||
        await object.getAttribute("data-kp-physics-object-position") !==
          checkpoint.position ||
        await energy.getAttribute("data-kp-physics-energy-total") !==
          checkpoint.kineticEnergy ||
        await view.getAttribute("data-kp-physics-display-precision") !== "2" ||
        await workDisplay.getAttribute("data-kp-latex") !==
          checkpoint.workDisplay ||
        await energyDisplay.getAttribute("data-kp-latex") !==
          checkpoint.energyDisplay ||
        await displacementDisplay.getAttribute("data-kp-latex") !==
          checkpoint.displacementDisplay) {
        throw new Error(
          `Physics ${checkpoint.name} checkpoint lost frame or display truth.`
        );
      }
      const dynamicWidths = {
        work: await workDisplay.evaluate((element) =>
          element.getBoundingClientRect().width
        ),
        energy: await energyDisplay.evaluate((element) =>
          element.getBoundingClientRect().width
        ),
        displacement: await displacementDisplay.evaluate((element) =>
          element.getBoundingClientRect().width
        )
      };
      if (stableDynamicWidths === undefined) {
        stableDynamicWidths = dynamicWidths;
      } else if (Math.abs(stableDynamicWidths.work - dynamicWidths.work) >
          0.5 || Math.abs(stableDynamicWidths.energy - dynamicWidths.energy) >
          0.5 || Math.abs(
        stableDynamicWidths.displacement - dynamicWidths.displacement
      ) > 0.5) {
        throw new Error(
          `Physics ${checkpoint.name} dynamic readouts changed size: ` +
          JSON.stringify({ stableDynamicWidths, dynamicWidths })
        );
      }
      const screenshot = path.join(
        outputRoot,
        `physics-${checkpoint.name}.png`
      );
      await page.screenshot({
        path: screenshot,
        fullPage: true,
        animations: "disabled"
      });
      screenshots[checkpoint.name] = path.relative(process.cwd(), screenshot);
    }

    await page.locator(
      '[data-action="select-animation-catalogue-inspector"]'
    ).selectOption("parameters");
    await page.locator('[data-action="set-physics-net-force"]').fill("5");
    await scrubber.fill("1");
    if (await graph.locator("[data-kp-physics-constant-force-line]")
      .getAttribute("data-kp-physics-force-value") !== "5" ||
      await graph.locator("[data-kp-physics-work-area]")
        .getAttribute("data-kp-physics-work-area") !== "20" ||
      await graph.locator("[data-kp-physics-energy-total]")
        .getAttribute("data-kp-physics-energy-total") !== "24") {
      throw new Error("Physics custom-force checkpoint lost exact truth.");
    }
    const customScreenshot = path.join(outputRoot, "physics-custom-5n.png");
    await page.screenshot({
      path: customScreenshot,
      fullPage: true,
      animations: "disabled"
    });
    screenshots["custom-5n"] = path.relative(process.cwd(), customScreenshot);

    const narrow = await browser.newPage({
      viewport: { width: 720, height: 900 }
    });
    try {
      const narrowUrl = new URL(physicsUrl);
      narrowUrl.searchParams.set("playhead", "0.46");
      await narrow.goto(narrowUrl.toString(), { waitUntil: "networkidle" });
      await narrow.evaluate(async () => document.fonts.ready);
      await waitForPhysicsExemplar(narrow);
      const narrowGeometry = await narrow.evaluate(() => {
        const controls = document.querySelector<HTMLElement>(
          "[data-kp-animation-catalogue-stage] " +
          ".editor-animation-player__controls"
        );
        const reviewHost = document.querySelector<HTMLElement>(
          "[data-kp-dev-review-shell]"
        );
        const launcher = reviewHost?.shadowRoot?.querySelector<HTMLElement>(
          ".launcher"
        );
        const play = controls?.querySelector<HTMLElement>(
          '[data-action="toggle-editor-animation"]'
        );
        const scrubber = controls?.querySelector<HTMLElement>(
          '[data-action="seek-editor-animation"]'
        );
        if (controls === null || reviewHost === null || launcher === null ||
          launcher === undefined || play === null || play === undefined ||
          scrubber === null || scrubber === undefined) {
          throw new Error("Narrow physics control geometry is missing.");
        }
        const controlsRect = controls.getBoundingClientRect();
        const launcherRect = launcher.getBoundingClientRect();
        const playRect = play.getBoundingClientRect();
        const scrubberRect = scrubber.getBoundingClientRect();
        return {
          reviewClearsTransport:
            launcherRect.bottom <= controlsRect.top - 2 ||
            launcherRect.right <= Math.min(
              playRect.left,
              scrubberRect.left
            ) - 2,
          controlsVisibleWithoutDocumentScroll:
            controlsRect.bottom <= window.innerHeight + 1 &&
            document.documentElement.scrollHeight <= window.innerHeight + 1
        };
      });
      if (!narrowGeometry.reviewClearsTransport ||
        !narrowGeometry.controlsVisibleWithoutDocumentScroll) {
        throw new Error(
          `Narrow physics controls collided: ${JSON.stringify(narrowGeometry)}`
        );
      }
      const narrowScreenshot = path.join(
        outputRoot,
        "physics-narrow-accumulate.png"
      );
      await narrow.screenshot({
        path: narrowScreenshot,
        fullPage: true,
        animations: "disabled"
      });
      screenshots["narrow-accumulate"] = path.relative(
        process.cwd(),
        narrowScreenshot
      );
    } finally {
      await narrow.close();
    }

    const manifest = path.join(outputRoot, "physics-exemplar.json");
    await writeFile(
      manifest,
      `${JSON.stringify({
        schemaVersion: "kp.animation-catalogue-physics-exemplar.v1",
        animationId: physicsExemplarId,
        url: physicsUrl.toString(),
        viewport,
        geometry,
        presentation: {
          profile: presentationProfile,
          mathTypography: "katex",
          rawSvgTextCount,
          minimumMathLabelCount: mathLabelCount,
          dynamicDisplayDecimals: 2
        },
        screenshots
      }, null, 2)}\n`,
      "utf8"
    );
    console.log(
      `animation catalogue physics exemplar: ${path.relative(process.cwd(), manifest)}`
    );
  } finally {
    await page.close();
  }
}

function rectanglesOverlap(
  left: { readonly left: number; readonly right: number; readonly top: number; readonly bottom: number },
  right: { readonly left: number; readonly right: number; readonly top: number; readonly bottom: number }
): boolean {
  return left.left < right.right && left.right > right.left &&
    left.top < right.bottom && left.bottom > right.top;
}

async function waitForEconomicsExemplar(page: Page) {
  await page.waitForFunction((expectedAnimationId) => {
    const shell = document.querySelector<HTMLElement>(
      "[data-kp-animation-catalogue]"
    );
    const player = shell?.querySelector<HTMLElement>(
      "[data-kp-editor-animation-player]"
    );
    const slot = player?.querySelector<HTMLElement>(
      '[data-kp-editor-animation-surface-slot="graph"]'
    );
    return shell?.dataset["kpAnimationCatalogueSelection"] ===
      expectedAnimationId &&
      shell.dataset["kpAnimationCatalogueHostOutcome"] === "painted" &&
      player?.dataset["kpEditorAnimationHydrated"] === "true" &&
      slot?.dataset["kpEditorAnimationAdapterStatus"] === "ready";
  }, economicsExemplarId);
}

async function waitForPhysicsExemplar(page: Page) {
  await page.waitForFunction((expectedAnimationId) => {
    const shell = document.querySelector<HTMLElement>(
      "[data-kp-animation-catalogue]"
    );
    const player = shell?.querySelector<HTMLElement>(
      "[data-kp-editor-animation-player]"
    );
    const slot = player?.querySelector<HTMLElement>(
      '[data-kp-editor-animation-surface-slot="graph"]'
    );
    return shell?.dataset["kpAnimationCatalogueSelection"] ===
      expectedAnimationId &&
      shell.dataset["kpAnimationCatalogueHostOutcome"] === "painted" &&
      player?.dataset["kpEditorAnimationHydrated"] === "true" &&
      slot?.dataset["kpEditorAnimationAdapterStatus"] === "ready";
  }, physicsExemplarId);
}

async function captureCatalogueInteractionSelection(browser: Browser) {
  const page = await browser.newPage({ viewport });
  const sourceUrl = new URL("/", baseUrl);
  sourceUrl.searchParams.set("artifact", animationId);

  try {
    await page.goto(sourceUrl.toString(), { waitUntil: "networkidle" });
    await page.waitForFunction((expectedAnimationId) => {
      const shell = document.querySelector<HTMLElement>(
        "[data-kp-animation-catalogue]"
      );
      return shell?.dataset["kpAnimationCatalogueSelection"] ===
        expectedAnimationId &&
        shell.dataset["kpAnimationCatalogueHostOutcome"] === "painted";
    }, animationId);

    const search = page.locator(
      '[data-action="filter-animation-catalogue"]'
    );
    const inspectorSelect = page.locator(
      '[data-action="select-animation-catalogue-inspector"]'
    );
    await inspectorSelect.selectOption("parameters");
    const review = page.locator("[data-kp-dev-review-shell]");
    await review.locator("button.launcher").click();
    await review.locator('[role="dialog"] textarea').fill(
      "Unsaved catalogue navigation baseline"
    );

    await page.evaluate(() => {
      const probeWindow = window as Window & {
        kpCatalogueDocumentProbe?: string;
      };
      probeWindow.kpCatalogueDocumentProbe = "before-navigation";
      const shell = document.querySelector<HTMLElement>(
        "[data-kp-animation-catalogue]"
      );
      const reviewHost = document.querySelector<HTMLElement>(
        "[data-kp-dev-review-shell]"
      );
      shell?.setAttribute("data-kp-catalogue-interaction-probe", "mounted");
      reviewHost?.setAttribute(
        "data-kp-catalogue-review-interaction-probe",
        "mounted"
      );
    });

    const railScrollTopBefore = await page.evaluate((nextAnimationId) => {
      const viewport = document.querySelector<HTMLElement>(
        ".kp-animation-catalogue-shell__rail-results"
      );
      const link = document.querySelector<HTMLAnchorElement>(
        `[data-kp-animation-catalogue-row="${nextAnimationId}"] a`
      );
      if (viewport === null || link === null) {
        throw new Error(`Catalogue row ${nextAnimationId} is missing.`);
      }
      viewport.scrollTop = Math.min(
        180,
        Math.max(0, viewport.scrollHeight - viewport.clientHeight)
      );
      link.focus({ preventScroll: true });
      return viewport.scrollTop;
    }, promotedSiblingId);
    await page.keyboard.press("Enter");
    await page.waitForFunction((expectedAnimationId) => {
      const shell = document.querySelector<HTMLElement>(
        "[data-kp-animation-catalogue]"
      );
      return shell?.dataset["kpAnimationCatalogueSelection"] ===
        expectedAnimationId &&
        shell.dataset["kpAnimationCatalogueHostOutcome"] === "painted";
    }, promotedSiblingId);
    const firstSelection = await page.evaluate((expectedAnimationId) => {
      const viewport = document.querySelector<HTMLElement>(
        ".kp-animation-catalogue-shell__rail-results"
      );
      const focusedRow = document.activeElement?.closest<HTMLElement>(
        "[data-kp-animation-catalogue-row]"
      );
      return {
        rowFocusPreserved:
          focusedRow?.dataset["kpAnimationCatalogueRow"] ===
            expectedAnimationId,
        railScrollTopAfter: viewport?.scrollTop ?? 0
      };
    }, promotedSiblingId);

    await inspectorSelect.focus();
    await page.evaluate(() => window.history.back());
    await page.waitForFunction((expectedAnimationId) => {
      const shell = document.querySelector<HTMLElement>(
        "[data-kp-animation-catalogue]"
      );
      return shell?.dataset["kpAnimationCatalogueSelection"] ===
        expectedAnimationId &&
        shell.dataset["kpAnimationCatalogueHostOutcome"] === "painted";
    }, animationId);
    const inspectorFocusPreserved = await inspectorSelect.evaluate(
      (select) => document.activeElement === select
    );
    const historyBackArtifact = new URL(page.url()).searchParams.get(
      "artifact"
    );

    const reviewTextarea = review.locator('[role="dialog"] textarea');
    await reviewTextarea.focus();
    await page.evaluate(() => window.history.forward());
    await page.waitForFunction((expectedAnimationId) => {
      const shell = document.querySelector<HTMLElement>(
        "[data-kp-animation-catalogue]"
      );
      return shell?.dataset["kpAnimationCatalogueSelection"] ===
        expectedAnimationId &&
        shell.dataset["kpAnimationCatalogueHostOutcome"] === "painted";
    }, promotedSiblingId);
    const reviewFocusPreserved = await reviewTextarea.evaluate((textarea) => {
      const root = textarea.getRootNode();
      return root instanceof ShadowRoot && root.activeElement === textarea;
    });
    const historyForwardArtifact = new URL(page.url()).searchParams.get(
      "artifact"
    );

    await search.fill("radical");
    await search.focus();
    await page.evaluate(() => window.history.back());
    await page.waitForFunction((expectedAnimationId) => {
      const shell = document.querySelector<HTMLElement>(
        "[data-kp-animation-catalogue]"
      );
      return shell?.dataset["kpAnimationCatalogueSelection"] ===
        expectedAnimationId &&
        shell.dataset["kpAnimationCatalogueHostOutcome"] === "painted";
    }, animationId);
    const searchFocusPreserved = await search.evaluate(
      (input) => document.activeElement === input
    );
    await page.evaluate((nextAnimationId) => {
      const link = document.querySelector<HTMLAnchorElement>(
        `[data-kp-animation-catalogue-row="${nextAnimationId}"] a`
      );
      if (link === null) {
        throw new Error(`Catalogue row ${nextAnimationId} is missing.`);
      }
      link.click();
    }, promotedSiblingId);
    await page.waitForFunction((expectedAnimationId) => {
      const shell = document.querySelector<HTMLElement>(
        "[data-kp-animation-catalogue]"
      );
      return shell?.dataset["kpAnimationCatalogueSelection"] ===
        expectedAnimationId &&
        shell.dataset["kpAnimationCatalogueHostOutcome"] === "painted";
    }, promotedSiblingId);

    const after = await page.evaluate(() => {
      const probeWindow = window as Window & {
        kpCatalogueDocumentProbe?: string;
      };
      const shell = document.querySelector<HTMLElement>(
        "[data-kp-animation-catalogue]"
      );
      const reviewHost = document.querySelector<HTMLElement>(
        "[data-kp-dev-review-shell]"
      );
      return {
        documentIdentityPreserved:
          probeWindow.kpCatalogueDocumentProbe === "before-navigation",
        shellIdentityPreserved:
          shell?.dataset["kpCatalogueInteractionProbe"] === "mounted",
        reviewComposerIdentityPreserved:
          reviewHost?.dataset["kpCatalogueReviewInteractionProbe"] ===
            "mounted",
        railQuery: document.querySelector<HTMLInputElement>(
          '[data-action="filter-animation-catalogue"]'
        )?.value ?? "",
        inspectorMode: document.querySelector<HTMLSelectElement>(
          '[data-action="select-animation-catalogue-inspector"]'
        )?.value ?? "",
        navigationType: performance.getEntriesByType("navigation")
          .map((entry) => (entry as PerformanceNavigationTiming).type)
          .at(-1) ?? "unknown"
      };
    });
    const reviewDraft = await review.locator(
      '[role="dialog"] textarea'
    ).inputValue();

    if (
      !after.documentIdentityPreserved ||
      !after.shellIdentityPreserved ||
      !after.reviewComposerIdentityPreserved ||
      !firstSelection.rowFocusPreserved ||
      Math.abs(
        firstSelection.railScrollTopAfter - railScrollTopBefore
      ) > 1 ||
      !inspectorFocusPreserved ||
      !reviewFocusPreserved ||
      !searchFocusPreserved ||
      historyBackArtifact !== animationId ||
      historyForwardArtifact !== promotedSiblingId ||
      after.railQuery !== "radical" ||
      after.inspectorMode !== "parameters" ||
      reviewDraft !== "Unsaved catalogue navigation baseline"
    ) {
      throw new Error(
        `Catalogue interaction baseline drifted: ${JSON.stringify({
          ...after,
          firstSelection,
          railScrollTopBefore,
          inspectorFocusPreserved,
          reviewFocusPreserved,
          searchFocusPreserved,
          historyBackArtifact,
          historyForwardArtifact,
          reviewDraft
        })}`
      );
    }

    return {
      schemaVersion: "kp.animation-catalogue-interaction-selection.v1",
      selection: `${animationId} -> ${promotedSiblingId}`,
      mode: "in-shell-selection",
      ...after,
      history: {
        backArtifact: historyBackArtifact,
        forwardArtifact: historyForwardArtifact,
        restoredInShell:
          historyBackArtifact === animationId &&
          historyForwardArtifact === promotedSiblingId
      },
      focus: {
        selectedRow: firstSelection.rowFocusPreserved,
        inspector: inspectorFocusPreserved,
        reviewComposer: reviewFocusPreserved,
        search: searchFocusPreserved
      },
      railScroll: {
        before: railScrollTopBefore,
        after: firstSelection.railScrollTopAfter,
        scrollable: railScrollTopBefore > 0,
        preserved: Math.abs(
          firstSelection.railScrollTopAfter - railScrollTopBefore
        ) <= 1
      },
      documentNavigationObserved: !after.documentIdentityPreserved,
      reviewDraftPreserved:
        reviewDraft === "Unsaved catalogue navigation baseline"
    } as const;
  } finally {
    await page.close();
  }
}

async function pressureDistinctCaller(browser: Browser): Promise<void> {
  const callerUrl = new URL("/", baseUrl);
  callerUrl.searchParams.set("artifact", distinctCallerId);
  const page = await browser.newPage({ viewport });

  try {
    await page.goto(callerUrl.toString(), { waitUntil: "networkidle" });
    await page.waitForFunction((expectedAnimationId) => {
      const shell = document.querySelector<HTMLElement>(
        "[data-kp-animation-catalogue]"
      );
      const player = shell?.querySelector<HTMLElement>(
        "[data-kp-editor-animation-player]"
      );
      const slot = player?.querySelector<HTMLElement>(
        '[data-kp-editor-animation-surface-slot="diagram"]'
      );
      return shell?.dataset["kpAnimationCatalogueSelection"] ===
        expectedAnimationId &&
        shell.dataset["kpAnimationCatalogueHostOutcome"] === "painted" &&
        shell.dataset["kpAnimationCatalogueSelectedHealth"] === "ready" &&
        player?.dataset["kpEditorAnimationHydrated"] === "true" &&
        slot?.dataset["kpEditorAnimationAdapterId"] ===
          "editor-animation-surface.exact-fraction-quantity.synchronized";
    }, distinctCallerId);

    const player = page.locator(
      "[data-kp-animation-catalogue-stage] [data-kp-editor-animation-player]"
    );
    if (await page.locator("iframe").count() !== 0) {
      throw new Error("Distinct catalogue caller used an iframe fallback.");
    }
    if (await player.locator(
      ".editor-equation-stage__content"
    ).count() !== 0) {
      throw new Error(
        "Equation-only stage geometry leaked into the diagram pressure caller."
      );
    }
    if (await player.locator(
      '[data-action="toggle-editor-animation"]'
    ).count() !== 1 || await player.locator(
      '[data-action="seek-editor-animation"]'
    ).count() !== 1 || await player.locator(
      '[data-action="step-editor-animation"], ' +
      '[data-action="rewind-editor-animation"], ' +
      '[data-action="reset-editor-animation"]'
    ).count() !== 0) {
      throw new Error("Distinct caller escaped compact catalogue transport.");
    }
    if (await page.locator(
      '[data-action="toggle-animation-catalogue-overlay"]:visible'
    ).count() !== 0) {
      throw new Error("Narrow panel controls leaked into the desktop shell.");
    }

    await player.focus();
    await page.keyboard.press("ArrowRight");
    await page.waitForFunction(() => {
      const playhead = Number(
        new URL(window.location.href).searchParams.get("playhead")
      );
      return Number.isFinite(playhead) && playhead > 0;
    });
    await page.keyboard.press("End");
    await page.waitForFunction(() =>
      new URL(window.location.href).searchParams.get("playhead") === "1"
    );
    await page.keyboard.press("Home");
    await page.waitForFunction(() =>
      !new URL(window.location.href).searchParams.has("playhead")
    );
    await page.keyboard.press("Space");
    await page.waitForFunction(() =>
      document.querySelector<HTMLElement>(
        "[data-kp-animation-catalogue-stage] " +
        "[data-kp-editor-animation-player]"
      )?.dataset["kpEditorAnimationStatus"] === "playing"
    );
    await page.keyboard.press("Space");
    await page.waitForFunction(() =>
      document.querySelector<HTMLElement>(
        "[data-kp-animation-catalogue-stage] " +
        "[data-kp-editor-animation-player]"
      )?.dataset["kpEditorAnimationStatus"] === "paused"
    );
  } finally {
    await page.close();
  }

  const reducedMotionPage = await browser.newPage({ viewport });
  try {
    await reducedMotionPage.emulateMedia({ reducedMotion: "reduce" });
    const reducedUrl = new URL(callerUrl);
    reducedUrl.searchParams.set("playhead", "0.5");
    await reducedMotionPage.goto(reducedUrl.toString(), {
      waitUntil: "networkidle"
    });
    await reducedMotionPage.waitForFunction((expectedAnimationId) => {
      const shell = document.querySelector<HTMLElement>(
        "[data-kp-animation-catalogue]"
      );
      const player = shell?.querySelector<HTMLElement>(
        "[data-kp-editor-animation-player]"
      );
      return shell?.dataset["kpAnimationCatalogueSelection"] ===
        expectedAnimationId &&
        shell.dataset["kpAnimationCatalogueHostOutcome"] === "painted" &&
        player?.dataset["kpEditorAnimationAccessibilityMode"] ===
          "reduced-motion" &&
        player.dataset["kpEditorAnimationProgress"] === "0.5";
    }, distinctCallerId);
  } finally {
    await reducedMotionPage.close();
  }

  const narrowPage = await browser.newPage({
    viewport: { width: 720, height: 900 }
  });
  try {
    await narrowPage.goto(callerUrl.toString(), { waitUntil: "networkidle" });
    await narrowPage.waitForFunction((expectedAnimationId) => {
      const shell = document.querySelector<HTMLElement>(
        "[data-kp-animation-catalogue]"
      );
      return shell?.dataset["kpAnimationCatalogueSelection"] ===
        expectedAnimationId &&
        shell.dataset["kpAnimationCatalogueHostOutcome"] === "painted";
    }, distinctCallerId);
    const shell = narrowPage.locator("[data-kp-animation-catalogue]");
    const railButton = narrowPage.locator(
      '[data-kp-animation-catalogue-overlay-target="rail"]'
    );
    const inspectorButton = narrowPage.locator(
      '[data-kp-animation-catalogue-overlay-target="inspector"]'
    );
    await railButton.click();
    if (await shell.getAttribute("data-kp-animation-catalogue-overlay") !==
      "rail" || await railButton.getAttribute("aria-expanded") !== "true") {
      throw new Error("Narrow artifact rail did not open accessibly.");
    }
    const search = narrowPage.locator(
      '[data-action="filter-animation-catalogue"]'
    );
    try {
      await narrowPage.waitForFunction(
        () => document.querySelector<HTMLInputElement>(
          '[data-action="filter-animation-catalogue"]'
        ) === document.activeElement,
        undefined,
        { timeout: 2_000 }
      );
    } catch (error: unknown) {
      const focus = await narrowPage.evaluate(() => {
        const search = document.querySelector(
          '[data-action="filter-animation-catalogue"]'
        );
        return {
          activeTag: document.activeElement?.tagName,
          activeAction: (document.activeElement as HTMLElement | null)
            ?.dataset["action"],
          railExists: document.querySelector(
            "#kp-animation-catalogue-rail"
          ) !== null,
          searchExists: search !== null,
          searchVisibility: search === null
            ? undefined
            : getComputedStyle(search).visibility,
          overlay: document.querySelector<HTMLElement>(
            "[data-kp-animation-catalogue]"
          )?.dataset["kpAnimationCatalogueOverlay"]
        };
      });
      throw new Error(
        `Narrow artifact focus was ${JSON.stringify(focus)}: ` +
        `${error instanceof Error ? error.message : String(error)}`
      );
    }
    if (!await search.isVisible()) {
      throw new Error("Narrow artifact rail search remained hidden.");
    }
    await narrowPage.keyboard.press("Escape");
    if (await shell.getAttribute("data-kp-animation-catalogue-overlay") !==
      null || !await railButton.evaluate((node) =>
        node === document.activeElement
      )) {
      throw new Error("Narrow artifact rail did not close back to its trigger.");
    }
    await inspectorButton.click();
    const inspectorSelect = narrowPage.locator(
      '[data-action="select-animation-catalogue-inspector"]'
    );
    await narrowPage.waitForFunction(() =>
      document.querySelector<HTMLSelectElement>(
        '[data-action="select-animation-catalogue-inspector"]'
      ) === document.activeElement
    );
    if (await shell.getAttribute("data-kp-animation-catalogue-overlay") !==
      "inspector" || !await inspectorSelect.isVisible() ||
      !await inspectorSelect.evaluate((node) => node === document.activeElement)) {
      throw new Error("Narrow inspector did not open with functional focus.");
    }
    if (await narrowPage.locator("iframe").count() !== 0) {
      throw new Error("Narrow catalogue caller used an iframe fallback.");
    }
  } finally {
    await narrowPage.close();
  }
}

async function captureCatalogueHostability(browser: Browser) {
  const entries = createKpAnimationCatalogueProjection().entries;
  const page = await browser.newPage({ viewport });
  const results: Array<{
    animationId: string;
    packId: string;
    outcome: string;
    health: string;
    surfaceKind?: string | undefined;
    adapterIds: readonly string[];
    gapKind?: string | undefined;
    iframeCount: number;
  }> = [];

  try {
    for (const entry of entries) {
      const entryUrl = new URL("/", baseUrl);
      entryUrl.searchParams.set("artifact", entry.animationId);
      await page.goto(entryUrl.toString(), { waitUntil: "networkidle" });
      try {
        await page.waitForFunction((expectedAnimationId) => {
          const catalogue = document.querySelector<HTMLElement>(
            "[data-kp-animation-catalogue]"
          );
          return catalogue?.dataset["kpAnimationCatalogueSelection"] ===
            expectedAnimationId && (
              catalogue.dataset["kpAnimationCatalogueHostOutcome"] !==
                undefined ||
              catalogue.dataset["kpAnimationCatalogueState"] === "error"
            );
        }, entry.animationId);
      } catch (error: unknown) {
        const unsettled = await page.evaluate(() => {
          const catalogue = document.querySelector<HTMLElement>(
            "[data-kp-animation-catalogue]"
          );
          const player = catalogue?.querySelector<HTMLElement>(
            "[data-kp-editor-animation-player]"
          );
          return {
            state: catalogue?.dataset["kpAnimationCatalogueState"],
            selection:
              catalogue?.dataset["kpAnimationCatalogueSelection"],
            outcome:
              catalogue?.dataset["kpAnimationCatalogueHostOutcome"],
            health:
              catalogue?.dataset["kpAnimationCatalogueSelectedHealth"],
            hydrated: player?.dataset["kpEditorAnimationHydrated"],
            slots: [...(catalogue?.querySelectorAll<HTMLElement>(
              "[data-kp-editor-animation-surface-slot]"
            ) ?? [])].map((slot) => ({
              kind: slot.dataset["kpEditorAnimationSurfaceSlot"],
              status: slot.dataset["kpEditorAnimationAdapterStatus"],
              adapter: slot.dataset["kpEditorAnimationAdapterId"],
              html: slot.innerHTML.slice(0, 160)
            }))
          };
        });
        throw new Error(
          `Catalogue hostability did not settle ${entry.animationId}: ` +
          `${error instanceof Error ? error.message : String(error)} ` +
          `${JSON.stringify(unsettled)}`
        );
      }
      const evidence = await page.evaluate((expectedAnimationId) => {
        const catalogue = document.querySelector<HTMLElement>(
          "[data-kp-animation-catalogue]"
        );
        if (
          catalogue === null ||
          catalogue.dataset["kpAnimationCatalogueSelection"] !==
            expectedAnimationId
        ) {
          throw new Error(`Catalogue did not select ${expectedAnimationId}.`);
        }
        const slots = [...catalogue.querySelectorAll<HTMLElement>(
          "[data-kp-editor-animation-surface-slot]"
        )];
        const outcome = catalogue.dataset["kpAnimationCatalogueHostOutcome"] ??
          "load-failure";
        const surfaceKind = catalogue.querySelector<HTMLElement>(
          "[data-kp-editor-animation-stage]"
        )?.dataset["kpEditorAnimationSurface"];
        const missingAdapter = slots.some((slot) =>
          slot.dataset["kpEditorAnimationAdapterStatus"] === "missing"
        );
        return {
          outcome,
          health:
            catalogue.dataset["kpAnimationCatalogueSelectedHealth"] ??
            (outcome === "load-failure" ? "broken" : "unknown"),
          ...(surfaceKind === undefined ? {} : { surfaceKind }),
          adapterIds: slots.flatMap((slot) => {
            const id = slot.dataset["kpEditorAnimationAdapterId"];
            return id === undefined ? [] : [id];
          }),
          ...(outcome !== "capability-gap"
            ? {}
            : {
                gapKind: missingAdapter
                  ? "missing-adapter"
                  : surfaceKind === "unsupported"
                    ? "unsupported-surface"
                    : "paint-failed"
              }),
          iframeCount: catalogue.querySelectorAll("iframe").length
        };
      }, entry.animationId);
      results.push({
        animationId: entry.animationId,
        packId: entry.packId,
        ...evidence
      });
    }
  } finally {
    await page.close();
  }

  if (results.length !== entries.length ||
    new Set(results.map(({ animationId }) => animationId)).size !==
      entries.length) {
    throw new Error("Catalogue hostability probe lost or duplicated rows.");
  }
  if (results.some(({ outcome }) =>
    outcome !== "painted" && outcome !== "capability-gap" &&
      outcome !== "load-failure"
  )) {
    throw new Error("Catalogue hostability probe retained nonterminal rows.");
  }
  if (results.some(({ iframeCount }) => iframeCount !== 0)) {
    throw new Error("Catalogue hostability probe found an iframe fallback.");
  }
  const missingAdapterIds = results
    .filter(({ gapKind }) => gapKind === "missing-adapter")
    .map(({ animationId }) => animationId)
    .sort();
  const expectedMissingAdapterIds: readonly string[] = [];
  if (JSON.stringify(missingAdapterIds) !==
    JSON.stringify(expectedMissingAdapterIds)) {
    throw new Error(
      `Catalogue missing-adapter inventory was ${JSON.stringify(missingAdapterIds)}.`
    );
  }
  return results;
}
