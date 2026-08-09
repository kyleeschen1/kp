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
} from "../../semantic/fraction-composition-salience-inventory.ts";

const fractionSalienceInventory =
  createKpFractionCompositionSalienceInventory();
const fractionAssetObjects = new Map(
  createKpFractionCompositionEquationAsset().bundle.objects.map(
    (object) => [object.id, object] as const
  )
);
const endpointProjectionCache = new Map<
  string,
  KpFractionCompositionSalienceProjection
>();
let endpointProjectionCompilations = 0;
let endpointProjectionCacheHits = 0;
let domApplications = 0;
let domRevisionSkips = 0;

export function inspectKpFractionCompositionSalienceRuntime() {
  return Object.freeze({
    endpointProjectionCompilations,
    endpointProjectionCacheHits,
    domApplications,
    domRevisionSkips,
    endpointProjectionCacheSize: endpointProjectionCache.size
  });
}

export function resetKpFractionCompositionSalienceRuntime(): void {
  endpointProjectionCompilations = 0;
  endpointProjectionCacheHits = 0;
  domApplications = 0;
  domRevisionSkips = 0;
}

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

export interface KpFractionCompositionSalienceSceneProjection {
  readonly theme: KpVisualThemeId;
  readonly presentationRevision: string;
  readonly phaseProgress: number;
  readonly operationIds: readonly string[];
  readonly focusTargetIds: readonly string[];
  readonly endpoints: readonly KpFractionCompositionSalienceProjection[];
}

export function projectKpFractionCompositionSalience(input: {
  readonly stateId: string;
  readonly theme: KpVisualThemeId;
  readonly focusTargetIds?: readonly string[];
}): KpFractionCompositionSalienceProjection {
  const cacheKey = [
    input.theme,
    input.stateId,
    ...(input.focusTargetIds ?? [])
  ].join(":");
  const cached = endpointProjectionCache.get(cacheKey);
  if (cached !== undefined) {
    endpointProjectionCacheHits += 1;
    return cached;
  }
  endpointProjectionCompilations += 1;
  const endpoint = fractionSalienceInventory.endpoints.find(
    ({ stateId }) => stateId === input.stateId
  );
  if (endpoint === undefined) {
    throw new Error(`Unknown fraction salience state ${input.stateId}.`);
  }
  const assetObject = fractionAssetObjects.get(input.stateId);
  if (assetObject === undefined) {
    throw new Error(`Fraction salience state ${input.stateId} has no asset object.`);
  }
  const focusTargetIds = Object.freeze([...(input.focusTargetIds ?? [])]);
  const focusedIds = expandFocusTargets({
    stateId: input.stateId,
    focusTargetIds,
    inventory: fractionSalienceInventory
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
  const projection = Object.freeze({
    stateId: input.stateId,
    theme: input.theme,
    focusTargetIds,
    objects: Object.freeze(objects)
  });
  endpointProjectionCache.set(cacheKey, projection);
  return projection;
}

export function projectKpFractionCompositionSalienceScene(input: {
  readonly theme: KpVisualThemeId;
  readonly sourceStateId: string;
  readonly targetStateId: string;
  readonly operationIds: readonly string[];
  readonly phaseProgress: number;
  readonly focusTargetIds?: readonly string[];
}): KpFractionCompositionSalienceSceneProjection {
  if (!Number.isFinite(input.phaseProgress) || input.phaseProgress < 0 ||
      input.phaseProgress > 1) {
    throw new Error("Fraction salience phase progress must be between 0 and 1.");
  }
  const inventory = fractionSalienceInventory;
  const explicitTargets = Object.freeze([...(input.focusTargetIds ?? [])]);
  let focusTargets = explicitTargets.length > 0
    ? explicitTargets
    : Object.freeze([...input.operationIds]);
  let sourceTargets = focusTargets.filter((targetId) =>
    targetIsAddressable({
      stateId: input.sourceStateId,
      targetId,
      inventory
    })
  );
  let targetTargets = focusTargets.filter((targetId) =>
    targetIsAddressable({
      stateId: input.targetStateId,
      targetId,
      inventory
    })
  );
  // Reader focus is cross-surface: a keyboard-focused fold control is valid
  // semantic state even though this KaTeX adapter has nothing to paint for it.
  if (explicitTargets.length > 0 &&
      sourceTargets.length + targetTargets.length === 0) {
    focusTargets = Object.freeze([...input.operationIds]);
    sourceTargets = focusTargets.filter((targetId) => targetIsAddressable({
      stateId: input.sourceStateId,
      targetId,
      inventory
    }));
    targetTargets = focusTargets.filter((targetId) => targetIsAddressable({
      stateId: input.targetStateId,
      targetId,
      inventory
    }));
  }
  const focusSource = input.phaseProgress < 0.5;
  return Object.freeze({
    theme: input.theme,
    presentationRevision: [
      input.theme,
      focusSource ? "source" : "target",
      ...focusTargets
    ].join(":"),
    phaseProgress: input.phaseProgress,
    operationIds: Object.freeze([...input.operationIds]),
    focusTargetIds: Object.freeze([...focusTargets]),
    endpoints: Object.freeze([
      projectKpFractionCompositionSalience({
        stateId: input.sourceStateId,
        theme: input.theme,
        focusTargetIds: focusSource ? sourceTargets : []
      }),
      projectKpFractionCompositionSalience({
        stateId: input.targetStateId,
        theme: input.theme,
        focusTargetIds: focusSource ? [] : targetTargets
      })
    ])
  });
}

/** Applies paint intent to authored wrappers; KaTeX keeps glyph and rule geometry. */
export function applyKpFractionCompositionSalienceToDom(input: {
  readonly root: HTMLElement;
  readonly projection: KpFractionCompositionSalienceProjection;
}): void {
  applyKpFractionCompositionSalienceSceneToDom({
    root: input.root,
    projections: [input.projection]
  });
}

export function applyKpFractionCompositionSalienceSceneToDom(input: {
  readonly root: HTMLElement;
  readonly projections: readonly KpFractionCompositionSalienceProjection[];
  readonly presentationRevision?: string | undefined;
}): void {
  if (input.presentationRevision !== undefined &&
      input.root.dataset["kpFractionSalienceRevision"] ===
        input.presentationRevision) {
    domRevisionSkips += 1;
    return;
  }
  domApplications += 1;
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
  for (const object of input.projections.flatMap((projection) =>
    Object.values(projection.objects)
  )) {
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
  if (input.presentationRevision !== undefined) {
    input.root.dataset["kpFractionSalienceRevision"] =
      input.presentationRevision;
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
      transition.attentionSourceSelectorIds.forEach((id) => focused.add(id));
      continue;
    }
    if (transition !== undefined && transition.targetStateId === input.stateId) {
      transition.attentionTargetSelectorIds.forEach((id) => focused.add(id));
      continue;
    }
    throw new Error(
      `Fraction salience target ${targetId} is not addressable in ${input.stateId}.`
    );
  }
  return focused;
}

function targetIsAddressable(input: {
  readonly stateId: string;
  readonly targetId: string;
  readonly inventory: ReturnType<typeof createKpFractionCompositionSalienceInventory>;
}): boolean {
  const endpoint = input.inventory.endpoints.find(
    ({ stateId }) => stateId === input.stateId
  );
  if (endpoint === undefined) return false;
  if (input.targetId === input.stateId ||
      endpoint.selectorIds.includes(input.targetId) ||
      endpoint.structuralAnchorIds.includes(input.targetId) ||
      endpoint.envelopeIds.includes(input.targetId)) {
    return true;
  }
  const transition = input.inventory.transitions.find(
    ({ stepId }) => stepId === input.targetId
  );
  return transition?.sourceStateId === input.stateId ||
    transition?.targetStateId === input.stateId;
}

function format(value: number): string {
  return value.toFixed(3).replace(/\.?0+$/, "");
}
