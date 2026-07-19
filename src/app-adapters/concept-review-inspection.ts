import {
  protocolArray,
  protocolInteger,
  protocolLiteral,
  protocolObject,
  protocolSchema,
  protocolString,
  type InferProtocolSchema
} from "../../protocols/public-api.ts";

const checkpointSchema = protocolObject({
  id: protocolString({ pattern: /^[a-z0-9]+(?:-[a-z0-9]+)*$/ }),
  anchor: protocolString({ pattern: /^checkpoint-[a-z0-9]+(?:-[a-z0-9]+)*$/ }),
  progressPermille: protocolInteger({ min: 0, max: 1000 }),
  frameId: protocolString({ pattern: /^[a-z0-9]+(?:[.-][a-z0-9]+)*$/ }),
  equationSemanticId: protocolString({ pattern: /^[a-z0-9]+(?:[.-][a-z0-9]+)*$/ }),
  semanticRefs: protocolArray(protocolString({ pattern: /^[a-z0-9]+(?:[.-][a-z0-9]+)*$/ })),
  exploreUrl: protocolString({ pattern: /^\/concepts\/[a-z0-9/-]+\?/ })
});

const conceptReviewInspectionBaseSchema = protocolObject({
  schemaVersion: protocolLiteral("kp.concept-review-inspection.v1"),
  conceptId: protocolString({ pattern: /^[a-z0-9]+(?:[.-][a-z0-9]+)*$/ }),
  conceptVersion: protocolString({ pattern: /^\d+\.\d+\.\d+$/ }),
  artifactIntegrity: protocolString({ pattern: /^sha256:[a-f0-9]{64}$/ }),
  canonicalPath: protocolString({ pattern: /^\/concepts\/[a-z0-9/-]+$/ }),
  sourcePath: protocolString({ minLength: 1 }),
  checkpoints: protocolArray(checkpointSchema)
});

export const conceptReviewInspectionSchema = protocolSchema((input) =>
  deepFreeze(conceptReviewInspectionBaseSchema.parse(input))
);

export type KpConceptReviewInspection = InferProtocolSchema<
  typeof conceptReviewInspectionSchema
>;

function deepFreeze<Value>(value: Value): Value {
  if (typeof value !== "object" || value === null || Object.isFrozen(value)) return value;
  for (const nested of Object.values(value)) deepFreeze(nested);
  return Object.freeze(value);
}
