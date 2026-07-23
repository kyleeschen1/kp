import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { chromium, type Locator, type Page } from "playwright";

const baseUrl = process.env["KP_VISUAL_BASE_URL"] ?? "http://127.0.0.1:8000";
const outputRoot = path.resolve(
  process.env["KP_VISUAL_OUTPUT"] ?? "tmp/codex/derivative-tangent-visual"
);
const checkpoints = [
  { id: "finite-secant", progress: 0 },
  { id: "convergence-quarter", progress: 0.25 },
  { id: "convergence-midpoint", progress: 0.5 },
  { id: "convergence-three-quarters", progress: 0.75 },
  { id: "tangent-limit", progress: 1 }
] as const;

await mkdir(outputRoot, { recursive: true });
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

try {
  await page.goto(
    `${baseUrl}/?animation=editor-animation.sample.animation.derivative-rules.tangent-graph`,
    { waitUntil: "networkidle" }
  );
  await page.evaluate(async () => document.fonts.ready);
  const player = page.locator("[data-kp-editor-animation-player]");
  const stage = player.locator("[data-kp-editor-animation-stage]");
  const scrubber = player.locator('[data-action="seek-editor-animation"]');
  await player.waitFor();
  await page.waitForFunction(() =>
    document.querySelector<HTMLElement>(
      "[data-kp-editor-animation-player]"
    )?.dataset["kpEditorAnimationHydrated"] === "true"
  );
  await player.locator("[data-kp-editor-graph-secant]").waitFor({
    state: "attached"
  });
  const mathOverlays = player.locator(
    "[data-kp-editor-graph-function-context] .katex, [data-kp-editor-graph-difference-quotient] .katex, [data-kp-editor-graph-current-sample] .katex, [data-kp-editor-graph-derivative-expression] .katex"
  );
  if (await mathOverlays.count() !== 4) {
    throw new Error("Derivative-tangent exemplar did not render all four math overlays through KaTeX.");
  }
  const warnings = (await player.locator(
    "[data-kp-editor-gestalt-warnings] li"
  ).allTextContents()).map((warning) => warning.trim()).filter(Boolean);
  const diagnostics = {
    status:
      await player.getAttribute("data-kp-editor-animation-gestalt-status") ??
      "missing",
    designIssues: await player.locator(
      "[data-kp-editor-design-issues]"
    ).textContent() ?? "missing"
  };
  if (diagnostics.status !== "ready" || warnings.length > 0) {
    throw new Error(
      `Derivative-tangent promotion diagnostics are not ready: ${JSON.stringify({
        diagnostics,
        warnings
      })}`
    );
  }
  await stage.evaluate((element) => {
    element.dataset["kpDerivativeTangentVisualIdentity"] = "stable";
  });

  const captures: DerivativeTangentCapture[] = [];
  for (const checkpoint of checkpoints) {
    await capture({
      page,
      player,
      scrubber,
      id: checkpoint.id,
      progress: checkpoint.progress,
      direction: "forward",
      captures
    });
  }

  await player.getByRole("button", { name: "Rewind animation" }).click();
  if (
    await stage.getAttribute("data-kp-derivative-tangent-visual-identity") !==
    "stable"
  ) {
    throw new Error("Derivative-tangent rewind replaced the graph stage.");
  }
  await capture({
    page,
    player,
    scrubber,
    id: "convergence-rewind-midpoint",
    progress: 0.5,
    direction: "rewind",
    captures
  });
  const forwardMiddle = captures.find(
    (candidate) => candidate.id === "convergence-midpoint.png"
  );
  const rewindMiddle = captures.at(-1);
  if (
    forwardMiddle?.h !== rewindMiddle?.h ||
    forwardMiddle?.movingX !== rewindMiddle?.movingX ||
    forwardMiddle?.secantSlope !== rewindMiddle?.secantSlope
  ) {
    throw new Error("Derivative-tangent rewind does not mirror forward state.");
  }

  await writeFile(
    path.join(outputRoot, "manifest.json"),
    `${JSON.stringify({
      schemaVersion: "kp.derivative-tangent-visual-review.v1",
      baseUrl,
      captures,
      diagnostics,
      warnings
    }, null, 2)}\n`,
    "utf8"
  );
  console.log(JSON.stringify({
    outputRoot: path.relative(process.cwd(), outputRoot),
    captures: captures.length,
    diagnostics,
    warnings
  }, null, 2));
} finally {
  await browser.close();
}

interface DerivativeTangentCapture {
  readonly id: string;
  readonly progress: number;
  readonly direction: "forward" | "rewind";
  readonly h: string;
  readonly movingX: string;
  readonly secantSlope: string;
}

async function capture(input: {
  readonly page: Page;
  readonly player: Locator;
  readonly scrubber: Locator;
  readonly id: string;
  readonly progress: number;
  readonly direction: "forward" | "rewind";
  readonly captures: DerivativeTangentCapture[];
}): Promise<void> {
  await input.scrubber.fill(String(input.progress));
  await input.page.evaluate(() =>
    new Promise<void>((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
    )
  );
  const point = input.player.locator("[data-kp-editor-graph-secant-point]");
  const secant = input.player.locator("[data-kp-editor-graph-secant]");
  const id = `${input.id}.png`;
  await input.player.screenshot({ path: path.join(outputRoot, id) });
  input.captures.push({
    id,
    progress: input.progress,
    direction: input.direction,
    h: await secant.getAttribute("data-kp-editor-graph-secant-h") ?? "missing",
    movingX:
      await point.getAttribute("data-kp-editor-graph-secant-x") ?? "missing",
    secantSlope:
      await secant.getAttribute("data-kp-editor-graph-secant-slope") ??
      "missing"
  });
}
