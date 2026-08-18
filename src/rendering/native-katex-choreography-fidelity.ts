import type {
  KpNativeKatexSceneReconciliation,
  KpNativeKatexSceneTrack
} from "./native-katex-base-scene-plan.ts";
import type {
  KpEquationStructuralSuccessionIntent
} from "../animation/structural-succession-presentation.ts";

export type KpNativeKatexStructuralSuccessionStrategy =
  | {
      readonly kind: "atom-tracks";
      readonly actPhaseIds: readonly string[];
    }
  | {
      readonly kind: "solid-mask-succession";
      readonly actPhaseIds: readonly string[];
    }
  | {
      readonly kind: "checkpoint-settlement";
      readonly actPhaseIds: readonly string[];
      readonly reason: string;
    };

export type KpNativeKatexChoreographyFidelityIssueCode =
  | "choreography.structural-strategy-missing"
  | "choreography.fade-dominant-succession"
  | "choreography.act-phase-empty";

export interface KpNativeKatexChoreographyFidelityIssue {
  readonly code: KpNativeKatexChoreographyFidelityIssueCode;
  readonly message: string;
  readonly entityIds: readonly string[];
}

export interface KpNativeKatexChoreographyFidelityReport {
  readonly kind: "native-katex-choreography-fidelity-report";
  readonly passed: boolean;
  readonly intentId: string;
  readonly strategyKind: KpNativeKatexStructuralSuccessionStrategy["kind"];
  readonly issues: readonly KpNativeKatexChoreographyFidelityIssue[];
}

/**
 * Audits the semantic-to-paint boundary, where a valid succession can
 * otherwise degrade into technically complete but pedagogically empty fades.
 */
export function auditKpNativeKatexChoreographyFidelity(input: {
  readonly intent: KpEquationStructuralSuccessionIntent;
  readonly strategy: KpNativeKatexStructuralSuccessionStrategy;
  readonly reconciliation: KpNativeKatexSceneReconciliation;
  readonly tracks: readonly KpNativeKatexSceneTrack[];
}): KpNativeKatexChoreographyFidelityReport {
  const issues: KpNativeKatexChoreographyFidelityIssue[] = [];
  const structuralEntityIds = Object.freeze([
    ...new Set([
      ...input.intent.sourceEntityIds,
      ...input.intent.targetEntityIds
    ])
  ]);
  if (input.strategy.kind === "atom-tracks") {
    issues.push(Object.freeze({
      code: "choreography.structural-strategy-missing" as const,
      message:
        `${input.intent.motifKind} requires a structural succession strategy; ` +
        "independent atom tracks cannot express the requested representation change.",
      entityIds: structuralEntityIds
    }));
  }

  const structuralDispositions = input.reconciliation.dispositions.filter(
    ({ semanticEntityIds }) => semanticEntityIds.some((entityId) =>
      structuralEntityIds.includes(entityId)
    )
  );
  const structuralComponentIds = new Set(
    structuralDispositions.map(({ id }) => `component.${id}`)
  );
  const structuralTracks = input.tracks.filter(({ componentId }) =>
    structuralComponentIds.has(componentId)
  );
  if (
    input.strategy.kind === "atom-tracks" &&
    structuralTracks.length > 0 &&
    structuralTracks.every(({ lifecycle }) =>
      lifecycle === "introduce" || lifecycle === "eliminate"
    )
  ) {
    issues.push(Object.freeze({
      code: "choreography.fade-dominant-succession" as const,
      message:
        "Every structural participant only enters or exits; no paint remains " +
        "continuous through the representation handoff.",
      entityIds: structuralEntityIds
    }));
  }

  const coveredActPhases = new Set(input.strategy.actPhaseIds);
  const missingActPhases = input.intent.actPhaseIds.filter(
    (phaseId) => !coveredActPhases.has(phaseId)
  );
  if (missingActPhases.length > 0) {
    issues.push(Object.freeze({
      code: "choreography.act-phase-empty" as const,
      message:
        `The selected paint strategy does not realize act phases: ` +
        missingActPhases.join(", "),
      entityIds: structuralEntityIds
    }));
  }

  return Object.freeze({
    kind: "native-katex-choreography-fidelity-report",
    passed: issues.length === 0,
    intentId: input.intent.id,
    strategyKind: input.strategy.kind,
    issues: Object.freeze(issues)
  });
}
