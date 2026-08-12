import type {
  KpSchemeParameterBoundEvent,
  KpSchemeSymbolResolvedEvent,
  KpSchemeTrace
} from "../semantic/scheme-factorial-trace.ts";

export interface KpSchemeBindingArc {
  readonly id: string;
  readonly callIndex: number;
  readonly eventId: string;
  readonly argumentExpressionId: string;
  readonly parameterOccurrenceId: string;
  readonly argumentValueId: string;
  readonly bindingId: string;
  readonly calleeEnvironmentId: string;
  readonly route: "arch";
  readonly controlPoints: readonly {
    readonly inline: number;
    readonly block: number;
  }[];
}

export interface KpSchemeProvenanceEcho {
  readonly id: string;
  readonly callIndex: number;
  readonly eventId: string;
  readonly bindingId: string;
  readonly valueId: string;
  readonly sourceOccurrenceId: string;
  readonly destinationOccurrenceId: string;
}

export interface KpSchemeBindingChoreography {
  readonly schemaVersion: "kp.scheme-factorial-binding-choreography.v1";
  readonly arcs: readonly KpSchemeBindingArc[];
  readonly echoes: readonly KpSchemeProvenanceEcho[];
}

export interface KpSchemeBindingSample {
  readonly progress: number;
  readonly arcProgress: number;
  readonly absorptionProgress: number;
  readonly cellProgress: number;
  readonly echoProgress: number;
  readonly sourceScale: number;
  readonly sourceOpacity: number;
  readonly parameterCellOpacity: number;
  readonly echoOpacity: number;
}

export function compileKpSchemeFactorialBindingChoreography(
  trace: KpSchemeTrace
): KpSchemeBindingChoreography {
  const bound = trace.events.filter((event): event is KpSchemeParameterBoundEvent =>
    event.kind === "parameter-bound");
  const arcs = bound.map((event, callIndex) => Object.freeze({
    id: `scheme-factorial.binding-arc.${callIndex}`,
    callIndex,
    eventId: event.id,
    argumentExpressionId: event.argumentExpressionId,
    parameterOccurrenceId: event.parameterOccurrenceId,
    argumentValueId: event.argumentValueId,
    bindingId: event.bindingId,
    calleeEnvironmentId: event.calleeEnvironmentId,
    route: "arch" as const,
    controlPoints: Object.freeze([
      Object.freeze({ inline: 0, block: 0 }),
      Object.freeze({ inline: 0.34, block: -0.6 }),
      Object.freeze({ inline: 0.68, block: -0.6 }),
      Object.freeze({ inline: 1, block: 0 })
    ])
  }));
  const bindingByEnvironment = new Map(bound.map((event, index) =>
    [event.calleeEnvironmentId, { event, index }] as const));
  const echoes = trace.events.flatMap((event) => {
    if (event.kind !== "symbol-resolved") return [];
    const call = bindingByEnvironment.get(event.environmentId);
    if (call === undefined || event.bindingId !== call.event.bindingId) return [];
    return [echo(event, call.event, call.index)];
  });
  return Object.freeze({
    schemaVersion: "kp.scheme-factorial-binding-choreography.v1",
    arcs: Object.freeze(arcs),
    echoes: Object.freeze(echoes)
  });
}

export function sampleKpSchemeBindingMotion(progress: number):
  KpSchemeBindingSample {
  const normalized = clamp(progress);
  const arcProgress = interval(normalized, 0, 0.48);
  const absorptionProgress = interval(normalized, 0.4, 0.62);
  const cellProgress = interval(normalized, 0.48, 0.7);
  const echoProgress = interval(normalized, 0.68, 1);
  return Object.freeze({
    progress: normalized,
    arcProgress,
    absorptionProgress,
    cellProgress,
    echoProgress,
    sourceScale: round(1 - absorptionProgress),
    sourceOpacity: round(1 - absorptionProgress),
    parameterCellOpacity: cellProgress,
    echoOpacity: echoProgress
  });
}

export function pointOnKpSchemeBindingArc(
  arc: KpSchemeBindingArc,
  progress: number
): { readonly inline: number; readonly block: number } {
  const value = clamp(progress);
  const [start, first, second, end] = arc.controlPoints;
  if (start === undefined || first === undefined || second === undefined ||
      end === undefined) {
    throw new Error(`Binding arc ${arc.id} requires four control points.`);
  }
  const inverse = 1 - value;
  return Object.freeze({
    inline: round(inverse ** 3 * start.inline +
      3 * inverse ** 2 * value * first.inline +
      3 * inverse * value ** 2 * second.inline + value ** 3 * end.inline),
    block: round(inverse ** 3 * start.block +
      3 * inverse ** 2 * value * first.block +
      3 * inverse * value ** 2 * second.block + value ** 3 * end.block)
  });
}

function echo(
  event: KpSchemeSymbolResolvedEvent,
  binding: KpSchemeParameterBoundEvent,
  callIndex: number
): KpSchemeProvenanceEcho {
  return Object.freeze({
    id: `scheme-factorial.provenance-echo.${callIndex}.${event.index}`,
    callIndex,
    eventId: event.id,
    bindingId: event.bindingId,
    valueId: event.valueId,
    sourceOccurrenceId: binding.parameterOccurrenceId,
    destinationOccurrenceId: event.occurrenceId
  });
}

function interval(value: number, start: number, end: number): number {
  return round(Math.max(0, Math.min(1, (value - start) / (end - start))));
}

function clamp(value: number): number {
  if (!Number.isFinite(value)) {
    throw new Error("Scheme binding progress must be finite.");
  }
  return Math.max(0, Math.min(1, value));
}

function round(value: number): number {
  return Math.round(value * 1e6) / 1e6;
}
