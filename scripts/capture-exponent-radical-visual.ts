import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { chromium, type Locator, type Page } from "playwright";

const baseUrl = process.env["KP_VISUAL_BASE_URL"] ?? "http://127.0.0.1:8000";
const outputRoot = path.resolve(
  process.env["KP_VISUAL_OUTPUT"] ?? "tmp/codex/exponent-radical-visual"
);
const viewport = { width: 1280, height: 900 } as const;

await mkdir(outputRoot, { recursive: true });
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport });

try {
  await page.goto(baseUrl, { waitUntil: "networkidle" });
  await page.evaluate(async () => document.fonts.ready);
  const player = page.locator("[data-kp-editor-animation-player]");
  const select = page.locator('[data-action="set-editor-animation"]');
  const captures: {
    id: string;
    animationId: string;
    progress: number;
    explanationProfile: string;
    direction: "forward" | "rewind";
  }[] = [];
  const diagnostics: {
    animationId: string;
    status: string;
    datasetStatus: string;
    designIssues: string;
    warnings: string[];
    warningMarkup: string[];
  }[] = [];

  await captureAnimation({
    page,
    player,
    select,
    optionId:
      "editor-animation.sample.animation.exponent-combine.square-as-product",
    animationId: "animation.generated.exponent.square-as-product",
    explanationProfile: "explain",
    checkpoints: [
      { id: "exponent-factor-peel", progress: 0.35 },
      { id: "exponent-unit-absorb", progress: 0.82 },
      { id: "exponent-native-settled", progress: 1 }
    ],
    captures,
    diagnostics
  });
  await captureAnimation({
    page,
    player,
    select,
    optionId:
      "editor-animation.sample.animation.exponent-combine.square-as-product",
    animationId: "animation.generated.exponent.square-as-product",
    explanationProfile: "fluent",
    checkpoints: [
      { id: "exponent-fluent-direct-expansion", progress: 0.78 },
      { id: "exponent-fluent-settled", progress: 1 }
    ],
    captures,
    diagnostics
  });
  await captureAnimation({
    page,
    player,
    select,
    optionId:
      "editor-animation.sample.animation.radical-rewrite.square-root-as-power",
    animationId: "animation.generated.radical.square-root-as-power",
    explanationProfile: "explain",
    checkpoints: [
      { id: "radical-solid-source", progress: 0.12 },
      { id: "radical-solid-departing", progress: 0.25 },
      { id: "radical-solid-morph", progress: 0.5 },
      { id: "radical-solid-forming", progress: 0.75 },
      { id: "radical-solid-complete", progress: 0.82 },
      { id: "radical-native-handoff", progress: 0.9 },
      { id: "radical-native-settled", progress: 0.96 }
    ],
    captures,
    diagnostics
  });
  await captureRadicalRewind({ page, player, captures });
  await writeFile(
    path.join(outputRoot, "manifest.json"),
    `${JSON.stringify({
      schemaVersion: "kp.exponent-radical-visual-review.v3",
      baseUrl,
      viewport,
      captures,
      diagnostics
    }, null, 2)}\n`,
    "utf8"
  );
  console.log(JSON.stringify({
    outputRoot: path.relative(process.cwd(), outputRoot),
    captures: captures.length,
    diagnostics
  }, null, 2));
} finally {
  await browser.close();
}

async function captureAnimation(input: {
  readonly page: Page;
  readonly player: Locator;
  readonly select: Locator;
  readonly optionId: string;
  readonly animationId: string;
  readonly explanationProfile: "explain" | "fluent";
  readonly checkpoints: readonly {
    readonly id: string;
    readonly progress: number;
  }[];
  readonly captures: {
    id: string;
    animationId: string;
    progress: number;
    explanationProfile: string;
    direction: "forward" | "rewind";
  }[];
  readonly diagnostics: {
    animationId: string;
    status: string;
    datasetStatus: string;
    designIssues: string;
    warnings: string[];
    warningMarkup: string[];
  }[];
}): Promise<void> {
  await input.select.selectOption(input.optionId);
  await input.player.waitFor();
  await input.page.waitForFunction((animationId) =>
    document.querySelector<HTMLElement>(
      "[data-kp-editor-animation-player]"
    )?.dataset["kpEditorAnimationId"] === animationId, input.animationId
  );
  await input.page.waitForFunction(() => {
    const status = document.querySelector<HTMLElement>(
      "[data-kp-editor-gestalt-status]"
    )?.textContent?.trim();
    return status !== undefined && status !== "Inspecting";
  });
  await input.player.locator(
    "[data-kp-editor-animation-explanation-profile-control]"
  ).selectOption(input.explanationProfile);
  if (
    input.animationId ===
    "animation.generated.radical.square-root-as-power"
  ) {
    await input.page.waitForFunction(() =>
      document.querySelector<HTMLElement>(
        "[data-kp-editor-equation-stage]"
      )?.dataset["kpEditorRadicalMorphReady"] === "true"
    );
    const stage = input.player.locator("[data-kp-editor-equation-stage]");
    const canvas = stage.locator("[data-kp-editor-radical-webgl-morph]");
    if (
      await stage.getAttribute("data-kp-editor-radical-morph-mode") !==
        "webgl-solid-mask" ||
      await canvas.getAttribute("data-kp-editor-radical-webgl-target") !==
        "complete-native-radical-operator"
    ) {
      throw new Error(
        "Radical exemplar did not initialize its complete-operator solid morph."
      );
    }
  }
  const diagnostic = {
    animationId: input.animationId,
    status: await input.player.locator(
      "[data-kp-editor-gestalt-status]"
    ).innerText(),
    datasetStatus: await input.player.getAttribute(
      "data-kp-editor-animation-gestalt-status"
    ) ?? "missing",
    designIssues: await input.player.locator(
      "[data-kp-editor-design-issues]"
    ).innerText(),
    warnings: await input.player.locator(
      "[data-kp-editor-gestalt-warnings] li"
    ).allInnerTexts(),
    warningMarkup: await input.player.locator(
      "[data-kp-editor-gestalt-warnings] li"
    ).evaluateAll((items) => items.map((item) => item.outerHTML))
  };
  input.diagnostics.push(diagnostic);
  if (
    diagnostic.datasetStatus !== "ready" ||
    diagnostic.warningMarkup.length > 0
  ) {
    throw new Error(
      `${input.animationId} is not promotion-ready: ${
        diagnostic.warningMarkup.join(" ") || diagnostic.datasetStatus
      }`
    );
  }
  const scrubber = input.player.locator('[data-action="seek-editor-animation"]');
  for (const checkpoint of input.checkpoints) {
    await scrubber.fill(String(checkpoint.progress));
    await input.page.evaluate(() =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
      )
    );
    await input.player.screenshot({
      path: path.join(outputRoot, `${checkpoint.id}.png`)
    });
    input.captures.push({
      id: `${checkpoint.id}.png`,
      animationId: input.animationId,
      progress: checkpoint.progress,
      explanationProfile: input.explanationProfile,
      direction: "forward"
    });
  }
}

async function captureRadicalRewind(input: {
  readonly page: Page;
  readonly player: Locator;
  readonly captures: {
    id: string;
    animationId: string;
    progress: number;
    explanationProfile: string;
    direction: "forward" | "rewind";
  }[];
}): Promise<void> {
  const stage = input.player.locator("[data-kp-editor-equation-stage]");
  const canvas = stage.locator("[data-kp-editor-radical-webgl-morph]");
  await canvas.evaluate((element) => {
    element.dataset["kpVisualRewindProbe"] = "prepared";
  });
  await input.player.getByRole("button", { name: "Rewind" }).click();
  if (
    await canvas.getAttribute("data-kp-visual-rewind-probe") !== "prepared" ||
    await stage.getAttribute("data-kp-editor-radical-morph-ready") !== "true"
  ) {
    throw new Error(
      "Radical rewind replaced or unprepared the solid morph renderer."
    );
  }

  const scrubber = input.player.locator('[data-action="seek-editor-animation"]');
  for (const checkpoint of [
    { id: "radical-rewind-settled", progress: 0.04 },
    { id: "radical-rewind-forming", progress: 0.25 },
    { id: "radical-rewind-morph", progress: 0.5 },
    { id: "radical-rewind-source", progress: 0.75 }
  ] as const) {
    await scrubber.fill(String(checkpoint.progress));
    await input.page.evaluate(() =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
      )
    );
    await input.player.screenshot({
      path: path.join(outputRoot, `${checkpoint.id}.png`)
    });
    input.captures.push({
      id: `${checkpoint.id}.png`,
      animationId: "animation.generated.radical.square-root-as-power",
      progress: checkpoint.progress,
      explanationProfile: "explain",
      direction: "rewind"
    });
  }
}
