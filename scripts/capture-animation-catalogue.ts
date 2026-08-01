import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { chromium } from "playwright";

const animationId = "animation.linear-solve.solve-x";
const baseUrl =
  process.env["KP_VISUAL_BASE_URL"] ?? "http://127.0.0.1:8000";
const outputRoot = path.resolve(
  process.env["KP_VISUAL_OUTPUT"] ?? "tmp/codex/animation-catalogue"
);
const viewport = { width: 1440, height: 1000 } as const;

await mkdir(outputRoot, { recursive: true });
const browser = await chromium.launch({ headless: true });

try {
  const page = await browser.newPage({ viewport });
  const url = new URL("/", baseUrl);
  url.searchParams.set("artifact", animationId);

  await page.goto(url.toString(), { waitUntil: "networkidle" });
  await page.evaluate(async () => document.fonts.ready);
  await page.locator(
    `[data-kp-animation-catalogue-state="selected"][data-kp-animation-catalogue-selection="${animationId}"]`
  ).waitFor();
  await page.waitForFunction(() => {
    const player = document.querySelector<HTMLElement>(
      "[data-kp-animation-catalogue-stage] [data-kp-editor-animation-player]"
    );
    const surface = player?.querySelector<HTMLElement>(
      "[data-kp-editor-animation-surface-slot]"
    );
    return player?.dataset["kpEditorAnimationHydrated"] === "true" &&
      surface?.dataset["kpEditorAnimationAdapterStatus"] === "ready";
  });

  const screenshot = path.join(outputRoot, "desktop.png");
  await page.screenshot({
    path: screenshot,
    fullPage: true,
    animations: "disabled"
  });

  const manifest = path.join(outputRoot, "manifest.json");
  await writeFile(
    manifest,
    `${JSON.stringify({
      schemaVersion: "kp.animation-catalogue-visual-capture.v1",
      animationId,
      routeState: "catalogue-explicit-exemplar",
      url: url.toString(),
      viewport,
      screenshot: path.relative(process.cwd(), screenshot)
    }, null, 2)}\n`,
    "utf8"
  );

  console.log(`animation catalogue capture: ${path.relative(process.cwd(), screenshot)}`);
  console.log(`animation catalogue manifest: ${path.relative(process.cwd(), manifest)}`);
} finally {
  await browser.close();
}
