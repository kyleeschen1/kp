import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import type { Page } from "playwright";

import {
  buildKpVisualContactSheetHtml,
  type KpVisualContactSheetItem
} from "./capture-visual-contact-sheet.ts";
import { createKpVisualReviewHarness } from "./visual-review-harness.ts";

const outputRoot = path.resolve(
  "tmp/codex/native-katex-compositor-conformance-checkpoint"
);
const scenarios = Object.freeze([
  {
    animationId: "animation.operation-evaluation.two-times-one-carrier",
    slug: "digit-two",
    label: "clean control · 2 × 1 → 2",
    sourceSelectorId:
      "expression.operation-evaluation.two-times-one-carrier.source.carrier",
    targetSelectorId:
      "expression.operation-evaluation.two-times-one-carrier.target.carrier"
  },
  {
    animationId: "animation.generated.add-zero",
    slug: "italic-x",
    label: "repaired carrier · x + 0 = 4 → x = 4",
    sourceSelectorId: "generated.add-zero.before.x",
    targetSelectorId: "generated.add-zero.after.x"
  }
]);
const checkpoints = Object.freeze([
  { id: "source", label: "source native · 0%", progress: 0 },
  { id: "source-seam", label: "material enters · 0.1%", progress: 0.001 },
  { id: "midpoint", label: "material transit · 50%", progress: 0.5 },
  { id: "target-seam", label: "material exits · 99.9%", progress: 0.999 },
  { id: "target", label: "target native · 100%", progress: 1 }
]);

async function capture(): Promise<void> {
  await mkdir(outputRoot, { recursive: true });
  const harness = createKpVisualReviewHarness();
  const items: KpVisualContactSheetItem[] = [];
  const evidence: Array<{
    readonly scenario: string;
    readonly checkpoint: string;
    readonly progress: number;
    readonly owner: string;
    readonly file: string;
  }> = [];
  try {
    const page = await harness.page({
      viewport: { width: 1_240, height: 760 },
      colorScheme: "dark",
      reducedMotion: "no-preference"
    });
    for (const scenario of scenarios) {
      const url = new URL("/", harness.baseUrl);
      url.searchParams.set("artifact", scenario.animationId);
      url.searchParams.set("theme", "dark");
      await page.goto(url.toString(), { waitUntil: "domcontentloaded" });
      const player = page.locator(
        `[data-kp-editor-animation-player]` +
        `[data-kp-editor-animation-id="${scenario.animationId}"]`
      );
      const stage = player.locator(
        "[data-kp-carrier-preserving-simplification-stage]"
      );
      const seek = player.locator('[data-action="seek-editor-animation"]');
      await stage.waitFor({ state: "attached" });
      await page.waitForFunction(() =>
        document.querySelector<HTMLElement>(
          "[data-kp-carrier-preserving-simplification-stage]"
        )?.dataset["kpCarrierPreservingSimplificationStage"] === "ready"
      );
      for (const checkpoint of checkpoints) {
        await seek.fill(String(checkpoint.progress));
        await page.waitForFunction((progress) => Number(
          document.querySelector<HTMLElement>(
            "[data-kp-carrier-preserving-simplification-stage]"
          )?.dataset["kpCarrierPreservingSimplificationProgress"]
        ) === progress, checkpoint.progress);
        const owner = await addPaintGuide({
          page,
          sourceSelectorId: scenario.sourceSelectorId,
          targetSelectorId: scenario.targetSelectorId
        });
        const id = `${scenario.slug}-${checkpoint.id}`;
        const file = path.join(outputRoot, `${id}.png`);
        await stage.screenshot({ path: file, animations: "disabled" });
        const image = await readFile(file);
        items.push({
          id,
          label: `${scenario.label} · ${checkpoint.label} · ${owner}`,
          progress: checkpoint.progress,
          viewport: { width: 1_240, height: 760 },
          file,
          dataUrl: `data:image/png;base64,${image.toString("base64")}`
        });
        evidence.push({
          scenario: scenario.animationId,
          checkpoint: checkpoint.id,
          progress: checkpoint.progress,
          owner,
          file: path.relative(process.cwd(), file)
        });
      }
    }
    const htmlSource = buildKpVisualContactSheetHtml(items, {
      title: "Native KaTeX compositor · 2 / italic x handoff checkpoint",
      columns: 2,
      imageFit: "contain",
      imageHeightPx: 260
    });
    const html = path.join(outputRoot, "index.html");
    const sheet = path.join(outputRoot, "contact-sheet.png");
    const manifest = path.join(outputRoot, "manifest.json");
    await writeFile(html, htmlSource, "utf8");
    await page.setViewportSize({ width: 1_440, height: 1_000 });
    await page.setContent(htmlSource, { waitUntil: "load" });
    await page.screenshot({
      path: sheet,
      fullPage: true,
      animations: "disabled"
    });
    await page.close();
    await writeFile(manifest, `${JSON.stringify({
      schemaVersion: "kp.native-katex-compositor-checkpoint.v1",
      note:
        "Cyan marks the active realized baseline; magenta bounds active realized ink.",
      scenarios: scenarios.map((scenario) => ({
        animationId: scenario.animationId,
        livePath: `/?artifact=${scenario.animationId}&theme=dark`
      })),
      evidence,
      sheet: path.relative(process.cwd(), sheet),
      html: path.relative(process.cwd(), html)
    }, null, 2)}\n`, "utf8");
    console.log(`review sheet: ${path.relative(process.cwd(), html)}`);
    console.log(`contact sheet: ${path.relative(process.cwd(), sheet)}`);
    console.log(`manifest: ${path.relative(process.cwd(), manifest)}`);
  } finally {
    await harness.close();
  }
}

async function addPaintGuide(input: {
  readonly page: Page;
  readonly sourceSelectorId: string;
  readonly targetSelectorId: string;
}): Promise<string> {
  return input.page.evaluate(async (selectors) => {
    const stage = document.querySelector<HTMLElement>(
      "[data-kp-carrier-preserving-simplification-stage]"
    );
    if (stage === null) throw new Error("Missing carrier checkpoint stage.");
    stage.querySelector("[data-kp-conformance-paint-guide]")?.remove();
    const owner = stage.dataset["kpCarrierPreservingSimplificationVisualOwner"];
    const source = stage.querySelector<HTMLElement>(
      `[data-kp-semantic-entity-id="${CSS.escape(selectors.sourceSelectorId)}"]`
    );
    const target = stage.querySelector<HTMLElement>(
      `[data-kp-semantic-entity-id="${CSS.escape(selectors.targetSelectorId)}"]`
    );
    const material = stage.querySelector<HTMLElement>(
      `[data-kp-equation-material-semantic-entity-id="${
        CSS.escape(selectors.sourceSelectorId)
      }"]`
    )?.firstElementChild;
    const active = owner === "source-native"
      ? source
      : owner === "target-native" ? target : material;
    if (!(active instanceof HTMLElement)) {
      throw new Error("Missing active carrier paint for checkpoint guide.");
    }
    const modulePath = "/src/rendering/native-katex-paint-geometry.ts";
    const geometry = await import(/* @vite-ignore */ modulePath);
    const rect = geometry.measureKpNativeKatexTextInkRect(stage, active);
    const baselineY = geometry.measureKpNativeKatexBaselineY(stage, active);
    const guide = document.createElement("div");
    guide.dataset["kpConformancePaintGuide"] = "true";
    guide.setAttribute("aria-hidden", "true");
    guide.style.cssText = [
      "position:absolute",
      "inset:0",
      "pointer-events:none",
      "z-index:2147483647"
    ].join(";");
    const baseline = document.createElement("div");
    baseline.style.cssText = [
      "position:absolute",
      "left:6%",
      "right:6%",
      `top:${baselineY}px`,
      "height:1px",
      "background:rgba(53,220,255,.75)"
    ].join(";");
    const ink = document.createElement("div");
    ink.style.cssText = [
      "position:absolute",
      `left:${rect.left}px`,
      `top:${rect.top}px`,
      `width:${rect.width}px`,
      `height:${rect.height}px`,
      "box-sizing:border-box",
      "border:1px solid rgba(255,90,210,.85)"
    ].join(";");
    guide.append(baseline, ink);
    stage.append(guide);
    return owner ?? "unknown-owner";
  }, {
    sourceSelectorId: input.sourceSelectorId,
    targetSelectorId: input.targetSelectorId
  });
}

await capture();
