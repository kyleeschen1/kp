import type { KpEquationMaterialOwnerHandoff } from "./equation-material-owner.ts";
import type { KpEquationVisualRect } from "./equation-visual-frame.ts";

export type KpEquationNativeEndpoint = "source" | "target";
export type KpEquationNativeEndpointFailureCode =
  | "non-exact-endpoint"
  | "native-authority"
  | "counterpart-release"
  | "material-release"
  | "missing-geometry"
  | "geometry-discontinuity";

export interface KpEquationNativeEndpointLawFailure {
  readonly code: KpEquationNativeEndpointFailureCode;
  readonly message: string;
}

export interface KpEquationNativeEndpointLawResult {
  readonly ownerId: string;
  readonly endpoint: KpEquationNativeEndpoint;
  readonly passed: boolean;
  readonly authorityTotal: number;
  readonly maximumGeometryResidualPx?: number | undefined;
  readonly failures: readonly KpEquationNativeEndpointLawFailure[];
}

export function checkKpEquationNativeEndpointLaw(input: {
  readonly endpoint: KpEquationNativeEndpoint;
  readonly nativePresent: boolean;
  readonly handoff: KpEquationMaterialOwnerHandoff;
  readonly nativeBounds?: KpEquationVisualRect | undefined;
  readonly materialBounds?: KpEquationVisualRect | undefined;
  readonly geometryTolerancePx?: number | undefined;
  readonly opacityTolerance?: number | undefined;
}): KpEquationNativeEndpointLawResult {
  const geometryTolerancePx = input.geometryTolerancePx ?? 0.5;
  const opacityTolerance = input.opacityTolerance ?? 0.000_001;
  if (!Number.isFinite(geometryTolerancePx) || geometryTolerancePx < 0) {
    throw new Error("Native endpoint geometry tolerance must be finite and non-negative.");
  }
  if (!Number.isFinite(opacityTolerance) || opacityTolerance < 0 || opacityTolerance > 1) {
    throw new Error("Native endpoint opacity tolerance must be within [0, 1].");
  }
  const failures: KpEquationNativeEndpointLawFailure[] = [];
  const expectedProgress = input.endpoint === "source" ? 0 : 1;
  if (Math.abs(input.handoff.progress - expectedProgress) > opacityTolerance) {
    failures.push({
      code: "non-exact-endpoint",
      message: `${input.handoff.ownerId} was sampled at ${input.handoff.progress}, not ${expectedProgress}.`
    });
  }
  const nativeOpacity = input.endpoint === "source"
    ? input.handoff.sourceNativeOpacity
    : input.handoff.targetNativeOpacity;
  const counterpartOpacity = input.endpoint === "source"
    ? input.handoff.targetNativeOpacity
    : input.handoff.sourceNativeOpacity;
  const expectedNativeOpacity = input.nativePresent ? 1 : 0;
  if (Math.abs(nativeOpacity - expectedNativeOpacity) > opacityTolerance) {
    failures.push({
      code: "native-authority",
      message: `${input.handoff.ownerId} native endpoint authority is ${nativeOpacity}, expected ${expectedNativeOpacity}.`
    });
  }
  if (counterpartOpacity > opacityTolerance) {
    failures.push({
      code: "counterpart-release",
      message: `${input.handoff.ownerId} retains opposite native authority ${counterpartOpacity}.`
    });
  }
  if (input.handoff.materialOpacity > opacityTolerance) {
    failures.push({
      code: "material-release",
      message: `${input.handoff.ownerId} retains material authority ${input.handoff.materialOpacity}.`
    });
  }

  let maximumGeometryResidualPx: number | undefined;
  if (input.nativePresent) {
    if (input.nativeBounds === undefined || input.materialBounds === undefined) {
      failures.push({
        code: "missing-geometry",
        message: `${input.handoff.ownerId} requires both native and material endpoint geometry.`
      });
    } else {
      maximumGeometryResidualPx = rectResidual(input.nativeBounds, input.materialBounds);
      if (maximumGeometryResidualPx > geometryTolerancePx) {
        failures.push({
          code: "geometry-discontinuity",
          message: `${input.handoff.ownerId} endpoint residual ${maximumGeometryResidualPx}px exceeds ${geometryTolerancePx}px.`
        });
      }
    }
  }
  return Object.freeze({
    ownerId: input.handoff.ownerId,
    endpoint: input.endpoint,
    passed: failures.length === 0,
    authorityTotal:
      input.handoff.sourceNativeOpacity +
      input.handoff.materialOpacity +
      input.handoff.targetNativeOpacity,
    ...(maximumGeometryResidualPx === undefined ? {} : { maximumGeometryResidualPx }),
    failures: Object.freeze(failures)
  });
}

function rectResidual(
  nativeBounds: KpEquationVisualRect,
  materialBounds: KpEquationVisualRect
): number {
  for (const [label, rect] of [["native", nativeBounds], ["material", materialBounds]] as const) {
    if (
      ![rect.left, rect.top, rect.width, rect.height].every(Number.isFinite) ||
      rect.width <= 0 || rect.height <= 0
    ) throw new Error(`Native endpoint ${label} bounds are invalid.`);
  }
  return Math.max(
    Math.abs(nativeBounds.left - materialBounds.left),
    Math.abs(nativeBounds.top - materialBounds.top),
    Math.abs(
      nativeBounds.left + nativeBounds.width -
      (materialBounds.left + materialBounds.width)
    ),
    Math.abs(
      nativeBounds.top + nativeBounds.height -
      (materialBounds.top + materialBounds.height)
    )
  );
}
