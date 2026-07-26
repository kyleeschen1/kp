import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { chromium } from "playwright";

import {
  kpFractionEndpointCheckpoints
} from "./glyph-reconciliation-endpoint-checkpoints.ts";
import {
  compareKpNativeKatexTypographyHandoffModels
} from "../src/rendering/native-katex-scene-compositor.ts";
import type {
  KpNativeKatexHandoffTelemetry
} from "../src/rendering/native-katex-rendered-scene.ts";

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
const typographyTransitCheckpoints = [
  0,
  250,
  500,
  750,
  959,
  960,
  961,
  999,
  1_000
] as const;

await mkdir(outputRoot, { recursive: true });
const browser = await chromium.launch({ headless: true });
const evidence: Array<Record<string, unknown>> = [];
const endpointEvidence: Array<Record<string, unknown>> = [];
const splitEvidence: Array<Record<string, unknown>> = [];
const radicalEvidence: Array<Record<string, unknown>> = [];
const compoundEvidence: Array<Record<string, unknown>> = [];
const checkpointEvidence: Array<{
  profile: typeof profiles[number]["id"];
  motion: "normal" | "reduced";
  old: string;
  corrected: string;
  nativeTarget: string;
}> = [];
const typographyTransitEvidence: Array<{
  profile: typeof profiles[number]["id"];
  progressPermille: number;
  file: string;
}> = [];
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
      const handoffComparison = compareKpNativeKatexTypographyHandoffModels({
        telemetry: {
          kind: "native-katex-handoff-telemetry",
          lifecycle: "renderer-session",
          stage: {} as HTMLElement,
          progress: checkpoint.fractionProgressPermille / 1_000,
          observations: snapshot.correlatedTelemetry as unknown as
            KpNativeKatexHandoffTelemetry["observations"],
          fontRevision: 1,
          viewportKey: profile.id
        },
        tolerancePx: 0.1,
        maximumTranslationPx: 2,
        maximumScaleRatio: 1.1
      });
      if (handoffComparison.selectedModel !== "target-style-reverse-flip") {
        throw new Error(
          `Dense endpoint ${checkpoint.id} requires ${
            handoffComparison.selectedModel
          }: ${JSON.stringify(handoffComparison.law.unsupportedIds)}.`
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
        handoffComparison,
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
  const materialEndpoint = kpFractionEndpointCheckpoints.find(
    ({ fractionProgressPermille }) => fractionProgressPermille === 999
  )!;
  const nativeEndpoint = kpFractionEndpointCheckpoints.find(
    ({ fractionProgressPermille }) => fractionProgressPermille === 1_000
  )!;
  for (const profile of profiles) {
    for (const motion of ["normal", "reduced"] as const) {
      const page = await browser.newPage({
        viewport: profile.viewport,
        reducedMotion: motion === "reduced" ? "reduce" : "no-preference"
      });
      const url = new URL("/glyph-reconciliation-experiment.html", baseUrl);
      url.searchParams.set(
        "progress",
        String(materialEndpoint.routeProgressPermille)
      );
      await page.goto(url.toString(), { waitUntil: "networkidle" });
      await page.evaluate(async () => document.fonts.ready);
      await page.locator(
        '[data-kp-glyph-review][data-kp-ready="true"]'
      ).waitFor();
      const card = page.locator(
        '[data-reconciliation-case="fraction-merge"]'
      );
      const correctedFile = path.join(
        outputRoot,
        `checkpoint-${profile.id}-${motion}-corrected-999.png`
      );
      await card.screenshot({ path: correctedFile });

      // The raw playback is the retained pre-correction handoff path.
      await page.evaluate((progress) => {
        const api = window as unknown as {
          __kpApplyFractionSceneFrame: (progress: number) => unknown;
        };
        api.__kpApplyFractionSceneFrame(progress);
      }, materialEndpoint.fractionProgressPermille / 1_000);
      const oldFile = path.join(
        outputRoot,
        `checkpoint-${profile.id}-${motion}-old-999.png`
      );
      await card.screenshot({ path: oldFile });

      url.searchParams.set(
        "progress",
        String(nativeEndpoint.routeProgressPermille)
      );
      await page.goto(url.toString(), { waitUntil: "networkidle" });
      await page.evaluate(async () => document.fonts.ready);
      await page.locator(
        '[data-kp-glyph-review][data-kp-ready="true"]'
      ).waitFor();
      const nativeFile = path.join(
        outputRoot,
        `checkpoint-${profile.id}-${motion}-native-target.png`
      );
      await page.locator(
        '[data-reconciliation-case="fraction-merge"]'
      ).screenshot({ path: nativeFile });
      checkpointEvidence.push({
        profile: profile.id,
        motion,
        old: path.relative(process.cwd(), oldFile),
        corrected: path.relative(process.cwd(), correctedFile),
        nativeTarget: path.relative(process.cwd(), nativeFile)
      });
      await page.close();
    }
  }
  for (const profile of profiles) {
    const page = await browser.newPage({ viewport: profile.viewport });
    await page.goto(
      new URL("/glyph-reconciliation-experiment.html?progress=0", baseUrl)
        .toString(),
      { waitUntil: "networkidle" }
    );
    await page.evaluate(async () => document.fonts.ready);
    await page.locator(
      '[data-kp-glyph-review][data-kp-ready="true"]'
    ).waitFor();
    for (const progressPermille of typographyTransitCheckpoints) {
      await page.evaluate((progress) => {
        const api = window as unknown as {
          __kpRealizeFractionTypographyHandoff: (
            progress: number
          ) => unknown;
        };
        api.__kpRealizeFractionTypographyHandoff(progress);
      }, progressPermille / 1_000);
      const file = path.join(
        outputRoot,
        `typography-transit-${profile.id}-${progressPermille}.png`
      );
      await page.locator("[data-fraction-stage]").screenshot({ path: file });
      typographyTransitEvidence.push({
        profile: profile.id,
        progressPermille,
        file: path.relative(process.cwd(), file)
      });
    }
    await page.close();
  }

  const checkpointRows = await Promise.all(checkpointEvidence.map(
    async (entry) => {
      const files = [
        ["Old raw handoff · 99.9%", entry.old],
        ["Corrected handoff · 99.9%", entry.corrected],
        ["Exact native target · 100%", entry.nativeTarget]
      ] as const;
      return {
        ...entry,
        images: await Promise.all(files.map(async ([label, file]) => ({
          label,
          source: `data:image/png;base64,${
            (await readFile(path.resolve(file))).toString("base64")
          }`
        })))
      };
    }
  ));
  const typographyTransitRows = await Promise.all(profiles.map(
    async (profile) => ({
      profile: profile.id,
      images: await Promise.all(typographyTransitEvidence.filter((entry) =>
        entry.profile === profile.id
      ).map(async (entry) => ({
        label: `${entry.progressPermille / 10}%`,
        source: `data:image/png;base64,${
          (await readFile(path.resolve(entry.file))).toString("base64")
        }`
      })))
    })
  ));
  const contactPage = await browser.newPage({
    viewport: { width: 1600, height: 1000 }
  });
  await contactPage.setContent(`<!doctype html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          * { box-sizing: border-box; }
          body {
            margin: 0;
            padding: 32px;
            background: #eef1f4;
            color: #17212b;
            font: 15px/1.45 system-ui, sans-serif;
          }
          h1 { margin: 0 0 8px; font-size: 28px; }
          .lede { margin: 0 0 28px; color: #52606d; }
          section { margin: 0 0 30px; }
          h2 { margin: 0 0 10px; font-size: 18px; }
          .row {
            display: grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 14px;
          }
          .transit-row {
            display: grid;
            grid-template-columns: repeat(9, minmax(0, 1fr));
            gap: 8px;
          }
          figure {
            margin: 0;
            overflow: hidden;
            border: 1px solid #c7ced6;
            border-radius: 10px;
            background: white;
            box-shadow: 0 3px 12px rgb(23 33 43 / 8%);
          }
          figcaption {
            padding: 9px 12px;
            border-bottom: 1px solid #d9dee4;
            font-weight: 700;
          }
          img {
            display: block;
            width: 100%;
            height: 250px;
            object-fit: contain;
            object-position: top center;
            background: white;
          }
          .transit-row figcaption {
            padding: 7px 8px;
            font-size: 13px;
          }
          .transit-row img { height: 150px; }
        </style>
      </head>
      <body>
        <h1>Fraction typography handoff checkpoint</h1>
        <p class="lede">
          (x/2 + y/2) → (x+y)/2 · raw handoff versus generic target-style
          reverse FLIP versus exact native ownership
        </p>
        ${checkpointRows.map((row) => `
          <section>
            <h2>${row.profile} · ${row.motion} motion</h2>
            <div class="row">
              ${row.images.map(({ label, source }) => `
                <figure>
                  <figcaption>${label}</figcaption>
                  <img src="${source}" alt="">
                </figure>
              `).join("")}
            </div>
          </section>
        `).join("")}
        <h1>Whole-transit glyph size succession</h1>
        <p class="lede">
          Target paint remains stable through every interior frame. The final
          three dense samples bracket the former 96% substitution boundary.
        </p>
        ${typographyTransitRows.map((row) => `
          <section>
            <h2>${row.profile}</h2>
            <div class="transit-row">
              ${row.images.map(({ label, source }) => `
                <figure>
                  <figcaption>${label}</figcaption>
                  <img src="${source}" alt="">
                </figure>
              `).join("")}
            </div>
          </section>
        `).join("")}
      </body>
    </html>`, { waitUntil: "load" });
  await contactPage.evaluate(async () => {
    await Promise.all([...document.images].map((image) =>
      image.complete
        ? Promise.resolve()
        : new Promise<void>((resolve, reject) => {
          image.addEventListener("load", () => resolve(), { once: true });
          image.addEventListener("error", () => reject(), { once: true });
        })
    ));
  });
  const checkpointContactSheet = path.join(
    outputRoot,
    "fraction-typography-checkpoint-contact-sheet.png"
  );
  await contactPage.screenshot({
    path: checkpointContactSheet,
    fullPage: true
  });
  await contactPage.close();
  await writeFile(
    path.join(outputRoot, "fraction-typography-checkpoint.json"),
    `${JSON.stringify({
      generatedAt: new Date().toISOString(),
      contactSheet: path.relative(process.cwd(), checkpointContactSheet),
      rows: checkpointEvidence,
      typographyTransit: typographyTransitEvidence
    }, null, 2)}\n`
  );
  await writeFile(
    path.join(outputRoot, "evidence.json"),
    `${JSON.stringify({
      generatedAt: new Date().toISOString(),
      evidence,
      endpointEvidence,
      splitEvidence,
      radicalEvidence,
      compoundEvidence,
      checkpointEvidence,
      typographyTransitEvidence
    }, null, 2)}\n`
  );
  console.log(
    `Captured ${evidence.length} overview frames and ${
      endpointEvidence.length
    } dense endpoint frames, ${splitEvidence.length} inverse split frames, and ${
      radicalEvidence.length
    } radical succession frames, plus ${
      compoundEvidence.length
    } compound scene frames and one ${
      checkpointEvidence.length
    }-row fraction checkpoint with ${
      typographyTransitEvidence.length
    } whole-transit frames in ${
      path.relative(process.cwd(), outputRoot)
    }.`
  );
} finally {
  await browser.close();
}
