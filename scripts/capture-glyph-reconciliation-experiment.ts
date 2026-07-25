import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { chromium } from "playwright";

const baseUrl = process.env["KP_VISUAL_BASE_URL"] ?? "http://127.0.0.1:8000";
const outputRoot = path.resolve("tmp/codex/glyph-reconciliation-experiment");
const profiles = [
  { id: "wide", viewport: { width: 1440, height: 950 } },
  { id: "phone", viewport: { width: 390, height: 844 } }
] as const;
const checkpoints = [0, 250, 500, 750, 1000] as const;

await mkdir(outputRoot, { recursive: true });
const browser = await chromium.launch({ headless: true });
const evidence: Array<Record<string, unknown>> = [];
try {
  for (const profile of profiles) {
    for (const progress of checkpoints) {
      const page = await browser.newPage({ viewport: profile.viewport });
      const url = new URL("/glyph-reconciliation-experiment.html", baseUrl);
      url.searchParams.set("progress", String(progress));
      await page.goto(url.toString(), { waitUntil: "networkidle" });
      await page.evaluate(async () => document.fonts.ready);
      await page.locator('[data-kp-glyph-review][data-kp-ready="true"]').waitFor();
      const caseCount = await page.locator("[data-reconciliation-case]").count();
      if (caseCount !== 4) {
        throw new Error(`Expected exactly four promoted cases, found ${caseCount}.`);
      }
      const motionCounts = {
        solve: await page.locator(
          '[data-reconciliation-case="solve-x"] [data-kp-native-katex-fragment-clone]'
        ).count(),
        merge: await page.locator(
          '[data-reconciliation-case="fraction-merge"] [data-kp-native-katex-fragment-clone]'
        ).count(),
        branch: await page.locator(
          '[data-reconciliation-case="plus-minus-branch"] [data-kp-native-katex-fragment-clone]'
        ).count(),
        crowded: await page.locator(
          '[data-reconciliation-case="crowded-quadratic"] [data-kp-native-katex-fragment-clone]'
        ).count()
      };
      if (
        motionCounts.solve !== 1 ||
        motionCounts.merge !== 2 ||
        motionCounts.branch !== 2 ||
        motionCounts.crowded !== 3
      ) {
        throw new Error(
          `Expected exact 1/2/2/3 fragment owners, found ${
            JSON.stringify(motionCounts)
          }.`
        );
      }
      const owner = await page.locator("[data-kp-glyph-review]")
        .getAttribute("data-kp-visual-owner");
      const expectedOwner = progress <= 300
        ? "source-native"
        : progress >= 920
          ? "target-native"
          : "clone-transit";
      if (owner !== expectedOwner) {
        throw new Error(
          `Expected ${expectedOwner} at ${progress}, found ${owner ?? "none"}.`
        );
      }
      const geometry = await page.evaluate(() => {
        const read = (selector: string) => {
          const rect = document.querySelector<HTMLElement>(selector)!
            .getBoundingClientRect();
          return {
            left: rect.left,
            top: rect.top,
            width: rect.width,
            height: rect.height
          };
        };
        return {
          source: read("[data-case-source]"),
          target: read("[data-case-target]"),
          moving: read("[data-kp-native-katex-fragment-clone]"),
          context: read("[data-case-context]")
        };
      });
      const overflow = await page.evaluate(() =>
        document.documentElement.scrollWidth - document.documentElement.clientWidth
      );
      if (overflow > 1) throw new Error(`${profile.id} overflows by ${overflow}px.`);
      if (await page.locator("[data-kp-dev-review-shell]").count() !== 1) {
        throw new Error("Review inbox is not mounted.");
      }
      const file = path.join(outputRoot, `contact-sheet-${profile.id}-${progress}.png`);
      await page.screenshot({ path: file, fullPage: true });
      evidence.push({
        profile: profile.id,
        progress,
        file: path.relative(process.cwd(), file),
        overflow,
        caseCount,
        motionCounts,
        geometry
      });
      await page.close();
    }
  }
  await writeFile(
    path.join(outputRoot, "evidence.json"),
    `${JSON.stringify({ generatedAt: new Date().toISOString(), evidence }, null, 2)}\n`
  );
  console.log(`Captured ${evidence.length} glyph reconciliation frames in ${path.relative(process.cwd(), outputRoot)}.`);
} finally {
  await browser.close();
}
