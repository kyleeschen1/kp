export const KP_SEMANTIC_DURATION_FULL_ACTION_LIMIT = 5;

export interface KpSemanticDurationAction {
  readonly id: string;
  readonly semanticRank: number;
  readonly minimumDurationMs: number;
  readonly repeatPatternId?: string | undefined;
}

export type KpSemanticDurationLongSequencePolicy =
  | "long-form"
  | "pattern-compression";

export interface KpSemanticDurationSegment {
  readonly id: string;
  readonly presentation: "full-action" | "pattern-sweep";
  readonly representedActionIds: readonly string[];
  readonly startMs: number;
  readonly durationMs: number;
  readonly endMs: number;
  readonly patternId?: string | undefined;
  readonly disclosure: "full" | "explicit-repeated-pattern";
}

export interface KpSemanticDurationPlan {
  readonly kind: "semantic-duration-plan";
  readonly id: string;
  readonly policy: "full-sequence" | KpSemanticDurationLongSequencePolicy;
  readonly actions: readonly KpSemanticDurationAction[];
  readonly segments: readonly KpSemanticDurationSegment[];
  readonly totalDurationMs: number;
  readonly originalActionCount: number;
  readonly representedActionCount: number;
  readonly compressedActionCount: number;
  readonly compressionApplied: boolean;
}

export interface KpSemanticDurationDiagnostic {
  readonly code:
    | "duration.invalid-action"
    | "duration.policy-required"
    | "duration.compression-spec-required"
    | "duration.compression-pattern-mismatch";
  readonly severity: "error" | "decision-required";
  readonly message: string;
}

export type KpSemanticDurationPlanningResult =
  | {
      readonly status: "planned";
      readonly plan: KpSemanticDurationPlan;
      readonly diagnostics: readonly [];
    }
  | {
      readonly status: "policy-required" | "rejected";
      readonly diagnostics: readonly KpSemanticDurationDiagnostic[];
    };

export interface KpSemanticDurationLawIssue {
  readonly code:
    | "duration.action-coverage"
    | "duration.full-action-accelerated"
    | "duration.invalid-sweep-position"
    | "duration.unmarked-compression"
    | "duration.invalid-total";
  readonly message: string;
}

export function planKpSemanticDuration(input: {
  readonly id: string;
  readonly actions: readonly KpSemanticDurationAction[];
  readonly longSequencePolicy?: KpSemanticDurationLongSequencePolicy | undefined;
  readonly compression?: {
    readonly patternId: string;
    readonly sweepMinimumDurationMs: number;
  } | undefined;
}): KpSemanticDurationPlanningResult {
  const actions = [...input.actions].sort(
    (left, right) => left.semanticRank - right.semanticRank
  );
  const invalid = validateActions(actions);
  if (invalid.length > 0) return { status: "rejected", diagnostics: invalid };

  if (actions.length <= KP_SEMANTIC_DURATION_FULL_ACTION_LIMIT) {
    return planned(fullSequencePlan(input.id, actions, "full-sequence"));
  }
  if (input.longSequencePolicy === undefined) {
    return {
      status: "policy-required",
      diagnostics: [{
        code: "duration.policy-required",
        severity: "decision-required",
        message:
          `${actions.length} serial semantic actions require explicit long-form or pattern-compression policy; duration cannot be silently reduced.`
      }]
    };
  }
  if (input.longSequencePolicy === "long-form") {
    return planned(fullSequencePlan(input.id, actions, "long-form"));
  }
  if (input.compression === undefined ||
      input.compression.patternId.trim().length === 0 ||
      !positive(input.compression.sweepMinimumDurationMs)) {
    return {
      status: "rejected",
      diagnostics: [{
        code: "duration.compression-spec-required",
        severity: "error",
        message:
          "Pattern compression requires a named repeated pattern and positive sweep minimum."
      }]
    };
  }
  const middle = actions.slice(2, -1);
  const mismatched = middle.filter(
    (action) => action.repeatPatternId !== input.compression!.patternId
  );
  if (mismatched.length > 0) {
    return {
      status: "rejected",
      diagnostics: [{
        code: "duration.compression-pattern-mismatch",
        severity: "error",
        message:
          `Pattern ${input.compression.patternId} does not authorize middle actions ${mismatched.map((action) => action.id).join(", ")}.`
      }]
    };
  }
  return planned(compressedPlan({
    id: input.id,
    actions,
    patternId: input.compression.patternId,
    sweepMinimumDurationMs: input.compression.sweepMinimumDurationMs
  }));
}

export function evaluateKpSemanticDurationLaws(
  plan: KpSemanticDurationPlan
): readonly KpSemanticDurationLawIssue[] {
  const issues: KpSemanticDurationLawIssue[] = [];
  const represented = plan.segments.flatMap((segment) => segment.representedActionIds);
  if (!sameOrderedIds(represented, plan.actions.map((action) => action.id))) {
    issues.push({
      code: "duration.action-coverage",
      message: "Every semantic action must be represented exactly once and in semantic order."
    });
  }
  const minimumById = new Map(
    plan.actions.map((action) => [action.id, action.minimumDurationMs] as const)
  );
  plan.segments.filter((segment) => segment.presentation === "full-action")
    .forEach((segment) => {
      const minimum = minimumById.get(segment.representedActionIds[0]!) ?? Infinity;
      if (segment.durationMs < minimum) {
        issues.push({
          code: "duration.full-action-accelerated",
          message: `Full action ${segment.representedActionIds[0]} received ${segment.durationMs}ms below its ${minimum}ms minimum.`
        });
      }
    });
  const sweeps = plan.segments.filter((segment) => segment.presentation === "pattern-sweep");
  sweeps.forEach((sweep) => {
    if (plan.segments.indexOf(sweep) !== 2 || plan.segments.at(-1) === sweep) {
      issues.push({
        code: "duration.invalid-sweep-position",
        message: "A pattern sweep must follow the first two full actions and precede the final full action."
      });
    }
    if (sweep.disclosure !== "explicit-repeated-pattern" || sweep.patternId === undefined) {
      issues.push({
        code: "duration.unmarked-compression",
        message: "Compressed work requires an explicit repeated-pattern disclosure."
      });
    }
  });
  const finalEnd = plan.segments.at(-1)?.endMs ?? 0;
  if (finalEnd !== plan.totalDurationMs ||
      plan.segments.some((segment, index) =>
        segment.startMs !== (index === 0 ? 0 : plan.segments[index - 1]!.endMs)
      )) {
    issues.push({
      code: "duration.invalid-total",
      message: "Semantic duration segments must be contiguous and end at totalDurationMs."
    });
  }
  return issues;
}

export function sampleKpSemanticDurationPlan(input: {
  readonly plan: KpSemanticDurationPlan;
  readonly elapsedMs: number;
}): {
  readonly elapsedMs: number;
  readonly progress: number;
  readonly segmentId: string;
  readonly segmentProgress: number;
  readonly representedActionIds: readonly string[];
  readonly presentation: KpSemanticDurationSegment["presentation"];
} {
  const elapsedMs = Math.max(0, Math.min(
    input.plan.totalDurationMs,
    Number.isFinite(input.elapsedMs) ? input.elapsedMs : 0
  ));
  const segment = input.plan.segments.find((candidate) => elapsedMs < candidate.endMs) ??
    input.plan.segments.at(-1)!;
  return {
    elapsedMs,
    progress: elapsedMs / input.plan.totalDurationMs,
    segmentId: segment.id,
    segmentProgress: Math.max(0, Math.min(
      1,
      (elapsedMs - segment.startMs) / segment.durationMs
    )),
    representedActionIds: segment.representedActionIds,
    presentation: segment.presentation
  };
}

function fullSequencePlan(
  id: string,
  actions: readonly KpSemanticDurationAction[],
  policy: "full-sequence" | "long-form"
): KpSemanticDurationPlan {
  return assemblePlan({
    id,
    actions,
    policy,
    segments: actions.map((action) => ({
      id: `${id}.action.${action.semanticRank}`,
      presentation: "full-action" as const,
      representedActionIds: [action.id],
      durationMs: action.minimumDurationMs,
      disclosure: "full" as const
    }))
  });
}

function compressedPlan(input: {
  readonly id: string;
  readonly actions: readonly KpSemanticDurationAction[];
  readonly patternId: string;
  readonly sweepMinimumDurationMs: number;
}): KpSemanticDurationPlan {
  const middle = input.actions.slice(2, -1);
  const final = input.actions.at(-1)!;
  return assemblePlan({
    id: input.id,
    actions: input.actions,
    policy: "pattern-compression",
    segments: [
      ...input.actions.slice(0, 2).map((action) => ({
        id: `${input.id}.action.${action.semanticRank}`,
        presentation: "full-action" as const,
        representedActionIds: [action.id],
        durationMs: action.minimumDurationMs,
        disclosure: "full" as const
      })),
      {
        id: `${input.id}.pattern-sweep`,
        presentation: "pattern-sweep",
        representedActionIds: middle.map((action) => action.id),
        durationMs: input.sweepMinimumDurationMs,
        patternId: input.patternId,
        disclosure: "explicit-repeated-pattern"
      },
      {
        id: `${input.id}.action.${final.semanticRank}`,
        presentation: "full-action",
        representedActionIds: [final.id],
        durationMs: final.minimumDurationMs,
        disclosure: "full"
      }
    ]
  });
}

function assemblePlan(input: {
  readonly id: string;
  readonly actions: readonly KpSemanticDurationAction[];
  readonly policy: KpSemanticDurationPlan["policy"];
  readonly segments: readonly Omit<KpSemanticDurationSegment, "startMs" | "endMs">[];
}): KpSemanticDurationPlan {
  let startMs = 0;
  const segments = input.segments.map((segment) => {
    const timed = { ...segment, startMs, endMs: startMs + segment.durationMs };
    startMs = timed.endMs;
    return timed;
  });
  const compressedActionCount = segments
    .filter((segment) => segment.presentation === "pattern-sweep")
    .reduce((count, segment) => count + segment.representedActionIds.length, 0);
  return {
    kind: "semantic-duration-plan",
    id: input.id,
    policy: input.policy,
    actions: input.actions.map((action) => ({ ...action })),
    segments,
    totalDurationMs: startMs,
    originalActionCount: input.actions.length,
    representedActionCount: segments.reduce(
      (count, segment) => count + segment.representedActionIds.length,
      0
    ),
    compressedActionCount,
    compressionApplied: compressedActionCount > 0
  };
}

function validateActions(
  actions: readonly KpSemanticDurationAction[]
): readonly KpSemanticDurationDiagnostic[] {
  const ids = new Set<string>();
  return actions.flatMap((action, index) => {
    const valid = action.id.trim().length > 0 &&
      !ids.has(action.id) &&
      action.semanticRank === index &&
      positive(action.minimumDurationMs);
    ids.add(action.id);
    return valid ? [] : [{
      code: "duration.invalid-action" as const,
      severity: "error" as const,
      message:
        `Action ${action.id || index} requires a unique id, contiguous semantic rank, and positive minimum duration.`
    }];
  });
}

function planned(plan: KpSemanticDurationPlan): KpSemanticDurationPlanningResult {
  const issues = evaluateKpSemanticDurationLaws(plan);
  if (issues.length > 0) throw new Error(issues[0]!.message);
  return { status: "planned", plan, diagnostics: [] };
}

function positive(value: number): boolean {
  return Number.isFinite(value) && value > 0;
}

function sameOrderedIds(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length && left.every((id, index) => id === right[index]);
}
