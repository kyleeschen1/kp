import {
  resolveKpSemanticSalience,
  resolveKpSemanticVisualTreatment,
  type KpResolvedSemanticSalience,
  type KpResolvedSemanticVisualTreatment,
  type KpSalienceIdentityFamily,
  type KpSemanticVisualRole,
  type KpVisualThemeId
} from "../../animation/semantic-visual-salience.ts";
import {
  createKpFractionCompositionEquationAsset
} from "../../semantic/fraction-composition-equation-asset.ts";
import {
  createKpFractionCompositionSalienceInventory
} from "../compiler/fraction-composition-salience-inventory.ts";

export interface KpFractionCompositionSalienceObjectProjection {
  readonly id: string;
  readonly role: KpSemanticVisualRole;
  readonly salience: KpResolvedSemanticSalience;
  readonly treatment: KpResolvedSemanticVisualTreatment;
}

export interface KpFractionCompositionSalienceProjection {
  readonly stateId: string;
  readonly theme: KpVisualThemeId;
  readonly focusTargetIds: readonly string[];
  readonly objects: Readonly<Record<
    string,
    KpFractionCompositionSalienceObjectProjection
  >>;
}

export function projectKpFractionCompositionSalience(input: {
  readonly stateId: string;
  readonly theme: KpVisualThemeId;
  readonly focusTargetIds?: readonly string[];
}): KpFractionCompositionSalienceProjection {
  const inventory = createKpFractionCompositionSalienceInventory();
  const endpoint = inventory.endpoints.find(
    ({ stateId }) => stateId === input.stateId
  );
  if (endpoint === undefined) {
    throw new Error(`Unknown fraction salience state ${input.stateId}.`);
  }
  const assetObject = createKpFractionCompositionEquationAsset().bundle.objects
    .find(({ id }) => id === input.stateId);
  if (assetObject === undefined) {
    throw new Error(`Fraction salience state ${input.stateId} has no asset object.`);
  }
  const focusTargetIds = Object.freeze([...(input.focusTargetIds ?? [])]);
  const focusedIds = expandFocusTargets({
    stateId: input.stateId,
    focusTargetIds,
    inventory
  });
  const hasFocus = focusTargetIds.length > 0;
  const selectorById = new Map(assetObject.selectors.map(
    (selector) => [selector.id, selector] as const
  ));
  const objects = Object.fromEntries([
    ...endpoint.selectorIds.map((id) => {
      const selector = selectorById.get(id);
      if (selector === undefined) {
        throw new Error(`Fraction salience selector ${id} lacks semantic metadata.`);
      }
      return objectProjection({
        id,
        role: selector.kind === "relation" || selector.kind === "operator"
          ? "relation"
          : selector.kind === "artifact"
            ? "structure"
            : "ink",
        identityFamily: "neutral",
        focused: focusedIds.has(id),
        hasFocus,
        theme: input.theme
      });
    }),
    ...endpoint.structuralAnchorIds.map((id) => objectProjection({
      id,
      role: "structure",
      identityFamily: "neutral",
      focused: focusedIds.has(id),
      hasFocus,
      theme: input.theme
    }))
  ]);
  return Object.freeze({
    stateId: input.stateId,
    theme: input.theme,
    focusTargetIds,
    objects: Object.freeze(objects)
  });
}

/** Applies paint intent to authored wrappers; KaTeX keeps glyph and rule geometry. */
export function applyKpFractionCompositionSalienceToDom(input: {
  readonly root: ParentNode;
  readonly projection: KpFractionCompositionSalienceProjection;
}): void {
  for (const element of input.root.querySelectorAll<HTMLElement>(
    "[data-kp-fraction-salience-bound]"
  )) {
    delete element.dataset["kpFractionSalienceBound"];
    delete element.dataset["kpSemanticVisualRole"];
    delete element.dataset["kpSemanticSalienceLevel"];
    delete element.dataset["kpSemanticIdentityFamily"];
    element.style.removeProperty("--kp-semantic-salience-color");
    element.style.removeProperty("--kp-semantic-salience-opacity");
    element.style.removeProperty("--kp-semantic-salience-stroke-scale");
  }
  const elementsById = new Map<string, HTMLElement[]>();
  for (const element of input.root.querySelectorAll<HTMLElement>(
    "[data-kp-reader-selector-id]"
  )) {
    const id = element.dataset["kpReaderSelectorId"];
    if (id === undefined) continue;
    const elements = elementsById.get(id) ?? [];
    elements.push(element);
    elementsById.set(id, elements);
  }
  for (const object of Object.values(input.projection.objects)) {
    const elements = elementsById.get(object.id);
    if (elements === undefined) {
      throw new Error(`Fraction salience DOM is missing ${object.id}.`);
    }
    for (const element of elements) {
      element.dataset["kpFractionSalienceBound"] = "true";
      element.dataset["kpSemanticVisualRole"] = object.role;
      element.dataset["kpSemanticSalienceLevel"] = object.salience.state.level;
      element.dataset["kpSemanticIdentityFamily"] =
        object.salience.state.identityFamily;
      element.style.setProperty(
        "--kp-semantic-salience-color",
        object.treatment.color
      );
      element.style.setProperty(
        "--kp-semantic-salience-opacity",
        format(object.treatment.opacity)
      );
      element.style.setProperty(
        "--kp-semantic-salience-stroke-scale",
        format(object.treatment.strokeScale)
      );
    }
  }
}

function objectProjection(input: {
  readonly id: string;
  readonly role: KpSemanticVisualRole;
  readonly identityFamily: KpSalienceIdentityFamily;
  readonly focused: boolean;
  readonly hasFocus: boolean;
  readonly theme: KpVisualThemeId;
}): readonly [string, KpFractionCompositionSalienceObjectProjection] {
  const salience = resolveKpSemanticSalience({
    baseLevel: "normal",
    identityFamily: input.identityFamily,
    presence: 1,
    signals: input.focused
      ? ["focused"]
      : input.hasFocus
        ? ["contextual"]
        : []
  });
  return [input.id, Object.freeze({
    id: input.id,
    role: input.role,
    salience,
    treatment: resolveKpSemanticVisualTreatment({
      theme: input.theme,
      role: input.role,
      state: salience.state
    })
  })];
}

function expandFocusTargets(input: {
  readonly stateId: string;
  readonly focusTargetIds: readonly string[];
  readonly inventory: ReturnType<typeof createKpFractionCompositionSalienceInventory>;
}): ReadonlySet<string> {
  const endpoint = input.inventory.endpoints.find(
    ({ stateId }) => stateId === input.stateId
  )!;
  const addressableIds = new Set([
    ...endpoint.selectorIds,
    ...endpoint.structuralAnchorIds
  ]);
  const focused = new Set<string>();
  for (const targetId of input.focusTargetIds) {
    if (targetId === input.stateId) {
      addressableIds.forEach((id) => focused.add(id));
      continue;
    }
    const envelope = endpoint.envelopes.find(({ id }) => id === targetId);
    if (envelope !== undefined) {
      envelope.memberSelectorIds.forEach((id) => focused.add(id));
      envelope.structuralAnchorIds.forEach((id) => focused.add(id));
      continue;
    }
    if (addressableIds.has(targetId)) {
      focused.add(targetId);
      continue;
    }
    const transition = input.inventory.transitions.find(
      ({ stepId }) => stepId === targetId
    );
    if (transition !== undefined && transition.sourceStateId === input.stateId) {
      transition.sourceSelectorIds.forEach((id) => focused.add(id));
      continue;
    }
    if (transition !== undefined && transition.targetStateId === input.stateId) {
      transition.targetSelectorIds.forEach((id) => focused.add(id));
      continue;
    }
    throw new Error(
      `Fraction salience target ${targetId} is not addressable in ${input.stateId}.`
    );
  }
  return focused;
}

function format(value: number): string {
  return value.toFixed(3).replace(/\.?0+$/, "");
}
