declare const kpVerifiedStateRetentionProjectionBrand: unique symbol;

export const KP_STATE_RETENTION_PROJECTION_AUTHORITY =
  "compiler.semantic.state-retention-projection.v1" as const;

export type KpStateRetentionPolicy =
  | "replacement"
  | "equivalence-frame"
  | "derivation-trail";

export interface KpStateRetentionSemanticReferent {
  readonly id: string;
  readonly meaningId: string;
}

export interface KpStateRetentionRepresentationOccurrence {
  readonly id: string;
  readonly stateId: string;
  readonly kind:
    | "source-state"
    | "target-state"
    | "relation"
    | "historical-state";
  readonly referentIds: readonly string[];
}

export interface KpStateRetentionHistoricalSnapshot {
  readonly id: string;
  readonly stateId: string;
  readonly occurrenceIds: readonly string[];
}

interface KpStateRetentionProjectionDraftBase {
  readonly schemaVersion: "kp.state-retention-projection-draft.v1";
  readonly id: string;
  readonly semanticTransitionId: string;
  readonly referents: readonly KpStateRetentionSemanticReferent[];
  readonly sourceOccurrence: KpStateRetentionRepresentationOccurrence;
  readonly targetOccurrence: KpStateRetentionRepresentationOccurrence;
  readonly selectedOccurrenceId: string;
}

export type KpStateRetentionProjectionDraft =
  | (KpStateRetentionProjectionDraftBase & Readonly<{
      policy: "replacement";
      historicalSnapshots: readonly [];
    }>)
  | (KpStateRetentionProjectionDraftBase & Readonly<{
      policy: "equivalence-frame";
      relationOccurrence: KpStateRetentionRepresentationOccurrence;
      historicalSnapshots: readonly [];
    }>)
  | (KpStateRetentionProjectionDraftBase & Readonly<{
      policy: "derivation-trail";
      historicalOccurrences:
        readonly KpStateRetentionRepresentationOccurrence[];
      historicalSnapshots: readonly KpStateRetentionHistoricalSnapshot[];
    }>);

export interface KpStateRetentionTransitOccurrence {
  readonly id: string;
  readonly stateId: string;
  readonly kind: "live-transition";
  readonly referentIds: readonly string[];
}

export interface KpStateRetentionPaintClaim {
  readonly paintOccurrenceId: string;
  readonly representationOccurrenceId: string;
  readonly ownerId: string;
  readonly ownerKind:
    | "native-source"
    | "frozen-native-context"
    | "native-relation"
    | "live-transition"
    | "native-target";
}

export interface KpStateRetentionPaintFrame {
  readonly phase: "source" | "transition" | "settled";
  readonly claims: readonly KpStateRetentionPaintClaim[];
}

export type KpVerifiedStateRetentionProjection = Readonly<{
  schemaVersion: "kp.verified-state-retention-projection.v1";
  kind: "verified-state-retention-projection";
  authority: typeof KP_STATE_RETENTION_PROJECTION_AUTHORITY;
  id: string;
  policy: KpStateRetentionPolicy;
  semanticTransitionId: string;
  referents: readonly KpStateRetentionSemanticReferent[];
  occurrences: readonly (
    KpStateRetentionRepresentationOccurrence |
    KpStateRetentionTransitOccurrence
  )[];
  historicalSnapshots: readonly KpStateRetentionHistoricalSnapshot[];
  transitOccurrence: KpStateRetentionTransitOccurrence;
  paintFrames: readonly [KpStateRetentionPaintFrame,
    KpStateRetentionPaintFrame, KpStateRetentionPaintFrame];
  selection: Readonly<{
    occurrenceId: string;
    referentIds: readonly string[];
  }>;
  readonly [kpVerifiedStateRetentionProjectionBrand]: true;
}>;

export type KpStateRetentionProjectionErrorCode =
  | "state-retention.unexpected-field"
  | "state-retention.duplicate-id"
  | "state-retention.unknown-referent"
  | "state-retention.invalid-occurrence-role"
  | "state-retention.invalid-history"
  | "state-retention.invalid-selection"
  | "state-retention.paint-owner-conflict";

export class KpStateRetentionProjectionError extends Error {
  override readonly name = "KpStateRetentionProjectionError";
  readonly code: KpStateRetentionProjectionErrorCode;

  constructor(code: KpStateRetentionProjectionErrorCode, message: string) {
    super(message);
    this.code = code;
  }
}

const verifiedProjections = new WeakSet<object>();

/**
 * Retention changes representation topology only. It never clones semantic
 * authority or lets one paint occurrence occupy two visible positions.
 */
export function compileKpStateRetentionProjection(
  draft: KpStateRetentionProjectionDraft
): KpVerifiedStateRetentionProjection {
  assertDataOnly(draft, "projection");
  assertDraftShape(draft);
  requireId(draft.id, "projection.id");
  requireId(draft.semanticTransitionId, "projection.semanticTransitionId");
  const referentIds = uniqueIds(draft.referents.map(({ id }) => id),
    "semantic referent");
  draft.referents.forEach((referent) => {
    requireId(referent.id, "referent.id");
    requireId(referent.meaningId, "referent.meaningId");
  });

  validateOccurrence(draft.sourceOccurrence, "source-state", referentIds);
  validateOccurrence(draft.targetOccurrence, "target-state", referentIds);
  const authoredOccurrences: KpStateRetentionRepresentationOccurrence[] = [
    draft.sourceOccurrence,
    draft.targetOccurrence
  ];
  if (draft.policy === "equivalence-frame") {
    validateOccurrence(draft.relationOccurrence, "relation", referentIds);
    authoredOccurrences.push(draft.relationOccurrence);
  }
  if (draft.policy === "derivation-trail") {
    if (draft.historicalSnapshots.length === 0 ||
        draft.historicalOccurrences.length === 0) {
      fail("state-retention.invalid-history",
        "A derivation trail requires at least one historical snapshot.");
    }
    draft.historicalOccurrences.forEach((occurrence) => {
      validateOccurrence(occurrence, "historical-state", referentIds);
      authoredOccurrences.push(occurrence);
    });
    validateHistory(draft.historicalSnapshots,
      draft.historicalOccurrences);
  }
  uniqueIds(authoredOccurrences.map(({ id }) => id),
    "representation occurrence");

  const transitOccurrence = deepFreeze({
    id: `occurrence.transit.${draft.id}`,
    stateId: draft.semanticTransitionId,
    kind: "live-transition" as const,
    referentIds: Object.freeze([...new Set([
      ...draft.sourceOccurrence.referentIds,
      ...draft.targetOccurrence.referentIds
    ])])
  });
  if (authoredOccurrences.some(({ id }) => id === transitOccurrence.id)) {
    fail("state-retention.duplicate-id",
      `Transit occurrence ${transitOccurrence.id} collides with authored identity.`);
  }
  const occurrences = Object.freeze([
    ...authoredOccurrences.map(deepCopyOccurrence),
    transitOccurrence
  ]);
  const paintFrames = createPaintFrames(draft, transitOccurrence);
  const settledOccurrenceIds = new Set(
    paintFrames[2].claims.map(({ representationOccurrenceId }) =>
      representationOccurrenceId)
  );
  if (!settledOccurrenceIds.has(draft.selectedOccurrenceId)) {
    fail("state-retention.invalid-selection",
      "Selection must reference an occurrence visible in the settled frame.");
  }
  const selected = occurrences.find(({ id }) =>
    id === draft.selectedOccurrenceId)!;
  const projection = deepFreeze({
    schemaVersion: "kp.verified-state-retention-projection.v1" as const,
    kind: "verified-state-retention-projection" as const,
    authority: KP_STATE_RETENTION_PROJECTION_AUTHORITY,
    id: draft.id,
    policy: draft.policy,
    semanticTransitionId: draft.semanticTransitionId,
    referents: draft.referents.map((referent) => ({ ...referent })),
    occurrences,
    historicalSnapshots: draft.historicalSnapshots.map((snapshot) => ({
      ...snapshot,
      occurrenceIds: [...snapshot.occurrenceIds]
    })),
    transitOccurrence,
    paintFrames,
    selection: {
      occurrenceId: selected.id,
      referentIds: [...selected.referentIds]
    }
  }) as unknown as KpVerifiedStateRetentionProjection;
  verifiedProjections.add(projection);
  return projection;
}

export function isKpVerifiedStateRetentionProjection(
  value: unknown
): value is KpVerifiedStateRetentionProjection {
  return typeof value === "object" && value !== null &&
    verifiedProjections.has(value);
}

function createPaintFrames(
  draft: KpStateRetentionProjectionDraft,
  transit: KpStateRetentionTransitOccurrence
): KpVerifiedStateRetentionProjection["paintFrames"] {
  const retained = draft.policy === "equivalence-frame"
    ? [claim(draft.sourceOccurrence, "frozen-native-context"),
        claim(draft.relationOccurrence, "native-relation")]
    : draft.policy === "derivation-trail"
      ? draft.historicalOccurrences.map((occurrence) =>
          claim(occurrence, "frozen-native-context"))
      : [];
  const frames = [
    frame("source", [
      ...(draft.policy === "derivation-trail" ? retained : []),
      claim(draft.sourceOccurrence, "native-source")
    ]),
    frame("transition", [
      ...retained,
      claim(transit, "live-transition")
    ]),
    frame("settled", [
      ...retained,
      claim(draft.targetOccurrence, "native-target")
    ])
  ] as const;
  frames.forEach(validateExclusivePaint);
  return Object.freeze(frames);
}

function claim(
  occurrence: KpStateRetentionRepresentationOccurrence |
    KpStateRetentionTransitOccurrence,
  ownerKind: KpStateRetentionPaintClaim["ownerKind"]
): KpStateRetentionPaintClaim {
  return Object.freeze({
    paintOccurrenceId: `paint.${occurrence.id}`,
    representationOccurrenceId: occurrence.id,
    ownerId: `owner.${ownerKind}.${occurrence.id}`,
    ownerKind
  });
}

function frame(
  phase: KpStateRetentionPaintFrame["phase"],
  claims: readonly KpStateRetentionPaintClaim[]
): KpStateRetentionPaintFrame {
  return Object.freeze({ phase, claims: Object.freeze([...claims]) });
}

function validateExclusivePaint(frame: KpStateRetentionPaintFrame): void {
  const paint = new Set<string>();
  const owners = new Set<string>();
  for (const claim of frame.claims) {
    if (paint.has(claim.paintOccurrenceId) || owners.has(claim.ownerId)) {
      fail("state-retention.paint-owner-conflict",
        `Frame ${frame.phase} contains duplicate paint ownership.`);
    }
    paint.add(claim.paintOccurrenceId);
    owners.add(claim.ownerId);
  }
}

function validateHistory(
  snapshots: readonly KpStateRetentionHistoricalSnapshot[],
  occurrences: readonly KpStateRetentionRepresentationOccurrence[]
): void {
  uniqueIds(snapshots.map(({ id }) => id), "historical snapshot");
  const byId = new Map(occurrences.map((occurrence) =>
    [occurrence.id, occurrence]));
  const claimed = new Set<string>();
  for (const snapshot of snapshots) {
    requireId(snapshot.id, "snapshot.id");
    requireId(snapshot.stateId, "snapshot.stateId");
    if (snapshot.occurrenceIds.length === 0) {
      fail("state-retention.invalid-history",
        `Snapshot ${snapshot.id} contains no occurrences.`);
    }
    for (const occurrenceId of snapshot.occurrenceIds) {
      const occurrence = byId.get(occurrenceId);
      if (occurrence === undefined || occurrence.stateId !== snapshot.stateId ||
          claimed.has(occurrenceId)) {
        fail("state-retention.invalid-history",
          `Snapshot ${snapshot.id} does not exclusively own ${occurrenceId}.`);
      }
      claimed.add(occurrenceId);
    }
  }
  if (claimed.size !== occurrences.length) {
    fail("state-retention.invalid-history",
      "Every historical occurrence must belong to exactly one snapshot.");
  }
}

function validateOccurrence(
  occurrence: KpStateRetentionRepresentationOccurrence,
  kind: KpStateRetentionRepresentationOccurrence["kind"],
  referentIds: ReadonlySet<string>
): void {
  requireId(occurrence.id, "occurrence.id");
  requireId(occurrence.stateId, "occurrence.stateId");
  if (occurrence.kind !== kind) {
    fail("state-retention.invalid-occurrence-role",
      `${occurrence.id} must be ${kind}.`);
  }
  uniqueIds(occurrence.referentIds, `${occurrence.id} referent`);
  occurrence.referentIds.forEach((id) => {
    if (!referentIds.has(id)) {
      fail("state-retention.unknown-referent",
        `${occurrence.id} references unknown semantic referent ${id}.`);
    }
  });
}

function assertDraftShape(draft: KpStateRetentionProjectionDraft): void {
  const common = ["schemaVersion", "id", "policy", "semanticTransitionId",
    "referents", "sourceOccurrence", "targetOccurrence",
    "selectedOccurrenceId", "historicalSnapshots"];
  const expected = draft.policy === "equivalence-frame"
    ? [...common, "relationOccurrence"]
    : draft.policy === "derivation-trail"
      ? [...common, "historicalOccurrences"]
      : common;
  const actual = Object.keys(draft).sort();
  const wanted = expected.sort();
  if (actual.length !== wanted.length ||
      actual.some((key, index) => key !== wanted[index])) {
    fail("state-retention.unexpected-field",
      `Projection ${draft.id} has unsupported fields.`);
  }
}

function assertDataOnly(value: unknown, path: string): void {
  if (typeof value === "function") {
    fail("state-retention.unexpected-field", `${path} cannot contain functions.`);
  }
  if (Array.isArray(value)) {
    value.forEach((entry, index) => assertDataOnly(entry, `${path}.${index}`));
  } else if (value !== null && typeof value === "object") {
    Object.entries(value).forEach(([key, entry]) => {
      if (/geometry|timing|keyframe|opacity|duration|renderer|domNode/iu
        .test(key)) {
        fail("state-retention.unexpected-field",
          `${path}.${key} is presentation authority.`);
      }
      assertDataOnly(entry, `${path}.${key}`);
    });
  }
}

function uniqueIds(values: readonly string[], label: string): ReadonlySet<string> {
  values.forEach((value) => requireId(value, label));
  const unique = new Set(values);
  if (unique.size !== values.length) {
    fail("state-retention.duplicate-id", `Duplicate ${label} ID.`);
  }
  return unique;
}

function requireId(value: string, path: string): void {
  if (typeof value !== "string" || value.trim().length === 0) {
    fail("state-retention.unexpected-field", `${path} requires an ID.`);
  }
}

function deepCopyOccurrence(
  occurrence: KpStateRetentionRepresentationOccurrence
): KpStateRetentionRepresentationOccurrence {
  return Object.freeze({
    ...occurrence,
    referentIds: Object.freeze([...occurrence.referentIds])
  });
}

function fail(code: KpStateRetentionProjectionErrorCode,
  message: string): never {
  throw new KpStateRetentionProjectionError(code, message);
}

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === "object") {
    Object.values(value as Record<string, unknown>).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
}
