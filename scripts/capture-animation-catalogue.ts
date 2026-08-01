import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { chromium } from "playwright";

const animationId = "animation.linear-solve.solve-x";
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
  if (allResultCount !== 33) {
    throw new Error(
      `Catalogue expected 33 flat asset rows, found ${allResultCount}.`
    );
  }
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
  await reviewPanel.locator("textarea").fill("Catalogue capture probe");
  await page.waitForFunction(() => {
    const host = document.querySelector<HTMLElement>(
      "[data-kp-dev-review-shell]"
    );
    return host?.shadowRoot?.querySelector(".meta")?.textContent
      ?.includes("Locked") === true;
  });
  const reviewMeta = await reviewPanel.locator(".meta").textContent();
  if (!reviewMeta?.includes("Current frame") || !reviewMeta.includes("0%")) {
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

  const manifest = path.join(outputRoot, "manifest.json");
  await writeFile(
    manifest,
    `${JSON.stringify({
      schemaVersion: "kp.animation-catalogue-visual-capture.v1",
      animationId,
      routeState: "catalogue-explicit-exemplar",
      url: url.toString(),
      viewport,
      screenshot: path.relative(process.cwd(), screenshot)
    }, null, 2)}\n`,
    "utf8"
  );

  console.log(`animation catalogue capture: ${path.relative(process.cwd(), screenshot)}`);
  console.log(`animation catalogue manifest: ${path.relative(process.cwd(), manifest)}`);
} finally {
  await browser.close();
}
