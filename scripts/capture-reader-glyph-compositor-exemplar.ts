import { access, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { chromium } from "playwright";
import { preview, type PreviewServer } from "vite";

const outputRoot = path.resolve("tmp/codex/reader-glyph-compositor");
const profiles = [
  { id: "wide", viewport: { width: 1280, height: 900 } },
  { id: "phone", viewport: { width: 390, height: 844 } }
] as const;
let server: PreviewServer | undefined;

await mkdir(outputRoot, { recursive: true });
try {
  await access(path.resolve("dist/reader/solve-x/index.html"));
  server = await preview({
    logLevel: "error",
    preview: { host: "127.0.0.1", port: 4180, strictPort: false }
  });
  const address = server.httpServer.address();
  if (address === null || typeof address === "string") {
    throw new Error("Reader compositor preview did not expose an address.");
  }
  const baseUrl = `http://127.0.0.1:${address.port}`;
  const browser = await chromium.launch({ headless: true });
  const captures: Array<Record<string, unknown>> = [];
  try {
    for (const profile of profiles) {
      for (const motion of ["full", "reduced"] as const) {
        const context = await browser.newContext({
          viewport: profile.viewport,
          reducedMotion: motion === "reduced" ? "reduce" : "no-preference"
        });
        const page = await context.newPage();
        const url = new URL("/reader/solve-x/", baseUrl);
        url.searchParams.set("kpLesson", "lesson.solve-x.x-plus-3");
        url.searchParams.set("kpVersion", "1");
        url.searchParams.set("kpProgress", "500");
        url.searchParams.set("kpMotion", motion);
        await page.goto(url.toString(), { waitUntil: "networkidle" });
        const stage = page.locator(
          '[data-kp-reader-equation-stage][data-kp-reader-glyph-compositor-active="true"]'
        );
        await stage.waitFor();
        const active = page.locator('[data-kp-reader-transition-active="true"]');
        const ownerCount = await active.locator(
          "[data-kp-native-katex-scene-owner]"
        ).count();
        if (ownerCount === 0) {
          throw new Error(`${profile.id}/${motion} has no compositor paint owners.`);
        }
        const overflow = await page.evaluate(() =>
          document.documentElement.scrollWidth -
          document.documentElement.clientWidth
        );
        if (overflow > 1) {
          throw new Error(`${profile.id}/${motion} overflows by ${overflow}px.`);
        }
        const file = path.join(
          outputRoot,
          `reader-compositor-${profile.id}-${motion}.png`
        );
        await stage.screenshot({ path: file });
        captures.push({
          profile: profile.id,
          motion,
          ownerCount,
          overflow,
          file: path.relative(process.cwd(), file)
        });
        await context.close();
      }
    }
  } finally {
    await browser.close();
  }
  const report = path.join(outputRoot, "review.json");
  await writeFile(report, `${JSON.stringify({
    schemaVersion: "kp.reader-glyph-compositor-review.v1",
    captures
  }, null, 2)}\n`);
  console.log(JSON.stringify({
    output: path.relative(process.cwd(), report),
    captureCount: captures.length,
    captures
  }, null, 2));
} finally {
  await server?.close();
}
