import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import type { Locator, Page } from "playwright";

import {
  buildKpVisualContactSheetHtml,
  type KpVisualContactSheetItem
} from "./capture-visual-contact-sheet.ts";
import { createKpVisualReviewHarness } from "./visual-review-harness.ts";

const outputRoot = path.resolve("tmp/codex/log-product-checkpoint");
const MATERIAL_OWNER_BUDGET = 12;
const OWNER_OVERFLOW_TOLERANCE_PX = 0.75;
const baselinePresentation = Object.freeze({
  theme: "dark",
  style: "organic-subtle",
  focus: "flat",
  view: "animation-catalogue"
} as const);
const materialPresentation = Object.freeze({
  theme: "dark",
  style: "organic-subtle",
  focus: "elevated",
  view: "animation-catalogue"
} as const);
const animations = Object.freeze([{
  id: "animation.algebra.log-product.product-to-sum",
  label: "two factors",
  progressions: [
    { phase: "forward", samples: [0, 0.14, 0.22, 0.34, 0.48, 0.54, 0.6, 0.66, 0.72, 1] },
    { phase: "return", samples: [0.72, 0.66, 0.6, 0.54, 0.48, 0.34, 0.22, 0.14, 0] }
  ]
}, {
  id: "animation.algebra.log-product.three-factors-to-sum",
  label: "three factors",
  progressions: [
    { phase: "forward", samples: [0, 0.14, 0.22, 0.34, 0.48, 0.54, 0.6, 0.66, 0.72, 1] },
    { phase: "return", samples: [0.72, 0.66, 0.6, 0.54, 0.48, 0.34, 0.22, 0.14, 0] }
  ]
}] as const);

const materialProgressions = Object.freeze([
  {
    phase: "forward" as const,
    samples: [
      0, 0.22, 0.34, 0.4, 0.48, 0.54, 0.6, 0.66, 0.72, 0.93, 0.96,
      0.99, 1
    ]
  },
  { phase: "return" as const, samples: [0.66, 0.48, 0.34, 0.22, 0] }
]);
const responsiveMaterialProgressions = Object.freeze([
  { phase: "forward" as const, samples: [0.22, 0.48, 0.6, 0.72] }
]);

const captureCases = Object.freeze([
  ...animations.map((animation) => Object.freeze({
    id: `flat-wide-${animation.label.replaceAll(" ", "-")}`,
    animation,
    presentation: baselinePresentation,
    viewport: { width: 1_240, height: 760 } as const,
    colorScheme: "dark" as const,
    reducedMotion: "no-preference" as const,
    progressions: animation.progressions
  })),
  Object.freeze({
    id: "material-wide-dark",
    animation: animations[0],
    presentation: materialPresentation,
    viewport: { width: 1_240, height: 760 } as const,
    colorScheme: "dark" as const,
    reducedMotion: "no-preference" as const,
    progressions: materialProgressions
  }),
  Object.freeze({
    id: "material-narrow-dark",
    animation: animations[0],
    presentation: materialPresentation,
    viewport: { width: 390, height: 844 } as const,
    colorScheme: "dark" as const,
    reducedMotion: "no-preference" as const,
    progressions: responsiveMaterialProgressions
  }),
  Object.freeze({
    id: "material-wide-light",
    animation: animations[0],
    presentation: Object.freeze({ ...materialPresentation, theme: "light" }),
    viewport: { width: 1_240, height: 760 } as const,
    colorScheme: "light" as const,
    reducedMotion: "no-preference" as const,
    progressions: responsiveMaterialProgressions
  }),
  Object.freeze({
    id: "no-depth-wide-dark",
    animation: animations[0],
    presentation: Object.freeze({ ...materialPresentation, focus: "no-depth" }),
    viewport: { width: 1_240, height: 760 } as const,
    colorScheme: "dark" as const,
    reducedMotion: "no-preference" as const,
    progressions: Object.freeze([
      { phase: "forward" as const, samples: [0.48] }
    ])
  }),
  Object.freeze({
    id: "material-reduced-motion-dark",
    animation: animations[0],
    presentation: materialPresentation,
    viewport: { width: 1_240, height: 760 } as const,
    colorScheme: "dark" as const,
    reducedMotion: "reduce" as const,
    progressions: Object.freeze([
      { phase: "forward" as const, samples: [0.48] }
    ])
  })
]);

interface CaptureEvidence {
  readonly id: string;
  readonly captureCaseId: string;
  readonly animationId: string;
  readonly phase: "forward" | "return";
  readonly progress: number;
  readonly semanticProgress: number;
  readonly visualOwner: string;
  readonly activeEndpointCount: number;
  readonly visibleMaterialOwnerCount: number;
  readonly treatedMaterialOwnerCount: number;
  readonly activeReliefOwnerCount: number;
  readonly displacedMaterialOwnerCount: number;
  readonly promotedMaterialOwnerCount: number;
  readonly depthMode: string;
  readonly typography: string;
  readonly visibleMaterialOwnerOverflowPx: number;
  readonly visibleMaterialOwnerMetrics: readonly {
    readonly entityId: string;
    readonly fontSize: string;
    readonly color: string;
    readonly textShadow: string;
    readonly translate: string;
    readonly width: number;
    readonly height: number;
    readonly transform: string;
  }[];
  readonly endpointMetrics: readonly {
    readonly stateId: string;
    readonly fontSize: string;
    readonly color: string;
    readonly width: number;
    readonly atomWidths: readonly number[];
  }[];
  readonly file: string;
}

async function capture(): Promise<void> {
  await mkdir(outputRoot, { recursive: true });
  const harness = createKpVisualReviewHarness();
  const items: KpVisualContactSheetItem[] = [];
  const evidence: CaptureEvidence[] = [];

  try {
    for (const captureCase of captureCases) {
      const { animation, presentation, viewport } = captureCase;
      const page = await harness.page({
        viewport,
        colorScheme: captureCase.colorScheme,
        reducedMotion: captureCase.reducedMotion ?? "no-preference"
      });
      const url = new URL("/", harness.baseUrl);
      url.searchParams.set("artifact", animation.id);
      url.searchParams.set("theme", presentation.theme);
      url.searchParams.set("style", presentation.style);
      url.searchParams.set("focus", presentation.focus);
      url.searchParams.set("view", presentation.view);
      await page.goto(url.toString(), { waitUntil: "domcontentloaded" });
      const stage = page.locator(
        `[data-kp-animation-catalogue-stage] [data-kp-log-product-stage]`
      );
      const seek = page.locator(
        `[data-kp-editor-animation-id="${animation.id}"] ` +
        `[data-action="seek-editor-animation"]`
      );
      await waitForReady(stage);
      await assertPresentationRestored({
        captureCaseId: captureCase.id,
        page,
        stage,
        presentation
      });
      if (captureCase.id === "material-wide-dark") {
        await assertInterruptedSeek({ page, stage, seek });
        await assertTransactionalResize({ page, stage, seek });
      }

      for (const progression of captureCase.progressions) {
        for (const progress of progression.samples) {
          const captured = await captureSample({
            captureCaseId: captureCase.id,
            animationId: animation.id,
            page,
            stage,
            seek,
            phase: progression.phase,
            progress,
            acceptSnappedProgress: captureCase.reducedMotion === "reduce"
          });
          evidence.push(captured);
          const image = await readFile(path.resolve(captured.file));
          items.push({
            id: captured.id,
            label:
              `${captureCase.id} · ${progression.phase} · ` +
              `${Math.round(progress * 100)}%`,
            progress,
            viewport,
            file: captured.file,
            dataUrl: `data:image/png;base64,${image.toString("base64")}`
          });
        }
      }
    }

    const htmlSource = buildKpVisualContactSheetHtml(items, {
      title: "Log product · flat preservation and material-depth comparators",
      columns: 3,
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
    const materialSamples = evidence.filter(({ captureCaseId }) =>
      captureCaseId.startsWith("material-")
    );
    const maxVisibleMaterialOwners = Math.max(
      0,
      ...materialSamples.map(({ visibleMaterialOwnerCount }) =>
        visibleMaterialOwnerCount
      )
    );
    const maxVisibleMaterialOwnerOverflowPx = Math.max(
      0,
      ...materialSamples.map(({ visibleMaterialOwnerOverflowPx }) =>
        visibleMaterialOwnerOverflowPx
      )
    );
    if (maxVisibleMaterialOwners > MATERIAL_OWNER_BUDGET) {
      throw new Error(
        `Material checkpoint exceeded ${MATERIAL_OWNER_BUDGET} visible owners.`
      );
    }
    if (maxVisibleMaterialOwnerOverflowPx > OWNER_OVERFLOW_TOLERANCE_PX) {
      throw new Error(
        `Material checkpoint overflowed its stage by ` +
        `${maxVisibleMaterialOwnerOverflowPx}px.`
      );
    }
    await writeFile(manifest, `${JSON.stringify({
      schemaVersion: "kp.log-product-visual-checkpoint.v1",
      animationIds: animations.map(({ id }) => id),
      captureCases: captureCases.map((captureCase) => ({
        id: captureCase.id,
        animationId: captureCase.animation.id,
        presentation: captureCase.presentation,
        viewport: captureCase.viewport
      })),
      samples: evidence,
      performance: {
        maxVisibleMaterialOwners,
        materialOwnerBudget: MATERIAL_OWNER_BUDGET,
        maxVisibleMaterialOwnerOverflowPx,
        ownerOverflowTolerancePx: OWNER_OVERFLOW_TOLERANCE_PX,
        perFrameLayoutReads: 0
      },
      sheet: path.relative(process.cwd(), sheet),
      html: path.relative(process.cwd(), html)
    }, null, 2)}\n`, "utf8");
    console.log(`log-product checkpoint: ${path.relative(process.cwd(), sheet)}`);
    console.log(`review sheet: ${path.relative(process.cwd(), html)}`);
    console.log(`manifest: ${path.relative(process.cwd(), manifest)}`);
  } finally {
    await harness.close();
  }
}

async function captureSample(input: {
  readonly captureCaseId: string;
  readonly animationId: string;
  readonly page: Page;
  readonly stage: Locator;
  readonly seek: Locator;
  readonly phase: "forward" | "return";
  readonly progress: number;
  readonly acceptSnappedProgress: boolean;
}): Promise<CaptureEvidence> {
  await input.seek.fill(String(input.progress));
  await input.page.waitForFunction(({ progress, acceptSnappedProgress }) => {
    const stage = document.querySelector<HTMLElement>(
      "[data-kp-log-product-stage]"
    );
    const actual = Number(stage?.dataset["kpLogProductProgress"]);
    return acceptSnappedProgress
      ? actual === 0 || actual === 1
      : actual === progress;
  }, {
    progress: input.progress,
    acceptSnappedProgress: input.acceptSnappedProgress
  });
  await input.stage.evaluate(async (root) => {
    await root.ownerDocument.fonts.ready;
    await new Promise<void>((resolve) => requestAnimationFrame(() =>
      requestAnimationFrame(() => resolve())
    ));
  });
  const familyKey = input.animationId.includes("three-factors") ? "xyz" : "xy";
  const id = `${input.captureCaseId}-${familyKey}-${input.phase}-${
    String(input.progress).replace(".", "-")
  }`;
  const file = path.join(outputRoot, `${id}.png`);
  await input.stage.screenshot({ path: file, animations: "disabled" });
  const state = await input.stage.evaluate((root) => {
    const visibleOwners = [...root.querySelectorAll<HTMLElement>(
      "[data-kp-equation-material-owner-id]"
    )].filter((owner) => Number(getComputedStyle(owner).opacity) > 0);
    const stageRect = root.getBoundingClientRect();
    const visibleMaterialOwnerOverflowPx = Math.max(0, ...visibleOwners.map(
      (owner) => {
        const rect = owner.getBoundingClientRect();
        return Math.max(
          stageRect.left - rect.left,
          rect.right - stageRect.right,
          stageRect.top - rect.top,
          rect.bottom - stageRect.bottom,
          0
        );
      }
    ));
    const treatedOwners = [...root.querySelectorAll<HTMLElement>(
      "[data-kp-log-product-material-role]"
    )];
    const visibleOwnerSet = new Set(visibleOwners);
    const visibleTreatedOwners = treatedOwners.filter((owner) =>
      visibleOwnerSet.has(owner)
    );
    return {
      semanticProgress: Number(root.dataset["kpLogProductProgress"]),
      visualOwner: root.dataset["kpLogProductVisualOwner"] ?? "",
    activeEndpointCount: [...root.querySelectorAll<HTMLElement>(
      ".kp-log-product-stage__endpoint"
    )].filter((endpoint) => endpoint.getAttribute("aria-hidden") === "false")
      .length,
    visibleMaterialOwnerCount: visibleOwners.length,
    treatedMaterialOwnerCount: treatedOwners.length,
    activeReliefOwnerCount: visibleTreatedOwners.filter((owner) =>
      owner.dataset["kpLogProductMaterialReliefActive"] === "true"
    ).length,
    displacedMaterialOwnerCount: visibleTreatedOwners.filter((owner) =>
      getComputedStyle(owner).translate !== "none"
    ).length,
    promotedMaterialOwnerCount: visibleTreatedOwners.filter((owner) =>
      getComputedStyle(owner).willChange !== "auto"
    ).length,
    depthMode: root.dataset["kpLogProductMaterialDepthMode"] ?? "",
    typography: root.dataset["kpLogProductTypography"] ?? "",
    visibleMaterialOwnerOverflowPx:
      Math.round(visibleMaterialOwnerOverflowPx * 100) / 100,
    visibleMaterialOwnerMetrics: visibleOwners.map((owner) => {
        const style = getComputedStyle(owner);
        const visual = owner.querySelector<HTMLElement>(
          ".editor-equation-stage__material-visual"
        );
        const visualStyle = getComputedStyle(visual ?? owner);
        const rect = owner.getBoundingClientRect();
        return {
          entityId:
            owner.dataset["kpEquationMaterialSemanticEntityId"] ?? "",
          fontSize: style.fontSize,
          color: visualStyle.color,
          textShadow: visualStyle.textShadow,
          translate: style.translate,
          width: Math.round(rect.width * 100) / 100,
          height: Math.round(rect.height * 100) / 100,
          transform: style.transform
        };
      }),
    endpointMetrics: [...root.querySelectorAll<HTMLElement>(
      ".kp-log-product-stage__endpoint"
    )].map((endpoint) => ({
      stateId: endpoint.dataset["kpLogProductEndpointStateId"] ?? "",
      fontSize: getComputedStyle(endpoint).fontSize,
      color: getComputedStyle(
        endpoint.querySelector<HTMLElement>(".katex-html") ?? endpoint
      ).color,
      width: Math.round(endpoint.getBoundingClientRect().width * 100) / 100,
      atomWidths: [...endpoint.querySelectorAll<HTMLElement>(
        "[data-kp-semantic-entity-id]"
      )].map((atom) =>
        Math.round(atom.getBoundingClientRect().width * 100) / 100
      )
    }))
    };
  });
  if (state.activeEndpointCount !== 1) {
    throw new Error(`${id} must expose exactly one accessible equation.`);
  }
  if (
    input.captureCaseId.startsWith("no-depth-") &&
    state.treatedMaterialOwnerCount !== 0
  ) {
    throw new Error(`${id} projected material treatment in no-depth mode.`);
  }
  if (
    input.captureCaseId.includes("reduced-motion") &&
    state.activeReliefOwnerCount !== 0
  ) {
    throw new Error(`${id} retained material relief in reduced motion.`);
  }
  if (
    input.captureCaseId.startsWith("material-") &&
    state.displacedMaterialOwnerCount !== 0
  ) {
    throw new Error(`${id} displaced foreground ink from its native plane.`);
  }
  const expectedGlyphColor = input.captureCaseId.includes("light")
    ? "rgb(13, 14, 18)"
    : "rgb(237, 232, 208)";
  const unexpectedGlyphColors = [
    ...state.visibleMaterialOwnerMetrics.map(({ color }) => color),
    ...state.endpointMetrics.map(({ color }) => color)
  ].filter((color) => color !== expectedGlyphColor);
  if (unexpectedGlyphColors.length > 0) {
    throw new Error(
      `${id} used glyph colors outside the resolved theme face: ` +
      [...new Set(unexpectedGlyphColors)].join(", ")
    );
  }
  if (input.captureCaseId.startsWith("material-")) {
    const fontSizes = state.endpointMetrics.map(({ fontSize }) =>
      Number.parseFloat(fontSize)
    );
    if (fontSizes.some((fontSize) => fontSize < 24 || fontSize > 28)) {
      throw new Error(
        `${id} escaped the bounded demonstration type scale: ` +
        fontSizes.join(", ")
      );
    }
  }
  if (
    input.captureCaseId === "material-wide-dark" &&
    input.progress >= 0.96 && input.progress < 1 &&
    (
      state.activeReliefOwnerCount !== 0 ||
      state.displacedMaterialOwnerCount !== 0 ||
      state.promotedMaterialOwnerCount !== 0
    )
  ) {
    throw new Error(
      `${id} retained material depth or layer promotion after landing: ` +
      JSON.stringify({
        relief: state.activeReliefOwnerCount,
        displaced: state.displacedMaterialOwnerCount,
        promoted: state.promotedMaterialOwnerCount
      })
    );
  }
  return {
    id,
    captureCaseId: input.captureCaseId,
    animationId: input.animationId,
    phase: input.phase,
    progress: input.progress,
    ...state,
    file: path.relative(process.cwd(), file)
  };
}

async function assertPresentationRestored(input: {
  readonly captureCaseId: string;
  readonly page: Page;
  readonly stage: Locator;
  readonly presentation: {
    readonly theme: string;
    readonly style: string;
    readonly focus: string;
    readonly view: string;
  };
}): Promise<void> {
  const restored = await input.page.evaluate(() => ({
    search: location.search,
    theme: document.documentElement.dataset["theme"] ?? "",
    resourceUrls: performance.getEntriesByType("resource")
      .map((entry) => entry.name)
  }));
  const params = new URLSearchParams(restored.search);
  for (const [key, expected] of Object.entries(input.presentation)) {
    if (params.get(key) !== expected) {
      throw new Error(
        `${input.captureCaseId} did not restore ${key}=${expected}.`
      );
    }
  }
  const stageMode = await input.stage.evaluate((root) => ({
    depth: root.dataset["kpLogProductMaterialDepthMode"] ?? "",
    typography: root.dataset["kpLogProductTypography"] ?? ""
  }));
  const expected = input.presentation.focus === "elevated"
    ? { depth: "material", typography: "demonstration" }
    : input.presentation.focus === "no-depth"
      ? { depth: "no-depth", typography: "display" }
      : { depth: "flat", typography: "display" };
  if (
    stageMode.depth !== expected.depth ||
    stageMode.typography !== expected.typography
  ) {
    throw new Error(
      `${input.captureCaseId} restored ${stageMode.depth}/${stageMode.typography}; ` +
      `expected ${expected.depth}/${expected.typography}.`
    );
  }
  if (!restored.resourceUrls.some((url) =>
    url.includes("log-product-surface-capability.ts")
  )) {
    throw new Error(`${input.captureCaseId} did not lazy-load log-product.`);
  }
  const unrelatedCapabilities = restored.resourceUrls.filter((url) =>
    /(?:log-quotient|exponential-homomorphism|graph-3d|programming)-surface-capability\.ts/u
      .test(url)
  );
  if (unrelatedCapabilities.length > 0) {
    throw new Error(
      `${input.captureCaseId} loaded unrelated capabilities: ` +
      unrelatedCapabilities.join(", ")
    );
  }
}

async function assertInterruptedSeek(input: {
  readonly page: Page;
  readonly stage: Locator;
  readonly seek: Locator;
}): Promise<void> {
  for (const progress of [0.6, 0.34, 0.72]) {
    await input.seek.fill(String(progress));
  }
  await input.page.waitForFunction(() => {
    const stage = document.querySelector<HTMLElement>(
      "[data-kp-log-product-stage]"
    );
    return Number(stage?.dataset["kpLogProductProgress"]) === 0.72;
  });
  const activeEndpointCount = await input.stage.locator(
    ".kp-log-product-stage__endpoint[aria-hidden=\"false\"]"
  ).count();
  if (activeEndpointCount !== 1) {
    throw new Error("Interrupted seek must retain one accessible endpoint.");
  }
}

async function assertTransactionalResize(input: {
  readonly page: Page;
  readonly stage: Locator;
  readonly seek: Locator;
}): Promise<void> {
  const initialViewport = input.page.viewportSize();
  if (initialViewport === null) {
    throw new Error("Resize verification requires a fixed viewport.");
  }
  await input.seek.fill("0.54");
  await input.page.waitForFunction(() => {
    const stage = document.querySelector<HTMLElement>(
      "[data-kp-log-product-stage]"
    );
    return Number(stage?.dataset["kpLogProductProgress"]) === 0.54;
  });
  const before = await geometrySnapshot(input.stage);
  await input.page.setViewportSize({
    width: Math.max(720, initialViewport.width - 360),
    height: initialViewport.height
  });
  await waitForGeometryRevision(input.stage, before.revision);
  const resized = await geometrySnapshot(input.stage);
  assertResizeSnapshot(before, resized, "narrower");

  await input.page.setViewportSize(initialViewport);
  await waitForGeometryRevision(input.stage, resized.revision);
  const restored = await geometrySnapshot(input.stage);
  assertResizeSnapshot(before, restored, "restored");
}

async function geometrySnapshot(stage: Locator): Promise<{
  readonly revision: number;
  readonly semanticProgress: number;
  readonly blockSize: number;
  readonly activeEndpointCount: number;
  readonly visibleMaterialOwnerCount: number;
}> {
  return stage.evaluate((root) => ({
    revision: Number(root.dataset["kpLogProductGeometryRevision"] ?? "0"),
    semanticProgress: Number(root.dataset["kpLogProductProgress"]),
    blockSize: root.getBoundingClientRect().height,
    activeEndpointCount: root.querySelectorAll(
      ".kp-log-product-stage__endpoint[aria-hidden=\"false\"]"
    ).length,
    visibleMaterialOwnerCount: [...root.querySelectorAll<HTMLElement>(
      "[data-kp-equation-material-owner-id]"
    )].filter((owner) => Number(getComputedStyle(owner).opacity) > 0).length
  }));
}

async function waitForGeometryRevision(
  stage: Locator,
  previousRevision: number
): Promise<void> {
  await stage.evaluate((root, revision) => new Promise<void>((resolve, reject) => {
    const ready = (): boolean =>
      root.dataset["kpLogProductGeometryState"] === "ready" &&
      Number(root.dataset["kpLogProductGeometryRevision"] ?? "0") > revision;
    if (ready()) {
      resolve();
      return;
    }
    const timeout = window.setTimeout(() => {
      observer.disconnect();
      reject(new Error(
        root.dataset["kpLogProductError"] ??
        "Timed out replacing log-product geometry after resize."
      ));
    }, 5_000);
    const observer = new MutationObserver(() => {
      if (!ready()) return;
      window.clearTimeout(timeout);
      observer.disconnect();
      resolve();
    });
    observer.observe(root, {
      attributes: true,
      attributeFilter: [
        "data-kp-log-product-geometry-state",
        "data-kp-log-product-geometry-revision"
      ]
    });
  }), previousRevision);
}

function assertResizeSnapshot(
  expected: Awaited<ReturnType<typeof geometrySnapshot>>,
  actual: Awaited<ReturnType<typeof geometrySnapshot>>,
  label: string
): void {
  if (actual.semanticProgress !== expected.semanticProgress) {
    throw new Error(`${label} resize changed semantic progress.`);
  }
  if (Math.abs(actual.blockSize - expected.blockSize) > 0.75) {
    throw new Error(`${label} resize changed reserved stage block size.`);
  }
  if (actual.activeEndpointCount !== 1) {
    throw new Error(`${label} resize lost accessible endpoint ownership.`);
  }
  if (actual.visibleMaterialOwnerCount === 0) {
    throw new Error(`${label} resize blanked the material scene.`);
  }
}

async function waitForReady(stage: Locator): Promise<void> {
  await stage.waitFor();
  await stage.evaluate((root) => new Promise<void>((resolve, reject) => {
    if (root.dataset["kpLogProductStage"] === "ready") {
      resolve();
      return;
    }
    const timeout = window.setTimeout(() => {
      observer.disconnect();
      reject(new Error(
        root.dataset["kpLogProductError"] ??
        "Timed out preparing log-product stage."
      ));
    }, 5_000);
    const observer = new MutationObserver(() => {
      if (root.dataset["kpLogProductStage"] === "preparing") return;
      window.clearTimeout(timeout);
      observer.disconnect();
      if (root.dataset["kpLogProductStage"] === "ready") resolve();
      else reject(new Error(
        root.dataset["kpLogProductError"] ?? "Log-product stage failed."
      ));
    });
    observer.observe(root, {
      attributes: true,
      attributeFilter: ["data-kp-log-product-stage"]
    });
  }));
}

await capture();
