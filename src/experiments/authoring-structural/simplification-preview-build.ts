import { createKpAuthoredSimplificationExplanation } from "./simplification-explanation.ts";
import { readKpAuthoredSimplificationOperation } from "./simplification-operation.ts";
import { createKpTwoTimesOneCarrierAnimationAsset } from "../../animation/operation-evaluation-adapter.ts";
import { createKpAnimationAsset } from "../../animation/asset.ts";
import { pinKpSemanticSlotVersion } from "../../semantic-state/pinned-recovery.ts";

/** Read-only preparation consumes retained aggregate endpoints, not a second
 * set of hardcoded notation values. Verification remains local to the build. */
export function buildKpAuthoredSimplificationPreview() {
  const data = createKpAuthoredSimplificationExplanation();
  const { model } = data.authored;
  const operation = readKpAuthoredSimplificationOperation(data.authored.receipt);
  const before = data.explanation.chain.before;
  const after = data.explanation.chain.after;
  const source = model.handles.pin(before).expression.read();
  const target = model.handles.pin(after).expression.read();
  const exemplar = { ...operation.exemplar, bundle: { ...operation.exemplar.bundle, objects: [source, target] } };
  const animation = createKpAnimationAsset({ ...createKpTwoTimesOneCarrierAnimationAsset(),
    bundle: exemplar.bundle, transformations: [operation.transformation] });
  return Object.freeze({ schemaVersion: "kp.authoring-simplification-preview.v1", status: "valid", animation,
    beforeVersionId: pinKpSemanticSlotVersion(before, model.handles.refs.expression.slotId).versionId,
    afterVersionId: pinKpSemanticSlotVersion(after, model.handles.refs.expression.slotId).versionId });
}
