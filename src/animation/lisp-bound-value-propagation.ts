import type { KpLispLambdaBindingGeometry } from
  "./lisp-lambda-binding-geometry.ts";
import type { KpLispLambdaApplicationFixture } from
  "../semantic/lisp-lambda-application-fixture.ts";
import { collectKpLispExpressions } from
  "../semantic/lisp-semantic-model.ts";

export interface KpLispBoundValuePropagationPlan {
  readonly id: "propagation.lisp.lambda-application";
  readonly bindingId: string;
  readonly value: {
    readonly sourceMaterialId: string;
    readonly nativeCode: string;
    readonly exactInteger: number;
  };
  readonly transferPathId: KpLispLambdaBindingGeometry["transfer"]["id"];
  readonly parameterMaterialId: string;
  readonly destinations: readonly {
    readonly destinationId: string;
    readonly referenceMaterialId: string;
    readonly derivedMaterialId: string;
    readonly order: number;
    readonly nativeCode: string;
    readonly originIds: readonly string[];
    readonly interval: { readonly start: number; readonly end: number };
  }[];
  readonly intervals: {
    readonly transfer: { readonly start: 0; readonly end: 0.42 };
    readonly absorb: { readonly start: 0.42; readonly end: 0.58 };
    readonly propagate: { readonly start: 0.58; readonly end: 0.86 };
    readonly settle: { readonly start: 0.86; readonly end: 1 };
  };
}

export interface KpLispBoundValuePropagationSample {
  readonly phase: "transfer" | "absorb" | "propagate" | "settle";
  readonly source: {
    readonly location: "path" | "parameter" | "consumed";
    readonly pathProgress: number;
    readonly scale: number;
    readonly opacity: number;
  };
  readonly wakeOpacity: number;
  readonly parameterBoxActive: boolean;
  readonly occurrenceBoxesActive: boolean;
  readonly destinations: readonly {
    readonly destinationId: string;
    readonly referenceMaterialId: string;
    readonly derivedMaterialId: string;
    readonly nativeCode: string;
    readonly valueOpacity: number;
    readonly valueScale: number;
    readonly referenceOpacity: number;
  }[];
}

const intervals = Object.freeze({
  transfer: Object.freeze({ start: 0 as const, end: 0.42 as const }),
  absorb: Object.freeze({ start: 0.42 as const, end: 0.58 as const }),
  propagate: Object.freeze({ start: 0.58 as const, end: 0.86 as const }),
  settle: Object.freeze({ start: 0.86 as const, end: 1 as const })
});

export function compileKpLispBoundValuePropagation(
  fixture: KpLispLambdaApplicationFixture,
  geometry: KpLispLambdaBindingGeometry
): KpLispBoundValuePropagationPlan {
  const { semantic, evaluation } = fixture;
  const binding = semantic.bindings.find(({ id }) => id === evaluation.bindingId);
  const environment = semantic.environments.find(({ id }) =>
    id === evaluation.environmentId);
  const entry = environment?.entries.find(({ bindingId }) =>
    bindingId === binding?.id);
  const argument = collectKpLispExpressions(semantic.root).find(({ id }) =>
    id === entry?.valueExpressionId);
  const value = semantic.values.find(({ sourceExpressionId }) =>
    sourceExpressionId === argument?.id);
  if (binding === undefined || entry === undefined || argument?.kind !== "atom" ||
      value === undefined || geometry.bindingId !== binding.id ||
      geometry.argumentMaterialId !== argument.id ||
      geometry.transfer.endMaterialId !== binding.binderOccurrenceId) {
    throw new Error("Certified bound-value propagation route is inconsistent.");
  }
  const derivedByReference = new Map(evaluation.occurrences.flatMap((derived) =>
    binding.referenceOccurrenceIds.filter((referenceId) =>
      derived.originExpressionIds.includes(referenceId)).map((referenceId) =>
        [referenceId, derived] as const)
  ));
  const ordered = semantic.destinations.filter(({ referenceOccurrenceId }) =>
    binding.referenceOccurrenceIds.includes(referenceOccurrenceId))
    .sort((left, right) => left.childIndex - right.childIndex);
  if (ordered.length === 0 || ordered.some(({ referenceOccurrenceId }) =>
    !geometry.destinationIds.includes(
      semantic.destinations.find(({ referenceOccurrenceId: id }) =>
        id === referenceOccurrenceId)!.id
    ) || !derivedByReference.has(referenceOccurrenceId))) {
    throw new Error("Certified propagation destination or derived value is missing.");
  }
  const width = (intervals.propagate.end - intervals.propagate.start) /
    (ordered.length + Math.max(0, ordered.length - 1) * 0.35);
  const stagger = width * 1.35;
  const destinations = ordered.map((destination, index) => {
    const derived = derivedByReference.get(destination.referenceOccurrenceId)!;
    const start = intervals.propagate.start + index * stagger;
    return Object.freeze({
      destinationId: destination.id,
      referenceMaterialId: destination.referenceOccurrenceId,
      derivedMaterialId: derived.id,
      order: index,
      nativeCode: derived.lexeme,
      originIds: Object.freeze([...derived.originExpressionIds]),
      interval: Object.freeze({
        start: round(start),
        end: round(Math.min(intervals.propagate.end, start + width))
      })
    });
  });
  return Object.freeze({
    id: "propagation.lisp.lambda-application",
    bindingId: binding.id,
    value: Object.freeze({
      sourceMaterialId: argument.id,
      nativeCode: argument.lexeme,
      exactInteger: value.exactInteger
    }),
    transferPathId: geometry.transfer.id,
    parameterMaterialId: binding.binderOccurrenceId,
    destinations: Object.freeze(destinations),
    intervals
  });
}

export function sampleKpLispBoundValuePropagation(
  plan: KpLispBoundValuePropagationPlan,
  progress: number
): KpLispBoundValuePropagationSample {
  const p = stableUnit(progress);
  const transferProgress = intervalProgress(intervals.transfer, p);
  const absorbProgress = intervalProgress(intervals.absorb, p);
  const phase = p < intervals.transfer.end
    ? "transfer"
    : p < intervals.absorb.end
      ? "absorb"
      : p < intervals.propagate.end
        ? "propagate"
        : "settle";
  const source = phase === "transfer"
    ? sourcePose("path", smoothstep(transferProgress), 1, 1)
    : phase === "absorb"
      ? sourcePose(
        "parameter",
        1,
        stableUnit(1 - smoothstep(absorbProgress)),
        stableUnit(1 - smoothstep(absorbProgress))
      )
      : sourcePose("consumed", 1, 0, 0);
  return Object.freeze({
    phase,
    source,
    wakeOpacity: phase === "transfer"
      ? round(Math.sin(Math.PI * transferProgress) * 0.72)
      : 0,
    parameterBoxActive: phase === "transfer" || phase === "absorb",
    occurrenceBoxesActive: phase === "propagate",
    destinations: Object.freeze(plan.destinations.map((destination) => {
      const local = smoothstep(intervalProgress(destination.interval, p));
      return Object.freeze({
        destinationId: destination.destinationId,
        referenceMaterialId: destination.referenceMaterialId,
        derivedMaterialId: destination.derivedMaterialId,
        nativeCode: destination.nativeCode,
        valueOpacity: local,
        valueScale: round(0.4 + local * 0.6),
        referenceOpacity: stableUnit(1 - local)
      });
    }))
  });
}

function sourcePose(
  location: KpLispBoundValuePropagationSample["source"]["location"],
  pathProgress: number,
  scale: number,
  opacity: number
) {
  return Object.freeze({ location, pathProgress, scale, opacity });
}

function intervalProgress(
  interval: { readonly start: number; readonly end: number },
  progress: number
): number {
  return stableUnit((progress - interval.start) / (interval.end - interval.start));
}

function smoothstep(value: number): number {
  return stableUnit(value * value * (3 - 2 * value));
}

function stableUnit(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return round(Math.max(0, Math.min(1, value)));
}

function round(value: number): number {
  return Math.round(value * 1e9) / 1e9;
}
