import type {
  KpExponentRadicalSelectorState
} from "../rendering/exponent-radical-selector-annotated-latex.ts";
import {
  resolveKpExponentRadicalStructuralElements
} from "../rendering/exponent-radical-selector-annotated-latex.ts";

export {
  createKpExponentRadicalSelectorAnnotatedLatex
} from "../rendering/exponent-radical-selector-annotated-latex.ts";

export function bindKpExponentRadicalStructuralMotionIds(input: {
  readonly root: HTMLElement;
  readonly states: readonly KpExponentRadicalSelectorState[];
}): Readonly<Record<string, string>> {
  const motionIds: Record<string, string> = {};
  for (const state of input.states) {
    const object = input.root.querySelector<HTMLElement>(
      `[data-kp-editor-equation-object-id="${CSS.escape(state.objectId)}"]`
    );
    if (object === null) continue;
    for (const binding of resolveKpExponentRadicalStructuralElements({
      root: object,
      state
    })) {
      const motionId =
        `exponent-radical.${state.objectId}.${binding.selectorId}`;
      const { element } = binding;
      element.dataset["kpMotionId"] = motionId;
      motionIds[binding.selectorId] = motionId;
    }
  }
  return motionIds;
}
