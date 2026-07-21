import { expect, test, type Locator, type Page } from "@playwright/test";

import { createLinearSolveAnimationAsset } from "../src/animation/linear-solve-adapter.ts";
import {
  createKpEquationCrossSurfaceFrame,
  type KpEquationCrossSurfaceFrame,
  type KpEquationSurfaceFragmentInput,
  type KpEquationSurfaceKind
} from "../src/rendering/equation-cross-surface-frame.ts";
import { kpEquationPresentationProfile } from "../src/rendering/equation-presentation-policy.ts";

const animation = createLinearSolveAnimationAsset();
const presentation = kpEquationPresentationProfile(animation);

test("canonical editor and reader expose comparable continuity frames", async ({ page }) => {
  const editorCancellation = await captureEditorFrame(page, 0.5);
  const editorFinal = await captureEditorFrame(page, 1);
  const readerCancellation = await captureReaderFrame(page, 0.5);
  const readerFinal = await captureReaderFrame(page, 1);

  expect(readerCancellation.presentation).toEqual(editorCancellation.presentation);
  expect(readerCancellation.transitionId).toBe(editorCancellation.transitionId);
  expect(readerFinal.transitionId).toBe(editorFinal.transitionId);
  expect(roles(readerCancellation)).toEqual(roles(editorCancellation));
  expect(roles(readerFinal)).toEqual(roles(editorFinal));
  expect(roles(readerFinal)).toEqual(["equals", "lhs.x", "rhs.4"]);
  expect(horizontalRoles(readerFinal)).toEqual(["lhs.x", "equals", "rhs.4"]);
  expect(horizontalRoles(editorFinal)).toEqual(["lhs.x", "equals", "rhs.4"]);

  for (const frame of [
    editorCancellation,
    editorFinal,
    readerCancellation,
    readerFinal
  ]) {
    expect(frame.fragments.length).toBeGreaterThan(0);
    expect(frame.fragments.every((fragment) => fragment.fontFamily?.includes("KaTeX")))
      .toBe(true);
  }

  const typeScaleRatio = medianFontSize(readerFinal) / medianFontSize(editorFinal);
  expect(typeScaleRatio).toBeGreaterThan(0.99);
  expect(typeScaleRatio).toBeLessThan(1.01);
});

async function captureEditorFrame(
  page: Page,
  progress: number
): Promise<KpEquationCrossSurfaceFrame> {
  await page.goto("/?animation=editor-animation.animation.linear-solve.solve-x");
  const player = page.locator("[data-kp-editor-animation-player]");
  await expect(player).toHaveAttribute("data-kp-editor-animation-id", animation.id);
  await expect(player).toHaveAttribute("data-kp-editor-animation-hydrated", "true");
  await page.evaluate(() => document.fonts.ready);
  await player.locator('[data-action="seek-editor-animation"]').fill(String(progress));
  await expect(player).toHaveAttribute(
    "data-kp-editor-animation-progress",
    String(progress)
  );
  await settle(page);
  const transition = player.locator("[data-kp-editor-equation-transition-id]");
  await expect(transition).toHaveAttribute(
    "data-kp-editor-equation-transition-id",
    progress === 1
      ? "transform.linear-solve.simplify-right-difference"
      : "transform.linear-solve.cancel-left-additive-inverse"
  );
  await expect(transition).toHaveAttribute(
    "data-kp-editor-equation-presentation-recipe",
    presentation.recipe
  );
  await expect(transition).toHaveAttribute(
    "data-kp-editor-equation-witnessed-annihilation-active",
    "false"
  );
  await expect(transition).toHaveAttribute(
    "data-kp-editor-equation-successor-synthesis-active",
    "false"
  );
  return captureSurfaceFrame({
    surface: "editor",
    animationId: animation.id,
    transitionId: await requiredAttribute(transition, "data-kp-editor-equation-transition-id"),
    presentation,
    progress,
    viewport: player.locator("[data-kp-editor-equation-stage]"),
    materialSelector: "[data-kp-equation-material-owner-id]",
    nativeSelector: "[data-kp-motion-id]"
  });
}

async function captureReaderFrame(
  page: Page,
  progress: number
): Promise<KpEquationCrossSurfaceFrame> {
  const progressPermille = Math.round(progress * 1_000);
  await page.goto(
    `/reader/solve-x/?kpLesson=lesson.solve-x.x-plus-3&kpVersion=1&kpProgress=${progressPermille}`
  );
  await expect(page.locator("body")).toHaveAttribute(
    "data-kp-reader-progress",
    String(progressPermille)
  );
  await page.evaluate(() => document.fonts.ready);
  await settle(page);
  const stage = page.locator("[data-kp-reader-equation-stage]");
  await expect(stage).toHaveAttribute(
    "data-kp-reader-equation-presentation-recipe",
    presentation.recipe
  );
  await expect(stage).toHaveAttribute(
    "data-kp-reader-equation-handoff-recipe",
    presentation.handoff
  );
  await expect(stage).toHaveAttribute(
    "data-kp-reader-equation-cancellation-recipe",
    presentation.cancellation
  );
  await expect(stage).toHaveAttribute(
    "data-kp-reader-equation-zero-witness-recipe",
    presentation.zeroWitness
  );
  await expect(stage).toHaveAttribute(
    "data-kp-reader-equation-successor-recipe",
    presentation.successor
  );
  await expect(stage).toHaveAttribute(
    "data-kp-reader-equation-depth-recipe",
    presentation.depth
  );
  return captureSurfaceFrame({
    surface: "reader",
    animationId: animation.id,
    transitionId: await requiredAttribute(page.locator("body"), "data-kp-reader-transition"),
    presentation,
    progress,
    viewport: page.locator("[data-kp-reader-equation-viewport]"),
    materialSelector: "[data-kp-reader-equation-material-fragment-id]",
    nativeSelector:
      '[data-kp-reader-transition-active="true"] [data-kp-reader-equation-anchor-id]'
  });
}

async function captureSurfaceFrame(input: {
  readonly surface: KpEquationSurfaceKind;
  readonly animationId: string;
  readonly transitionId: string;
  readonly presentation: typeof presentation;
  readonly progress: number;
  readonly viewport: Locator;
  readonly materialSelector: string;
  readonly nativeSelector: string;
}): Promise<KpEquationCrossSurfaceFrame> {
  const evidence = await input.viewport.evaluate((viewport, selectors) => {
    const viewportBounds = rect(viewport.getBoundingClientRect());
    const material = [...viewport.querySelectorAll<HTMLElement>(selectors.materialSelector)]
      .filter(visible);
    const candidates = material.length > 0
      ? material
      : [...viewport.querySelectorAll<HTMLElement>(selectors.nativeSelector)].filter(visible);
    const fragments = candidates.map((element, index) => {
      const readerFragmentId = element.dataset["kpReaderEquationMaterialFragmentId"];
      const readerAnchorId = element.dataset["kpReaderEquationAnchorId"];
      const editorOwnerId = element.dataset["kpEquationMaterialOwnerId"];
      const editorMotionId = element.dataset["kpMotionId"];
      const readerOwnerId = element.closest<HTMLElement>(
        "[data-kp-reader-equation-material-owner-id]"
      )?.dataset["kpReaderEquationMaterialOwnerId"];
      const semanticId = element.dataset["kpEquationMaterialSourceMotionId"]
        ?? editorMotionId
        ?? readerFragmentId?.replace(/^anchor\./, "")
        ?? readerAnchorId?.replace(/^anchor\./, "");
      if (semanticId === undefined) throw new Error("Parity fragment lacks semantic identity.");
      const glyph = element.querySelector<HTMLElement>(
        ".mathnormal, .mord, .mbin, .mrel"
      ) ?? element;
      const glyphStyle = getComputedStyle(glyph);
      return {
        fragmentId: `${selectors.surface}.${editorOwnerId ?? readerFragmentId ??
          editorMotionId ?? readerAnchorId ?? index}`,
        semanticId,
        representation: material.length > 0 ? "material" : "native",
        bounds: rect(element.getBoundingClientRect()),
        opacity: effectiveOpacity(element, viewport),
        ...(editorOwnerId === undefined && readerOwnerId === undefined
          ? {}
          : { ownerId: editorOwnerId ?? readerOwnerId }),
        fontFamily: glyphStyle.fontFamily,
        fontSizePx: Number.parseFloat(glyphStyle.fontSize)
      };
    });
    return { viewportBounds, fragments };

    function visible(element: HTMLElement): boolean {
      const bounds = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      return style.display !== "none" && style.visibility !== "hidden" &&
        effectiveOpacity(element, viewport) > 0.001 && bounds.width > 0 && bounds.height > 0;
    }

    function effectiveOpacity(element: HTMLElement, boundary: Element): number {
      let opacity = 1;
      let current: HTMLElement | null = element;
      while (current !== null) {
        opacity *= Number.parseFloat(getComputedStyle(current).opacity);
        if (current === boundary) break;
        current = current.parentElement;
      }
      return Math.max(0, Math.min(1, opacity));
    }

    function rect(bounds: DOMRect): { left: number; top: number; width: number; height: number } {
      return { left: bounds.left, top: bounds.top, width: bounds.width, height: bounds.height };
    }
  }, {
    surface: input.surface,
    materialSelector: input.materialSelector,
    nativeSelector: input.nativeSelector
  }) as {
    viewportBounds: { left: number; top: number; width: number; height: number };
    fragments: KpEquationSurfaceFragmentInput[];
  };
  return createKpEquationCrossSurfaceFrame({
    ...input,
    viewportBounds: evidence.viewportBounds,
    fragments: evidence.fragments
  });
}

function roles(frame: KpEquationCrossSurfaceFrame): string[] {
  return [...new Set(frame.fragments.map((fragment) => semanticRole(fragment.semanticId)))]
    .sort();
}

function horizontalRoles(frame: KpEquationCrossSurfaceFrame): string[] {
  return frame.fragments
    .map((fragment) => ({
      role: semanticRole(fragment.semanticId),
      center: fragment.normalizedBounds.left + fragment.normalizedBounds.width / 2
    }))
    .sort((left, right) => left.center - right.center)
    .map(({ role }) => role);
}

function semanticRole(semanticId: string): string {
  const roles = [
    "lhs.plus3",
    "lhs.minus3",
    "lhs.x",
    "rhs.minus3",
    "rhs.minus",
    "rhs.7",
    "rhs.3",
    "rhs.4",
    "equals"
  ];
  const role = roles.find((candidate) => semanticId.endsWith(`.${candidate}`));
  if (role === undefined) throw new Error(`Unknown canonical semantic role ${semanticId}.`);
  return role;
}

function medianFontSize(frame: KpEquationCrossSurfaceFrame): number {
  const sizes = frame.fragments
    .map(({ fontSizePx }) => fontSizePx)
    .filter((size): size is number => size !== undefined)
    .sort((left, right) => left - right);
  const result = sizes[Math.floor(sizes.length / 2)];
  if (result === undefined) throw new Error("Parity frame has no typography evidence.");
  return result;
}

async function requiredAttribute(locator: Locator, name: string): Promise<string> {
  const value = await locator.getAttribute(name);
  if (value === null || value === "") throw new Error(`Missing required ${name}.`);
  return value;
}

async function settle(page: Page): Promise<void> {
  await page.evaluate(() => new Promise<void>((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  }));
}
