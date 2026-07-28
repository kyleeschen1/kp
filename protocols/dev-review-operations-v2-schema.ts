import {
  protocolArray,
  protocolBoolean,
  protocolEnum,
  protocolInteger,
  protocolLiteral,
  protocolNumber,
  protocolObject,
  protocolOptional,
  protocolRefine,
  protocolString,
  type ProtocolSchema
} from "./runtime-schema.ts";
import {
  kpDevReviewCaptureSchema,
  kpDevReviewProtocolLimits,
  kpDevReviewStatusSchema
} from "./dev-review-schema.ts";
import { kpDevReviewRoundV2Schema } from "./dev-review-v2-schema.ts";
import type {
  KpDevReviewAdvanceCursorOperationV2,
  KpDevReviewCloseRoundOperationV2,
  KpDevReviewOpenRoundOperationV2,
  KpDevReviewOperationSuccessV2,
  KpDevReviewQueryInput,
  KpDevReviewQueryResult,
  KpDevReviewSetStatusOperationV2
} from "./dev-review-operations-v2.ts";

const id = protocolString({
  minLength: 1,
  maxLength: kpDevReviewProtocolLimits.identifierCharacters,
  pattern: /^[a-zA-Z0-9][a-zA-Z0-9._:-]*$/
});
const optionalReason = protocolOptional(protocolString({
  minLength: 1,
  maxLength: kpDevReviewProtocolLimits.reasonCharacters
}));
const optionalNonNegativeInteger = protocolOptional(protocolInteger({ min: 0 }));

export const kpDevReviewQueryInputSchema = protocolRefine(
  protocolObject({
    scope: protocolOptional(protocolEnum(["current", "historical", "all"])),
    roundId: protocolOptional(id),
    statuses: protocolOptional(protocolArray(kpDevReviewStatusSchema, { maxLength: 7 })),
    routePrefix: protocolOptional(protocolString({ minLength: 1, maxLength: 2_048 })),
    afterSequence: optionalNonNegativeInteger,
    unreadBy: protocolOptional(id),
    limit: protocolOptional(protocolInteger({ min: 1, max: 100 })),
    detail: protocolOptional(protocolEnum(["summary", "full"]))
  }) as ProtocolSchema<KpDevReviewQueryInput>,
  (query) => query.scope === undefined || query.roundId === undefined,
  "scope and roundId cannot be combined"
);

export const kpDevReviewOpenRoundOperationV2Schema = protocolObject({
  label: protocolString({ minLength: 1, maxLength: 120 }),
  baseline: protocolObject({
    commit: protocolString({ minLength: 1, maxLength: 256 }),
    fingerprint: protocolString({ minLength: 1, maxLength: 256 }),
    dirty: protocolBoolean()
  })
}) as ProtocolSchema<KpDevReviewOpenRoundOperationV2>;

export const kpDevReviewCloseRoundOperationV2Schema = protocolObject({
  roundId: protocolOptional(id),
  reason: optionalReason
}) as ProtocolSchema<KpDevReviewCloseRoundOperationV2>;

export const kpDevReviewSetStatusOperationV2Schema = protocolObject({
  noteId: id,
  status: kpDevReviewStatusSchema,
  reason: optionalReason
}) as ProtocolSchema<KpDevReviewSetStatusOperationV2>;

export const kpDevReviewAdvanceCursorOperationV2Schema = protocolObject({
  consumerId: id,
  roundId: id,
  throughSequence: protocolInteger({ min: 0 })
}) as ProtocolSchema<KpDevReviewAdvanceCursorOperationV2>;

export const kpDevReviewOperationSuccessV2Schema = protocolObject({
  ok: protocolLiteral(true)
}) as ProtocolSchema<KpDevReviewOperationSuccessV2>;

const build = protocolObject({
  commit: protocolString({ minLength: 1, maxLength: 256 }),
  fingerprint: protocolString({ minLength: 1, maxLength: 256 }),
  dirty: protocolBoolean()
});
const normalizedQuery = protocolObject({
  scope: protocolEnum(["current", "historical", "all"]),
  roundId: protocolOptional(id),
  statuses: protocolOptional(protocolArray(kpDevReviewStatusSchema, { maxLength: 7 })),
  routePrefix: protocolOptional(protocolString({ minLength: 1, maxLength: 2_048 })),
  afterSequence: optionalNonNegativeInteger,
  unreadBy: protocolOptional(id),
  limit: protocolInteger({ min: 1, max: 100 }),
  detail: protocolEnum(["summary", "full"])
});
const statusCounts = protocolObject({
  new: protocolInteger({ min: 0 }),
  discussed: protocolInteger({ min: 0 }),
  grouped: protocolInteger({ min: 0 }),
  accepted: protocolInteger({ min: 0 }),
  fixed: protocolInteger({ min: 0 }),
  verified: protocolInteger({ min: 0 }),
  dismissed: protocolInteger({ min: 0 })
});
const compactEvidence = protocolObject({
  id,
  sequence: protocolInteger({ min: 1 }),
  roundId: id,
  status: kpDevReviewStatusSchema,
  comment: protocolString({ minLength: 1, maxLength: kpDevReviewProtocolLimits.commentCharacters }),
  sessionId: id,
  capturedAt: protocolString({ minLength: 20, maxLength: 40 }),
  route: protocolString({ minLength: 1, maxLength: 2_048 }),
  build,
  checkpointId: protocolOptional(id),
  progressPermille: protocolOptional(protocolInteger({ min: 0, max: 1_000 })),
  animationProgressPermille:
    protocolOptional(protocolInteger({ min: 0, max: 1_000 })),
  phaseProgressPermille:
    protocolOptional(protocolInteger({ min: 0, max: 1_000 })),
  activeNodeId: protocolOptional(id),
  activePhase: protocolOptional(id),
  foldMode: protocolOptional(id),
  surfaceProfile: protocolOptional(id),
  surfaceViewport: protocolOptional(protocolObject({
    width: protocolNumber({ min: 1, max: 100_000 }),
    height: protocolNumber({ min: 1, max: 100_000 }),
    devicePixelRatio: protocolNumber({ min: 0.1, max: 20 })
  })),
  capture: protocolOptional(kpDevReviewCaptureSchema)
});

export const kpDevReviewQueryResultSchema = protocolObject({
  query: normalizedQuery,
  counts: protocolObject({
    lifetime: protocolInteger({ min: 0 }),
    current: protocolInteger({ min: 0 }),
    currentNew: protocolInteger({ min: 0 }),
    historical: protocolInteger({ min: 0 }),
    matching: protocolInteger({ min: 0 }),
    byStatus: statusCounts
  }),
  rounds: protocolArray(protocolObject({
    id,
    sequence: protocolInteger({ min: 1 }),
    label: protocolString({ minLength: 1, maxLength: 120 }),
    status: protocolEnum(["open", "closed"]),
    synthetic: protocolBoolean(),
    noteCount: protocolInteger({ min: 0 }),
    newCount: protocolInteger({ min: 0 })
  }), { maxLength: 10_000 }),
  page: protocolObject({
    notes: protocolArray(compactEvidence, { maxLength: 100 }),
    hasMore: protocolBoolean(),
    nextAfterSequence: optionalNonNegativeInteger
  })
}) as ProtocolSchema<KpDevReviewQueryResult>;

export { kpDevReviewRoundV2Schema };
