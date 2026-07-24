import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { chromium } from "playwright";

import { createKpQuadraticBranchingPreservationManifest } from "../src/editor/quadratic-branching-preservation.ts";

const baseUrl =
  process.env["KP_VISUAL_BASE_URL"] ?? "http://127.0.0.1:8000";
const outputRoot = path.resolve(
  process.env["KP_VISUAL_OUTPUT"] ??
    "tmp/codex/quadratic-branching-preservation"
);
const profiles = [
  { id: "wide", viewport: { width: 1440, height: 1000 } },
  { id: "narrow", viewport: { width: 390, height: 844 } }
] as const;
const manifest = createKpQuadraticBranchingPreservationManifest();

await mkdir(outputRoot, { recursive: true });
const browser = await chromium.launch({ headless: true });
const captures: {
  readonly id: string;
  readonly animationId: string;
  readonly profile: string;
  readonly file: string;
  readonly playerCount: number;
  readonly horizontalOverflowPx: number;
}[] = [];

try {
  for (const entry of manifest.entries) {
    for (const profile of profiles) {
      const page = await browser.newPage({ viewport: profile.viewport });
      try {
        const url = new URL("/", baseUrl);
        url.searchParams.set("view", "animation-workbench");
        url.searchParams.set("q", entry.query);
        url.searchParams.set("workbenchAnimation", entry.animationId);
        await page.goto(url.toString(), { waitUntil: "networkidle" });
        await page.evaluate(async () => document.fonts.ready);
        await page
          .locator(
            `[data-kp-animation-workbench-selection="${entry.animationId}"]`
          )
          .waitFor();

        const playerCount = await page
          .locator("[data-kp-editor-animation-player]")
          .count();
        const expectedPlayerCount =
          entry.expectedPlayability === "playable" ? 1 : 0;
        if (playerCount !== expectedPlayerCount) {
          throw new Error(
            `${entry.animationId} expected ${expectedPlayerCount} player(s), received ${playerCount}.`
          );
        }
        const horizontalOverflowPx = await page.evaluate(
          () =>
            document.documentElement.scrollWidth -
            document.documentElement.clientWidth
        );
        if (horizontalOverflowPx > 1) {
          throw new Error(
            `${entry.animationId} ${profile.id} overflows by ${horizontalOverflowPx}px.`
          );
        }
        const id = `${entry.id}-${profile.id}`;
        const file = path.join(outputRoot, `${id}.png`);
        await page.screenshot({
          path: file,
          fullPage: true,
          animations: "disabled"
        });
        captures.push({
          id,
          animationId: entry.animationId,
          profile: profile.id,
          file: path.relative(process.cwd(), file),
          playerCount,
          horizontalOverflowPx
        });
      } finally {
        await page.close();
      }
    }
  }

  const outputManifest = path.join(outputRoot, "manifest.json");
  await writeFile(
    outputManifest,
    `${JSON.stringify(
      {
        ...manifest,
        baseUrl,
        captures
      },
      null,
      2
    )}\n`,
    "utf8"
  );
  console.log(
    JSON.stringify(
      {
        manifest: path.relative(process.cwd(), outputManifest),
        captures: captures.length,
        plannedPlayerCount: captures
          .filter(({ animationId }) =>
            animationId ===
            "animation.algebra.quadratic.solution-branching"
          )
          .reduce((sum, { playerCount }) => sum + playerCount, 0)
      },
      null,
      2
    )
  );
} finally {
  await browser.close();
}
