import type {
  KpDevReviewCompactNoteEvidence
} from "../../protocols/dev-review-operations-v2.ts";
import type {
  KpAnimationReviewState
} from "./semantic-animation-workbench-lifecycle.ts";
import type {
  KpCanonicalAnimationIdentity
} from "./semantic-animation-workbench-identity.ts";

export interface KpAnimationReviewEvidence {
  readonly captureIdentity: string;
  readonly animationId: string;
  readonly noteId: string;
  readonly sequence: number;
  readonly roundId: string;
  readonly current: boolean;
  readonly status: KpDevReviewCompactNoteEvidence["status"];
  readonly comment: string;
  readonly sessionId: string;
  readonly capturedAt: string;
  readonly route: string;
  readonly buildFingerprint: string;
  readonly checkpointId?: string;
  readonly progressPermille?: number;
  readonly activePhase?: string;
}

export interface KpAnimationReviewProjection {
  readonly animationId: string;
  readonly state: KpAnimationReviewState;
  readonly current: readonly KpAnimationReviewEvidence[];
  readonly historical: readonly KpAnimationReviewEvidence[];
}

export interface KpAnimationReviewDiagnostic {
  readonly code: "ambiguous-note-identity";
  readonly noteId: string;
  readonly animationIds: readonly string[];
  readonly message: string;
}

export interface KpAnimationReviewAdapterResult {
  readonly projections: readonly KpAnimationReviewProjection[];
  readonly unscopedNoteIds: readonly string[];
  readonly diagnostics: readonly KpAnimationReviewDiagnostic[];
}

export function projectKpAnimationReviewEvidence(input: {
  readonly identities: readonly KpCanonicalAnimationIdentity[];
  readonly notes: readonly KpDevReviewCompactNoteEvidence[];
  readonly currentRoundId?: string;
}): KpAnimationReviewAdapterResult {
  const evidenceByAnimation = new Map<string, KpAnimationReviewEvidence[]>();
  const unscopedNoteIds: string[] = [];
  const diagnostics: KpAnimationReviewDiagnostic[] = [];

  for (const note of input.notes) {
    const animationIds = matchingAnimationIds(note, input.identities);
    if (animationIds.length === 0) {
      unscopedNoteIds.push(note.id);
      continue;
    }
    if (animationIds.length > 1) {
      diagnostics.push({
        code: "ambiguous-note-identity",
        noteId: note.id,
        animationIds,
        message:
          `Review note ${note.id} matches multiple animations: ${animationIds.join(", ")}.`
      });
      continue;
    }

    const animationId = animationIds[0]!;
    const evidence = createEvidence(
      animationId,
      note,
      note.roundId === input.currentRoundId
    );
    const group = evidenceByAnimation.get(animationId) ?? [];
    group.push(evidence);
    evidenceByAnimation.set(animationId, group);
  }

  const projections = [...evidenceByAnimation.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([animationId, evidence]) => {
      const ordered = [...evidence].sort(
        (left, right) => left.sequence - right.sequence
      );
      const current = ordered.filter((item) => item.current);
      return {
        animationId,
        state: reviewState(current),
        current,
        historical: ordered.filter((item) => !item.current)
      };
    });

  return {
    projections,
    unscopedNoteIds,
    diagnostics
  };
}

function matchingAnimationIds(
  note: KpDevReviewCompactNoteEvidence,
  identities: readonly KpCanonicalAnimationIdentity[]
): readonly string[] {
  const claims = noteClaims(note);
  return identities
    .filter((identity) => {
      const identityClaims = [identity.animationId, ...identity.aliases];
      return claims.some((claim) =>
        identityClaims.some(
          (identityClaim) =>
            claim === identityClaim ||
            claim.startsWith(`${identityClaim}.forward.`) ||
            claim.startsWith(`${identityClaim}.rewind.`)
        )
      );
    })
    .map((identity) => identity.animationId);
}

function noteClaims(
  note: KpDevReviewCompactNoteEvidence
): readonly string[] {
  const route = new URL(note.route, "http://kp.local");
  return [
    note.capture?.semantic.assetId,
    note.activePhase,
    route.searchParams.get("animation") ?? undefined
  ].filter((claim): claim is string => claim !== undefined && claim !== "");
}

function createEvidence(
  animationId: string,
  note: KpDevReviewCompactNoteEvidence,
  current: boolean
): KpAnimationReviewEvidence {
  return {
    captureIdentity:
      `${note.roundId}:${note.id}:${note.sequence}:${note.build.fingerprint}`,
    animationId,
    noteId: note.id,
    sequence: note.sequence,
    roundId: note.roundId,
    current,
    status: note.status,
    comment: note.comment,
    sessionId: note.sessionId,
    capturedAt: note.capturedAt,
    route: note.route,
    buildFingerprint: note.build.fingerprint,
    ...(note.checkpointId === undefined
      ? {}
      : { checkpointId: note.checkpointId }),
    ...(note.progressPermille === undefined
      ? {}
      : { progressPermille: note.progressPermille }),
    ...(note.activePhase === undefined
      ? {}
      : { activePhase: note.activePhase })
  };
}

function reviewState(
  current: readonly KpAnimationReviewEvidence[]
): KpAnimationReviewState {
  const latest = [...current]
    .reverse()
    .find((evidence) => evidence.status !== "dismissed");
  switch (latest?.status) {
    case "new":
    case "discussed":
    case "grouped":
    case "accepted":
      return "changes-requested";
    case "fixed":
      return "awaiting-review";
    case "verified":
      return "approved";
    default:
      return "unreviewed";
  }
}
