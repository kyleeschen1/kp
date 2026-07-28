import type {
  KpEquationStageMeasurementIdentity
} from "./equation-stage-layout.ts";

declare const kpReaderCompositorGeometryCacheKeyBrand: unique symbol;

export interface KpReaderCompositorGeometryCacheIdentity {
  readonly [kpReaderCompositorGeometryCacheKeyBrand]:
    "KpReaderCompositorGeometryCacheIdentity";
  readonly key: string;
}

export interface KpReaderCompositorGeometryCacheIdentityInput {
  readonly transitionId: string;
  readonly renderPlanId: string;
  readonly materialPlanId: string;
  readonly fontRevision: number;
  readonly measurementIdentity: KpEquationStageMeasurementIdentity;
  readonly layoutApplicationId: string;
  readonly viewportWidthPx: number;
  readonly viewportHeightPx: number;
  readonly devicePixelRatio: number;
  readonly motionMode: "continuous" | "essential" | "checkpoint";
  readonly presentationGeometryRevision: string;
}

export function createKpReaderCompositorGeometryCacheIdentity(
  input: KpReaderCompositorGeometryCacheIdentityInput
): KpReaderCompositorGeometryCacheIdentity {
  const textFields = [
    input.transitionId,
    input.renderPlanId,
    input.materialPlanId,
    input.measurementIdentity.coordinateSpaceId,
    input.layoutApplicationId,
    input.presentationGeometryRevision
  ];
  if (textFields.some((value) => value.trim() === "")) {
    throw new Error(
      "Reader compositor geometry cache identity requires non-empty authority ids."
    );
  }
  if (
    !Number.isSafeInteger(input.fontRevision) ||
    input.fontRevision < 0 ||
    !Number.isSafeInteger(input.measurementIdentity.revision) ||
    input.measurementIdentity.revision < 0
  ) {
    throw new Error(
      "Reader compositor geometry cache identity requires non-negative font and measurement revisions."
    );
  }
  for (const [label, value] of [
    ["viewport width", input.viewportWidthPx],
    ["viewport height", input.viewportHeightPx],
    ["device pixel ratio", input.devicePixelRatio]
  ] as const) {
    if (!Number.isFinite(value) || value <= 0) {
      throw new Error(
        `Reader compositor geometry cache identity requires a positive ${label}.`
      );
    }
  }

  // Keep the key total and positional: adding a geometry authority requires a
  // factory signature change and therefore forces every cache caller to decide
  // how that authority participates in invalidation.
  const key = JSON.stringify([
    input.transitionId,
    input.renderPlanId,
    input.materialPlanId,
    input.fontRevision,
    input.measurementIdentity.coordinateSpaceId,
    input.measurementIdentity.revision,
    input.layoutApplicationId,
    input.viewportWidthPx,
    input.viewportHeightPx,
    input.devicePixelRatio,
    input.motionMode,
    input.presentationGeometryRevision
  ]);
  return Object.freeze({ key }) as KpReaderCompositorGeometryCacheIdentity;
}
