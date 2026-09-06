import type { createKpAuthoredDistributionModel } from "./distribution-model.ts";
import type { KpAggregateSemanticSnapshot } from "../../semantic-state/aggregate-snapshot.ts";
import {
  pinKpAggregateSemanticSnapshot, pinKpSemanticSlotVersion, recoverKpPinnedSnapshot,
  type KpSemanticSnapshotRecoveryIndex
} from "../../semantic-state/pinned-recovery.ts";
import { resolveKpStructuredExpressionSubtree } from "../../semantic/structured-expression.ts";

export class KpAuthoredStructuralSelectionError extends Error {
  readonly code: "kp.authoring.structural-foreign-model" | "kp.authoring.structural-stale-selection" | "kp.authoring.structural-selection-gap";
  constructor(code: KpAuthoredStructuralSelectionError["code"], message: string) {
    super(message);
    this.name = "KpAuthoredStructuralSelectionError";
    this.code = code;
  }
}

/** A semantic subtree query is resolved within an exact aggregate version.
 * It grants inspection only, never rewrite legality or animation authority.
 */
export function pinKpAuthoredStructuralSelection(input: {
  readonly model: ReturnType<typeof createKpAuthoredDistributionModel>["model"];
  readonly snapshot: KpAggregateSemanticSnapshot;
  readonly side: "left" | "right";
  readonly entityId: string;
}) {
  const { model, snapshot, side, entityId } = input;
  const resolve = (candidate: KpAggregateSemanticSnapshot) => {
    if (candidate.namespace !== model.compiled.namespace) throw new KpAuthoredStructuralSelectionError(
      "kp.authoring.structural-foreign-model", "Use a snapshot from the selected author model.");
    const equation = model.handles.pin(candidate).equation.read();
    if (side !== "left" && side !== "right") throw new KpAuthoredStructuralSelectionError(
      "kp.authoring.structural-selection-gap", "Select an explicit equation side.");
    const node = resolveKpStructuredExpressionSubtree(equation[side], entityId);
    if (node === undefined) throw new KpAuthoredStructuralSelectionError(
      "kp.authoring.structural-selection-gap", `No semantic subtree ${JSON.stringify(entityId)} on ${side}.`);
    return { equation, node };
  };
  const selected = resolve(snapshot);
  const snapshotPin = pinKpAggregateSemanticSnapshot(snapshot);
  const version = pinKpSemanticSlotVersion(snapshot, model.handles.refs.equation.slotId);
  const reference = Object.freeze({ version, side, entityId, equationId: selected.equation.id });
  const assertCurrent = (candidate: KpAggregateSemanticSnapshot) => {
    if (candidate.namespace !== model.compiled.namespace) throw new KpAuthoredStructuralSelectionError(
      "kp.authoring.structural-foreign-model", "Use a snapshot from the selected author model.");
    const current = pinKpSemanticSlotVersion(candidate, model.handles.refs.equation.slotId);
    if (current.snapshotId !== version.snapshotId || current.entityId !== version.entityId || current.versionId !== version.versionId) {
      throw new KpAuthoredStructuralSelectionError("kp.authoring.structural-stale-selection",
        "Repin explicitly before applying a selection to a different aggregate version.");
    }
    const resolved = resolve(candidate);
    if (resolved.equation.id !== reference.equationId) throw new KpAuthoredStructuralSelectionError(
      "kp.authoring.structural-stale-selection", "The selected equation occurrence changed.");
    return resolved.node;
  };
  return Object.freeze({ reference, assertCurrent,
    recover(index: KpSemanticSnapshotRecoveryIndex) {
      return assertCurrent(recoverKpPinnedSnapshot(index, snapshotPin));
    }
  });
}
