import {
  validateKpSemanticTraversalPlan,
  type KpSemanticTraversalPlan
} from "./semantic-traversal.ts";

export type KpPropagationRule =
  | "causal"
  | "far-to-near"
  | "near-to-far"
  | "reading-order"
  | "radial"
  | "branch-order"
  | "symmetric"
  | "semantic-traversal-rank";

export interface KpPropagationParticipant {
  readonly id: string;
  readonly semanticEntityIds: readonly string[];
  readonly causalRank?: number | undefined;
  readonly distance?: number | undefined;
  readonly readingIndex?: number | undefined;
  readonly radialRank?: number | undefined;
  readonly branchIndex?: number | undefined;
  readonly symmetryGroupId?: string | undefined;
  readonly traversalParticipantId?: string | undefined;
}

export interface KpPropagationCascadeConstraints {
  readonly maximumStaggerSpan: number;
  readonly requestedStaggerSpan: number;
  readonly readinessThreshold: number;
  readonly latestOverlappingStartProgress: number;
  readonly minimumParticipantDuration: number;
  readonly stableVariationStrength: number;
}

export interface KpPropagationEntry {
  readonly participantId: string;
  readonly semanticEntityIds: readonly string[];
  readonly rank: number;
  readonly start: number;
  readonly end: number;
  readonly startsAfterPreviousReadiness: boolean;
  readonly overlapsPreviousRank: boolean;
}

export interface KpPropagationPlan {
  readonly id: string;
  readonly kind: "kp-propagation-plan";
  readonly rule: KpPropagationRule;
  readonly entries: readonly KpPropagationEntry[];
  readonly rankCount: number;
  readonly staggerSpan: number;
  readonly participantDuration: number;
  readonly promotable: boolean;
  readonly diagnostics: readonly string[];
}

export interface KpPropagationCompileInput {
  readonly id: string;
  readonly rule: KpPropagationRule;
  readonly participants: readonly KpPropagationParticipant[];
  readonly traversalPlan?: KpSemanticTraversalPlan | undefined;
  readonly constraints: KpPropagationCascadeConstraints;
}

export function compileKpPropagation(
  input: KpPropagationCompileInput
): KpPropagationPlan {
  validateInput(input);
  const ranked = rankParticipants(input);
  const rankCount =
    ranked.reduce((maximum, item) => Math.max(maximum, item.rank), -1) + 1;
  const diagnostics: string[] = [];
  const readinessThreshold = Math.max(
    input.constraints.readinessThreshold,
    input.traversalPlan?.cascade.nextRankReadinessThreshold ?? 0
  );
  const maximumSpan = Math.min(
    input.constraints.maximumStaggerSpan,
    input.constraints.requestedStaggerSpan
  );
  const spacing = rankCount <= 1 ? 0 : maximumSpan / (rankCount - 1);
  const minimumForReadiness =
    spacing / input.constraints.latestOverlappingStartProgress;
  const participantDuration = Math.max(
    input.constraints.minimumParticipantDuration,
    minimumForReadiness
  );
  const readinessAtNextStart =
    spacing === 0 || participantDuration === 0
      ? 1
      : spacing / participantDuration;

  if (
    rankCount > 1 &&
    readinessAtNextStart < readinessThreshold
  ) {
    diagnostics.push(
      "The cohesion stagger ceiling is too small to preserve the required readiness threshold and participant legibility."
    );
  }
  if (
    rankCount > 1 &&
    readinessAtNextStart >= 1
  ) {
    diagnostics.push(
      "Adjacent propagation ranks do not overlap, so the result is not a cascade."
    );
  }
  if (maximumSpan + participantDuration > 1) {
    diagnostics.push(
      "The propagation cascade does not fit inside normalized act progress."
    );
  }

  const entries = ranked.map((item) => {
    const baseStart = item.rank * spacing;
    const variation = stableVariation(
      input.rule === "symmetric"
        ? item.participant.symmetryGroupId!
        : item.participant.id,
      spacing,
      input.constraints.stableVariationStrength,
      item.rank,
      rankCount
    );
    const start = round(baseStart + variation);
    const previousStart = item.rank === 0 ? undefined : (item.rank - 1) * spacing;
    const previousProgress =
      previousStart === undefined || participantDuration === 0
        ? 1
        : (start - previousStart) / participantDuration;
    return {
      participantId: item.participant.id,
      semanticEntityIds: [...item.participant.semanticEntityIds],
      rank: item.rank,
      start,
      end: round(start + participantDuration),
      startsAfterPreviousReadiness:
        item.rank === 0 ||
        previousProgress >= readinessThreshold,
      overlapsPreviousRank:
        item.rank === 0 || previousProgress < 1
    };
  });
  if (
    entries.some(
      (entry) =>
        !entry.startsAfterPreviousReadiness || !entry.overlapsPreviousRank
    )
  ) {
    diagnostics.push(
      "Stable timing variation would obscure readiness order or break cascading overlap."
    );
  }
  if (!preservesRankOrder(entries)) {
    diagnostics.push(
      "Propagation timing does not preserve semantic rank order."
    );
  }

  return {
    id: input.id,
    kind: "kp-propagation-plan",
    rule: input.rule,
    entries,
    rankCount,
    staggerSpan: round(maximumSpan),
    participantDuration: round(participantDuration),
    promotable: diagnostics.length === 0,
    diagnostics
  };
}

function rankParticipants(
  input: KpPropagationCompileInput
): readonly {
  readonly participant: KpPropagationParticipant;
  readonly rank: number;
}[] {
  if (input.rule === "semantic-traversal-rank") {
    const traversal = input.traversalPlan!;
    const byId = new Map(
      traversal.participants.map((participant) => [
        participant.id,
        participant.rank
      ])
    );
    return input.participants.map((participant) => ({
      participant,
      rank: byId.get(participant.traversalParticipantId!)!
    }));
  }
  if (input.rule === "symmetric") {
    const groups = unique(
      input.participants
        .map((participant) => participant.symmetryGroupId!)
        .sort()
    );
    return input.participants.map((participant) => ({
      participant,
      rank: groups.indexOf(participant.symmetryGroupId!)
    }));
  }
  const sortableRule = input.rule as Exclude<
    KpPropagationRule,
    "symmetric" | "semantic-traversal-rank"
  >;
  const sorted = [...input.participants].sort((left, right) => {
    const difference = propagationValue(sortableRule, left) -
      propagationValue(sortableRule, right);
    return difference || left.id.localeCompare(right.id);
  });
  return sorted.map((participant, rank) => ({ participant, rank }));
}

function propagationValue(
  rule: Exclude<
    KpPropagationRule,
    "symmetric" | "semantic-traversal-rank"
  >,
  participant: KpPropagationParticipant
): number {
  switch (rule) {
    case "causal":
      return participant.causalRank!;
    case "far-to-near":
      return -participant.distance!;
    case "near-to-far":
      return participant.distance!;
    case "reading-order":
      return participant.readingIndex!;
    case "radial":
      return participant.radialRank!;
    case "branch-order":
      return participant.branchIndex!;
  }
}

function validateInput(input: KpPropagationCompileInput): void {
  if (input.participants.length === 0) {
    throw new Error("Propagation requires at least one participant.");
  }
  const ids = new Set<string>();
  input.participants.forEach((participant, index) => {
    if (ids.has(participant.id)) {
      throw new Error(`Duplicate propagation participant ${participant.id}.`);
    }
    ids.add(participant.id);
    if (participant.semanticEntityIds.length === 0) {
      throw new Error(
        `participants[${index}] requires at least one semantic entity.`
      );
    }
    requireRuleValue(input.rule, participant, index);
  });
  for (const [key, value] of Object.entries(input.constraints)) {
    if (!Number.isFinite(value) || value < 0 || value > 1) {
      throw new Error(`constraints.${key} must be normalized.`);
    }
  }
  if (
    input.constraints.readinessThreshold >=
    input.constraints.latestOverlappingStartProgress
  ) {
    throw new Error(
      "Readiness threshold must precede the latest overlapping cascade start."
    );
  }
  if (input.rule === "semantic-traversal-rank") {
    if (input.traversalPlan === undefined) {
      throw new Error(
        "Semantic traversal propagation requires an authoritative traversal plan."
      );
    }
    const issues = validateKpSemanticTraversalPlan(input.traversalPlan);
    if (issues.length > 0) {
      throw new Error(
        `traversalPlan.${issues[0]!.path}: ${issues[0]!.message}`
      );
    }
    const traversalIds = new Set(
      input.traversalPlan.participants.map((participant) => participant.id)
    );
    input.participants.forEach((participant, index) => {
      if (!traversalIds.has(participant.traversalParticipantId!)) {
        throw new Error(
          `participants[${index}].traversalParticipantId must reference the authoritative traversal plan.`
        );
      }
    });
  }
}

function requireRuleValue(
  rule: KpPropagationRule,
  participant: KpPropagationParticipant,
  index: number
): void {
  const path = `participants[${index}]`;
  const field = (() => {
    switch (rule) {
      case "causal": return "causalRank";
      case "far-to-near":
      case "near-to-far": return "distance";
      case "reading-order": return "readingIndex";
      case "radial": return "radialRank";
      case "branch-order": return "branchIndex";
      case "symmetric": return "symmetryGroupId";
      case "semantic-traversal-rank": return "traversalParticipantId";
    }
  })();
  const value = participant[field];
  if (
    typeof value === "string"
      ? value.trim().length === 0
      : !Number.isFinite(value)
  ) {
    throw new Error(`${path}.${field} is required by ${rule} propagation.`);
  }
}

function stableVariation(
  id: string,
  spacing: number,
  strength: number,
  rank: number,
  rankCount: number
): number {
  if (rank === 0 || rank === rankCount - 1 || spacing === 0) return 0;
  const unit = hashString(id) / 0xffffffff;
  return (unit * 2 - 1) * spacing * strength * 0.25;
}

function preservesRankOrder(entries: readonly KpPropagationEntry[]): boolean {
  const bounds = new Map<number, { minimum: number; maximum: number }>();
  entries.forEach((entry) => {
    const current = bounds.get(entry.rank);
    bounds.set(entry.rank, {
      minimum: Math.min(current?.minimum ?? entry.start, entry.start),
      maximum: Math.max(current?.maximum ?? entry.start, entry.start)
    });
  });
  const ordered = [...bounds.entries()].sort(
    ([left], [right]) => left - right
  );
  return ordered.every(
    ([, current], index) =>
      index === 0 || ordered[index - 1]![1].maximum < current.minimum
  );
}

function unique(values: readonly string[]): readonly string[] {
  return [...new Set(values)];
}

function hashString(value: string): number {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

function round(value: number): number {
  const result = Math.round(value * 1_000_000) / 1_000_000;
  return Object.is(result, -0) ? 0 : result;
}
