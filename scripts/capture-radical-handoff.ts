import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { createKpVisualReviewHarness } from "./visual-review-harness.ts";

const animationId =
  "editor-animation.sample.animation.radical-rewrite.square-root-as-power";
const deviceScaleFactor = Number(
  process.argv.find((argument) => argument.startsWith("--dpr="))
    ?.slice("--dpr=".length) ?? "1"
);
if (!Number.isFinite(deviceScaleFactor) || deviceScaleFactor <= 0) {
  throw new Error("Radical handoff DPR must be positive.");
}
const sampleProgresses = [
  0.03,
  0.055,
  0.059,
  0.06,
  0.061,
  0.065,
  0.07,
  0.08,
  0.09,
  0.099,
  0.1,
  0.101
];
const outputRoot = path.resolve(
  process.env["KP_VISUAL_OUTPUT"] ??
    `tmp/codex/radical-handoff-dpr${deviceScaleFactor}`
);
const harness = createKpVisualReviewHarness(
  process.env["KP_VISUAL_BASE_URL"] === undefined
    ? {}
    : { baseUrl: process.env["KP_VISUAL_BASE_URL"] }
);

interface Clip {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

interface DomRowGeometry {
  readonly numeratorCenterY: number;
  readonly ruleCenterY: number;
  readonly denominatorCenterY: number;
}

interface PixelObservation {
  readonly bbox: {
    readonly left: number;
    readonly top: number;
    readonly width: number;
    readonly height: number;
  } | undefined;
  readonly centroidY: number | undefined;
  readonly totalDarkness: number;
  readonly visibleInkPixels: number;
  readonly rowCenters: {
    readonly numerator: number | undefined;
    readonly rule: number | undefined;
    readonly denominator: number | undefined;
  };
  readonly rowDarkness: readonly number[];
}

interface HandoffSample {
  readonly progress: number;
  readonly screenshot: string;
  readonly pixel: PixelObservation;
  readonly owner: {
    readonly nativeOpacity: number;
    readonly morphOpacity: number;
  };
  readonly canvas: {
    readonly transform: string;
    readonly rect: {
      readonly left: number;
      readonly top: number;
      readonly width: number;
      readonly height: number;
    };
    readonly width: number;
    readonly height: number;
  };
  readonly dom: {
    readonly stageRect: {
      readonly left: number;
      readonly top: number;
      readonly width: number;
      readonly height: number;
    };
    readonly fractionRect: {
      readonly left: number;
      readonly top: number;
      readonly width: number;
      readonly height: number;
    };
    readonly sizingGroups: readonly {
      readonly className: string;
      readonly fontSize: string;
      readonly lineHeight: string;
      readonly transform: string;
    }[];
    readonly fractionNodes: readonly {
      readonly tagName: string;
      readonly className: string;
      readonly motionId: string | undefined;
      readonly text: string;
      readonly left: number;
      readonly top: number;
      readonly width: number;
      readonly height: number;
      readonly opacity: string;
      readonly transform: string;
      readonly filter: string;
      readonly fontSize: string;
      readonly fontWeight: string;
      readonly outline: string;
      readonly boxShadow: string;
      readonly focusOutlineStrength: string;
      readonly focusScale: string;
    }[];
  };
  readonly endpointComparison: unknown;
  readonly devicePixelRatio: number;
}

await mkdir(outputRoot, { recursive: true });
try {
  const page = await harness.page({
    viewport: { width: 1180, height: 760 },
    deviceScaleFactor,
    reducedMotion: "no-preference"
  });
  const url = new URL("/", harness.baseUrl);
  url.searchParams.set("view", "animation-workbench");
  url.searchParams.set("q", "radical");
  url.searchParams.set("workbenchAnimation", animationId);
  await page.goto(url.toString(), { waitUntil: "networkidle" });
  await page.evaluate(async () => document.fonts.ready);

  const player = page.locator("[data-kp-editor-animation-player]");
  await player.waitFor();
  // The player deliberately exposes one play/pause toggle. Check state first
  // so capture setup never turns an already paused deterministic frame on.
  if (await player.getAttribute("data-kp-editor-animation-status") === "playing") {
    await player.locator(
      '[data-action="toggle-editor-animation"]'
    ).click();
  }
  const scrubber = player.locator('[data-action="seek-editor-animation"]');
  const stage = player.locator("[data-kp-editor-equation-stage]");
  await stage.waitFor();
  await page.waitForFunction(() =>
    document.querySelector<HTMLElement>(
      "[data-kp-editor-equation-stage]"
    )?.dataset["kpEditorRadicalMorphReady"] === "true"
  );

  await scrubber.fill("0.03");
  await settle(page);
  const reference = await stage.evaluate((element) => {
    if (!(element instanceof HTMLElement)) {
      throw new Error("Radical stage must be an HTML element.");
    }
    const numerator = element.querySelector<HTMLElement>(
      '[data-kp-motion-id*=".power.exponent-numerator"]'
    );
    const fraction = numerator?.closest<HTMLElement>(".mfrac");
    const rule = fraction?.querySelector<HTMLElement>(".frac-line");
    const denominator = element.querySelector<HTMLElement>(
      '[data-kp-motion-id*=".power.exponent-denominator"]'
    );
    if (
      numerator === null ||
      numerator === undefined ||
      fraction === null ||
      fraction === undefined ||
      rule === null ||
      rule === undefined ||
      denominator === null
    ) {
      throw new Error("Could not locate the live DOM fraction anatomy.");
    }
    const fractionRect = fraction.getBoundingClientRect();
    const horizontalPadding = 2;
    const verticalPadding = 3;
    const clip: Clip = {
      x: Math.floor(fractionRect.left - horizontalPadding),
      y: Math.floor(fractionRect.top - verticalPadding),
      width: Math.ceil(fractionRect.width + horizontalPadding * 2),
      height: Math.ceil(fractionRect.height + verticalPadding * 2)
    };
    const centerInClip = (node: HTMLElement) => {
      const rect = node.getBoundingClientRect();
      return rect.top + rect.height / 2 - clip.y;
    };
    return {
      clip,
      rows: {
        numeratorCenterY: centerInClip(numerator),
        ruleCenterY: centerInClip(rule),
        denominatorCenterY: centerInClip(denominator)
      }
    };
  });

  const samples: HandoffSample[] = [];
  for (const progress of sampleProgresses) {
    await scrubber.fill(String(progress));
    await settle(page);
    await page.waitForFunction((expected) => {
      const actual = Number(
        document.querySelector<HTMLElement>(
          "[data-kp-editor-equation-stage]"
        )?.dataset["kpEditorEquationSemanticProgress"]
      );
      return Math.abs(actual - expected) < 1e-9;
    }, progress);

    const observation = await stage.evaluate(async (element) => {
      if (!(element instanceof HTMLElement)) {
        throw new Error("Radical stage must be an HTML element.");
      }
      const numerator = element.querySelector<HTMLElement>(
        '[data-kp-motion-id*=".power.exponent-numerator"]'
      );
      const fraction = numerator?.closest<HTMLElement>(".mfrac");
      const exponent = numerator?.closest<HTMLElement>(".msupsub");
      const morph = element.querySelector<HTMLCanvasElement>(
        "[data-kp-editor-radical-webgl-morph]"
      );
      if (
        numerator === null ||
        numerator === undefined ||
        fraction === null ||
        fraction === undefined ||
        exponent === null ||
        exponent === undefined ||
        morph === null
      ) {
        throw new Error("Could not locate both radical source owners.");
      }
      const stageRect = element.getBoundingClientRect();
      const fractionRect = fraction.getBoundingClientRect();
      const morphRect = morph.getBoundingClientRect();
      const moduleUrl = "/src/rendering/radical-webgl-morph.ts";
      const module = await import(moduleUrl) as {
        measureKpRadicalWebglSourceInk(stage: HTMLElement): unknown;
      };
      const rect = (value: DOMRect) => ({
        left: value.left,
        top: value.top,
        width: value.width,
        height: value.height
      });
      const sizingGroups = [];
      let group: HTMLElement | null = fraction;
      while (group !== null && group !== exponent.parentElement) {
        const computed = getComputedStyle(group);
        sizingGroups.push({
          className: group.className,
          fontSize: computed.fontSize,
          lineHeight: computed.lineHeight,
          transform: computed.transform
        });
        group = group.parentElement;
      }
      const fractionNodes = [fraction, ...fraction.querySelectorAll<HTMLElement>(
        "*"
      )].map((node) => {
        const computed = getComputedStyle(node);
        const nodeRect = node.getBoundingClientRect();
        return {
          tagName: node.tagName.toLowerCase(),
          className: node.className,
          motionId: node.dataset["kpMotionId"],
          text: node.childElementCount === 0
            ? (node.textContent ?? "").trim()
            : "",
          left: nodeRect.left,
          top: nodeRect.top,
          width: nodeRect.width,
          height: nodeRect.height,
          opacity: computed.opacity,
          transform: computed.transform,
          filter: computed.filter,
          fontSize: computed.fontSize,
          fontWeight: computed.fontWeight,
          outline: computed.outline,
          boxShadow: computed.boxShadow,
          focusOutlineStrength: computed.getPropertyValue(
            "--kp-focus-outline-strength"
          ),
          focusScale: computed.getPropertyValue("--kp-focus-scale")
        };
      });
      return {
        owner: {
          nativeOpacity: Number(getComputedStyle(exponent).opacity),
          morphOpacity: Number(getComputedStyle(morph).opacity)
        },
        canvas: {
          transform: getComputedStyle(morph).transform,
          rect: rect(morphRect),
          width: morph.width,
          height: morph.height
        },
        dom: {
          stageRect: rect(stageRect),
          fractionRect: rect(fractionRect),
          sizingGroups,
          fractionNodes
        },
        endpointComparison: module.measureKpRadicalWebglSourceInk(element),
        devicePixelRatio: window.devicePixelRatio
      };
    });

    const screenshot = await page.screenshot({ clip: reference.clip });
    const pixel = await analyzePixels(
      page,
      screenshot,
      reference.clip,
      reference.rows
    );
    const screenshotPath = path.join(
      outputRoot,
      `forward-${progress.toFixed(3)}.png`
    );
    await writeFile(screenshotPath, screenshot);
    samples.push({
      progress,
      screenshot: path.relative(process.cwd(), screenshotPath),
      pixel,
      ...observation
    });
  }

  const baseline = samples[0]?.pixel.centroidY;
  const boundaryDeltas = adjacentBoundaryDeltas(samples);
  const maximumBoundaryDelta = Math.max(
    0,
    ...boundaryDeltas.map((sample) => Math.abs(sample.deltaY))
  );
  const trace = {
    schemaVersion: "kp.radical-handoff-trace.v1",
    direction: "forward",
    viewport: { width: 1180, height: 760 },
    deviceScaleFactor,
    fixedClip: reference.clip,
    referenceRows: reference.rows,
    boundaryDeltas,
    maximumBoundaryDelta,
    samples: samples.map((sample) => ({
      ...sample,
      centroidDeltaFromNative:
        baseline === undefined || sample.pixel.centroidY === undefined
          ? undefined
          : sample.pixel.centroidY - baseline
    }))
  };
  const manifestPath = path.join(outputRoot, "trace.json");
  const contactSheetPath = path.join(outputRoot, "contact-sheet.html");
  if (maximumBoundaryDelta > 0.15) {
    throw new Error(
      `Radical handoff centroid discontinuity ${maximumBoundaryDelta}px ` +
      "exceeds the 0.15px boundary budget."
    );
  }
  await writeFile(manifestPath, `${JSON.stringify(trace, null, 2)}\n`, "utf8");
  await writeFile(
    contactSheetPath,
    contactSheet(samples, baseline, reference.clip),
    "utf8"
  );
  console.log(JSON.stringify({
    trace: path.relative(process.cwd(), manifestPath),
    contactSheet: path.relative(process.cwd(), contactSheetPath),
    samples: samples.map((sample) => ({
      progress: sample.progress,
      owner: sample.owner,
      centroidY: sample.pixel.centroidY,
      centroidDeltaFromNative:
        baseline === undefined || sample.pixel.centroidY === undefined
          ? undefined
          : sample.pixel.centroidY - baseline,
      rowCenters: sample.pixel.rowCenters,
      totalDarkness: sample.pixel.totalDarkness,
      bbox: sample.pixel.bbox,
      canvasTransform: sample.canvas.transform
    })),
    boundaryDeltas,
    maximumBoundaryDelta
  }, null, 2));
} finally {
  await harness.close();
}

function adjacentBoundaryDeltas(
  samples: readonly HandoffSample[]
): readonly {
  readonly from: number;
  readonly to: number;
  readonly deltaY: number;
}[] {
  const deltas = [];
  for (let index = 1; index < samples.length; index += 1) {
    const previous = samples[index - 1]!;
    const current = samples[index]!;
    if (current.progress - previous.progress > 0.002) continue;
    if (
      previous.pixel.centroidY === undefined ||
      current.pixel.centroidY === undefined
    ) {
      continue;
    }
    deltas.push({
      from: previous.progress,
      to: current.progress,
      deltaY: current.pixel.centroidY - previous.pixel.centroidY
    });
  }
  return deltas;
}

async function analyzePixels(
  page: import("playwright").Page,
  screenshot: Uint8Array,
  clip: Clip,
  rows: DomRowGeometry
): Promise<PixelObservation> {
  return page.evaluate(async ({ bytes, cssWidth, cssHeight, referenceRows }) => {
    const bitmap = await createImageBitmap(
      new Blob([new Uint8Array(bytes)], { type: "image/png" })
    );
    const canvas = document.createElement("canvas");
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const context = canvas.getContext("2d");
    if (context === null) throw new Error("Could not inspect handoff pixels.");
    context.drawImage(bitmap, 0, 0);
    bitmap.close();
    const pixels = context.getImageData(
      0,
      0,
      canvas.width,
      canvas.height
    ).data;
    const scaleX = canvas.width / cssWidth;
    const scaleY = canvas.height / cssHeight;
    const rowDarkness = Array.from<number>({ length: canvas.height }).fill(0);
    let left = canvas.width;
    let top = canvas.height;
    let right = -1;
    let bottom = -1;
    let weightedY = 0;
    let totalDarkness = 0;
    let visibleInkPixels = 0;
    for (let y = 0; y < canvas.height; y += 1) {
      for (let x = 0; x < canvas.width; x += 1) {
        const offset = (y * canvas.width + x) * 4;
        const red = pixels[offset] ?? 255;
        const green = pixels[offset + 1] ?? 255;
        const blue = pixels[offset + 2] ?? 255;
        const darkness = Math.max(0, 255 - (red + green + blue) / 3);
        if (darkness <= 2) continue;
        rowDarkness[y] = (rowDarkness[y] ?? 0) + darkness;
        totalDarkness += darkness;
        weightedY += (y + 0.5) * darkness;
        if (darkness > 16) {
          visibleInkPixels += 1;
          left = Math.min(left, x);
          top = Math.min(top, y);
          right = Math.max(right, x);
          bottom = Math.max(bottom, y);
        }
      }
    }
    const numeratorRuleBoundary =
      (referenceRows.numeratorCenterY + referenceRows.ruleCenterY) / 2 * scaleY;
    const ruleDenominatorBoundary =
      (referenceRows.ruleCenterY + referenceRows.denominatorCenterY) / 2 * scaleY;
    const centerWithin = (start: number, end: number) => {
      let weight = 0;
      let weighted = 0;
      for (
        let y = Math.max(0, Math.floor(start));
        y < Math.min(canvas.height, Math.ceil(end));
        y += 1
      ) {
        const darkness = rowDarkness[y] ?? 0;
        weight += darkness;
        weighted += (y + 0.5) * darkness;
      }
      return weight <= 0 ? undefined : weighted / weight / scaleY;
    };
    return {
      bbox: right < left || bottom < top
        ? undefined
        : {
            left: left / scaleX,
            top: top / scaleY,
            width: (right - left + 1) / scaleX,
            height: (bottom - top + 1) / scaleY
          },
      centroidY: totalDarkness <= 0
        ? undefined
        : weightedY / totalDarkness / scaleY,
      totalDarkness: totalDarkness / (scaleX * scaleY),
      visibleInkPixels: visibleInkPixels / (scaleX * scaleY),
      rowCenters: {
        numerator: centerWithin(0, numeratorRuleBoundary),
        rule: centerWithin(numeratorRuleBoundary, ruleDenominatorBoundary),
        denominator: centerWithin(ruleDenominatorBoundary, canvas.height)
      },
      rowDarkness: rowDarkness.map((value) => value / scaleX)
    };
  }, {
    bytes: Array.from(screenshot),
    cssWidth: clip.width,
    cssHeight: clip.height,
    referenceRows: rows
  });
}

async function settle(page: import("playwright").Page): Promise<void> {
  await page.evaluate(() => new Promise<void>((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
  ));
}

function contactSheet(
  samples: readonly HandoffSample[],
  baseline: number | undefined,
  clip: Clip
): string {
  const cells = samples.map((sample) => {
    const source = path.basename(sample.screenshot);
    const referenceTop = baseline === undefined
      ? "0"
      : `${baseline * 6}px`;
    const delta = baseline === undefined || sample.pixel.centroidY === undefined
      ? "n/a"
      : `${(sample.pixel.centroidY - baseline).toFixed(3)}px`;
    return `<figure><div class="crop" style="width:${clip.width * 6}px;` +
      `height:${clip.height * 6}px"><img src="${source}" alt="radical ` +
      `handoff at ${sample.progress}" width="${clip.width * 6}" ` +
      `height="${clip.height * 6}"><i style="top:${referenceTop}"></i></div>` +
      `<figcaption>${sample.progress.toFixed(3)} · native ` +
      `${sample.owner.nativeOpacity.toFixed(0)} · WebGL ` +
      `${sample.owner.morphOpacity.toFixed(0)} · Δy ${delta}</figcaption>` +
      `</figure>`;
  }).join("");
  return "<!doctype html><meta charset=\"utf-8\">" +
    "<title>Radical source handoff trace</title><style>" +
    "body{font:13px system-ui;margin:24px;color:#1f2933}main{display:flex;" +
    "flex-wrap:wrap;gap:20px}figure{margin:0}.crop{position:relative;" +
    "background:white;border:1px solid #aab4c0;image-rendering:pixelated;" +
    "overflow:hidden}.crop img{display:block;image-rendering:pixelated}" +
    ".crop i{position:absolute;left:0;right:0;border-top:1px solid #e03131}" +
    "figcaption{margin-top:6px;font-family:ui-monospace,monospace}" +
    "</style><h1>Radical source handoff</h1><p>The red line is the " +
    "composited darkness centroid of the native 1/2 reference frame.</p>" +
    `<main>${cells}</main>`;
}
