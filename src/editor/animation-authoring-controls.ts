export type KpEditorAnimationAuthoringControlId =
  | "role-mode"
  | "lineage-mode"
  | "provenance-visibility"
  | "salience-policy"
  | "correctness-disclosure"
  | "gap-policy"
  | "spacing"
  | "tempo"
  | "path-preference";

export interface KpEditorAnimationAuthoringState {
  readonly kind: "editor-animation-authoring-state";
  readonly revision: number;
  readonly semantic: {
    readonly roleMode: "canonical" | "source-focused" | "target-focused";
    readonly lineageMode: "preserve" | "copy" | "merge" | "replace";
    readonly provenanceVisibility: boolean;
    readonly saliencePolicy: "source-to-target" | "balanced" | "target-first";
    readonly correctnessDisclosure: "immediate" | "checkpoint" | "learner-request";
    readonly gapPolicy: "strict" | "show-typed-gaps";
  };
  readonly presentation: {
    readonly spacing: "compact" | "balanced" | "spacious";
    readonly tempo: number;
    readonly pathPreference:
      | "automatic"
      | "arc-above"
      | "arc-below"
      | "around-left"
      | "around-right";
  };
}

export interface KpEditorAnimationRegenerationRequest {
  readonly kind: "editor-animation-regeneration-request";
  readonly animationId: string;
  readonly authoringRevision: number;
  readonly semantic: KpEditorAnimationAuthoringState["semantic"];
  readonly presentation: KpEditorAnimationAuthoringState["presentation"];
}

export function createKpEditorAnimationAuthoringState(): KpEditorAnimationAuthoringState {
  return {
    kind: "editor-animation-authoring-state",
    revision: 0,
    semantic: {
      roleMode: "canonical",
      lineageMode: "preserve",
      provenanceVisibility: true,
      saliencePolicy: "source-to-target",
      correctnessDisclosure: "checkpoint",
      gapPolicy: "show-typed-gaps"
    },
    presentation: {
      spacing: "balanced",
      tempo: 1,
      pathPreference: "automatic"
    }
  };
}

export function updateKpEditorAnimationAuthoringControl(input: {
  readonly state: KpEditorAnimationAuthoringState;
  readonly controlId: KpEditorAnimationAuthoringControlId;
  readonly value: string | number | boolean;
}): KpEditorAnimationAuthoringState {
  const state = input.state;
  switch (input.controlId) {
    case "role-mode":
      return semanticUpdate(state, { roleMode: enumValue(input.value, input.controlId, ["canonical", "source-focused", "target-focused"]) });
    case "lineage-mode":
      return semanticUpdate(state, { lineageMode: enumValue(input.value, input.controlId, ["preserve", "copy", "merge", "replace"]) });
    case "provenance-visibility":
      return semanticUpdate(state, { provenanceVisibility: Boolean(input.value) });
    case "salience-policy":
      return semanticUpdate(state, { saliencePolicy: enumValue(input.value, input.controlId, ["source-to-target", "balanced", "target-first"]) });
    case "correctness-disclosure":
      return semanticUpdate(state, { correctnessDisclosure: enumValue(input.value, input.controlId, ["immediate", "checkpoint", "learner-request"]) });
    case "gap-policy":
      return semanticUpdate(state, { gapPolicy: enumValue(input.value, input.controlId, ["strict", "show-typed-gaps"]) });
    case "spacing":
      return presentationUpdate(state, { spacing: enumValue(input.value, input.controlId, ["compact", "balanced", "spacious"]) });
    case "tempo": {
      const tempo = typeof input.value === "number" ? input.value : Number(input.value);
      if (!Number.isFinite(tempo) || tempo < 0.5 || tempo > 2) {
        throw new Error("Animation tempo must be between 0.5 and 2.");
      }
      return presentationUpdate(state, { tempo });
    }
    case "path-preference":
      return presentationUpdate(state, { pathPreference: enumValue(input.value, input.controlId, ["automatic", "arc-above", "arc-below", "around-left", "around-right"]) });
  }
}

export function createKpEditorAnimationRegenerationRequest(input: {
  readonly animationId: string;
  readonly state: KpEditorAnimationAuthoringState;
}): KpEditorAnimationRegenerationRequest {
  return {
    kind: "editor-animation-regeneration-request",
    animationId: input.animationId,
    authoringRevision: input.state.revision,
    semantic: { ...input.state.semantic },
    presentation: { ...input.state.presentation }
  };
}

function semanticUpdate(
  state: KpEditorAnimationAuthoringState,
  update: Partial<KpEditorAnimationAuthoringState["semantic"]>
): KpEditorAnimationAuthoringState {
  return { ...state, revision: state.revision + 1, semantic: { ...state.semantic, ...update } };
}

function presentationUpdate(
  state: KpEditorAnimationAuthoringState,
  update: Partial<KpEditorAnimationAuthoringState["presentation"]>
): KpEditorAnimationAuthoringState {
  return { ...state, revision: state.revision + 1, presentation: { ...state.presentation, ...update } };
}

function enumValue<const TValue extends string>(
  value: string | number | boolean,
  controlId: string,
  allowed: readonly TValue[]
): TValue {
  if (typeof value !== "string" || !allowed.includes(value as TValue)) {
    throw new Error(`Invalid ${controlId} value ${String(value)}.`);
  }
  return value as TValue;
}
