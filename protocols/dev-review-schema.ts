import {
  protocolArray,
  protocolBoolean,
  protocolEnum,
  protocolInteger,
  protocolLiteral,
  protocolNumber,
  protocolObject,
  protocolOptional,
  protocolRecord,
  protocolRefine,
  protocolString,
  type ProtocolSchema
} from "./runtime-schema.ts";
import {
  KP_DEV_REVIEW_SCHEMA_VERSION,
  type KpDevReviewCreateRequestV1,
  type KpDevReviewEventV1
} from "./dev-review-v1.ts";

export const kpDevReviewProtocolLimits = Object.freeze({
  commentCharacters: 4_000,
  routeCharacters: 4_096,
  identifierCharacters: 192,
  reasonCharacters: 1_000,
  activeTransformations: 32,
  focusRefs: 64,
  ownerIds: 128,
  temporalSamples: 180
});

const id = protocolString({
  minLength: 1,
  maxLength: kpDevReviewProtocolLimits.identifierCharacters,
  pattern: /^[a-zA-Z0-9][a-zA-Z0-9._:-]*$/
});
const optionalId = protocolOptional(id);
const boundedText = protocolString({ minLength: 1, maxLength: 256 });
const optionalText = protocolOptional(boundedText);
const isoTimestamp = protocolRefine(
  protocolString({ minLength: 20, maxLength: 40 }),
  (value) => !Number.isNaN(Date.parse(value)) && value.includes("T"),
  "expected ISO timestamp"
);
const route = protocolRefine(
  protocolString({ minLength: 1, maxLength: kpDevReviewProtocolLimits.routeCharacters }),
  // Protocol schemas compile without DOM globals, so the wire boundary validates
  // the only route property it needs: an explicit, absolute HTTP(S) origin.
  (value) => /^https?:\/\/[^\s/$.?#].[^\s]*$/i.test(value),
  "expected http(s) URL"
);
const point = protocolObject({ x: protocolNumber(), y: protocolNumber() });
const rect = protocolObject({
  left: protocolNumber(),
  top: protocolNumber(),
  width: protocolNumber({ min: 0 }),
  height: protocolNumber({ min: 0 })
});
const target = protocolObject({
  selectorId: optionalId,
  objectId: optionalId,
  transformationId: optionalId,
  materialOwnerId: optionalId,
  normalizedPoint: protocolOptional(protocolObject({
    x: protocolNumber({ min: 0, max: 1 }),
    y: protocolNumber({ min: 0, max: 1 })
  })),
  viewportRect: protocolOptional(rect),
  pagePoint: protocolOptional(point)
});
const environment = protocolObject({
  browserName: boundedText,
  browserVersion: optionalText,
  platform: optionalText,
  language: boundedText,
  viewport: protocolObject({
    width: protocolNumber({ min: 1, max: 100_000 }),
    height: protocolNumber({ min: 1, max: 100_000 }),
    devicePixelRatio: protocolNumber({ min: 0.1, max: 20 }),
    scrollX: protocolNumber(),
    scrollY: protocolNumber()
  }),
  reducedMotion: protocolBoolean(),
  forcedColors: protocolBoolean(),
  colorScheme: protocolEnum(["light", "dark"]),
  build: protocolObject({
    commit: boundedText,
    fingerprint: boundedText,
    dirty: protocolBoolean()
  })
});
const semantic = protocolObject({
  documentId: optionalId,
  documentVersion: optionalText,
  assetId: optionalId,
  checkpointId: optionalId,
  progressPermille: protocolOptional(protocolInteger({ min: 0, max: 1_000 })),
  projectionId: optionalId,
  activeTransformationIds: protocolArray(id, {
    maxLength: kpDevReviewProtocolLimits.activeTransformations
  }),
  activePhase: optionalText,
  focusSource: optionalText,
  focusRefs: protocolArray(id, { maxLength: kpDevReviewProtocolLimits.focusRefs }),
  motionPreference: optionalText,
  motionMode: optionalText,
  playbackDirection: protocolOptional(protocolEnum(["forward", "rewind"])),
  target: protocolOptional(target)
});
const render = protocolObject({
  rendererId: optionalId,
  motionAuthority: optionalText,
  fitStatus: optionalText,
  fitScale: protocolOptional(protocolNumber({ min: 0.01, max: 10 })),
  layoutRevision: protocolOptional(protocolInteger({ min: 0 })),
  layoutReadCount: protocolOptional(protocolInteger({ min: 0 })),
  fontRevision: protocolOptional(protocolInteger({ min: 0 })),
  fontReady: protocolOptional(protocolBoolean()),
  ownerIds: protocolArray(id, { maxLength: kpDevReviewProtocolLimits.ownerIds })
});
const temporalSample = protocolObject({
  offsetMs: protocolNumber({ min: -60_000, max: 0 }),
  progressPermille: protocolOptional(protocolInteger({ min: 0, max: 1_000 })),
  frameIntervalMs: protocolOptional(protocolNumber({ min: 0, max: 60_000 })),
  scrollDeltaY: protocolOptional(protocolNumber({ min: -100_000, max: 100_000 })),
  transitionId: optionalId,
  phase: optionalText,
  layoutRevision: protocolOptional(protocolInteger({ min: 0 }))
});
export const kpDevReviewCaptureSchema = protocolObject({
  route,
  capturedAt: isoTimestamp,
  environment,
  semantic,
  render,
  temporalTrace: protocolArray(temporalSample, {
    maxLength: kpDevReviewProtocolLimits.temporalSamples
  })
});

export const kpDevReviewCreateRequestSchema = protocolObject({
  schemaVersion: protocolLiteral(KP_DEV_REVIEW_SCHEMA_VERSION),
  sessionId: id,
  comment: protocolRefine(
    protocolString({ minLength: 1, maxLength: kpDevReviewProtocolLimits.commentCharacters }),
    (value) => value.trim().length > 0,
    "expected non-blank comment"
  ),
  capture: kpDevReviewCaptureSchema
}) as ProtocolSchema<KpDevReviewCreateRequestV1>;

export const kpDevReviewStatusSchema = protocolEnum([
  "new", "discussed", "grouped", "accepted", "fixed", "verified", "dismissed"
]);
export const kpDevReviewNoteSchema = protocolObject({
  schemaVersion: protocolLiteral(KP_DEV_REVIEW_SCHEMA_VERSION),
  sessionId: id,
  comment: protocolString({ minLength: 1, maxLength: kpDevReviewProtocolLimits.commentCharacters }),
  capture: kpDevReviewCaptureSchema,
  id,
  sequence: protocolInteger({ min: 1 }),
  status: kpDevReviewStatusSchema
});
const noteCreated = protocolObject({
  schemaVersion: protocolLiteral(KP_DEV_REVIEW_SCHEMA_VERSION),
  kind: protocolLiteral("note-created"),
  occurredAt: isoTimestamp,
  note: kpDevReviewNoteSchema
});
const statusChanged = protocolObject({
  schemaVersion: protocolLiteral(KP_DEV_REVIEW_SCHEMA_VERSION),
  kind: protocolLiteral("status-changed"),
  occurredAt: isoTimestamp,
  noteId: id,
  status: kpDevReviewStatusSchema,
  reason: protocolOptional(protocolString({
    minLength: 1,
    maxLength: kpDevReviewProtocolLimits.reasonCharacters
  }))
});
const cursorAdvanced = protocolObject({
  schemaVersion: protocolLiteral(KP_DEV_REVIEW_SCHEMA_VERSION),
  kind: protocolLiteral("cursor-advanced"),
  occurredAt: isoTimestamp,
  consumerId: id,
  throughSequence: protocolInteger({ min: 0 })
});

export const kpDevReviewEventSchema: ProtocolSchema<KpDevReviewEventV1> = {
  parse(input) {
    if (typeof input !== "object" || input === null || Array.isArray(input)) {
      return noteCreated.parse(input) as KpDevReviewEventV1;
    }
    const kind = (input as Record<string, unknown>)["kind"];
    if (kind === "note-created") return noteCreated.parse(input) as KpDevReviewEventV1;
    if (kind === "status-changed") return statusChanged.parse(input) as KpDevReviewEventV1;
    return cursorAdvanced.parse(input) as KpDevReviewEventV1;
  },
  safeParse(input) {
    try {
      return { success: true, value: this.parse(input) };
    } catch (error) {
      if (error instanceof Error && "issues" in error) {
        return { success: false, issues: (error as { issues: readonly { path: string; message: string }[] }).issues };
      }
      throw error;
    }
  }
};

export const kpDevReviewInboxSchema = protocolObject({
  schemaVersion: protocolLiteral(KP_DEV_REVIEW_SCHEMA_VERSION),
  notes: protocolArray(kpDevReviewNoteSchema, { maxLength: 10_000 }),
  cursors: protocolRecord(protocolInteger({ min: 0 }), id)
});
