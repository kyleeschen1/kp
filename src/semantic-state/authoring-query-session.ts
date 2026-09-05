import type { assembleKpSemanticStateExplanation } from "./authoring-explanation-assembly.ts";
import type { KpDerivedSemanticStateLeafHandle } from "./authoring-state-handles.ts";
import type { KpSemanticStateGroupDescriptor, KpSemanticStateMemberMap } from "./authoring-schema.ts";
import { evaluateKpSemanticDerivedValue } from "./derived-evaluator.ts";
import {
  createKpSemanticSnapshotRecoveryIndex, recoverKpPinnedSnapshot,
  type KpPinnedSnapshotReference
} from "./pinned-recovery.ts";
import type { KpSemanticStateCompositionNodeDeclaration } from "./state-family-composition-declaration.ts";
import type { KpSemanticStateCompositionLogicalAddress } from "./state-family-composition-address.ts";
import {
  createKpSemanticStateCompositionEvaluator,
  KpSemanticStateCompositionEvaluatorError
} from "./state-family-composition-evaluator.ts";
import { adaptKpSnapshotToSemanticStateReadSource } from "./state-family-sample-source.ts";

/** A session owns acceleration, never the model's history or compute truth. */
export function createKpSemanticStateQuerySession<
  const Root extends KpSemanticStateGroupDescriptor<KpSemanticStateMemberMap>,
  const Node extends KpSemanticStateCompositionNodeDeclaration
>(
  explanation: ReturnType<typeof assembleKpSemanticStateExplanation<Root, Node>>,
  options: { readonly cacheCapacity?: number } = {}
) {
  const byTransformation = new Map(explanation.members.map(member => [
    member.endpoint.transformationId, member
  ]));
  const bindings = explanation.chain.applications.map(applied => {
    const member = byTransformation.get(applied.application.transformationId);
    const handle = explanation.handles.members.find(item => item.id === applied.memberId);
    if (member === undefined || handle === undefined) {
      throw new KpSemanticStateCompositionEvaluatorError(
        "unexpected-composition-evaluator-binding",
        `No authored evaluator binding for member ${JSON.stringify(applied.memberId)}.`
      );
    }
    return member.bindEvaluator(handle, applied);
  });
  const evaluator = createKpSemanticStateCompositionEvaluator({
    chain: explanation.chain, compositionHandles: explanation.handles,
    stateHandles: explanation.model.handles, bindings, ...options
  });
  // Only public settled boundaries enter recovery. Cohort execution artifacts
  // and arbitrary playhead samples do not acquire persistent history identity.
  const history = createKpSemanticSnapshotRecoveryIndex(
    explanation.chain.boundaries.map(boundary => boundary.snapshot)
  );
  const assertActive = () => {
    if (evaluator.inspect().status === "disposed") {
      throw new KpSemanticStateCompositionEvaluatorError(
        "composition-evaluator-disposed", "A disposed authoring query session cannot recover history."
      );
    }
  };
  return Object.freeze({
    history,
    resolve(address: KpSemanticStateCompositionLogicalAddress) {
      return evaluator.resolveAddress(address);
    },
    evaluate<Result>(
      address: KpSemanticStateCompositionLogicalAddress,
      target: KpDerivedSemanticStateLeafHandle<Result>
    ): Result {
      const resolution = evaluator.resolveAddress(address);
      const source = resolution.kind === "settled-semantic-state-composition-resolution"
        ? adaptKpSnapshotToSemanticStateReadSource(resolution.snapshot)
        : resolution.sample.source;
      // Derived evaluation retains request-local memoization. No accumulating
      // per-frame derived cache is needed to make an author query deterministic.
      return evaluateKpSemanticDerivedValue({ graph: explanation.model.graph, source, target });
    },
    recover(reference: KpPinnedSnapshotReference) {
      assertActive();
      return recoverKpPinnedSnapshot(history, reference);
    },
    inspect() { return evaluator.inspect(); },
    reset() { evaluator.reset(); },
    dispose() { evaluator.dispose(); }
  });
}
