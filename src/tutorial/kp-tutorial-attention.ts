export interface KpTutorialAttentionRegion<
  RegionId extends string = string,
  PassageId extends string = string,
  MotionBlockId extends string = string
> {
  readonly id: RegionId;
  readonly passageId: PassageId;
  readonly motionBlockId?: MotionBlockId | undefined;
  readonly top: number;
  readonly bottom: number;
}

export interface KpTutorialAttentionRegionRegistration<
  RegionId extends string = string,
  PassageId extends string = string,
  MotionBlockId extends string = string
> {
  readonly id: RegionId;
  readonly passageId: PassageId;
  readonly motionBlockId?: MotionBlockId | undefined;
  readonly element: HTMLElement;
}

export interface KpTutorialAttentionFrame<
  RegionId extends string = string,
  PassageId extends string = string,
  MotionBlockId extends string = string
> {
  readonly cursorY: number;
  readonly state: "within-region" | "between-regions";
  readonly activeRegionId?: RegionId | undefined;
  readonly activePassageId?: PassageId | undefined;
  readonly activeMotionBlockId?: MotionBlockId | undefined;
  readonly nearestRegionDistance: number;
}

// CSS transforms and vh alignment can place the same edge on opposite sides
// of a subpixel rounding boundary in layout and animation frames.
const cursorContainmentEpsilonPx = 0.5;

/**
 * Resolves attention from physical containment, not prior state or semantic
 * preference. Every visual consumer can therefore share the invariant that
 * an active card actually intersects the reading cursor.
 */
export function projectKpTutorialAttentionFrame<
  RegionId extends string,
  PassageId extends string,
  MotionBlockId extends string
>(input: {
  readonly cursorY: number;
  readonly regions: readonly KpTutorialAttentionRegion<
    RegionId,
    PassageId,
    MotionBlockId
  >[];
}): KpTutorialAttentionFrame<RegionId, PassageId, MotionBlockId> {
  const cursorY = finite(input.cursorY, 0);
  const regions = input.regions
    .filter(({ top, bottom }) =>
      Number.isFinite(top) && Number.isFinite(bottom) && bottom >= top
    );
  const active = regions
    .filter(({ top, bottom }) =>
      cursorY >= top - cursorContainmentEpsilonPx &&
      cursorY <= bottom + cursorContainmentEpsilonPx
    )
    .sort((left, right) => {
      const span = (left.bottom - left.top) - (right.bottom - right.top);
      if (Math.abs(span) > Number.EPSILON) return span;
      return Math.abs(center(left) - cursorY) - Math.abs(center(right) - cursorY);
    })[0];
  const nearestRegionDistance = regions.reduce(
    (nearest, region) => Math.min(nearest, distanceToRegion(cursorY, region)),
    Number.POSITIVE_INFINITY
  );
  if (active === undefined) {
    return Object.freeze({
      cursorY,
      state: "between-regions",
      nearestRegionDistance
    });
  }
  return Object.freeze({
    cursorY,
    state: "within-region",
    activeRegionId: active.id,
    activePassageId: active.passageId,
    ...(active.motionBlockId === undefined
      ? {}
      : { activeMotionBlockId: active.motionBlockId }),
    nearestRegionDistance
  });
}

/** Reads layout once at the imperative boundary; projection remains pure. */
export function measureKpTutorialAttentionRegions<
  RegionId extends string,
  PassageId extends string,
  MotionBlockId extends string
>(
  registrations: readonly KpTutorialAttentionRegionRegistration<
    RegionId,
    PassageId,
    MotionBlockId
  >[]
): readonly KpTutorialAttentionRegion<RegionId, PassageId, MotionBlockId>[] {
  return Object.freeze(registrations.map((registration) => {
    const bounds = registration.element.getBoundingClientRect();
    return Object.freeze({
      id: registration.id,
      passageId: registration.passageId,
      ...(registration.motionBlockId === undefined
        ? {}
        : { motionBlockId: registration.motionBlockId }),
      top: bounds.top,
      bottom: bounds.bottom
    });
  }));
}

function distanceToRegion(
  cursorY: number,
  region: Pick<KpTutorialAttentionRegion, "top" | "bottom">
): number {
  if (cursorY < region.top) return region.top - cursorY;
  if (cursorY > region.bottom) return cursorY - region.bottom;
  return 0;
}

function center(region: Pick<KpTutorialAttentionRegion, "top" | "bottom">): number {
  return region.top + (region.bottom - region.top) / 2;
}

function finite(value: number, fallback: number): number {
  return Number.isFinite(value) ? value : fallback;
}
