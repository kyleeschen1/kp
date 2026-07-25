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
const splitCheckpoints = [0, 500, 1000] as const;
const radicalCheckpoints = [0, 500, 999, 1000] as const;
const compoundCheckpoints = [0, 450, 950, 1000] as const;

await mkdir(outputRoot, { recursive: true });
const browser = await chromium.launch({ headless: true });
const evidence: Array<Record<string, unknown>> = [];
const endpointEvidence: Array<Record<string, unknown>> = [];
const splitEvidence: Array<Record<string, unknown>> = [];
const radicalEvidence: Array<Record<string, unknown>> = [];
const compoundEvidence: Array<Record<string, unknown>> = [];
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
        const telemetryApi = window as unknown as {
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
          __kpMeasureFractionRuleHandoff: (progress: number) => {
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
              wrapperTransform: string;
              clipPath: string;
              paintFingerprint: string;
              styleFingerprint: string;
              opacity: number;
              ruleGeometry: {
                axis: "horizontal" | "vertical";
                left: number;
                top: number;
                width: number;
                thickness: number;
              };
            }[];
          };
          __kpMeasureFractionCorrelatedHandoff: (progress: number) => {
            observations: readonly {
              id: string;
              side: "native-source" | "material" | "native-target";
              paintAtomId: string;
              semanticEntityId: string;
              paintKind: string;
              rect: {
                left: number;
                top: number;
                width: number;
                height: number;
              };
              baselineY: number | null;
              wrapperTransform: string;
              wrapperFingerprint: string;
              clipPath: string;
              paintFingerprint: string;
              styleFingerprint: string;
              opacity: number;
              ruleGeometry?: {
                axis: "horizontal" | "vertical";
                left: number;
                top: number;
                width: number;
                thickness: number;
              };
            }[];
          };
        };
        const glyphTelemetry =
          telemetryApi.__kpMeasureFractionGlyphHandoff(fractionProgress);
        const ruleTelemetry =
          telemetryApi.__kpMeasureFractionRuleHandoff(fractionProgress);
        const correlatedTelemetry =
          telemetryApi.__kpMeasureFractionCorrelatedHandoff(fractionProgress);
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
        const sourceRect = source.getBoundingClientRect();
        const targetRect = target.getBoundingClientRect();
        return {
          sourceOpacity: source.style.opacity,
          targetOpacity: target.style.opacity,
          sourceAnchorY: sourceRect.top + sourceRect.height / 2,
          targetAnchorY: targetRect.top + targetRect.height / 2,
          anchorResidualPx: Math.abs(
            sourceRect.top + sourceRect.height / 2 -
              (targetRect.top + targetRect.height / 2)
          ),
          materialOwnerCount: materialOwners.length,
          visibleMaterialOwnerCount: materialOwners.filter((owner) =>
            Number(owner.style.opacity) > 0
          ).length,
          glyphTelemetry: glyphTelemetry.observations.map((observation) => ({
            ...observation
          })),
          ruleTelemetry: ruleTelemetry.observations.map((observation) => ({
            ...observation
          })),
          correlatedTelemetry: correlatedTelemetry.observations.map(
            (observation) => ({
              ...observation
            })
          )
        };
      }, checkpoint.fractionProgressPermille / 1_000);
      const correlatedGroups = snapshot.correlatedTelemetry.reduce(
        (groups, observation) => {
          const id = observation.id.replace(/\.(source|material|native)$/, "");
          groups.set(id, [
            ...(groups.get(id) ?? []),
            observation
          ]);
          return groups;
        },
        new Map<string, typeof snapshot.correlatedTelemetry>()
      );
      if (
        correlatedGroups.size === 0 ||
        [...correlatedGroups.values()].some((observations) =>
          observations.length !== 3 ||
          !observations.some(({ side }) => side === "native-source") ||
          !observations.some(({ side }) => side === "material") ||
          !observations.some(({ side }) => side === "native-target") ||
          observations.some(({ wrapperTransform, wrapperFingerprint }) =>
            wrapperTransform.length === 0 || wrapperFingerprint.length === 0
          )
        )
      ) {
        throw new Error(
          `Incomplete correlated endpoint telemetry at ${checkpoint.id}.`
        );
      }
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
      if (snapshot.anchorResidualPx > 0.1) {
        throw new Error(
          `Fraction endpoints do not share one stable anchor at ${
            profile.id
          }: ${JSON.stringify(snapshot)}.`
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
  for (const profile of profiles) {
    for (const progress of splitCheckpoints) {
      const page = await browser.newPage({ viewport: profile.viewport });
      const url = new URL("/glyph-reconciliation-experiment.html", baseUrl);
      url.searchParams.set("fractionDirection", "split");
      url.searchParams.set("progress", String(progress));
      await page.goto(url.toString(), { waitUntil: "networkidle" });
      await page.evaluate(async () => document.fonts.ready);
      const review = page.locator(
        '[data-kp-glyph-review][data-kp-ready="true"]'
      );
      await review.waitFor();
      const card = page.locator(
        '[data-reconciliation-case="fraction-split"]'
      );
      const snapshot = await card.evaluate((element) => {
        const stage = element.querySelector<HTMLElement>(
          "[data-fraction-stage]"
        )!;
        const materialOwners = [
          ...element.querySelectorAll<HTMLElement>(
            "[data-kp-native-katex-scene-owner]"
          )
        ];
        return {
          semanticOwner: stage.dataset["kpFractionSemanticOwner"],
          visibleMaterialOwnerCount: materialOwners.filter((owner) =>
            Number(owner.style.opacity) > 0
          ).length,
          nativeTargetDenominatorCount: element.querySelectorAll(
            '[data-fraction-source] [data-kp-semantic-selector-id]'
          ).length
        };
      });
      const expectedSemanticOwner = progress === 0
        ? "source-native"
        : progress === 1000
          ? "target-native"
          : "stage-description";
      if (snapshot.semanticOwner !== expectedSemanticOwner) {
        throw new Error(
          `Expected split ${expectedSemanticOwner} at ${progress}, found ${
            snapshot.semanticOwner ?? "none"
          }.`
        );
      }
      if (
        snapshot.nativeTargetDenominatorCount !== 2 ||
        (progress === 500
          ? snapshot.visibleMaterialOwnerCount === 0
          : snapshot.visibleMaterialOwnerCount !== 0)
      ) {
        throw new Error(
          `Invalid split ownership at ${progress}: ${JSON.stringify(snapshot)}.`
        );
      }
      const file = path.join(
        outputRoot,
        `fraction-split-${profile.id}-${progress}.png`
      );
      await card.screenshot({ path: file });
      splitEvidence.push({
        profile: profile.id,
        progress,
        file: path.relative(process.cwd(), file),
        ...snapshot
      });
      await page.close();
    }
  }
  for (const profile of profiles) {
    for (const progress of radicalCheckpoints) {
      const page = await browser.newPage({ viewport: profile.viewport });
      const url = new URL("/glyph-reconciliation-experiment.html", baseUrl);
      url.searchParams.set("radicalInventory", "1");
      url.searchParams.set("progress", String(progress));
      await page.goto(url.toString(), { waitUntil: "networkidle" });
      await page.evaluate(async () => document.fonts.ready);
      const card = page.locator(
        '[data-radical-inventory][data-kp-radical-inventory-ready="true"]'
      );
      await card.waitFor();
      const snapshot = await card.evaluate((element) => {
        const stage = element.querySelector<HTMLElement>(
          "[data-radical-stage]"
        )!;
        const stageRect = stage.getBoundingClientRect();
        const owners = [...stage.querySelectorAll<HTMLElement>(
          "[data-kp-native-katex-scene-owner]"
        )];
        const visibleOwners = owners.filter((owner) =>
          Number(owner.style.opacity) > 0
        );
        const structuralViewport = visibleOwners.find((owner) =>
          owner.querySelector("svg path") !== null
        )?.querySelector("svg");
        const structuralRect = structuralViewport?.getBoundingClientRect();
        return {
          visualOwner: element.dataset["kpRadicalVisualOwner"],
          semanticOwner: stage.dataset["kpRadicalSemanticOwner"],
          sourceHidden: element.querySelector("[data-radical-source]")
            ?.getAttribute("aria-hidden"),
          targetHidden: element.querySelector("[data-radical-target]")
            ?.getAttribute("aria-hidden"),
          visibleOwnerCount: visibleOwners.length,
          materialOwnersInert: owners.every((owner) =>
            owner.hasAttribute("inert") &&
            owner.getAttribute("aria-hidden") === "true"
          ),
          structuralViewportContained:
            structuralViewport == null ||
            (
              structuralRect !== undefined &&
              structuralRect.left >= stageRect.left - 1 &&
              structuralRect.right <= stageRect.right + 1 &&
              structuralRect.top >= stageRect.top - 1 &&
              structuralRect.bottom <= stageRect.bottom + 1 &&
              getComputedStyle(structuralViewport).overflow === "hidden"
            ),
          overflow:
            document.documentElement.scrollWidth -
            document.documentElement.clientWidth
        };
      });
      const expectedOwner =
        progress === 0 ? "source-native" :
        progress === 1000 ? "target-native" :
        "material-scene";
      const expectedSemanticOwner =
        progress === 0 ? "source-native" :
        progress === 1000 ? "target-native" :
        "stage-description";
      if (
        snapshot.visualOwner !== expectedOwner ||
        snapshot.semanticOwner !== expectedSemanticOwner ||
        snapshot.materialOwnersInert !== true ||
        snapshot.structuralViewportContained !== true ||
        snapshot.overflow !== 0 ||
        (progress > 0 && progress < 1000
          ? snapshot.visibleOwnerCount === 0
          : snapshot.visibleOwnerCount !== 0)
      ) {
        throw new Error(
          `Invalid radical exemplar at ${profile.id}/${progress}: ${
            JSON.stringify(snapshot)
          }.`
        );
      }
      const file = path.join(
        outputRoot,
        `radical-succession-${profile.id}-${progress}.png`
      );
      await card.screenshot({ path: file });
      radicalEvidence.push({
        profile: profile.id,
        progress,
        file: path.relative(process.cwd(), file),
        ...snapshot
      });
      await page.close();
    }
  }
  for (const profile of profiles) {
    for (const progress of compoundCheckpoints) {
      const page = await browser.newPage({ viewport: profile.viewport });
      const url = new URL("/glyph-reconciliation-experiment.html", baseUrl);
      url.searchParams.set("compoundScene", "1");
      url.searchParams.set("compoundProgress", String(progress));
      await page.goto(url.toString(), { waitUntil: "networkidle" });
      await page.evaluate(async () => document.fonts.ready);
      const panel = page.locator(
        '[data-compound-trace][data-compound-scene-ready="true"]'
      );
      await panel.waitFor();
      const snapshot = await panel.evaluate((element) => {
        const stage = element.querySelector<HTMLElement>(
          "[data-compound-stage]"
        )!;
        const stageRect = stage.getBoundingClientRect();
        const owners = [...stage.querySelectorAll<HTMLElement>(
          "[data-kp-native-katex-scene-owner]"
        )];
        const visibleOwners = owners.filter((owner) =>
          Number(owner.style.opacity) > 0
        );
        return {
          sceneIndex: element.getAttribute("data-compound-scene-index"),
          localProgress: element.getAttribute(
            "data-compound-scene-local-progress"
          ),
          visualOwner: element.getAttribute(
            "data-compound-scene-visual-owner"
          ),
          operationId: element.getAttribute(
            "data-compound-scene-operation-id"
          ),
          visibleOwnerCount: visibleOwners.length,
          accessibleNativeStateCount: stage.querySelectorAll(
            '[data-compound-state-id]:not([aria-hidden="true"])'
          ).length,
          materialOwnersInert: owners.every((owner) =>
            owner.hasAttribute("inert") &&
            owner.getAttribute("aria-hidden") === "true"
          ),
          contained: visibleOwners.every((owner) => {
            const rect = owner.getBoundingClientRect();
            return rect.left >= stageRect.left - 1 &&
              rect.right <= stageRect.right + 1 &&
              rect.top >= stageRect.top - 1 &&
              rect.bottom <= stageRect.bottom + 1;
          }),
          overflow:
            document.documentElement.scrollWidth -
            document.documentElement.clientWidth
        };
      });
      const expectedOwner =
        progress === 0 ? "source-native" :
        progress === 1000 ? "target-native" :
        "material-scene";
      if (
        snapshot.visualOwner !== expectedOwner ||
        snapshot.materialOwnersInert !== true ||
        snapshot.contained !== true ||
        snapshot.overflow !== 0 ||
        (expectedOwner === "material-scene"
          ? snapshot.visibleOwnerCount === 0 ||
            snapshot.accessibleNativeStateCount !== 0
          : snapshot.visibleOwnerCount !== 0 ||
            snapshot.accessibleNativeStateCount !== 1)
      ) {
        throw new Error(
          `Invalid compound exemplar at ${profile.id}/${progress}: ${
            JSON.stringify(snapshot)
          }.`
        );
      }
      const file = path.join(
        outputRoot,
        `compound-scene-${profile.id}-${progress}.png`
      );
      await panel.screenshot({ path: file });
      compoundEvidence.push({
        profile: profile.id,
        progress,
        file: path.relative(process.cwd(), file),
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
      endpointEvidence,
      splitEvidence,
      radicalEvidence,
      compoundEvidence
    }, null, 2)}\n`
  );
  console.log(
    `Captured ${evidence.length} overview frames and ${
      endpointEvidence.length
    } dense endpoint frames, ${splitEvidence.length} inverse split frames, and ${
      radicalEvidence.length
    } radical succession frames, plus ${
      compoundEvidence.length
    } compound scene frames in ${
      path.relative(process.cwd(), outputRoot)
    }.`
  );
} finally {
  await browser.close();
}
