import {
  createKpFractionCompositionEquationAsset
} from "../../semantic/fraction-composition-equation-asset.ts";
import {
  createKpFractionCompositionEndpointSpecs
} from "../../semantic/fraction-composition-endpoint-spec.ts";
import {
  createKpFractionCompositionEvaluationTree
} from "../../semantic/fraction-composition-evaluation-tree.ts";
import {
  createKpLawfulFractionSolveMacro
} from "../../semantic/fraction-solve-macro.ts";
import {
  semanticTransformationLeafRefs
} from "../../semantic/transformation-composition.ts";

export const kpFractionCompositionSalienceCheckpointIds = Object.freeze([
  "factored",
  "normalized",
  "constant-quotient",
  "difference-simplified",
  "right-product-simplified",
  "solved"
] as const);

export type KpFractionCompositionSalienceCheckpointId =
  typeof kpFractionCompositionSalienceCheckpointIds[number];

export interface KpFractionCompositionSalienceEndpointInventory {
  readonly stateId: string;
  readonly selectorIds: readonly string[];
  readonly structuralAnchorIds: readonly string[];
  readonly envelopeIds: readonly string[];
  readonly envelopes: readonly {
    readonly id: string;
    readonly memberSelectorIds: readonly string[];
    readonly structuralAnchorIds: readonly string[];
  }[];
}

export interface KpFractionCompositionSalienceTransitionInventory {
  readonly stepId: string;
  readonly sourceStateId: string;
  readonly targetStateId: string;
  readonly correspondenceIds: readonly string[];
  readonly sourceSelectorIds: readonly string[];
  readonly targetSelectorIds: readonly string[];
}

export interface KpFractionCompositionSalienceCheckpointInventory {
  readonly id: KpFractionCompositionSalienceCheckpointId;
  readonly stateId: string;
  readonly operationIds: readonly string[];
  readonly defaultFocusTargetId: string;
}

export interface KpFractionCompositionSalienceInventory {
  readonly nativePaintOwner: "native-katex";
  readonly selectorRealization: "annotated-katex-dom";
  readonly structuralAnchorRealization: "measured-katex-artifact";
  readonly envelopeRealization: "virtual-member-paint-union";
  readonly endpoints: readonly KpFractionCompositionSalienceEndpointInventory[];
  readonly transitions: readonly KpFractionCompositionSalienceTransitionInventory[];
  readonly checkpoints: readonly KpFractionCompositionSalienceCheckpointInventory[];
}

export function createKpFractionCompositionSalienceInventory():
KpFractionCompositionSalienceInventory {
  const macro = createKpLawfulFractionSolveMacro();
  const endpointSpecs = createKpFractionCompositionEndpointSpecs();
  const asset = createKpFractionCompositionEquationAsset();
  const tree = createKpFractionCompositionEvaluationTree();
  const root = tree.root;
  if (root.kind !== "sequence") {
    throw new Error("Fraction composition salience requires a sequence root.");
  }

  const checkpointStateIndexes = [0, 2, 4, 7, 10, 13] as const;
  if (root.children.length !== checkpointStateIndexes.length - 1) {
    throw new Error("Fraction composition salience checkpoints must cover each fold group.");
  }

  const endpoints = endpointSpecs.map((endpoint) => Object.freeze({
    stateId: endpoint.stateId,
    selectorIds: endpoint.selectorIds,
    structuralAnchorIds: Object.freeze(
      endpoint.structuralAnchors.map(({ id }) => id)
    ),
    envelopeIds: Object.freeze(endpoint.groupEnvelopes.map(({ id }) => id)),
    envelopes: Object.freeze(endpoint.groupEnvelopes.map((envelope) =>
      Object.freeze({
        id: envelope.id,
        memberSelectorIds: envelope.memberSelectorIds,
        structuralAnchorIds: Object.freeze([
          ...(envelope.structuralAnchorIds ?? [])
        ])
      })
    ))
  }));
  const transitions = asset.transformations.map((transformation) => {
    const records = transformation.correspondenceMap?.records ?? [];
    return Object.freeze({
      stepId: transformation.id,
      sourceStateId: transformation.sourceObjectIds[0]!,
      targetStateId: transformation.targetObjectIds[0]!,
      correspondenceIds: Object.freeze(records.map(({ id }) => id)),
      sourceSelectorIds: unique(records.flatMap(
        ({ sourceSelectorIds }) => sourceSelectorIds
      )),
      targetSelectorIds: unique(records.flatMap(
        ({ targetSelectorIds }) => targetSelectorIds
      ))
    });
  });
  const checkpoints = kpFractionCompositionSalienceCheckpointIds.map(
    (id, index) => {
      const stateId = macro.states[checkpointStateIndexes[index]!]!.id;
      const group = index === 0 ? undefined : root.children[index - 1];
      const operationIds = group === undefined
        ? Object.freeze([] as string[])
        : Object.freeze(semanticTransformationLeafRefs(group).map(({ id }) => id));
      return Object.freeze({
        id,
        stateId,
        operationIds,
        defaultFocusTargetId: `${stateId}.equation`
      });
    }
  );

  return Object.freeze({
    nativePaintOwner: "native-katex" as const,
    selectorRealization: "annotated-katex-dom" as const,
    structuralAnchorRealization: "measured-katex-artifact" as const,
    envelopeRealization: "virtual-member-paint-union" as const,
    endpoints: Object.freeze(endpoints),
    transitions: Object.freeze(transitions),
    checkpoints: Object.freeze(checkpoints)
  });
}

function unique(ids: readonly string[]): readonly string[] {
  return Object.freeze([...new Set(ids)]);
}
