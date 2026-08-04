import type { KpLispResponsiveGeometry } from
  "./lisp-s-expression-responsive-geometry.ts";
import {
  defineKpLispInternalTuning,
  type KpLispInternalTuningProjection
} from "./lisp-s-expression-timing.ts";
import type { KpLispSemanticModel } from
  "../semantic/lisp-semantic-model.ts";

export interface KpLispBindingPoint {
  readonly xEm: number;
  readonly yEm: number;
}

export interface KpLispBindingCubicSegment {
  readonly start: KpLispBindingPoint;
  readonly control1: KpLispBindingPoint;
  readonly control2: KpLispBindingPoint;
  readonly end: KpLispBindingPoint;
}

export interface KpLispLambdaBindingGeometry {
  readonly id: "binding-geometry.lisp.lambda-application";
  readonly bindingId: string;
  readonly environmentId: string;
  readonly destinationIds: readonly string[];
  readonly argumentMaterialId: string;
  readonly boxes: readonly {
    readonly materialId: string;
    readonly role: "parameter" | "occurrence";
    readonly strength: "strong" | "light";
    readonly colorToken: "--kp-lisp-binding-color";
    readonly rect: {
      readonly xEm: number;
      readonly yEm: number;
      readonly widthEm: number;
      readonly heightEm: number;
    };
  }[];
  readonly transfer: {
    readonly id: "transfer.argument-to-parameter";
    readonly route: "wide-arch" | "phone-clearance-arch";
    readonly segments: readonly KpLispBindingCubicSegment[];
    readonly transientWake: true;
    readonly startMaterialId: string;
    readonly endMaterialId: string;
  };
}

export function planKpLispLambdaBindingGeometry(
  semantic: KpLispSemanticModel,
  geometry: KpLispResponsiveGeometry,
  tuning: KpLispInternalTuningProjection = defineKpLispInternalTuning()
): KpLispLambdaBindingGeometry {
  const binding = semantic.bindings[0];
  const environment = semantic.environments.find(({ entries }) =>
    entries.some(({ bindingId }) => bindingId === binding?.id));
  const entry = environment?.entries.find(({ bindingId }) =>
    bindingId === binding?.id);
  if (binding === undefined || environment === undefined || entry === undefined) {
    throw new Error("Certified lambda binding route is incomplete.");
  }
  const destinations = semantic.destinations.filter(({ referenceOccurrenceId }) =>
    binding.referenceOccurrenceIds.includes(referenceOccurrenceId));
  if (destinations.length !== binding.referenceOccurrenceIds.length) {
    throw new Error("Every certified binding occurrence needs a destination.");
  }
  const argument = tokenRect(geometry, entry.valueExpressionId);
  const parameter = tokenRect(geometry, binding.binderOccurrenceId);
  const occurrenceRects = binding.referenceOccurrenceIds.map((id) => ({
    id,
    rect: tokenRect(geometry, id)
  }));
  const start = point(
    argument.rect.xEm + argument.rect.widthEm / 2,
    argument.rect.yEm
  );
  const end = point(
    parameter.rect.xEm + parameter.rect.widthEm / 2,
    parameter.rect.yEm
  );
  const route = geometry.mode === "wide" ? "wide-arch" : "phone-clearance-arch";
  const segments = route === "wide-arch"
    ? wideArch(start, end, tuning.values.archHeight)
    : phoneArch(start, end, geometry.stage, tuning.values.archHeight);

  return Object.freeze({
    id: "binding-geometry.lisp.lambda-application",
    bindingId: binding.id,
    environmentId: environment.id,
    destinationIds: Object.freeze(destinations.map(({ id }) => id)),
    argumentMaterialId: entry.valueExpressionId,
    boxes: Object.freeze([
      box(binding.binderOccurrenceId, "parameter", "strong", parameter.rect, 0.18),
      ...occurrenceRects.map(({ id, rect }) =>
        box(id, "occurrence", "light", rect.rect, 0.12))
    ]),
    transfer: Object.freeze({
      id: "transfer.argument-to-parameter",
      route,
      segments: Object.freeze(segments),
      transientWake: true,
      startMaterialId: entry.valueExpressionId,
      endMaterialId: binding.binderOccurrenceId
    })
  });
}

function tokenRect(
  geometry: KpLispResponsiveGeometry,
  materialId: string
): KpLispResponsiveGeometry["tokens"][number] {
  const token = geometry.tokens.find((candidate) =>
    candidate.materialId === materialId);
  if (token === undefined) {
    throw new Error(`Binding material ${materialId} has no responsive geometry.`);
  }
  return token;
}

function box(
  materialId: string,
  role: "parameter" | "occurrence",
  strength: "strong" | "light",
  value: KpLispResponsiveGeometry["tokens"][number]["rect"],
  padding: number
): KpLispLambdaBindingGeometry["boxes"][number] {
  return Object.freeze({
    materialId,
    role,
    strength,
    colorToken: "--kp-lisp-binding-color",
    rect: Object.freeze({
      xEm: round(value.xEm - padding),
      yEm: round(value.yEm - padding),
      widthEm: round(value.widthEm + padding * 2),
      heightEm: round(value.heightEm + padding * 2)
    })
  });
}

function wideArch(
  start: KpLispBindingPoint,
  end: KpLispBindingPoint,
  archHeight: number
): readonly KpLispBindingCubicSegment[] {
  const span = Math.abs(start.xEm - end.xEm);
  const apexY = Math.max(0.8, Math.min(start.yEm, end.yEm) - span * archHeight);
  return [segment(
    start,
    point(start.xEm, apexY),
    point(end.xEm, apexY),
    end
  )];
}

function phoneArch(
  start: KpLispBindingPoint,
  end: KpLispBindingPoint,
  stage: KpLispResponsiveGeometry["stage"],
  archHeight: number
): readonly KpLispBindingCubicSegment[] {
  const corridorX = Math.max(0.8, stage.xEm + 1.25);
  const apexY = Math.max(0.8, end.yEm - archHeight * 5);
  const corridor = point(corridorX, start.yEm);
  return [
    segment(
      start,
      point(start.xEm - (start.xEm - corridorX) * 0.35, start.yEm),
      point(corridorX, start.yEm),
      corridor
    ),
    segment(
      corridor,
      point(corridorX, apexY),
      point(end.xEm, apexY),
      end
    )
  ];
}

function segment(
  start: KpLispBindingPoint,
  control1: KpLispBindingPoint,
  control2: KpLispBindingPoint,
  end: KpLispBindingPoint
): KpLispBindingCubicSegment {
  return Object.freeze({ start, control1, control2, end });
}

function point(xEm: number, yEm: number): KpLispBindingPoint {
  return Object.freeze({ xEm: round(xEm), yEm: round(yEm) });
}

function round(value: number): number {
  return Math.round(value * 1e6) / 1e6;
}
