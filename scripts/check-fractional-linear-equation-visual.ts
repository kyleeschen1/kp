import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import type { Page } from "playwright";

import { createKpVisualReviewHarness } from "./visual-review-harness.ts";

const outputRoot = path.resolve(
  process.env["KP_FRACTIONAL_LINEAR_VISUAL_OUTPUT"]
    ?? "tmp/codex/fractional-linear-equation-visual"
);
const explicitBaseUrl = process.env["KP_VISUAL_BASE_URL"];
const harness = createKpVisualReviewHarness(
  explicitBaseUrl === undefined ? {} : { baseUrl: explicitBaseUrl }
);
const checkpoints = new Set([0, 167, 333, 500, 667, 833, 1_000]);
const progressSamples = uniqueSorted([
  ...Array.from({ length: 31 }, (_, index) => Math.round(index * 1_000 / 30)),
  ...checkpoints
]);

await mkdir(outputRoot, { recursive: true });
const pageErrors: string[] = [];
try {
  const page = await harness.page({
    viewport: { width: 1280, height: 900 },
    reducedMotion: "no-preference"
  });
  page.on("pageerror", (error) => pageErrors.push(error.message));
  const samples = [];
  for (const progress of progressSamples) {
    const url = new URL("/reader/solve-fractional-linear/", harness.baseUrl);
    url.searchParams.set("kpLesson", "lesson.solve-x.fractional-linear");
    url.searchParams.set("kpVersion", "1");
    url.searchParams.set("kpProgress", String(progress));
    await page.goto(url.toString(), { waitUntil: "networkidle" });
    await settle(page);
    samples.push(await sampleVisualFrame(page, progress));
    if (checkpoints.has(progress)) {
      await page.locator("[data-kp-reader-equation-stage]").screenshot({
        path: path.join(outputRoot, `checkpoint-${String(progress).padStart(4, "0")}.png`)
      });
    }
  }
  const failures = [
    ...pageErrors.map((message) => `browser error: ${message}`),
    ...samples.flatMap((sample) => sample.failures.map((failure) =>
      `progress ${sample.requestedProgress}: ${failure}`
    ))
  ];
  const report = {
    schemaVersion: "kp.fractional-linear-equation-visual-check.v1",
    route: "/reader/solve-fractional-linear/",
    viewport: { width: 1280, height: 900 },
    samples,
    failures
  } as const;
  const reportPath = path.join(outputRoot, "report.json");
  await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  process.stdout.write(`${JSON.stringify({
    report: path.relative(process.cwd(), reportPath),
    samples: samples.length,
    failures: failures.length
  }, null, 2)}\n`);
  if (failures.length > 0) {
    process.stderr.write(`${failures.join("\n")}\n`);
    process.exitCode = 1;
  }
} finally {
  await harness.close();
}

async function sampleVisualFrame(page: Page, requestedProgress: number) {
  return page.evaluate((progress) => {
    interface Box { left: number; top: number; right: number; bottom: number; width: number; height: number }
    const box = (element: Element): Box => {
      const rect = element.getBoundingClientRect();
      return {
        left: rect.left,
        top: rect.top,
        right: rect.right,
        bottom: rect.bottom,
        width: rect.width,
        height: rect.height
      };
    };
    const viewport = document.querySelector<HTMLElement>("[data-kp-reader-equation-viewport]");
    const stage = document.querySelector<HTMLElement>("[data-kp-reader-equation-stage]");
    const active = document.querySelector<HTMLElement>("[data-kp-reader-transition-active=true]");
    if (viewport === null || stage === null || active === null) {
      throw new Error("Fractional equation visual frame is unavailable.");
    }
    const viewportBox = box(viewport);
    const ink = [
      ...active.querySelectorAll<HTMLElement>("[data-kp-reader-equation-anchor-id]"),
      ...stage.querySelectorAll<HTMLElement>("[data-kp-reader-equation-material-owner-id]")
    ].filter((element) => {
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return Number(style.opacity) > 0.01 && style.visibility !== "hidden" &&
        rect.width > 0 && rect.height > 0;
    }).map((element) => ({
      id: element.dataset["kpReaderEquationAnchorId"]
        ?? element.dataset["kpReaderEquationMaterialOwnerId"]
        ?? "unknown",
      rect: box(element),
      opacity: Number(getComputedStyle(element).opacity)
    }));
    const failures: string[] = [];
    const tolerance = 1.5;
    for (const item of ink) {
      if (item.rect.left < viewportBox.left - tolerance ||
        item.rect.right > viewportBox.right + tolerance ||
        item.rect.top < viewportBox.top - tolerance ||
        item.rect.bottom > viewportBox.bottom + tolerance) {
        failures.push(`ink ${item.id} escapes the equation viewport`);
      }
    }
    const renderedStates = [...active.querySelectorAll<HTMLElement>(
      ".kp-reader-equation-state"
    )];
    if (renderedStates.some((state) => state.scrollWidth > state.clientWidth + 1)) {
      failures.push("an equation state wraps or internally overflows");
    }
    if (stage.scrollWidth > stage.clientWidth + 1) {
      failures.push("the stage has horizontal overflow");
    }
    const visibleFractionRules = ink.filter((item) => item.id.endsWith("fraction.rule"));
    if (visibleFractionRules.some((item) => item.rect.width < 4 || item.rect.height < 0.5)) {
      failures.push("a visible fraction rule loses measurable ink");
    }
    const katexFonts = [...new Set(
      [...stage.querySelectorAll<HTMLElement>(".katex")]
        .filter((element) => element.getBoundingClientRect().width > 0)
        .map((element) => getComputedStyle(element).fontFamily)
    )];
    if (katexFonts.length !== 1) failures.push("KaTeX font family changes inside the stage");
    const fragments = [...stage.querySelectorAll<HTMLElement>(
      "[data-kp-reader-equation-material-fragment-id]"
    )].filter((element) => {
      const owner = element.closest<HTMLElement>(
        "[data-kp-reader-equation-material-owner-id]"
      );
      const rect = element.getBoundingClientRect();
      return owner !== null && Number(getComputedStyle(owner).opacity) > 0.2 &&
        Number(getComputedStyle(element).opacity) > 0.2 &&
        rect.width > 0 && rect.height > 0;
    }).map((element) => ({
      id: element.dataset["kpReaderEquationMaterialFragmentId"] ?? "unknown",
      ownerId: element.closest<HTMLElement>(
        "[data-kp-reader-equation-material-owner-id]"
      )?.dataset["kpReaderEquationMaterialOwnerId"] ?? "unknown",
      rect: box(element)
    }));
    const collisions = fragments.flatMap((left, leftIndex) =>
      fragments.slice(leftIndex + 1).flatMap((right) => {
        if (left.ownerId === right.ownerId) return [];
        const width = Math.max(0, Math.min(left.rect.right, right.rect.right) -
          Math.max(left.rect.left, right.rect.left));
        const height = Math.max(0, Math.min(left.rect.bottom, right.rect.bottom) -
          Math.max(left.rect.top, right.rect.top));
        const intersection = width * height;
        const smallerArea = Math.min(
          left.rect.width * left.rect.height,
          right.rect.width * right.rect.height
        );
        return intersection > 4 && intersection / smallerArea > 0.08
          ? [`${left.id} <> ${right.id}`]
          : [];
      })
    );
    const transitionId = document.body.dataset["kpReaderTransition"] ?? "";
    const causalConvergence = transitionId.includes("cancel") ||
      transitionId.includes("simplify");
    if (!causalConvergence && collisions.length > 0) {
      failures.push(`unexpected material collision: ${collisions[0]}`);
    }
    return {
      requestedProgress: progress,
      renderedProgress: Number(document.body.dataset["kpReaderProgress"]),
      transitionId: transitionId || null,
      viewport: viewportBox,
      stage: {
        width: stage.getBoundingClientRect().width,
        scrollWidth: stage.scrollWidth,
        clientWidth: stage.clientWidth
      },
      visibleInkCount: ink.length,
      visibleFractionRuleCount: visibleFractionRules.length,
      materialCollisionCount: collisions.length,
      katexFonts,
      failures
    };
  }, requestedProgress);
}

async function settle(page: Page): Promise<void> {
  await page.locator("[data-kp-reader-equation-stage]").waitFor();
  await page.evaluate(async () => {
    await document.fonts.ready;
    await new Promise<void>((resolve) => requestAnimationFrame(() =>
      requestAnimationFrame(() => resolve())
    ));
  });
}

function uniqueSorted(values: readonly number[]): readonly number[] {
  return [...new Set(values)].sort((left, right) => left - right);
}
