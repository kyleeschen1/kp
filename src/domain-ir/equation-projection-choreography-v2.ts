import {
  isKpCompiledEquationGrammarV2,
  type KpCompiledEquationGrammarV2,
  type KpEquationProjectionIntentV2
} from "./equation-grammar-v2.ts";
import {
  isKpResolvedEquationGrammarOperationsV2,
  type KpResolvedEquationGrammarOperationsV2,
  type KpResolvedEquationTransitionOperationV2
} from "./equation-grammar-v2-operation-resolution.ts";

export const kpEquationProjectionChoreographyRegistryV2SchemaVersion =
  "kp.equation-projection-choreography-registry.v2" as const;

export type KpEquationProjectionChoreographyProfileV2 =
  | {
      readonly id: "kp.projection-choreography.replacement.v2";
      readonly intent: "replacement";
      readonly retentionPolicy: "replacement";
      readonly sourceSettlement: "retire-after-transit";
      readonly relationOccurrence: "none";
      readonly history: "none";
      readonly settledFocus: "target";
    }
  | {
      readonly id: "kp.projection-choreography.equivalence.v2";
      readonly intent: "equivalence";
      readonly retentionPolicy: "equivalence-frame";
      readonly sourceSettlement: "retain-frozen-context";
      readonly relationOccurrence: "required-distinct-occurrence";
      readonly history: "none";
      readonly settledFocus: "target-with-equivalence-context";
    }
  | {
      readonly id: "kp.projection-choreography.derivation.v2";
      readonly intent: "derivation";
      readonly retentionPolicy: "derivation-trail";
      readonly sourceSettlement: "promote-to-history";
      readonly relationOccurrence: "optional-derived-relation";
      readonly history: "append-source-snapshot";
      readonly settledFocus: "latest-target";
    };

export interface KpEquationProjectionChoreographyRegistryV2 {
  readonly schemaVersion:
    typeof kpEquationProjectionChoreographyRegistryV2SchemaVersion;
  readonly kind: "equation-projection-choreography-registry-v2";
  readonly entries:
    readonly KpEquationProjectionChoreographyProfileV2[];
}

export const kpEquationProjectionChoreographyRegistryV2 =
  createKpEquationProjectionChoreographyRegistryV2({
    entries: [
      {
        id: "kp.projection-choreography.replacement.v2",
        intent: "replacement",
        retentionPolicy: "replacement",
        sourceSettlement: "retire-after-transit",
        relationOccurrence: "none",
        history: "none",
        settledFocus: "target"
      },
      {
        id: "kp.projection-choreography.equivalence.v2",
        intent: "equivalence",
        retentionPolicy: "equivalence-frame",
        sourceSettlement: "retain-frozen-context",
        relationOccurrence: "required-distinct-occurrence",
        history: "none",
        settledFocus: "target-with-equivalence-context"
      },
      {
        id: "kp.projection-choreography.derivation.v2",
        intent: "derivation",
        retentionPolicy: "derivation-trail",
        sourceSettlement: "promote-to-history",
        relationOccurrence: "optional-derived-relation",
        history: "append-source-snapshot",
        settledFocus: "latest-target"
      }
    ]
  });

export function createKpEquationProjectionChoreographyRegistryV2(input: {
  readonly entries:
    readonly KpEquationProjectionChoreographyProfileV2[];
}): KpEquationProjectionChoreographyRegistryV2 {
  const intents = new Set<KpEquationProjectionIntentV2>();
  const ids = new Set<string>();
  input.entries.forEach((entry) => {
    if (entry.id.trim() === "" || ids.has(entry.id)) {
      throw new Error(`Duplicate or empty projection profile ${entry.id}.`);
    }
    if (intents.has(entry.intent)) {
      throw new Error(`Duplicate projection intent ${entry.intent}.`);
    }
    ids.add(entry.id);
    intents.add(entry.intent);
  });
  return Object.freeze({
    schemaVersion: kpEquationProjectionChoreographyRegistryV2SchemaVersion,
    kind: "equation-projection-choreography-registry-v2" as const,
    entries: Object.freeze(input.entries.map((entry) =>
      Object.freeze({ ...entry })))
  });
}

export interface KpResolvedEquationProjectionChoreographyV2 {
  readonly transitionId: string;
  readonly sourceStateId: string;
  readonly targetStateId: string;
  /** Exact compiler-owned operation; projections may not clone or replace it. */
  readonly semanticOperation: KpResolvedEquationTransitionOperationV2;
  readonly profile: KpEquationProjectionChoreographyProfileV2;
  readonly occurrenceObligations: {
    readonly source: "native-source";
    readonly transit: "one-live-transition-occurrence";
    readonly target: "native-target";
    readonly paintOwnership: "exclusive-per-occurrence";
  };
  readonly resolutionSource: "projection-choreography-registry";
}

declare const kpResolvedProjectionChoreographyAuthority: unique symbol;

export type KpResolvedEquationProjectionChoreographiesV2 = Readonly<{
  readonly schemaVersion: "kp.resolved-equation-projection-choreographies.v2";
  readonly kind: "resolved-equation-projection-choreographies-v2";
  readonly grammarId: string;
  readonly assetId: string;
  readonly transitions: readonly KpResolvedEquationProjectionChoreographyV2[];
  readonly [kpResolvedProjectionChoreographyAuthority]: true;
}>;

export interface KpEquationProjectionChoreographyDiagnosticV2 {
  readonly code:
    | "projection-choreography.uncompiled-grammar"
    | "projection-choreography.unresolved-operations"
    | "projection-choreography.operation-mismatch"
    | "projection-choreography.unregistered-intent";
  readonly transitionId?: string | undefined;
  readonly message: string;
}

export type KpEquationProjectionChoreographyResolutionV2 =
  | {
      readonly status: "resolved";
      readonly choreography:
        KpResolvedEquationProjectionChoreographiesV2;
      readonly diagnostics: readonly [];
    }
  | {
      readonly status: "repair-required";
      readonly diagnostics:
        readonly KpEquationProjectionChoreographyDiagnosticV2[];
    };

const resolvedChoreographies = new WeakSet<object>();

export function resolveKpEquationProjectionChoreographiesV2(input: {
  readonly grammar: KpCompiledEquationGrammarV2;
  readonly operations: KpResolvedEquationGrammarOperationsV2;
  readonly registry?:
    KpEquationProjectionChoreographyRegistryV2 | undefined;
}): KpEquationProjectionChoreographyResolutionV2 {
  if (!isKpCompiledEquationGrammarV2(input.grammar)) {
    return repair([{
      code: "projection-choreography.uncompiled-grammar",
      message: "Projection choreography requires compiled equation grammar v2."
    }]);
  }
  if (!isKpResolvedEquationGrammarOperationsV2(input.operations)) {
    return repair([{
      code: "projection-choreography.unresolved-operations",
      message: "Projection choreography requires resolved transition operations."
    }]);
  }
  if (input.operations.grammarId !== input.grammar.id ||
      input.operations.assetId !== input.grammar.assetId) {
    return repair([{
      code: "projection-choreography.operation-mismatch",
      message: "Resolved operations belong to a different equation grammar."
    }]);
  }
  const registry = input.registry ?? kpEquationProjectionChoreographyRegistryV2;
  const operationsByTransition = new Map(
    input.operations.transitions.map((operation) =>
      [operation.transitionId, operation])
  );
  const diagnostics: KpEquationProjectionChoreographyDiagnosticV2[] = [];
  const transitions: KpResolvedEquationProjectionChoreographyV2[] = [];
  input.grammar.transitions.forEach((transition) => {
    const operation = operationsByTransition.get(transition.id);
    if (operation === undefined ||
        operation.transformationId !== transition.transformationId) {
      diagnostics.push({
        code: "projection-choreography.operation-mismatch",
        transitionId: transition.id,
        message: `Transition ${transition.id} lacks its exact resolved operation.`
      });
      return;
    }
    const profile = registry.entries.find(
      ({ intent }) => intent === transition.projection.intent
    );
    if (profile === undefined) {
      diagnostics.push({
        code: "projection-choreography.unregistered-intent",
        transitionId: transition.id,
        message:
          `Projection ${transition.projection.intent} has no registered topology.`
      });
      return;
    }
    transitions.push(Object.freeze({
      transitionId: transition.id,
      sourceStateId: transition.sourceStateId,
      targetStateId: transition.targetStateId,
      semanticOperation: operation,
      profile,
      occurrenceObligations: Object.freeze({
        source: "native-source" as const,
        transit: "one-live-transition-occurrence" as const,
        target: "native-target" as const,
        paintOwnership: "exclusive-per-occurrence" as const
      }),
      resolutionSource: "projection-choreography-registry" as const
    }));
  });
  if (diagnostics.length > 0) return repair(diagnostics);
  const choreography = Object.freeze({
    schemaVersion:
      "kp.resolved-equation-projection-choreographies.v2" as const,
    kind: "resolved-equation-projection-choreographies-v2" as const,
    grammarId: input.grammar.id,
    assetId: input.grammar.assetId,
    transitions: Object.freeze(transitions)
  }) as unknown as KpResolvedEquationProjectionChoreographiesV2;
  resolvedChoreographies.add(choreography);
  return Object.freeze({
    status: "resolved" as const,
    choreography,
    diagnostics: Object.freeze([]) as readonly []
  });
}

export function isKpResolvedEquationProjectionChoreographiesV2(
  value: unknown
): value is KpResolvedEquationProjectionChoreographiesV2 {
  return typeof value === "object" && value !== null &&
    resolvedChoreographies.has(value);
}

function repair(
  diagnostics: readonly KpEquationProjectionChoreographyDiagnosticV2[]
): KpEquationProjectionChoreographyResolutionV2 {
  return Object.freeze({
    status: "repair-required" as const,
    diagnostics: Object.freeze([...diagnostics])
  });
}
