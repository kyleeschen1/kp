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
      await page.locator("[data-kp-glyph-review]").waitFor();
      const overflow = await page.evaluate(() =>
        document.documentElement.scrollWidth - document.documentElement.clientWidth
      );
      if (overflow > 1) throw new Error(`${profile.id} overflows by ${overflow}px.`);
      if (await page.locator("[data-kp-dev-review-shell]").count() !== 1) {
        throw new Error("Review inbox is not mounted.");
      }
      const file = path.join(outputRoot, `solve-x-${profile.id}-${progress}.png`);
      await page.screenshot({ path: file, fullPage: true });
      evidence.push({
        profile: profile.id,
        progress,
        file: path.relative(process.cwd(), file),
        overflow
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
