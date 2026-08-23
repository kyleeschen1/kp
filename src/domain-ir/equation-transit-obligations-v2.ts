import type { SelectorCorrespondenceRelationId } from "../semantic/correspondence.ts";
import {
  isKpCompiledEquationGrammarV2,
  type KpCompiledEquationGrammarV2
} from "./equation-grammar-v2.ts";
import {
  isKpResolvedEquationProjectionChoreographiesV2,
  type KpResolvedEquationProjectionChoreographiesV2,
  type KpResolvedEquationProjectionChoreographyV2
} from "./equation-projection-choreography-v2.ts";

export const kpEquationTransitObligationsV2SchemaVersion =
  "kp.equation-transit-obligations.v2" as const;

export interface KpEquationTransitBoundaryIntentV2 {
  readonly id: string;
  readonly kind: "preserve-readable-semantic-boundary";
  readonly boundaryEntityIds: readonly string[];
  readonly crossingRecordIds: readonly string[];
}

export interface KpEquationTargetArrivalIntentV2 {
  readonly id: string;
  readonly kind: "join-semantic-target-cohort";
  readonly recordIds: readonly string[];
  readonly targetEntityIds: readonly string[];
  readonly connectorEntityIds: readonly string[];
}

export interface KpEquationTransitionTransitIntentV2 {
  readonly transitionId: string;
  readonly boundaries: readonly KpEquationTransitBoundaryIntentV2[];
  readonly arrivals: readonly KpEquationTargetArrivalIntentV2[];
}

export interface KpEquationTransitRecordObligationV2 {
  readonly recordId: string;
  readonly relation: SelectorCorrespondenceRelationId;
  readonly sourceEntityIds: readonly string[];
  readonly targetEntityIds: readonly string[];
  readonly boundaryIntentIds: readonly string[];
  readonly routeAuthority: "renderer-measured-route";
  readonly timingAuthority: "registered-renderer-profile";
}

export interface KpEquationTargetArrivalObligationV2 {
  readonly id: string;
  readonly kind: "semantic-target-cohort" | "individual-target-arrival";
  readonly recordIds: readonly string[];
  readonly targetEntityIds: readonly string[];
  readonly connectorEntityIds: readonly string[];
  readonly geometryAuthority: "native-target-ink";
  readonly timingAuthority: "registered-renderer-profile";
  readonly handoff: "settle-before-native-target-ownership";
}

export interface KpEquationTransitionTransitObligationsV2 {
  readonly transitionId: string;
  readonly semanticOperation:
    KpResolvedEquationProjectionChoreographyV2["semanticOperation"];
  readonly boundaries: readonly KpEquationTransitBoundaryIntentV2[];
  readonly transitRecords: readonly KpEquationTransitRecordObligationV2[];
  readonly arrivals: readonly KpEquationTargetArrivalObligationV2[];
}

declare const kpEquationTransitObligationsV2Authority: unique symbol;

export type KpCompiledEquationTransitObligationsV2 = Readonly<{
  readonly schemaVersion: typeof kpEquationTransitObligationsV2SchemaVersion;
  readonly kind: "compiled-equation-transit-obligations-v2";
  readonly grammarId: string;
  readonly assetId: string;
  readonly transitions: readonly KpEquationTransitionTransitObligationsV2[];
  readonly [kpEquationTransitObligationsV2Authority]: true;
}>;

export interface KpEquationTransitObligationsDiagnosticV2 {
  readonly code:
    | "transit.uncompiled-grammar"
    | "transit.unresolved-projection"
    | "transit.projection-mismatch"
    | "transit.unknown-transition"
    | "transit.duplicate-intent"
    | "transit.unknown-boundary-entity"
    | "transit.unknown-record"
    | "transit.nonmoving-record"
    | "transit.invalid-arrival-target"
    | "transit.duplicate-arrival"
    | "transit.caller-presentation";
  readonly transitionId?: string | undefined;
  readonly intentId?: string | undefined;
  readonly message: string;
}

export type KpEquationTransitObligationsCompilationV2 =
  | {
      readonly status: "compiled";
      readonly obligations: KpCompiledEquationTransitObligationsV2;
      readonly diagnostics: readonly [];
    }
  | {
      readonly status: "repair-required";
      readonly diagnostics: readonly KpEquationTransitObligationsDiagnosticV2[];
    };

const compiledObligations = new WeakSet<object>();
const transitingRelations = new Set<SelectorCorrespondenceRelationId>([
  "identity", "role-change", "fan-in", "fan-out"
]);
const arrivingRelations = new Set<SelectorCorrespondenceRelationId>([
  ...transitingRelations,
  "introduction"
]);

export function compileKpEquationTransitObligationsV2(input: {
  readonly grammar: KpCompiledEquationGrammarV2;
  readonly choreography: KpResolvedEquationProjectionChoreographiesV2;
  readonly intents?: readonly KpEquationTransitionTransitIntentV2[] | undefined;
}): KpEquationTransitObligationsCompilationV2 {
  if (!isKpCompiledEquationGrammarV2(input.grammar)) {
    return repair("transit.uncompiled-grammar",
      "Transit obligations require compiler-minted equation grammar v2.");
  }
  if (!isKpResolvedEquationProjectionChoreographiesV2(input.choreography)) {
    return repair("transit.unresolved-projection",
      "Transit obligations require resolved projection choreography.");
  }
  if (input.choreography.grammarId !== input.grammar.id ||
      input.choreography.assetId !== input.grammar.assetId) {
    return repair("transit.projection-mismatch",
      "Projection choreography belongs to another equation grammar.");
  }

  const intents = input.intents ?? [];
  const diagnostics: KpEquationTransitObligationsDiagnosticV2[] = [];
  const transitionIds = new Set(input.grammar.transitions.map(({ id }) => id));
  const duplicateTransitionIds = duplicates(intents.map(({ transitionId }) =>
    transitionId));
  duplicateTransitionIds.forEach((transitionId) => diagnostics.push({
    code: "transit.duplicate-intent",
    transitionId,
    message: `Transition ${transitionId} has multiple transit intent records.`
  }));
  intents.forEach((intent) => {
    if (!transitionIds.has(intent.transitionId)) {
      diagnostics.push({
        code: "transit.unknown-transition",
        transitionId: intent.transitionId,
        message: `Unknown transit transition ${intent.transitionId}.`
      });
    }
    rejectCallerPresentation(intent, diagnostics);
  });

  const intentsByTransition = new Map(intents.map((intent) =>
    [intent.transitionId, intent]));
  const choreographyByTransition = new Map(
    input.choreography.transitions.map((transition) =>
      [transition.transitionId, transition])
  );
  const statesById = new Map(input.grammar.states.map((state) =>
    [state.id, state]));
  const transitions = input.grammar.transitions.map((transition) => {
    const choreography = choreographyByTransition.get(transition.id)!;
    const intent = intentsByTransition.get(transition.id) ?? {
      transitionId: transition.id,
      boundaries: [],
      arrivals: []
    };
    const source = statesById.get(transition.sourceStateId)!;
    const target = statesById.get(transition.targetStateId)!;
    const availableEntities = new Set([
      ...source.entityIds,
      ...target.entityIds
    ]);
    const recordsById = new Map(
      transition.operation.correspondenceMap.records.map((record) =>
        [record.id, record])
    );
    const transitingRecords = transition.operation.correspondenceMap.records
      .filter((record) => transitingRelations.has(record.relation));
    const arrivingRecords = transition.operation.correspondenceMap.records
      .filter((record) => arrivingRelations.has(record.relation));

    validateBoundaries({
      transitionId: transition.id,
      boundaries: intent.boundaries,
      availableEntities,
      recordsById,
      diagnostics
    });
    validateArrivals({
      transitionId: transition.id,
      arrivals: intent.arrivals,
      availableTargetEntities: new Set(target.entityIds),
      recordsById,
      arrivingRecordIds: new Set(arrivingRecords.map(({ id }) => id)),
      diagnostics
    });

    const declaredArrivalRecords = new Set(
      intent.arrivals.flatMap(({ recordIds }) => recordIds)
    );
    return Object.freeze({
      transitionId: transition.id,
      semanticOperation: choreography.semanticOperation,
      boundaries: Object.freeze(intent.boundaries.map(freezeBoundary)),
      transitRecords: Object.freeze(transitingRecords.map((record) =>
        Object.freeze({
          recordId: record.id,
          relation: record.relation,
          sourceEntityIds: Object.freeze([...record.sourceSelectorIds]),
          targetEntityIds: Object.freeze([...record.targetSelectorIds]),
          boundaryIntentIds: Object.freeze(intent.boundaries
            .filter(({ crossingRecordIds }) =>
              crossingRecordIds.includes(record.id))
            .map(({ id }) => id)),
          routeAuthority: "renderer-measured-route" as const,
          timingAuthority: "registered-renderer-profile" as const
        }))),
      arrivals: Object.freeze([
        ...intent.arrivals.map((arrival) => Object.freeze({
          id: arrival.id,
          kind: "semantic-target-cohort" as const,
          recordIds: Object.freeze([...arrival.recordIds]),
          targetEntityIds: Object.freeze([...arrival.targetEntityIds]),
          connectorEntityIds: Object.freeze([...arrival.connectorEntityIds]),
          geometryAuthority: "native-target-ink" as const,
          timingAuthority: "registered-renderer-profile" as const,
          handoff: "settle-before-native-target-ownership" as const
        })),
        ...arrivingRecords.filter(({ id }) =>
          !declaredArrivalRecords.has(id)).map((record) => Object.freeze({
          id: `arrival.${transition.id}.${record.id}`,
          kind: "individual-target-arrival" as const,
          recordIds: Object.freeze([record.id]),
          targetEntityIds: Object.freeze([...record.targetSelectorIds]),
          connectorEntityIds: Object.freeze([]),
          geometryAuthority: "native-target-ink" as const,
          timingAuthority: "registered-renderer-profile" as const,
          handoff: "settle-before-native-target-ownership" as const
        }))
      ])
    });
  });

  if (diagnostics.length > 0) {
    return Object.freeze({
      status: "repair-required" as const,
      diagnostics: Object.freeze(diagnostics)
    });
  }
  const obligations = Object.freeze({
    schemaVersion: kpEquationTransitObligationsV2SchemaVersion,
    kind: "compiled-equation-transit-obligations-v2" as const,
    grammarId: input.grammar.id,
    assetId: input.grammar.assetId,
    transitions: Object.freeze(transitions)
  }) as unknown as KpCompiledEquationTransitObligationsV2;
  compiledObligations.add(obligations);
  return Object.freeze({
    status: "compiled" as const,
    obligations,
    diagnostics: Object.freeze([]) as readonly []
  });
}

export function isKpCompiledEquationTransitObligationsV2(
  value: unknown
): value is KpCompiledEquationTransitObligationsV2 {
  return typeof value === "object" && value !== null &&
    compiledObligations.has(value);
}

function validateBoundaries(input: {
  readonly transitionId: string;
  readonly boundaries: readonly KpEquationTransitBoundaryIntentV2[];
  readonly availableEntities: ReadonlySet<string>;
  readonly recordsById: ReadonlyMap<string, {
    readonly relation: SelectorCorrespondenceRelationId;
  }>;
  readonly diagnostics: KpEquationTransitObligationsDiagnosticV2[];
}): void {
  duplicates(input.boundaries.map(({ id }) => id)).forEach((intentId) =>
    input.diagnostics.push({
      code: "transit.duplicate-intent",
      transitionId: input.transitionId,
      intentId,
      message: `Transit boundary ${intentId} is duplicated.`
    }));
  input.boundaries.forEach((boundary) => {
    boundary.boundaryEntityIds.forEach((entityId) => {
      if (!input.availableEntities.has(entityId)) {
        input.diagnostics.push({
          code: "transit.unknown-boundary-entity",
          transitionId: input.transitionId,
          intentId: boundary.id,
          message: `Boundary ${boundary.id} references unknown entity ${entityId}.`
        });
      }
    });
    boundary.crossingRecordIds.forEach((recordId) => {
      const record = input.recordsById.get(recordId);
      if (record === undefined) {
        input.diagnostics.push({
          code: "transit.unknown-record",
          transitionId: input.transitionId,
          intentId: boundary.id,
          message: `Boundary ${boundary.id} references unknown record ${recordId}.`
        });
      } else if (!transitingRelations.has(record.relation)) {
        input.diagnostics.push({
          code: "transit.nonmoving-record",
          transitionId: input.transitionId,
          intentId: boundary.id,
          message: `Boundary ${boundary.id} cannot route ${record.relation} record ${recordId}.`
        });
      }
    });
  });
}

function validateArrivals(input: {
  readonly transitionId: string;
  readonly arrivals: readonly KpEquationTargetArrivalIntentV2[];
  readonly availableTargetEntities: ReadonlySet<string>;
  readonly recordsById: ReadonlyMap<string, {
    readonly targetSelectorIds: readonly string[];
  }>;
  readonly arrivingRecordIds: ReadonlySet<string>;
  readonly diagnostics: KpEquationTransitObligationsDiagnosticV2[];
}): void {
  duplicates(input.arrivals.map(({ id }) => id)).forEach((intentId) =>
    input.diagnostics.push({
      code: "transit.duplicate-intent",
      transitionId: input.transitionId,
      intentId,
      message: `Target arrival ${intentId} is duplicated.`
    }));
  const seenRecords = new Set<string>();
  input.arrivals.forEach((arrival) => {
    [...arrival.targetEntityIds, ...arrival.connectorEntityIds]
      .forEach((entityId) => {
        if (!input.availableTargetEntities.has(entityId)) {
          input.diagnostics.push({
            code: "transit.invalid-arrival-target",
            transitionId: input.transitionId,
            intentId: arrival.id,
            message: `Arrival ${arrival.id} references non-target entity ${entityId}.`
          });
        }
      });
    arrival.recordIds.forEach((recordId) => {
      const record = input.recordsById.get(recordId);
      if (record === undefined) {
        input.diagnostics.push({
          code: "transit.unknown-record",
          transitionId: input.transitionId,
          intentId: arrival.id,
          message: `Arrival ${arrival.id} references unknown record ${recordId}.`
        });
        return;
      }
      if (!input.arrivingRecordIds.has(recordId) ||
          !record.targetSelectorIds.some((id) =>
            arrival.targetEntityIds.includes(id) ||
            arrival.connectorEntityIds.includes(id))) {
        input.diagnostics.push({
          code: "transit.invalid-arrival-target",
          transitionId: input.transitionId,
          intentId: arrival.id,
          message: `Arrival ${arrival.id} does not own a target of ${recordId}.`
        });
      }
      if (seenRecords.has(recordId)) {
        input.diagnostics.push({
          code: "transit.duplicate-arrival",
          transitionId: input.transitionId,
          intentId: arrival.id,
          message: `Record ${recordId} belongs to multiple arrival cohorts.`
        });
      }
      seenRecords.add(recordId);
    });
  });
}

function rejectCallerPresentation(
  intent: KpEquationTransitionTransitIntentV2,
  diagnostics: KpEquationTransitObligationsDiagnosticV2[]
): void {
  const forbidden = new Set([
    "arc", "coordinates", "delayMs", "durationMs", "easing", "path",
    "progress", "timing", "x", "y"
  ]);
  const visit = (value: unknown, path: string): void => {
    if (typeof value !== "object" || value === null) return;
    Object.entries(value).forEach(([key, child]) => {
      if (forbidden.has(key)) {
        diagnostics.push({
          code: "transit.caller-presentation",
          transitionId: intent.transitionId,
          message: `Transit intent cannot author ${path}.${key}.`
        });
      }
      visit(child, `${path}.${key}`);
    });
  };
  visit(intent, `transitions.${intent.transitionId}`);
}

function freezeBoundary(
  boundary: KpEquationTransitBoundaryIntentV2
): KpEquationTransitBoundaryIntentV2 {
  return Object.freeze({
    ...boundary,
    boundaryEntityIds: Object.freeze([...boundary.boundaryEntityIds]),
    crossingRecordIds: Object.freeze([...boundary.crossingRecordIds])
  });
}

function duplicates(values: readonly string[]): string[] {
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  values.forEach((value) => {
    if (seen.has(value)) duplicates.add(value);
    seen.add(value);
  });
  return [...duplicates];
}

function repair(
  code: KpEquationTransitObligationsDiagnosticV2["code"],
  message: string
): KpEquationTransitObligationsCompilationV2 {
  return Object.freeze({
    status: "repair-required" as const,
    diagnostics: Object.freeze([{ code, message }])
  });
}
