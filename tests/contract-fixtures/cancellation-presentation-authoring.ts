import type {
  KpCancellationPresentationAuthoringDraft,
  KpVerifiedCancellationPresentationAuthoring
} from "../../src/animation/cancellation-presentation-authoring.ts";

declare const bundle:
  KpCancellationPresentationAuthoringDraft["inverseBundles"][number];

const incomplete: KpCancellationPresentationAuthoringDraft = {
  schemaVersion: "kp.cancellation-presentation-authoring.v1",
  id: "cancellation.incomplete",
  transformationId: "transform.incomplete",
  cancellationRecordId: "record.cancel",
  // @ts-expect-error Cancellation authoring always has exactly two inverses.
  inverseBundles: [bundle],
  catalysts: [],
  artifacts: [],
  survivors: []
};

declare const raw: KpCancellationPresentationAuthoringDraft;

// @ts-expect-error Raw or external authoring cannot fabricate proof authority.
const fabricated: KpVerifiedCancellationPresentationAuthoring = raw;

void [incomplete, fabricated];
