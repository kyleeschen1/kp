import {
  kpExactFractionQuantityPreservationManifest as manifest
} from "../reader/compiler/exact-fraction-quantity-preservation-manifest.ts";
import {
  createKpExactFractionQuantityTrace,
  type KpExactFractionQuantityTrace
} from "../semantic/exact-fraction-quantity-trace.ts";
import {
  createKpExactFractionQuantitySymbolicProjection,
  type KpExactFractionQuantitySymbolicProjection
} from "./exact-fraction-quantity-symbolic-projection.ts";

export interface KpExactFractionQuantityAccessibleStep {
  readonly index: number;
  readonly checkpointId: string;
  readonly beatId: string;
  readonly stateId: string;
  readonly operation: KpExactFractionQuantityTrace["beats"][number]["operation"];
  readonly label: string;
  readonly description: string;
  readonly accessibleMath: string;
  readonly rawLatex: string;
  readonly nativeHtmlAndMathml: string;
  readonly focusSelectionIds: readonly string[];
  readonly transcriptRefIds: readonly string[];
}

export interface KpExactFractionQuantityAccessibleProjection {
  readonly schemaVersion:
    "kp.exact-fraction-quantity-accessible-projection.v1";
  readonly traceId: KpExactFractionQuantityTrace["id"];
  readonly unitLabel: string;
  readonly introduction: string;
  readonly steps: readonly KpExactFractionQuantityAccessibleStep[];
  readonly finalStatement: string;
  readonly foldInvariant: true;
  readonly viewInvariant: true;
}

export function createKpExactFractionQuantityAccessibleProjection(input: {
  readonly trace?: KpExactFractionQuantityTrace | undefined;
  readonly symbolic?:
    KpExactFractionQuantitySymbolicProjection | undefined;
} = {}): KpExactFractionQuantityAccessibleProjection {
  const trace = input.trace ?? createKpExactFractionQuantityTrace();
  const symbolic =
    input.symbolic ?? createKpExactFractionQuantitySymbolicProjection(trace);
  if (
    trace.states.length !== manifest.checkpoints.length ||
    trace.beats.length !== manifest.checkpoints.length ||
    symbolic.endpoints.length !== manifest.checkpoints.length
  ) {
    throw new Error(
      "Exact-fraction accessibility must cover every certified checkpoint."
    );
  }
  const steps = Object.freeze(manifest.checkpoints.map(
    (checkpoint, index): KpExactFractionQuantityAccessibleStep => {
      const state = trace.states[index]!;
      const beat = trace.beats[index]!;
      const endpoint = symbolic.endpoints[index]!;
      if (
        state.checkpointId !== checkpoint.id ||
        beat.id !== checkpoint.beatId ||
        beat.toStateId !== state.id ||
        endpoint.stateId !== state.id ||
        endpoint.checkpointId !== checkpoint.id
      ) {
        throw new Error(
          `Exact-fraction accessible step ${index} detached from its trace.`
        );
      }
      const focusSelectionIds = Object.freeze(
        state.selections.map(({ selectionId }) => selectionId)
      );
      return Object.freeze({
        index,
        checkpointId: checkpoint.id,
        beatId: beat.id,
        stateId: state.id,
        operation: beat.operation,
        label: checkpoint.label,
        description: operationDescription(beat.operation),
        accessibleMath: endpoint.accessibleText,
        rawLatex: endpoint.annotated.rawLatex,
        nativeHtmlAndMathml: endpoint.nativeHtmlAndMathml,
        focusSelectionIds,
        transcriptRefIds: Object.freeze(focusSelectionIds.map(
          (selectionId) => `transcript.selection.${selectionId}`
        ))
      });
    }
  ));
  if (
    new Set(steps.map(({ checkpointId }) => checkpointId)).size !==
      steps.length ||
    new Set(steps.map(({ beatId }) => beatId)).size !== steps.length
  ) {
    throw new Error(
      "Exact-fraction accessibility repeats a checkpoint or operation."
    );
  }
  return Object.freeze({
    schemaVersion:
      "kp.exact-fraction-quantity-accessible-projection.v1",
    traceId: trace.id,
    unitLabel: manifest.exactUnit.label,
    introduction:
      "Add one third and one sixth as selected parts of the same one whole.",
    steps,
    finalStatement:
      "The same three selected sixths are exactly one half.",
    foldInvariant: true,
    viewInvariant: true
  });
}

function operationDescription(
  operation: KpExactFractionQuantityTrace["beats"][number]["operation"]
): string {
  switch (operation) {
    case "establish-same-unit":
      return "Both addends name parts of the same one-whole unit.";
    case "refine-partition":
      return "Refine one third into the same two selected sixths without changing its quantity.";
    case "align-common-denominator":
      return "Write both addends in sixths: two sixths plus one sixth.";
    case "merge-disjoint-parts":
      return "Merge the two-sixths and one-sixth selections into the same three selected sixths.";
    case "recognize-equivalent-regrouping":
      return "Regroup the same three selected sixths as one half.";
  }
}
