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
  const captures: { id: string; animationId: string; progress: number }[] = [];
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
      "editor-animation.sample.animation.radical-rewrite.square-root-as-power",
    animationId: "animation.generated.radical.square-root-as-power",
    checkpoints: [
      { id: "radical-source-gathered", progress: 0.55 },
      { id: "radical-bundle-transfer", progress: 0.67 },
      { id: "radical-native-settled", progress: 0.98 }
    ],
    captures,
    diagnostics
  });
  await writeFile(
    path.join(outputRoot, "manifest.json"),
    `${JSON.stringify({
      schemaVersion: "kp.exponent-radical-visual-review.v1",
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
  readonly checkpoints: readonly {
    readonly id: string;
    readonly progress: number;
  }[];
  readonly captures: { id: string; animationId: string; progress: number }[];
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
      progress: checkpoint.progress
    });
  }
}
