import type { KpEquationPresentationProfile } from "../animation/equation-presentation-policy.ts";
import type { KpEquationVisualRect } from "./equation-visual-frame.ts";

export type KpEquationSurfaceKind = "editor" | "reader";
export type KpEquationSurfaceRepresentation = "native" | "material" | "witness";

export interface KpEquationSurfaceFragmentInput {
  readonly fragmentId: string;
  readonly semanticId: string;
  readonly representation: KpEquationSurfaceRepresentation;
  readonly bounds: KpEquationVisualRect;
  readonly opacity: number;
  readonly ownerId?: string | undefined;
  readonly fontFamily?: string | undefined;
  readonly fontSizePx?: number | undefined;
}

export interface KpEquationCrossSurfaceFragment {
  readonly fragmentId: string;
  readonly semanticId: string;
  readonly representation: KpEquationSurfaceRepresentation;
  readonly ownerId?: string | undefined;
  readonly boundsPx: KpEquationVisualRect;
  readonly normalizedBounds: KpEquationVisualRect;
  readonly opacity: number;
  readonly fontFamily?: string | undefined;
  readonly fontSizePx?: number | undefined;
}

export interface KpEquationCrossSurfaceFrame {
  readonly schemaVersion: 1;
  readonly surface: KpEquationSurfaceKind;
  readonly animationId: string;
  readonly transitionId: string;
  readonly presentation: KpEquationPresentationProfile;
  readonly progress: number;
  readonly viewport: {
    readonly widthPx: number;
    readonly heightPx: number;
  };
  readonly fragments: readonly KpEquationCrossSurfaceFragment[];
}

export function createKpEquationCrossSurfaceFrame(input: {
  readonly surface: KpEquationSurfaceKind;
  readonly animationId: string;
  readonly transitionId: string;
  readonly presentation: KpEquationPresentationProfile;
  readonly progress: number;
  readonly viewportBounds: KpEquationVisualRect;
  readonly fragments: readonly KpEquationSurfaceFragmentInput[];
}): KpEquationCrossSurfaceFrame {
  assertIdentity(input.animationId, "animation");
  assertIdentity(input.transitionId, "transition");
  assertUnit(input.progress, "progress");
  assertRect(input.viewportBounds, "viewport");
  const fragmentIds = new Set<string>();
  const fragments = input.fragments.map((fragment) => {
    assertIdentity(fragment.fragmentId, "fragment");
    assertIdentity(fragment.semanticId, `fragment ${fragment.fragmentId} semantic`);
    if (fragmentIds.has(fragment.fragmentId)) {
      throw new Error(`Equation cross-surface frame repeats fragment ${fragment.fragmentId}.`);
    }
    fragmentIds.add(fragment.fragmentId);
    assertRect(fragment.bounds, `fragment ${fragment.fragmentId}`);
    assertUnit(fragment.opacity, `fragment ${fragment.fragmentId} opacity`);
    if (fragment.fontSizePx !== undefined && (
      !Number.isFinite(fragment.fontSizePx) || fragment.fontSizePx <= 0
    )) {
      throw new Error(`Equation cross-surface fragment ${fragment.fragmentId} has invalid type.`);
    }
    const boundsPx = relativeBounds(fragment.bounds, input.viewportBounds);
    return Object.freeze({
      fragmentId: fragment.fragmentId,
      semanticId: fragment.semanticId,
      representation: fragment.representation,
      ...(fragment.ownerId === undefined ? {} : { ownerId: fragment.ownerId }),
      boundsPx: Object.freeze(boundsPx),
      normalizedBounds: Object.freeze({
        left: boundsPx.left / input.viewportBounds.width,
        top: boundsPx.top / input.viewportBounds.height,
        width: boundsPx.width / input.viewportBounds.width,
        height: boundsPx.height / input.viewportBounds.height
      }),
      opacity: fragment.opacity,
      ...(fragment.fontFamily === undefined ? {} : { fontFamily: fragment.fontFamily }),
      ...(fragment.fontSizePx === undefined ? {} : { fontSizePx: fragment.fontSizePx })
    });
  });

  // Geometry is normalized only at this boundary so editor and reader retain
  // native layout internally while parity checks compare one stable space.
  return Object.freeze({
    schemaVersion: 1,
    surface: input.surface,
    animationId: input.animationId,
    transitionId: input.transitionId,
    presentation: input.presentation,
    progress: input.progress,
    viewport: Object.freeze({
      widthPx: input.viewportBounds.width,
      heightPx: input.viewportBounds.height
    }),
    fragments: Object.freeze(fragments)
  });
}

function relativeBounds(
  bounds: KpEquationVisualRect,
  viewport: KpEquationVisualRect
): KpEquationVisualRect {
  return {
    left: bounds.left - viewport.left,
    top: bounds.top - viewport.top,
    width: bounds.width,
    height: bounds.height
  };
}

function assertRect(rect: KpEquationVisualRect, label: string): void {
  if (
    ![rect.left, rect.top, rect.width, rect.height].every(Number.isFinite) ||
    rect.width <= 0 || rect.height <= 0
  ) throw new Error(`Equation cross-surface ${label} bounds are invalid.`);
}

function assertIdentity(value: string, label: string): void {
  if (value.trim() === "") {
    throw new Error(`Equation cross-surface ${label} id must not be empty.`);
  }
}

function assertUnit(value: number, label: string): void {
  if (!Number.isFinite(value) || value < 0 || value > 1) {
    throw new Error(`Equation cross-surface ${label} must be within [0, 1].`);
  }
}
