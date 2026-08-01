import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { chromium, type Browser } from "playwright";

import {
  createKpAnimationCatalogueProjection
} from "../src/editor/animation-catalogue-projection.ts";

const animationId = "animation.linear-solve.solve-x";
const promotedSiblingId =
  "animation.generated.radical.square-root-as-power";
const distinctCallerId =
  "animation.exact-fraction-quantity.third-plus-sixth";
const baseUrl =
  process.env["KP_VISUAL_BASE_URL"] ?? "http://127.0.0.1:8000";
const outputRoot = path.resolve(
  process.env["KP_VISUAL_OUTPUT"] ?? "tmp/codex/animation-catalogue"
);
const viewport = { width: 1440, height: 1000 } as const;

await mkdir(outputRoot, { recursive: true });
const browser = await chromium.launch({ headless: true });

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
  if (
    fuzzyResultIds.length !== 1 ||
    fuzzyResultIds[0] !== animationId
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
  if (allResultCount !== 34) {
    throw new Error(
      `Catalogue expected 34 flat asset rows, found ${allResultCount}.`
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
  const expectedMissingAdapterIds = [
    "animation.comparison.linear-solve-programming",
    "animation.programming.add.execution-trace"
  ];
  if (JSON.stringify(missingAdapterIds) !==
    JSON.stringify(expectedMissingAdapterIds)) {
    throw new Error(
      `Catalogue missing-adapter inventory was ${JSON.stringify(missingAdapterIds)}.`
    );
  }
  return results;
}
