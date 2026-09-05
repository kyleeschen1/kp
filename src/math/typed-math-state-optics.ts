import type { KpSemanticStateModelAssembly } from "../semantic-state/authoring-model-assembly.ts";
import type { KpRequiredSemanticStateLeafHandle } from "../semantic-state/authoring-state-handles.ts";
import type { KpSemanticStateGroupDescriptor, KpSemanticStateMemberMap, KpSemanticStateReadonlyValue } from "../semantic-state/authoring-schema.ts";
import { readKpSemanticSlotBinding, type KpAggregateSemanticSnapshot } from "../semantic-state/aggregate-snapshot.ts";
import { requireAndFreezeKpPersistentSemanticValue } from "../semantic-state/entity-version-store.ts";
import {
  createKpSemanticSnapshotRecoveryIndex, pinKpSemanticSlotVersion, recoverKpPinnedVersion,
  type KpSemanticSnapshotRecoveryIndex
} from "../semantic-state/pinned-recovery.ts";
import { beginKpSemanticTransaction } from "../semantic-state/transaction.ts";
import {
  createKpTypedMathSceneHandle, createKpTypedMathSceneTimeline,
  type KpRecoverableMathObject
} from "./typed-math-scene.ts";
import { createKpTypedMathStateValue } from "./typed-math-state-value.ts";
import {
  resolveKpSemanticSelection, transformKpSemanticSelection,
  type KpSemanticOptic, type KpSemanticOpticCardinality, type KpSemanticRewriteOperation,
  type KpSemanticRewriteResult
} from "./typed-semantic-optics.ts";

export type KpTypedMathStateOpticErrorCode =
  | "kp.math.foreign-state-handle" | "kp.math.stale-state-selection"
  | "kp.math.unsupported-cardinality" | "kp.math.unsupported-object-replacement"
  | "kp.math.rewrite-failed" | "kp.math.nondeterministic-rewrite-evidence";

export class KpTypedMathStateOpticError extends Error {
  readonly code: KpTypedMathStateOpticErrorCode;
  constructor(code: KpTypedMathStateOpticErrorCode, message: string, cause?: unknown) {
    super(message, { cause });
    this.name = "KpTypedMathStateOpticError";
    this.code = code;
  }
}

/** Stable entity/version pins supply identity; an optic path is only a selector. */
export function pinKpTypedMathStateSelection<
  Schema extends KpSemanticStateGroupDescriptor<KpSemanticStateMemberMap>,
  Value extends KpRecoverableMathObject, Focus,
  Cardinality extends KpSemanticOpticCardinality
>(input: {
  readonly model: KpSemanticStateModelAssembly<Schema>;
  readonly snapshot: KpAggregateSemanticSnapshot;
  readonly target: KpRequiredSemanticStateLeafHandle<KpSemanticStateReadonlyValue<NoInfer<Value>>>;
  readonly optic: KpSemanticOptic<Value, Focus, Cardinality>;
}) {
  const { model, snapshot, target, optic } = input;
  const leaf = model.compiled.leaves[model.compiled.leafIndex[target.encodedPath] ?? -1];
  if (target.namespace !== model.compiled.namespace || leaf?.identities.slotId !== target.slotId ||
    leaf.descriptor.kind !== "required-value" || JSON.stringify(leaf.path) !== JSON.stringify(target.path)) {
    throw new KpTypedMathStateOpticError("kp.math.foreign-state-handle", "Math target was not declared by this model.");
  }
  model.handles.pin(snapshot);
  const version = pinKpSemanticSlotVersion(snapshot, target.slotId);
  const sourceIndex = createKpSemanticSnapshotRecoveryIndex([snapshot]);
  // The typed model handle owns the value type. Storage remains the existing
  // aggregate version; this adapter neither recreates it nor keeps a second store.
  const root = recoverKpPinnedVersion(sourceIndex, version).value as unknown as Value;
  const object = createKpTypedMathSceneHandle(root);
  const selection = resolveKpSemanticSelection(root, optic);
  const reference = Object.freeze({
    version, slotId: target.slotId, objectId: root.id, opticId: optic.id,
    descriptor: selection.descriptor,
    entities: Object.freeze(selection.refs.map(ref => Object.freeze({ entityId: ref.entityId, path: ref.path })))
  });
  const recover = (index: KpSemanticSnapshotRecoveryIndex) => {
    const candidate = recoverKpPinnedVersion(index, version).value as unknown as KpRecoverableMathObject;
    if (!object.matches(candidate)) throw new KpTypedMathStateOpticError(
      "kp.math.stale-state-selection", "The pinned object changed identity, kind, or shape."
    );
    const recovered = resolveKpSemanticSelection(candidate, optic);
    if (JSON.stringify(recovered.refs.map(ref => ({ entityId: ref.entityId, path: ref.path }))) !==
      JSON.stringify(reference.entities)) throw new KpTypedMathStateOpticError(
      "kp.math.stale-state-selection", "The optic no longer resolves the pinned semantic entities."
    );
    return recovered;
  };
  return Object.freeze({
    reference, recover,
    rewrite(input: {
      readonly before: KpAggregateSemanticSnapshot;
      readonly applicationId: string;
      readonly operation: KpSemanticRewriteOperation;
      readonly transform: Parameters<typeof transformKpSemanticSelection<Value, Focus, Cardinality>>[0]["transform"];
    }) {
      if (input.before.namespace !== model.compiled.namespace) throw new KpTypedMathStateOpticError(
        "kp.math.foreign-state-handle", "Rewrite source belongs to another model namespace."
      );
      const binding = readKpSemanticSlotBinding(input.before, target.slotId);
      if (input.before.id !== version.snapshotId || binding.entityId !== version.entityId ||
        binding.versionId !== version.versionId) throw new KpTypedMathStateOpticError(
        "kp.math.stale-state-selection", "Repin the selection explicitly before rewriting a different aggregate version."
      );
      recover(createKpSemanticSnapshotRecoveryIndex([input.before]));
      const operation = Object.freeze({ ...input.operation, authorityIds: Object.freeze([...input.operation.authorityIds]) });
      const transformationId = model.compiled.identityScope.appliedTransformation(
        model.compiled.identityScope.transformation(operation.id), input.applicationId
      );
      const transaction = beginKpSemanticTransaction({
        identities: model.compiled.identityScope, before: input.before, transformationId
      });
      let rewrite: KpSemanticRewriteResult<Value, Focus> | undefined;
      let evidenceKey: string | undefined;
      let commit: ReturnType<typeof transaction.commit>;
      try {
        transaction.update(transaction.scope, {
          id: `${operation.id}.selected-rewrite`, sourceId: operation.id,
          revisionId: "selected-rewrite", slotId: target.slotId,
          update(previous) {
            const current = previous as unknown as Value;
            const boundedOptic: KpSemanticOptic<Value, Focus, Cardinality> = {
              ...optic,
              replace(value, replacements) {
                const result = optic.replace(value, replacements);
                if (result.id !== object.objectId || result.kind !== object.kind) throw new KpTypedMathStateOpticError(
                  "kp.math.unsupported-object-replacement", "A selected rewrite must retain its root object's identity and kind."
                );
                if (!object.matches(result) || optic.resolve(result).length !== reference.entities.length) {
                  throw new KpTypedMathStateOpticError("kp.math.unsupported-cardinality",
                    "Structural shape/cardinality changes need separately authored correspondence and lifecycle authority.");
                }
                return result;
              }
            };
            rewrite = transformKpSemanticSelection({ root: current, optic: boundedOptic, operation, transform: input.transform });
            const nextEvidence = JSON.stringify({ transformation: rewrite.transformation, correspondenceMap: rewrite.correspondenceMap });
            if (evidenceKey !== undefined && evidenceKey !== nextEvidence) throw new KpTypedMathStateOpticError(
              "kp.math.nondeterministic-rewrite-evidence", "Repeated rewrite evaluation changed its declared correspondence."
            );
            evidenceKey = nextEvidence;
            return requireAndFreezeKpPersistentSemanticValue(createKpTypedMathStateValue(rewrite.value));
          }
        });
        commit = transaction.commit(transaction.scope);
      } catch (cause) {
        transaction.abort(transaction.scope);
        if (cause instanceof KpTypedMathStateOpticError) throw cause;
        throw new KpTypedMathStateOpticError("kp.math.rewrite-failed", "Selected math rewrite failed without publishing a successor.", cause);
      }
      // Projection is outside the abort boundary: a committed scope has expired.
      // Correspondence is declared provenance, not a mathematical proof or an
      // animation certificate granted by state.update.
      return Object.freeze({ commit, rewrite: rewrite!, source: version,
        target: pinKpSemanticSlotVersion(commit.after, target.slotId) });
    }
  });
}

/** Compatibility projection only: supplied snapshots remain the history authority. */
export function projectKpAggregateMathScene<Value extends KpRecoverableMathObject>(input: {
  readonly id: string;
  readonly index: KpSemanticSnapshotRecoveryIndex;
  readonly steps: readonly {
    readonly id: string;
    readonly objects: readonly { recover(index: KpSemanticSnapshotRecoveryIndex): { readonly root: Value } }[];
  }[];
}) {
  return createKpTypedMathSceneTimeline({ id: input.id,
    steps: input.steps.map(step => ({ id: step.id,
      objects: step.objects.map(object => object.recover(input.index).root) })) });
}
