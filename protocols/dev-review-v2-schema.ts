import {
  protocolArray,
  protocolBoolean,
  protocolEnum,
  protocolInteger,
  protocolLiteral,
  protocolObject,
  protocolOptional,
  protocolRecord,
  protocolRefine,
  protocolString,
  type ProtocolSchema
} from "./runtime-schema.ts";
import {
  kpDevReviewCaptureSchema,
  kpDevReviewProtocolLimits,
  kpDevReviewStatusSchema
} from "./dev-review-schema.ts";
import {
  KP_DEV_REVIEW_SCHEMA_VERSION_V2,
  type KpDevReviewCreateRequestV2,
  type KpDevReviewEventV2,
  type KpDevReviewInboxV2,
  type KpDevReviewNoteV2,
  type KpDevReviewRoundV2
} from "./dev-review-v2.ts";

const id = protocolString({
  minLength: 1,
  maxLength: kpDevReviewProtocolLimits.identifierCharacters,
  pattern: /^[a-zA-Z0-9][a-zA-Z0-9._:-]*$/
});
const isoTimestamp = protocolRefine(
  protocolString({ minLength: 20, maxLength: 40 }),
  (value) => !Number.isNaN(Date.parse(value)) && value.includes("T"),
  "expected ISO timestamp"
);
const reason = protocolOptional(protocolString({
  minLength: 1,
  maxLength: kpDevReviewProtocolLimits.reasonCharacters
}));

const reviewRoundShape = protocolObject({
  id,
  sequence: protocolInteger({ min: 1 }),
  label: protocolString({ minLength: 1, maxLength: 120 }),
  status: protocolEnum(["open", "closed"]),
  openedAt: isoTimestamp,
  closedAt: protocolOptional(isoTimestamp),
  baseline: protocolObject({
    commit: protocolString({ minLength: 1, maxLength: 256 }),
    fingerprint: protocolString({ minLength: 1, maxLength: 256 }),
    dirty: protocolBoolean()
  }),
  synthetic: protocolBoolean()
}) as ProtocolSchema<KpDevReviewRoundV2>;

export const kpDevReviewRoundV2Schema = protocolRefine(
  reviewRoundShape,
  (round) => round.status === "open"
    ? round.closedAt === undefined
    : round.closedAt !== undefined,
  "open rounds must omit closedAt and closed rounds must include it"
);

export const kpDevReviewCreateRequestV2Schema = protocolObject({
  schemaVersion: protocolLiteral(KP_DEV_REVIEW_SCHEMA_VERSION_V2),
  roundId: id,
  sessionId: id,
  comment: protocolRefine(
    protocolString({ minLength: 1, maxLength: kpDevReviewProtocolLimits.commentCharacters }),
    (value) => value.trim().length > 0,
    "expected non-blank comment"
  ),
  capture: kpDevReviewCaptureSchema
}) as ProtocolSchema<KpDevReviewCreateRequestV2>;

export const kpDevReviewNoteV2Schema = protocolObject({
  schemaVersion: protocolLiteral(KP_DEV_REVIEW_SCHEMA_VERSION_V2),
  roundId: id,
  sessionId: id,
  comment: protocolString({ minLength: 1, maxLength: kpDevReviewProtocolLimits.commentCharacters }),
  capture: kpDevReviewCaptureSchema,
  id,
  sequence: protocolInteger({ min: 1 }),
  status: kpDevReviewStatusSchema
}) as ProtocolSchema<KpDevReviewNoteV2>;

const roundOpened = protocolObject({
  schemaVersion: protocolLiteral(KP_DEV_REVIEW_SCHEMA_VERSION_V2),
  kind: protocolLiteral("round-opened"),
  occurredAt: isoTimestamp,
  round: kpDevReviewRoundV2Schema
});
const roundClosed = protocolObject({
  schemaVersion: protocolLiteral(KP_DEV_REVIEW_SCHEMA_VERSION_V2),
  kind: protocolLiteral("round-closed"),
  occurredAt: isoTimestamp,
  roundId: id,
  reason
});
const noteCreated = protocolObject({
  schemaVersion: protocolLiteral(KP_DEV_REVIEW_SCHEMA_VERSION_V2),
  kind: protocolLiteral("note-created"),
  occurredAt: isoTimestamp,
  note: kpDevReviewNoteV2Schema
});
const statusChanged = protocolObject({
  schemaVersion: protocolLiteral(KP_DEV_REVIEW_SCHEMA_VERSION_V2),
  kind: protocolLiteral("status-changed"),
  occurredAt: isoTimestamp,
  noteId: id,
  status: kpDevReviewStatusSchema,
  reason
});
const cursorAdvanced = protocolObject({
  schemaVersion: protocolLiteral(KP_DEV_REVIEW_SCHEMA_VERSION_V2),
  kind: protocolLiteral("cursor-advanced"),
  occurredAt: isoTimestamp,
  consumerId: id,
  roundId: id,
  throughSequence: protocolInteger({ min: 0 })
});

export const kpDevReviewEventV2Schema: ProtocolSchema<KpDevReviewEventV2> = {
  parse(input) {
    if (typeof input !== "object" || input === null || Array.isArray(input)) {
      return roundOpened.parse(input) as KpDevReviewEventV2;
    }
    const kind = (input as Record<string, unknown>)["kind"];
    if (kind === "round-opened") return roundOpened.parse(input) as KpDevReviewEventV2;
    if (kind === "round-closed") return roundClosed.parse(input) as KpDevReviewEventV2;
    if (kind === "note-created") return noteCreated.parse(input) as KpDevReviewEventV2;
    if (kind === "status-changed") return statusChanged.parse(input) as KpDevReviewEventV2;
    return cursorAdvanced.parse(input) as KpDevReviewEventV2;
  },
  safeParse(input) {
    try {
      return { success: true, value: this.parse(input) };
    } catch (error) {
      if (error instanceof Error && "issues" in error) {
        return {
          success: false,
          issues: (error as { issues: readonly { path: string; message: string }[] }).issues
        };
      }
      throw error;
    }
  }
};

export const kpDevReviewInboxV2Schema = protocolObject({
  schemaVersion: protocolLiteral(KP_DEV_REVIEW_SCHEMA_VERSION_V2),
  currentRoundId: protocolOptional(id),
  rounds: protocolArray(kpDevReviewRoundV2Schema, { maxLength: 10_000 }),
  notes: protocolArray(kpDevReviewNoteV2Schema, { maxLength: 10_000 }),
  cursors: protocolRecord(protocolRecord(protocolInteger({ min: 0 }), id), id)
}) as ProtocolSchema<KpDevReviewInboxV2>;
