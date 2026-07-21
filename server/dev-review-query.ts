import type { KpDevReviewStatusV1 } from "../protocols/dev-review-v1.ts";
import type { KpDevReviewInboxV2, KpDevReviewNoteV2 } from "../protocols/dev-review-v2.ts";
import type {
  KpDevReviewCompactNoteEvidence,
  KpDevReviewQueryInput,
  KpDevReviewQueryResult,
  KpDevReviewQueryScope,
  KpDevReviewRoundQuerySummary
} from "../protocols/dev-review-operations-v2.ts";

export type {
  KpDevReviewCompactNoteEvidence,
  KpDevReviewNormalizedQuery,
  KpDevReviewQueryInput,
  KpDevReviewQueryResult,
  KpDevReviewQueryScope,
  KpDevReviewRoundQuerySummary
} from "../protocols/dev-review-operations-v2.ts";

export const kpDevReviewQueryLimits = Object.freeze({
  defaultPageSize: 20,
  maximumPageSize: 100
});

const statuses: readonly KpDevReviewStatusV1[] = [
  "new",
  "discussed",
  "grouped",
  "accepted",
  "fixed",
  "verified",
  "dismissed"
];

export function queryKpDevReviewInbox(
  inbox: KpDevReviewInboxV2,
  input: KpDevReviewQueryInput = {}
): KpDevReviewQueryResult {
  const query = normalizeQuery(inbox, input);
  const selectedRoundIds = selectRoundIds(inbox, query.scope, query.roundId);
  const selectedNotes = inbox.notes.filter((note) => selectedRoundIds.has(note.roundId));
  const matching = selectedNotes.filter((note) => matches(note, inbox, query));
  const pageNotes = matching.slice(0, query.limit);
  const hasMore = matching.length > pageNotes.length;

  return {
    query,
    counts: summarizeCounts(inbox, matching.length),
    rounds: summarizeRounds(inbox),
    page: {
      notes: pageNotes.map((note) => compactEvidence(note, query.detail)),
      hasMore,
      ...(hasMore && pageNotes.length > 0
        ? { nextAfterSequence: pageNotes.at(-1)?.sequence }
        : {})
    }
  };
}

function normalizeQuery(
  inbox: KpDevReviewInboxV2,
  input: KpDevReviewQueryInput
): KpDevReviewQueryResult["query"] {
  if (input.roundId !== undefined && input.scope !== undefined) {
    throw new TypeError("Review query cannot combine roundId with scope");
  }
  if (input.roundId !== undefined && !inbox.rounds.some((round) => round.id === input.roundId)) {
    throw new Error(`Unknown review round ${input.roundId}`);
  }
  if (input.unreadBy !== undefined && input.unreadBy.trim().length === 0) {
    throw new TypeError("Review query unreadBy must not be empty");
  }
  if (input.routePrefix !== undefined && input.routePrefix.length === 0) {
    throw new TypeError("Review query routePrefix must not be empty");
  }
  const limit = input.limit ?? kpDevReviewQueryLimits.defaultPageSize;
  if (!Number.isSafeInteger(limit) || limit < 1 || limit > kpDevReviewQueryLimits.maximumPageSize) {
    throw new RangeError(
      `Review query limit must be between 1 and ${kpDevReviewQueryLimits.maximumPageSize}`
    );
  }
  const afterSequence = input.afterSequence;
  if (afterSequence !== undefined && (!Number.isSafeInteger(afterSequence) || afterSequence < 0)) {
    throw new RangeError("Review query afterSequence must be a non-negative integer");
  }
  const selectedStatuses = input.statuses === undefined
    ? undefined
    : [...new Set(input.statuses)];
  if (selectedStatuses?.some((status) => !statuses.includes(status))) {
    throw new TypeError("Review query contains an unknown status");
  }
  return {
    scope: input.scope ?? "current",
    limit,
    detail: input.detail ?? "summary",
    ...(input.roundId === undefined ? {} : { roundId: input.roundId }),
    ...(selectedStatuses === undefined ? {} : { statuses: selectedStatuses }),
    ...(input.routePrefix === undefined ? {} : { routePrefix: input.routePrefix }),
    ...(afterSequence === undefined ? {} : { afterSequence }),
    ...(input.unreadBy === undefined ? {} : { unreadBy: input.unreadBy })
  };
}

function selectRoundIds(
  inbox: KpDevReviewInboxV2,
  scope: KpDevReviewQueryScope,
  roundId: string | undefined
): ReadonlySet<string> {
  if (roundId !== undefined) return new Set([roundId]);
  if (scope === "current") {
    return new Set(inbox.currentRoundId === undefined ? [] : [inbox.currentRoundId]);
  }
  if (scope === "historical") {
    return new Set(
      inbox.rounds
        .filter((round) => round.id !== inbox.currentRoundId)
        .map((round) => round.id)
    );
  }
  return new Set(inbox.rounds.map((round) => round.id));
}

function matches(
  note: KpDevReviewNoteV2,
  inbox: KpDevReviewInboxV2,
  query: KpDevReviewQueryResult["query"]
): boolean {
  if (query.statuses !== undefined && !query.statuses.includes(note.status)) return false;
  if (query.routePrefix !== undefined && !note.capture.route.startsWith(query.routePrefix)) {
    return false;
  }
  if (query.afterSequence !== undefined && note.sequence <= query.afterSequence) return false;
  if (query.unreadBy !== undefined) {
    const cursor = inbox.cursors[query.unreadBy]?.[note.roundId] ?? 0;
    if (note.sequence <= cursor) return false;
  }
  return true;
}

function summarizeCounts(
  inbox: KpDevReviewInboxV2,
  matching: number
): KpDevReviewQueryResult["counts"] {
  const current = inbox.notes.filter((note) => note.roundId === inbox.currentRoundId);
  const byStatus = Object.fromEntries(statuses.map((status) => [status, 0])) as Record<
    KpDevReviewStatusV1,
    number
  >;
  for (const note of inbox.notes) byStatus[note.status] += 1;
  return {
    lifetime: inbox.notes.length,
    current: current.length,
    currentNew: current.filter((note) => note.status === "new").length,
    historical: inbox.notes.length - current.length,
    matching,
    byStatus
  };
}

function summarizeRounds(inbox: KpDevReviewInboxV2): readonly KpDevReviewRoundQuerySummary[] {
  return inbox.rounds.map((round) => {
    const notes = inbox.notes.filter((note) => note.roundId === round.id);
    return {
      id: round.id,
      sequence: round.sequence,
      label: round.label,
      status: round.status,
      noteCount: notes.length,
      newCount: notes.filter((note) => note.status === "new").length
    };
  });
}

function compactEvidence(
  note: KpDevReviewNoteV2,
  detail: "summary" | "full"
): KpDevReviewCompactNoteEvidence {
  const semantic = note.capture.semantic;
  return {
    id: note.id,
    sequence: note.sequence,
    roundId: note.roundId,
    status: note.status,
    comment: note.comment,
    sessionId: note.sessionId,
    capturedAt: note.capture.capturedAt,
    route: note.capture.route,
    build: structuredClone(note.capture.environment.build),
    ...(semantic.checkpointId === undefined ? {} : { checkpointId: semantic.checkpointId }),
    ...(semantic.progressPermille === undefined
      ? {}
      : { progressPermille: semantic.progressPermille }),
    ...(semantic.activePhase === undefined ? {} : { activePhase: semantic.activePhase }),
    ...(detail === "full" ? { capture: structuredClone(note.capture) } : {})
  };
}
