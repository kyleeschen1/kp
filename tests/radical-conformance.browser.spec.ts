import { expect, test } from "@playwright/test";

import {
  evaluateKpRadicalConformance,
  kpNormativeRadicalConformanceBaseline,
  type KpRadicalConformanceObservation
} from "../src/animation/radical-conformance.ts";

test("normative radical transition satisfies explicit visual continuity laws", async ({
  page
}) => {
  await page.goto("/");
  await page.locator('[data-action="set-editor-animation"]').selectOption(
    "editor-animation.sample.animation.radical-rewrite.square-root-as-power"
  );
  const player = page.locator("[data-kp-editor-animation-player]");
  const scrubber = player.locator('[data-action="seek-editor-animation"]');
  const stage = player.locator("[data-kp-editor-equation-stage]");
  const transition = stage.locator("[data-kp-editor-equation-transition-id]");

  await expect(player).toHaveAttribute(
    "data-kp-editor-animation-id",
    kpNormativeRadicalConformanceBaseline.animationId
  );
  await scrubber.fill("0.55");
  const grouping = await transition.evaluate((element) => {
    const sourceTokens = Array.from(element.querySelectorAll<HTMLElement>(
      '[data-kp-editor-equation-source] [data-kp-motion-id*=".power.exponent-"]'
    ));
    const targetTokens = Array.from(element.querySelectorAll<HTMLElement>(
      '[data-kp-editor-equation-target] [data-kp-motion-id*=".radical.radical-"]'
    ));
    const centers = sourceTokens.map((token) => {
      const rect = token.getBoundingClientRect();
      return `${Math.round(rect.left * 10) / 10},${Math.round(rect.top * 10) / 10}`;
    });
    return {
      sourceFragmentCount: sourceTokens.length,
      distinctSourceSlotCount: new Set(centers).size,
      targetFragmentCount: targetTokens.length,
      targetsVisibleBeforeReadiness: targetTokens.filter(
        (token) => Number(getComputedStyle(token).opacity) > 0.001
      ).length
    };
  });

  await scrubber.fill("0.67");
  const transfer = await transition.evaluate((element) => {
    const sourceTokens = Array.from(element.querySelectorAll<HTMLElement>(
      '[data-kp-editor-equation-source] [data-kp-motion-id*=".power.exponent-"]'
    ));
    const targetTokens = Array.from(element.querySelectorAll<HTMLElement>(
      '[data-kp-editor-equation-target] [data-kp-motion-id*=".radical.radical-"]'
    ));
    const scaleOf = (token: HTMLElement) => {
      const transform = getComputedStyle(token).transform;
      return transform === "none" ? 1 : new DOMMatrixReadOnly(transform).a;
    };
    const layerTransforms = [
      element.querySelector<HTMLElement>("[data-kp-editor-equation-source]")!,
      element.querySelector<HTMLElement>("[data-kp-editor-equation-target]")!
    ].map((layer) => getComputedStyle(layer).transform);
    return {
      sourcePathFamilies: sourceTokens.map(
        (token) => token.dataset["kpEquationMotionPathVariant"] ?? "missing"
      ),
      targetPathFamilies: targetTokens.map(
        (token) => token.dataset["kpEquationMotionPathVariant"] ?? "missing"
      ),
      minimumTokenScale: Math.min(
        ...[...sourceTokens, ...targetTokens].map(scaleOf)
      ),
      wholeStructureTransforms: layerTransforms
    };
  });
  const maximumStageOverflowPx = await stage.evaluate((element) => {
    const stageRect = element.getBoundingClientRect();
    const visible = Array.from(element.querySelectorAll<HTMLElement>(
      "[data-kp-motion-id], [data-kp-equation-material-owner-id]"
    )).filter((token) => Number(getComputedStyle(token).opacity) > 0.001);
    return visible.reduce((maximum, token) => {
      const rect = token.getBoundingClientRect();
      return Math.max(
        maximum,
        stageRect.left - rect.left,
        rect.right - stageRect.right,
        stageRect.top - rect.top,
        rect.bottom - stageRect.bottom,
        0
      );
    }, 0);
  });
  const typography = await stage.evaluate((element) => {
    const material = element.querySelector<HTMLElement>(
      '[data-kp-equation-material-owner-id="radical-rewrite.root-notation.hook"]'
    )!;
    const native = element.querySelector<HTMLElement>(
      '[data-kp-radical-native-visual="true"]'
    )!;
    const materialVisual = material.querySelector<HTMLElement>(
      ".editor-equation-stage__material-visual"
    )!;
    const materialStyle = getComputedStyle(materialVisual);
    const nativeStyle = getComputedStyle(native);
    return {
      materialFontFamily: materialStyle.fontFamily,
      nativeFontFamily: nativeStyle.fontFamily,
      materialFontSizePx: Number.parseFloat(materialStyle.fontSize),
      nativeFontSizePx: Number.parseFloat(nativeStyle.fontSize)
    };
  });

  const readOwnerPoses = () => stage.evaluate((element) =>
    Object.fromEntries(Array.from(element.querySelectorAll<HTMLElement>(
      "[data-kp-equation-material-owner-id]"
    )).map((owner) => {
      const rect = owner.getBoundingClientRect();
      return [owner.dataset["kpEquationMaterialOwnerId"]!, {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
        opacity: Number(getComputedStyle(owner).opacity)
      }];
    }))
  );
  await scrubber.fill("0.65");
  const forward = await readOwnerPoses();
  await player.getByRole("button", { name: "Rewind animation" }).click();
  await scrubber.fill("0.35");
  const rewind = await readOwnerPoses();
  const commonOwnerIds = Object.keys(forward).filter((id) => rewind[id] !== undefined);
  const maximumReversePositionDeltaPx = Math.max(0, ...commonOwnerIds.map((id) =>
    Math.hypot(
      rewind[id]!.x - forward[id]!.x,
      rewind[id]!.y - forward[id]!.y
    )
  ));
  const maximumReverseOpacityDelta = Math.max(0, ...commonOwnerIds.map((id) =>
    Math.abs(rewind[id]!.opacity - forward[id]!.opacity)
  ));

  await player.getByRole("button", { name: "Reset animation" }).click();
  await scrubber.fill("0.98");
  const settlement = await stage.evaluate((element) => ({
    nativeGeometryReady:
      element.dataset["kpEditorEquationNativeSettlementReady"] === "true",
    nativeSettlementProgress: Number(
      element.dataset["kpEditorEquationNativeSettlementProgress"] ?? 0
    ),
    maximumNativeResidualPx: Number(
      element.dataset["kpEditorEquationNativeSettlementResidual"] ?? Infinity
    ),
    remainingMaterialFragmentCount: element.querySelectorAll(
      '[data-kp-equation-material-fragment-role^="radical-"]'
    ).length
  }));

  const observation: KpRadicalConformanceObservation = {
    ...grouping,
    ...transfer,
    maximumStageOverflowPx,
    ...typography,
    maximumReversePositionDeltaPx,
    maximumReverseOpacityDelta,
    ...settlement
  };
  expect(evaluateKpRadicalConformance({ observation })).toEqual([]);
});
