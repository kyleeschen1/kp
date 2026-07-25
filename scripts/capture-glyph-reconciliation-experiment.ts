import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { chromium } from "playwright";

import {
  kpFractionEndpointCheckpoints
} from "./glyph-reconciliation-endpoint-checkpoints.ts";

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
const endpointEvidence: Array<Record<string, unknown>> = [];
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
          '[data-reconciliation-case="fraction-merge"] [data-kp-native-katex-scene-owner]'
        ).count(),
        branch: await page.locator(
          '[data-reconciliation-case="plus-minus-branch"] [data-kp-native-katex-fragment-clone]'
        ).count(),
        crowded: await page.locator(
          '[data-reconciliation-case="crowded-quadratic"] [data-kp-native-katex-fragment-clone]'
        ).count()
      };
      const expectedMergeOwners = Number(await page.locator(
        "[data-kp-glyph-review]"
      ).getAttribute("data-kp-fraction-scene-track-count"));
      if (
        motionCounts.solve !== 1 ||
        motionCounts.merge !== expectedMergeOwners ||
        expectedMergeOwners < 6 ||
        motionCounts.branch !== 2 ||
        motionCounts.crowded !== 3
      ) {
        throw new Error(
          `Expected exact 1/${expectedMergeOwners}/2/3 motion owners, found ${
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
  for (const profile of profiles) {
    for (const checkpoint of kpFractionEndpointCheckpoints) {
      const page = await browser.newPage({ viewport: profile.viewport });
      const url = new URL("/glyph-reconciliation-experiment.html", baseUrl);
      url.searchParams.set(
        "progress",
        String(checkpoint.routeProgressPermille)
      );
      await page.goto(url.toString(), { waitUntil: "networkidle" });
      await page.evaluate(async () => document.fonts.ready);
      const review = page.locator(
        '[data-kp-glyph-review][data-kp-ready="true"]'
      );
      await review.waitFor();
      const card = page.locator(
        '[data-reconciliation-case="fraction-merge"]'
      );
      const snapshot = await card.evaluate((element, fractionProgress) => {
        const telemetry = (window as unknown as {
          __kpMeasureFractionGlyphHandoff: (progress: number) => {
            observations: readonly {
              id: string;
              side: "material" | "native-target";
              paintAtomId: string;
              semanticEntityId: string;
              rect: {
                left: number;
                top: number;
                width: number;
                height: number;
              };
              baselineY: number | null;
              wrapperTransform: string;
              paintFingerprint: string;
              styleFingerprint: string;
              opacity: number;
            }[];
          };
        }).__kpMeasureFractionGlyphHandoff(fractionProgress);
        const materialOwners = [
          ...element.querySelectorAll<HTMLElement>(
            "[data-kp-native-katex-scene-owner]"
          )
        ];
        const source = element.querySelector<HTMLElement>(
          "[data-fraction-source]"
        )!;
        const target = element.querySelector<HTMLElement>(
          "[data-fraction-target]"
        )!;
        return {
          sourceOpacity: source.style.opacity,
          targetOpacity: target.style.opacity,
          materialOwnerCount: materialOwners.length,
          visibleMaterialOwnerCount: materialOwners.filter((owner) =>
            Number(owner.style.opacity) > 0
          ).length,
          glyphTelemetry: telemetry.observations.map((observation) => ({
            ...observation
          }))
        };
      }, checkpoint.fractionProgressPermille / 1_000);
      const visualOwner = await review.getAttribute(
        "data-kp-fraction-visual-owner"
      );
      const expectedOwner = checkpoint.fractionProgressPermille === 1_000
        ? "target-native"
        : "material-scene";
      if (visualOwner !== expectedOwner) {
        throw new Error(
          `Expected ${expectedOwner} at fraction progress ${
            checkpoint.fractionProgressPermille
          }, found ${visualOwner ?? "none"}.`
        );
      }
      if (
        checkpoint.fractionProgressPermille === 1_000
          ? snapshot.targetOpacity !== "1" ||
            snapshot.visibleMaterialOwnerCount !== 0
          : snapshot.targetOpacity !== "0" ||
            snapshot.visibleMaterialOwnerCount === 0
      ) {
        throw new Error(
          `Invalid endpoint ownership at ${checkpoint.id}: ${
            JSON.stringify(snapshot)
          }.`
        );
      }
      const file = path.join(
        outputRoot,
        `endpoint-${profile.id}-${checkpoint.id}.png`
      );
      await card.screenshot({ path: file });
      endpointEvidence.push({
        profile: profile.id,
        ...checkpoint,
        file: path.relative(process.cwd(), file),
        visualOwner,
        ...snapshot
      });
      await page.close();
    }
  }
  await writeFile(
    path.join(outputRoot, "evidence.json"),
    `${JSON.stringify({
      generatedAt: new Date().toISOString(),
      evidence,
      endpointEvidence
    }, null, 2)}\n`
  );
  console.log(
    `Captured ${evidence.length} overview frames and ${
      endpointEvidence.length
    } dense endpoint frames in ${path.relative(process.cwd(), outputRoot)}.`
  );
} finally {
  await browser.close();
}
