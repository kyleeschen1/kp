import { compileGradient } from "../../math/expression.ts";
import { createPositiveQuadraticField, type PositiveQuadraticField } from "../kinetic-figure-surface-contour/quadratic-field.ts";

export interface GradientPoint { readonly x: number; readonly y: number }
export interface GradientContourSource {
  readonly schemaVersion: "kp.gradient-contour-source.v1";
  readonly a: number;
  readonly b: number;
  readonly point: GradientPoint;
}
export const gradientContourPrimary: GradientContourSource = Object.freeze({
  schemaVersion: "kp.gradient-contour-source.v1", a: 1, b: 2, point: Object.freeze({ x: 1, y: .5 })
});
const unitBrand = Symbol("gradient-unit-direction");
export interface GradientUnitDirection extends GradientPoint { readonly [unitBrand]: true }
export function gradientUnitDirection(x: number, y: number): GradientUnitDirection {
  const length = Math.hypot(x, y);
  if (!Number.isFinite(length) || length === 0) throw new RangeError("A direction requires a finite nonzero vector.");
  return Object.freeze({ x: x / length, y: y / length, [unitBrand]: true as const });
}
type GradientAtPoint =
  | { readonly kind: "stationary"; readonly gradient: GradientPoint; readonly magnitude: 0 }
  | { readonly kind: "regular"; readonly gradient: GradientPoint; readonly magnitude: number;
      readonly uphill: GradientUnitDirection; readonly tangent: GradientUnitDirection };
export interface GradientContourModel {
  readonly field: PositiveQuadraticField;
  readonly source: GradientContourSource;
  readonly latex: string;
  readonly level: number;
  readonly atPoint: GradientAtPoint;
  readonly height: (point: GradientPoint) => number;
  readonly derivative: (direction: GradientUnitDirection) => number;
}
export type GradientContourCheck =
  | { readonly status: "checked"; readonly model: GradientContourModel }
  | { readonly status: "repair"; readonly code: "unsupported-source" | "out-of-bounds"; readonly path: string; readonly expected: string };

/** The bounded source owns one field; notation and local derivatives are
 * compiled from the same expression, never independently authored answers. */
export function checkGradientContourSource(value: unknown): GradientContourCheck {
  const repair = (path: string, expected: string, code: "unsupported-source" | "out-of-bounds" = "unsupported-source"): GradientContourCheck =>
    ({ status: "repair", code, path, expected });
  if (!record(value) || Object.keys(value).sort().join(",") !== "a,b,point,schemaVersion" || value["schemaVersion"] !== "kp.gradient-contour-source.v1")
    return repair("$", "Use the bounded quadratic source with schemaVersion, a, b and point only.");
  const a = value["a"], b = value["b"], point = value["point"];
  if (!finite(a) || a < .25 || a > 4) return repair("$.a", "Use a finite positive coefficient from 0.25 to 4.", "out-of-bounds");
  if (!finite(b) || b < .25 || b > 4) return repair("$.b", "Use a finite positive coefficient from 0.25 to 4.", "out-of-bounds");
  if (!record(point) || Object.keys(point).sort().join(",") !== "x,y") return repair("$.point", "Provide x and y only.");
  const x = point["x"], y = point["y"];
  if (!finite(x) || Math.abs(x) > 1.5) return repair("$.point.x", "Use a finite coordinate between -1.5 and 1.5.", "out-of-bounds");
  if (!finite(y) || Math.abs(y) > 1.5) return repair("$.point.y", "Use a finite coordinate between -1.5 and 1.5.", "out-of-bounds");
  const source: GradientContourSource = Object.freeze({ schemaVersion: "kp.gradient-contour-source.v1", a, b, point: Object.freeze({ x, y }) });
  const field = createPositiveQuadraticField(a, b);
  const derivatives = compileGradient(field.expression, ["x", "y"]);
  const height = (p: GradientPoint) => {
    if (!finite(p.x) || !finite(p.y)) throw new RangeError("Sample coordinates must be finite.");
    const result = field.height(p.x, p.y);
    if (!Number.isFinite(result)) throw new RangeError("Sample height must be finite.");
    return result;
  };
  const gradient = Object.freeze({ x: derivatives[0]!({ x, y }), y: derivatives[1]!({ x, y }) });
  const magnitude = Math.hypot(gradient.x, gradient.y);
  const atPoint: GradientAtPoint = magnitude === 0
    ? Object.freeze({ kind: "stationary", gradient, magnitude: 0 })
    : Object.freeze({ kind: "regular", gradient, magnitude, uphill: gradientUnitDirection(gradient.x, gradient.y), tangent: gradientUnitDirection(-gradient.y, gradient.x) });
  return { status: "checked", model: Object.freeze({ source, field, latex: field.latex, level: height(source.point), atPoint, height,
    derivative(direction: GradientUnitDirection) {
      if (direction[unitBrand] !== true || !Number.isFinite(direction.x) || !Number.isFinite(direction.y) || Math.abs(Math.hypot(direction.x, direction.y) - 1) > 1e-12)
        throw new TypeError("Compare normalized directions from gradientUnitDirection.");
      return gradient.x * direction.x + gradient.y * direction.y;
    } }) };
}

export function createGradientContourModel(source: GradientContourSource = gradientContourPrimary): GradientContourModel {
  const result = checkGradientContourSource(source);
  if (result.status === "repair") throw new TypeError(`${result.path}: ${result.expected}`);
  return result.model;
}

export function gradientContourPoint(model: GradientContourModel, angle: number): GradientPoint {
  if (!Number.isFinite(angle)) throw new RangeError("Contour angle must be finite.");
  return Object.freeze({ x: Math.sqrt(model.level / model.source.a) * Math.cos(angle), y: Math.sqrt(model.level / model.source.b) * Math.sin(angle) });
}

export function gradientStraightStep(model: GradientContourModel, direction: GradientUnitDirection, distance: number) {
  if (!Number.isFinite(distance)) throw new RangeError("Step distance must be finite.");
  const slope = model.derivative(direction);
  const point = Object.freeze({ x: model.source.point.x + direction.x * distance, y: model.source.point.y + direction.y * distance });
  return Object.freeze({ point, slope, firstOrderChange: slope * distance, actualChange: model.height(point) - model.level });
}

/** The tangent plane is a first-order model, not the finite-step surface.
 * Keeping its evaluator distinct prevents an illustration from changing truth. */
export function gradientLocalHeight(model: GradientContourModel, point: GradientPoint): number {
  if (!finite(point.x) || !finite(point.y)) throw new RangeError("Local coordinates must be finite.");
  const p = model.source.point, g = model.atPoint.gradient;
  const height = model.level + g.x * (point.x - p.x) + g.y * (point.y - p.y);
  if (!finite(height)) throw new RangeError("Local height must be finite.");
  return height;
}

export function gradientDirectionComponents(model: GradientContourModel, direction: GradientUnitDirection) {
  const totalRise = model.derivative(direction), at = model.atPoint;
  if (at.kind === "stationary") return Object.freeze({ kind: "stationary" as const, totalRise });
  // Unit-vector dot products can leave signed roundoff at exact orthogonality.
  // Canonicalize only machine-scale zeros, before geometry and labels diverge.
  const component = (value: number) => Math.abs(value) <= Number.EPSILON * 8 ? 0 : value;
  const across = component(direction.x * at.uphill.x + direction.y * at.uphill.y);
  const along = component(direction.x * at.tangent.x + direction.y * at.tangent.y);
  const acrossVector = Object.freeze({ x: across * at.uphill.x, y: across * at.uphill.y });
  const alongVector = Object.freeze({ x: along * at.tangent.x, y: along * at.tangent.y });
  return Object.freeze({ kind: "regular" as const, across, along, acrossVector, alongVector,
    acrossRise: across * at.magnitude, alongRise: 0, totalRise });
}
function record(value: unknown): value is Record<string, unknown> { return !!value && typeof value === "object" && !Array.isArray(value); }
function finite(value: unknown): value is number { return typeof value === "number" && Number.isFinite(value); }
