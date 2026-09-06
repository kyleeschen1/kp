import { prepareKpAuthoredSimplificationOperation, readKpAuthoredSimplificationOperation, KpAuthoredSimplificationOperationError } from "./simplification-operation.ts";
import { KpAuthoredStructuralSelectionError } from "./structural-selection.ts";
import { assembleKpSemanticStateModel } from "../../semantic-state/authoring-model-assembly.ts";
import { kpStateValue, kpStateGroup, kpStateDerived, type KpSemanticStateReadonlyValue } from "../../semantic-state/authoring-schema.ts";
import { requireAndFreezeKpPersistentSemanticValue } from "../../semantic-state/entity-version-store.ts";
import type { KpSemanticAssetObject } from "../../semantic/asset.ts";
import type { KpAggregateSemanticSnapshot } from "../../semantic-state/aggregate-snapshot.ts";
import { pinKpAggregateSemanticSnapshot, pinKpSemanticSlotVersion, recoverKpPinnedSnapshot, type KpSemanticSnapshotRecoveryIndex } from "../../semantic-state/pinned-recovery.ts";
import { defineKpSemanticStateModelFamily, assembleKpSemanticStateExplanation, bindKpSemanticStateExplanationMember } from "../../semantic-state/authoring-explanation-assembly.ts";
import { kpStateFamilyParameters } from "../../semantic-state/state-family-definition.ts";
import { declareKpSemanticStateDiscreteTransition } from "../../semantic-state/state-family-transition.ts";
import { createKpSemanticProgress, type KpSemanticProgress } from "../../semantic-state/semantic-progress.ts";
import { createKpInTransitionSemanticStateCompositionAddress, createKpSettledSemanticStateCompositionAddress } from "../../semantic-state/state-family-composition-address.ts";
import { createKpSemanticStateQuerySession } from "../../semantic-state/authoring-query-session.ts";

function persistentExpression(object: KpSemanticAssetObject) {
  if (typeof object.value !== "object" || object.value === null || !("latex" in object.value) || typeof object.value.latex !== "string") {
    throw new KpAuthoredSimplificationOperationError("kp.authoring.simplification-source-gap", "Expected the trusted notation-bearing asset object.");
  }
  // Legacy asset types admit unknown/undefined; runtime validation closes the
  // data boundary without replacing the canonical object or dropping selectors.
  return requireAndFreezeKpPersistentSemanticValue(object) as unknown as
    KpSemanticStateReadonlyValue<KpSemanticAssetObject<{ readonly latex: string }>>;
}

export function createKpAuthoredSimplificationModel(namespace = "lesson.authoring-structural.simplification") {
  const receipt = prepareKpAuthoredSimplificationOperation();
  const operation = readKpAuthoredSimplificationOperation(receipt);
  const source = persistentExpression(operation.source);
  const target = persistentExpression(operation.target);
  const model = assembleKpSemanticStateModel({ namespace,
    schema: kpStateGroup({ expression: kpStateValue(source), notation: kpStateDerived<string>() }),
    derive: ({ refs, derive }) => [derive({ target: refs.notation, dependencies: [refs.expression],
      compute: ([expression]) => expression.value.latex })]
  });
  return Object.freeze({ model, receipt, source, target });
}

export function pinKpAuthoredSimplificationSelection(input: {
  readonly authored: ReturnType<typeof createKpAuthoredSimplificationModel>;
  readonly snapshot: KpAggregateSemanticSnapshot;
  readonly selectorId: string;
}) {
  const { model } = input.authored;
  const resolve = (snapshot: KpAggregateSemanticSnapshot) => {
    if (snapshot.namespace !== model.compiled.namespace) throw new KpAuthoredStructuralSelectionError(
      "kp.authoring.structural-foreign-model", "Use the selected simplification model.");
    const expression = model.handles.pin(snapshot).expression.read();
    const selector = expression.selectors.find(selector => selector.id === input.selectorId);
    if (!selector) throw new KpAuthoredStructuralSelectionError("kp.authoring.structural-selection-gap", "Select an existing semantic occurrence.");
    return selector;
  };
  resolve(input.snapshot);
  const version = pinKpSemanticSlotVersion(input.snapshot, model.handles.refs.expression.slotId);
  const pin = pinKpAggregateSemanticSnapshot(input.snapshot);
  const assertCurrent = (snapshot: KpAggregateSemanticSnapshot) => {
    if (snapshot.namespace !== model.compiled.namespace) throw new KpAuthoredStructuralSelectionError(
      "kp.authoring.structural-foreign-model", "Use the selected simplification model.");
    const current = pinKpSemanticSlotVersion(snapshot, model.handles.refs.expression.slotId);
    if (current.snapshotId !== version.snapshotId || current.entityId !== version.entityId || current.versionId !== version.versionId) {
      throw new KpAuthoredStructuralSelectionError("kp.authoring.structural-stale-selection", "Repin the semantic occurrence before applying a later version.");
    }
    return resolve(snapshot);
  };
  return Object.freeze({ reference: Object.freeze({ version, selectorId: input.selectorId }), assertCurrent,
    recover: (index: KpSemanticSnapshotRecoveryIndex) => assertCurrent(recoverKpPinnedSnapshot(index, pin)) });
}

export function defineKpAuthoredSimplificationFamily(authored: ReturnType<typeof createKpAuthoredSimplificationModel>) {
  const operation = readKpAuthoredSimplificationOperation(authored.receipt);
  if (JSON.stringify(authored.source) !== JSON.stringify(operation.source) || JSON.stringify(authored.target) !== JSON.stringify(operation.target)) {
    throw new KpAuthoredSimplificationOperationError("kp.authoring.simplification-source-gap", "Authored endpoints must retain verified source integrity.");
  }
  const selection = pinKpAuthoredSimplificationSelection({ authored, snapshot: authored.model.initial,
    selectorId: operation.recipe.carrier.sourceSelectorRef });
  const family = defineKpSemanticStateModelFamily(authored.model, {
    id: operation.transformation.id, sourceId: operation.operationId,
    parameters: kpStateFamilyParameters<{ operation: "simplify" }>(),
    transitions: builder => [builder.discrete(declareKpSemanticStateDiscreteTransition({
      id: "expression.simplify", sourceId: operation.operationId, target: authored.model.handles.refs.expression,
      changePoints: [{ id: "settled", at: createKpSemanticProgress(1n, 1n), valueSourceId: operation.target.id }]
    }), ({ after }) => after)],
    author(parameters, state) {
      if (parameters.operation !== "simplify") throw new KpAuthoredSimplificationOperationError(
        "kp.authoring.simplification-evidence-gap", "This family only applies verified simplification.");
      state.expression.update(previous => {
        if (JSON.stringify(previous) !== JSON.stringify(operation.source)) throw new KpAuthoredSimplificationOperationError(
          "kp.authoring.simplification-source-gap", "The simplification source changed before publication.");
        return authored.target;
      });
    }
  });
  return Object.freeze({ ...family, selection,
    apply(...args: Parameters<typeof family.apply>) { selection.assertCurrent(args[0]); return family.apply(...args); },
    applyPreparedApplication(...args: Parameters<typeof family.applyPreparedApplication>) {
      selection.assertCurrent(args[0]); return family.applyPreparedApplication(...args);
    },
    reparameterize(...args: Parameters<typeof family.reparameterize>) {
      selection.assertCurrent(args[0].commit.before); return family.reparameterize(...args);
    }
  });
}

export function createKpAuthoredSimplificationExplanation(namespace = "lesson.authoring-structural.simplification") {
  const authored = createKpAuthoredSimplificationModel(namespace);
  const definition = defineKpAuthoredSimplificationFamily(authored);
  const member = bindKpSemanticStateExplanationMember({ name: "simplify", sourceId: "authoring.simplification.member",
    definition, application: definition.prepareApplication({ applicationId: "simplify",
      sourceId: "authoring.simplification.application", parameters: { operation: "simplify" } }) });
  const explanation = assembleKpSemanticStateExplanation({ model: authored.model, localId: "simplification",
    sourceId: "authoring.simplification.explanation", root: member.member, members: [member] });
  return Object.freeze({ authored, definition, explanation,
    at: (progress: KpSemanticProgress) => createKpInTransitionSemanticStateCompositionAddress({ handles: explanation.handles, target: explanation.handles.root, progress }),
    before: createKpSettledSemanticStateCompositionAddress({ handles: explanation.handles, boundary: explanation.handles.composition.before }),
    after: createKpSettledSemanticStateCompositionAddress({ handles: explanation.handles, boundary: explanation.handles.composition.after }),
    createSession: () => createKpSemanticStateQuerySession(explanation, { cacheCapacity: 2 }) });
}
