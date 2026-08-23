import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { chromium } from "playwright";

const animationId =
  "animation.generated.calculus.derivative.power-rule-x-cubed";
const baseUrl =
  process.env["KP_VISUAL_BASE_URL"] ?? "http://127.0.0.1:8000";
const outputRoot = path.resolve(
  process.env["KP_VISUAL_OUTPUT"] ??
    "tmp/codex/derivative-power-scope-trace-visual"
);
const checkpoints = [
  { id: "source", progress: 0 },
  { id: "application-notice", progress: 0.07 },
  { id: "operator-released", progress: 0.15 },
  { id: "rewrite-triggered", progress: 0.18 },
  { id: "exponent-branches", progress: 0.28 },
  { id: "decrement-ready", progress: 0.49 },
  { id: "decrement-compresses", progress: 0.66 },
  { id: "decrement-resolves", progress: 0.82 },
  { id: "native-result", progress: 1 }
] as const;

await mkdir(outputRoot, { recursive: true });
const browser = await chromium.launch({ headless: true });

try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  page.on("console", (message) => {
    if (message.type() === "error") {
      console.error(`Browser console: ${message.text()}`);
    }
  });
  page.on("pageerror", (error) => {
    console.error(`Browser page error: ${error.message}`);
  });
  const url = new URL("/", baseUrl);
  url.searchParams.set("artifact", animationId);
  url.searchParams.set("playhead", "0");
  await page.goto(url.toString(), { waitUntil: "networkidle" });
  await page.evaluate(async () => document.fonts.ready);

  const player = page.locator(
    "[data-kp-animation-catalogue-stage] [data-kp-editor-animation-player]"
  );
  await player.waitFor();
  await page.waitForFunction((expectedId) => {
    const selected = document.querySelector<HTMLElement>(
      "[data-kp-animation-catalogue-state=\"selected\"]"
    );
    const host = selected?.querySelector<HTMLElement>(
      "[data-kp-editor-animation-player]"
    );
    const surface = host?.querySelector<HTMLElement>(
      "[data-kp-editor-animation-surface-slot]"
    );
    return selected?.dataset["kpAnimationCatalogueSelection"] === expectedId &&
      host?.dataset["kpEditorAnimationHydrated"] === "true" &&
      surface?.dataset["kpEditorAnimationAdapterStatus"] === "ready";
  }, animationId);
  const scrubber = player.locator('[data-action="seek-editor-animation"]');
  // Hydration preserves the SSR placeholder until the first semantic frame;
  // a reversible nudge asks the adapter to paint without changing the review URL.
  await scrubber.fill("0.001");
  await scrubber.fill("0");
  const equationStage = player.locator("[data-kp-editor-equation-stage]");
  try {
    await equationStage.waitFor({ state: "attached", timeout: 5_000 });
  } catch {
    const diagnostic = await player.evaluate((element) => ({
      dataset: { ...(element as HTMLElement).dataset },
      html: element.innerHTML
    }));
    throw new Error(
      `Derivative equation stage did not mount: ${JSON.stringify(diagnostic)}`
    );
  }

  const captures: Array<{
    readonly id: string;
    readonly progress: number;
    readonly file: string;
    readonly transitionId: string | null;
  }> = [];
  for (const checkpoint of checkpoints) {
    await scrubber.fill(String(checkpoint.progress));
    await page.waitForTimeout(32);
    const transition = player.locator(
      "[data-kp-editor-equation-transition-id]"
    );
    const file = path.join(outputRoot, `${checkpoint.id}.png`);
    await player.locator("[data-kp-editor-animation-stage]").screenshot({
      path: file
    });
    captures.push({
      ...checkpoint,
      file,
      transitionId: await transition.getAttribute(
        "data-kp-editor-equation-transition-id"
      )
    });
  }

  await scrubber.fill("0.28");
  const flatGlyphs = await player.locator(
    "[data-kp-editor-derivative-power-role]"
  ).evaluateAll((elements) => elements.map((element) => {
    const style = getComputedStyle(element);
    const matrix = style.transform === "none"
      ? new DOMMatrix()
      : new DOMMatrix(style.transform);
    return {
      role: (element as HTMLElement).dataset["kpEditorDerivativePowerRole"],
      scaleX: matrix.a,
      scaleY: matrix.d,
      textShadow: style.textShadow,
      color: style.color,
      opacity: style.opacity
    };
  }));
  if (flatGlyphs.some(({ scaleX, scaleY, textShadow }) =>
    Math.abs(scaleX - 1) > 0.001 || Math.abs(scaleY - 1) > 0.001 ||
    textShadow !== "none"
  )) {
    throw new Error(
      `Derivative checkpoint left the flat-2D baseline: ${JSON.stringify(flatGlyphs)}`
    );
  }

  await scrubber.fill("0.66");
  const decrementGlyphs = await player.locator(
    "[data-kp-editor-derivative-decrement-role]"
  ).evaluateAll((elements) => elements.map((element) => {
    const style = getComputedStyle(element);
    return {
      role: (element as HTMLElement).dataset[
        "kpEditorDerivativeDecrementRole"
      ],
      dataset: { ...(element as HTMLElement).dataset },
      className: element.className,
      outlineStyle: style.outlineStyle,
      outlineWidth: style.outlineWidth,
      outlineColor: style.outlineColor,
      boxShadow: style.boxShadow
    };
  }));
  if (decrementGlyphs.some(({ outlineStyle, boxShadow }) =>
    outlineStyle !== "none" || boxShadow !== "none"
  )) {
    throw new Error(
      `Derivative decrement retained fragment boxes: ${JSON.stringify(decrementGlyphs)}`
    );
  }

  await scrubber.fill("0");
  if (Number(await scrubber.inputValue()) !== 0) {
    throw new Error("Derivative checkpoint did not rewind to its native source.");
  }

  await writeFile(
    path.join(outputRoot, "manifest.json"),
    `${JSON.stringify({
      schemaVersion: "kp.derivative-power-visual-review.v2",
      animationId,
      baseUrl,
      captures,
      flatGlyphs,
      decrementGlyphs
    }, null, 2)}\n`,
    "utf8"
  );
  console.log(
    `Derivative power visual checkpoint captured ${captures.length} frames in ${outputRoot}.`
  );
} finally {
  await browser.close();
}
