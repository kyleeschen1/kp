export type KpSemanticTraversalPolicy =
  | "ranked-index"
  | "dependency"
  | "execution"
  | "reading"
  | "symmetric"
  | "compressed";

export interface KpSemanticTraversalParticipant {
  readonly id: string;
  readonly entityIds: readonly string[];
  readonly rank: number;
  readonly semanticIndex?: number | undefined;
  readonly dependsOnParticipantIds?: readonly string[] | undefined;
  readonly symmetryGroupId?: string | undefined;
}

export interface KpSemanticTraversalRank {
  readonly rank: number;
  readonly participantIds: readonly string[];
  readonly presentation: "show" | "compress";
}

export interface KpSemanticTraversalPlan {
  readonly id: string;
  readonly kind: "semantic-traversal-plan";
  readonly policy: KpSemanticTraversalPolicy;
  readonly authorityId: string;
  readonly participants: readonly KpSemanticTraversalParticipant[];
  readonly ranks: readonly KpSemanticTraversalRank[];
  readonly cascade: {
    readonly adjacentOnly: true;
    readonly nextRankReadinessThreshold: number;
  };
}

export interface KpSemanticTraversalIssue {
  readonly path: string;
  readonly message: string;
}

export function validateKpSemanticTraversalPlan(
  plan: KpSemanticTraversalPlan
): readonly KpSemanticTraversalIssue[] {
  const issues: KpSemanticTraversalIssue[] = [];
  const participantIds = new Set<string>();
  plan.participants.forEach((participant, index) => {
    const path = `participants[${index}]`;
    if (participantIds.has(participant.id)) {
      issue(`${path}.id`, `Duplicate traversal participant ${participant.id}.`, issues);
    }
    participantIds.add(participant.id);
    if (!Number.isInteger(participant.rank) || participant.rank < 0) {
      issue(`${path}.rank`, "Traversal rank must be a nonnegative integer.", issues);
    }
    if (participant.entityIds.length === 0) {
      issue(`${path}.entityIds`, "Traversal participants require semantic entities.", issues);
    }
    if (plan.policy === "ranked-index" && participant.semanticIndex === undefined) {
      issue(`${path}.semanticIndex`, "Ranked-index traversal requires an explicit semantic index.", issues);
    }
    if (plan.policy === "dependency") {
      participant.dependsOnParticipantIds?.forEach((id) => {
        const dependency = plan.participants.find((candidate) => candidate.id === id);
        if (dependency === undefined) {
          issue(`${path}.dependsOnParticipantIds`, `Unknown traversal dependency ${id}.`, issues);
        } else if (dependency.rank >= participant.rank) {
          issue(`${path}.dependsOnParticipantIds`, `Traversal dependency ${id} must occupy an earlier rank.`, issues);
        }
      });
    }
    if (plan.policy === "symmetric" && participant.symmetryGroupId === undefined) {
      issue(`${path}.symmetryGroupId`, "Symmetric traversal requires a declared symmetry group.", issues);
    }
  });

  if (plan.policy === "ranked-index") {
    [...plan.participants]
      .sort((left, right) => left.semanticIndex! - right.semanticIndex!)
      .forEach((participant, expectedRank) => {
        if (participant.rank !== expectedRank) {
          issue(
            `participants[${plan.participants.indexOf(participant)}].rank`,
            `Semantic index order requires participant ${participant.id} at rank ${expectedRank}.`,
            issues
          );
        }
      });
  }

  const sortedRanks = [...plan.ranks].sort((left, right) => left.rank - right.rank);
  sortedRanks.forEach((rank, index) => {
    if (rank.rank !== index) {
      issue(`ranks[${index}].rank`, "Traversal ranks must be contiguous from zero.", issues);
    }
    if (rank.participantIds.length === 0) {
      issue(`ranks[${index}].participantIds`, "Traversal ranks cannot be empty.", issues);
    }
    rank.participantIds.forEach((id) => {
      const participant = plan.participants.find((candidate) => candidate.id === id);
      if (participant === undefined) {
        issue(`ranks[${index}].participantIds`, `Unknown traversal participant ${id}.`, issues);
      } else if (participant.rank !== rank.rank) {
        issue(`ranks[${index}].participantIds`, `Participant ${id} declares rank ${participant.rank}, not ${rank.rank}.`, issues);
      }
    });
    if (
      rank.participantIds.length > 1 &&
      plan.policy !== "symmetric"
    ) {
      issue(`ranks[${index}].participantIds`, "Only symmetric traversal may share a rank.", issues);
    }
    if (plan.policy === "symmetric" && rank.participantIds.length > 1) {
      const groups = new Set(
        rank.participantIds.map((id) =>
          plan.participants.find((participant) => participant.id === id)
            ?.symmetryGroupId
        )
      );
      if (groups.size !== 1) {
        issue(
          `ranks[${index}].participantIds`,
          "Participants sharing a symmetric rank must belong to one symmetry group.",
          issues
        );
      }
    }
  });
  plan.participants.forEach((participant, index) => {
    const count = plan.ranks.filter((rank) =>
      rank.participantIds.includes(participant.id)
    ).length;
    if (count !== 1) {
      issue(`participants[${index}]`, `Traversal participant ${participant.id} must appear in exactly one rank.`, issues);
    }
  });

  if (
    !Number.isFinite(plan.cascade.nextRankReadinessThreshold) ||
    plan.cascade.nextRankReadinessThreshold <= 0 ||
    plan.cascade.nextRankReadinessThreshold > 1
  ) {
    issue(
      "cascade.nextRankReadinessThreshold",
      "Traversal cascade readiness must be greater than zero and at most one.",
      issues
    );
  }
  if (plan.policy === "compressed") {
    const shown = sortedRanks.filter((rank) => rank.presentation === "show");
    const compressed = sortedRanks.filter((rank) => rank.presentation === "compress");
    if (
      compressed.length === 0 ||
      shown[0]?.rank !== 0 ||
      shown[shown.length - 1]?.rank !== sortedRanks[sortedRanks.length - 1]?.rank
    ) {
      issue(
        "ranks",
        "Compressed traversal must show the first and final ranks and explicitly compress at least one middle rank.",
        issues
      );
    }
  } else if (plan.ranks.some((rank) => rank.presentation === "compress")) {
    issue("ranks", "Only compressed traversal may omit detailed rank presentation.", issues);
  }
  rejectStyleOwnership(plan, issues);
  return issues;
}

export function orderedKpSemanticTraversalParticipants(
  plan: KpSemanticTraversalPlan
): readonly KpSemanticTraversalParticipant[] {
  const byId = new Map(plan.participants.map((participant) => [participant.id, participant]));
  return [...plan.ranks]
    .sort((left, right) => left.rank - right.rank)
    .flatMap((rank) =>
      rank.participantIds.map((id) => byId.get(id)!)
    );
}

function rejectStyleOwnership(
  value: unknown,
  issues: KpSemanticTraversalIssue[],
  path = "$"
): void {
  if (Array.isArray(value)) {
    value.forEach((item, index) => rejectStyleOwnership(item, issues, `${path}[${index}]`));
    return;
  }
  if (typeof value !== "object" || value === null) return;
  Object.entries(value).forEach(([key, child]) => {
    if (/^(style|styleId|gestaltStyle|staggerMs|delayMs)$/i.test(key)) {
      issue(`${path}.${key}`, `Gestalt style field ${key} cannot own semantic traversal.`, issues);
    }
    rejectStyleOwnership(child, issues, `${path}.${key}`);
  });
}

function issue(
  path: string,
  message: string,
  issues: KpSemanticTraversalIssue[]
): void {
  issues.push({ path, message });
}
