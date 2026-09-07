/// <reference types="vite/client" />

import {
  compileKpCarrierPreservingSimplificationRecipe,
  type KpCarrierPreservingSimplificationRecipe
} from "../animation/carrier-preserving-simplification-recipe.ts";
import {
  createKpTwoTimesOneCarrierAnimationAsset,
  kpTwoTimesOneCarrierAnimationId
} from "../animation/operation-evaluation-adapter.ts";
import {
  resolveKpOperationEvaluationFamilyCandidate
} from "../animation/operation-evaluation-family-profile.ts";
import {
  bindKpNativeKatexCarrierPreservingSimplification
} from "../rendering/native-katex-carrier-preserving-simplification-binding.ts";
import {
  compileKpNativeKatexCarrierPreservingSimplificationMotion
} from "../rendering/native-katex-carrier-preserving-simplification-motion.ts";
import {
  kpNativeKatexCarrierPreservingSimplificationOpticalProfile
} from "../rendering/native-katex-carrier-preserving-simplification-profile.ts";
import {
  createKpNativeKatexCarrierPreservingSimplificationSession,
  type KpNativeKatexCarrierPreservingSimplificationSession
} from "../rendering/native-katex-carrier-preserving-simplification-settlement.ts";
import {
  bindKpCarrierPreservingSimplificationNativeEndpoint,
  kpCanonicalCarrierPreservingSimplificationNativeEndpoints,
  kpGeneratedAddZeroCarrierPreservingSimplificationNativeEndpoints,
  type KpCarrierPreservingSimplificationNativeEndpoint,
  settleAndObserveKpCarrierPreservingSimplificationEndpoint
} from "../rendering/carrier-preserving-simplification-native-endpoints.ts";
import {
  planKpNativeKatexStationaryContextAlignment
} from "../rendering/native-katex-carrier-preserving-simplification-alignment.ts";
import {
  createKpEquationFontReadiness
} from "../rendering/equation-font-readiness.ts";
import {
  syncKpEquationMaterialLayer
} from "../rendering/equation-material-layer-dom.ts";
import {
  createKpNativeKatexRenderedEndpointHandle,
  type KpNativeKatexRenderedEndpointRevision
} from "../rendering/native-katex-rendered-scene.ts";
import {
  createKpTwoTimesOneCarrierEvidenceCandidate,
  createKpTwoTimesOneCarrierExemplar
} from "../semantic/carrier-preserving-simplification-exemplar.ts";
import {
  createKpGeneratedAddZeroCarrierSource,
  kpGeneratedAddZeroAnimationId
} from "../semantic/generated-add-zero-carrier-preserving-simplification.ts";
import {
  verifyKpCarrierPreservingSimplificationEvidence,
  type KpCarrierPreservingSimplificationEvidenceCandidate
} from "../semantic/carrier-preserving-simplification-evidence.ts";
import type { KpAssetBundle } from "../semantic/asset.ts";
import type { KpSemanticTransformation } from
  "../semantic/asset-transformation.ts";
import {
  KP_EDITOR_ANIMATION_DISPOSE_EVENT
} from "./animation-player-controller.ts";
import type {
  KpEditorAnimationPlayerState
} from "./animation-player-state.ts";
import type {
  KpEditorAnimationSurfaceAdapter
} from "./animation-surface-adapter-registry.ts";
import {
  compileKpEquationEvaluationMigrationV2,
  type KpEquationEvaluationMigrationV2
} from "../domain-ir/equation-evaluation-migration-v2.ts";

type EndpointRoots = readonly [HTMLElement, HTMLElement];
type NativeEndpoints = readonly [
  KpCarrierPreservingSimplificationNativeEndpoint,
  KpCarrierPreservingSimplificationNativeEndpoint
];

interface KpCarrierPreservingSimplificationSurfaceDefinition {
  readonly identityInkShrinkReview?: boolean;
  readonly animationId: string;
  readonly recipe: KpCarrierPreservingSimplificationRecipe;
  readonly governance: KpEquationEvaluationMigrationV2;
  readonly endpoints: NativeEndpoints;
  readonly ariaLabel: string;
  readonly readyStatus: string;
  readonly completeStatus: string;
  readonly activeStatus: string;
}

interface KpCarrierPreservingSimplificationSurfaceSession {
  readonly player: HTMLElement;
  readonly stage: HTMLElement;
  readonly definition: KpCarrierPreservingSimplificationSurfaceDefinition;
  readonly endpointRoots: EndpointRoots;
  readonly fontReadiness: ReturnType<typeof createKpEquationFontReadiness>;
  generation: number;
  measurementRevision: number;
  pendingState: KpEditorAnimationPlayerState;
  playback?: KpNativeKatexCarrierPreservingSimplificationSession | undefined;
  measuredRevisions?: {
    readonly source: KpNativeKatexRenderedEndpointRevision;
    readonly target: KpNativeKatexRenderedEndpointRevision;
  } | undefined;
  preparedFontRevision?: number | undefined;
  preparedViewportFingerprint?: string | undefined;
  invalidationQueued: boolean;
  replacementPreparing: boolean;
  pendingInvalidation: boolean;
  resizeObserver?: ResizeObserver | undefined;
  removeWindowResizeListener?: (() => void) | undefined;
  unsubscribeFonts?: (() => void) | undefined;
  disposed: boolean;
}

const sessions = new WeakMap<HTMLElement,
  KpCarrierPreservingSimplificationSurfaceSession>();
const surfaceDefinitions = createSurfaceDefinitions();

export const kpEditorCarrierPreservingSimplificationSurfaceAdapter =
  createSurfaceAdapter(surfaceDefinitions);

/** Bounded prepared-source entrance: retain native ownership and verified
 * recipe authority. A caller may explicitly opt into the removal-paint review. */
export function createKpPreparedCarrierPreservingSimplificationSurfaceAdapter(
  animation: import("../animation/asset.ts").KpAnimationAsset,
  options: { readonly identityInkShrinkReview?: boolean } = {}
): KpEditorAnimationSurfaceAdapter {
  if (JSON.stringify(animation) !== JSON.stringify(createKpTwoTimesOneCarrierAnimationAsset())) {
    throw new Error("kp.authoring.simplification-surface-source-gap");
  }
  return createSurfaceAdapter(createSurfaceDefinitions(animation).slice(0, 1)
    .map(definition => ({ ...definition, identityInkShrinkReview: options.identityInkShrinkReview ?? false })));
}

function createSurfaceAdapter(definitions: readonly KpCarrierPreservingSimplificationSurfaceDefinition[]) {
  return Object.freeze({
    id:
      "editor-animation-surface.operation-evaluation.carrier-preserving-simplification",
    slotKind: "equation" as const,
    priority: 142,
    supports(state) {
      return definitions.some(
        ({ animationId }) => animationId === state.animationId
      );
    },
    render({ player, slot, state }) {
      let session = sessions.get(player);
      if (session === undefined) {
        session = mountSurface(
          player,
          slot,
          state,
          requiredSurfaceDefinition(state.animationId, definitions)
        );
        sessions.set(player, session);
        player.addEventListener(
          KP_EDITOR_ANIMATION_DISPOSE_EVENT,
          () => disposeSurface(player, session!),
          { once: true }
        );
        const generation = ++session.generation;
        void prepareSurface(session, generation);
      }
      session.pendingState = state;
      if (session.playback !== undefined) applyFrame(session, state);
    }
  } satisfies KpEditorAnimationSurfaceAdapter);
}

function createSurfaceDefinitions(prepared?: import("../animation/asset.ts").KpAnimationAsset):
readonly KpCarrierPreservingSimplificationSurfaceDefinition[] {
  const exemplarAnimation = prepared ?? createKpTwoTimesOneCarrierAnimationAsset();
  const exemplar = prepared ? { bundle: prepared.bundle, transformation: prepared.transformations[0]! }
    : createKpTwoTimesOneCarrierExemplar();
  const generatedAddZero = createKpGeneratedAddZeroCarrierSource();
  const exemplarRecipe = compileRecipe({
    candidate: createKpTwoTimesOneCarrierEvidenceCandidate(),
    bundle: exemplar.bundle,
    transformation: exemplar.transformation
  });
  const generatedAddZeroRecipe = compileRecipe({
    candidate: generatedAddZero.evidenceCandidate,
    bundle: generatedAddZero.animation.bundle,
    transformation: generatedAddZero.transformation
  });
  return Object.freeze([
    Object.freeze({
      animationId: kpTwoTimesOneCarrierAnimationId,
      recipe: exemplarRecipe,
      governance: compileCarrierGovernance({
        animation: exemplarAnimation,
        operationId:
          "kp.semantic-motion.absorb-multiplicative-identity",
        recipe: exemplarRecipe
      }),
      endpoints:
        kpCanonicalCarrierPreservingSimplificationNativeEndpoints,
      ariaLabel:
        "Two times one simplifies to two while preserving the first two.",
      readyStatus: "Two times one ready.",
      completeStatus: "Two remains.",
      activeStatus:
        "The multiplication sign and identity witness fade away while two stays present."
    }),
    Object.freeze({
      animationId: kpGeneratedAddZeroAnimationId,
      recipe: generatedAddZeroRecipe,
      governance: compileCarrierGovernance({
        animation: generatedAddZero.animation,
        operationId: "kp.semantic-motion.absorb-additive-identity",
        recipe: generatedAddZeroRecipe
      }),
      endpoints:
        kpGeneratedAddZeroCarrierPreservingSimplificationNativeEndpoints,
      ariaLabel:
        "x plus zero equals four simplifies to x equals four while preserving x, equality, and four.",
      readyStatus: "x plus zero equals four ready.",
      completeStatus: "x equals four remains.",
      activeStatus:
        "The plus sign and zero fade away while x, equality, and four stay present."
    })
  ]);
}

function compileCarrierGovernance(input: {
  readonly animation: import("../animation/asset.ts").KpAnimationAsset;
  readonly operationId:
    | "kp.semantic-motion.absorb-additive-identity"
    | "kp.semantic-motion.absorb-multiplicative-identity";
  readonly recipe: KpCarrierPreservingSimplificationRecipe;
}): KpEquationEvaluationMigrationV2 {
  const operator = input.recipe.removedSyntaxCohort.selectorRefs.filter(
    (id) => id !== input.recipe.identityLawWitness.sourceSelectorRef
  );
  return compileKpEquationEvaluationMigrationV2({
    animation: input.animation,
    operationId: input.operationId,
    roleBindings: {
      "operand-before": [input.recipe.carrier.sourceSelectorRef],
      operator,
      identity: [input.recipe.identityLawWitness.sourceSelectorRef],
      "operand-after": [input.recipe.carrier.targetSelectorRef]
    }
  });
}

function compileRecipe(input: {
  readonly candidate: KpCarrierPreservingSimplificationEvidenceCandidate;
  readonly bundle: KpAssetBundle;
  readonly transformation: KpSemanticTransformation;
}): KpCarrierPreservingSimplificationRecipe {
  const verified = verifyKpCarrierPreservingSimplificationEvidence({
    candidate: input.candidate,
    bundle: input.bundle,
    transformation: input.transformation
  });
  if (verified.status !== "verified") {
    throw new Error(
      `Carrier surface ${input.transformation.id} lacks verified evidence.`
    );
  }
  const resolution = resolveKpOperationEvaluationFamilyCandidate({
    family: "carrier-preserving-simplification",
    handoff: "persistent-carrier-transfer",
    transformationKind: input.transformation.transformType,
    evidence: verified.evidence
  });
  const compiled = compileKpCarrierPreservingSimplificationRecipe(resolution);
  if (compiled.status !== "compiled") {
    throw new Error(compiled.message);
  }
  return compiled.recipe;
}

function requiredSurfaceDefinition(
  animationId: string,
  definitions: readonly KpCarrierPreservingSimplificationSurfaceDefinition[]
): KpCarrierPreservingSimplificationSurfaceDefinition {
  const definition = definitions.find((candidate) =>
    candidate.animationId === animationId
  );
  if (definition === undefined) {
    throw new Error(`Unsupported carrier surface ${animationId}.`);
  }
  return definition;
}

function mountSurface(
  player: HTMLElement,
  slot: HTMLElement,
  state: KpEditorAnimationPlayerState,
  definition: KpCarrierPreservingSimplificationSurfaceDefinition
): KpCarrierPreservingSimplificationSurfaceSession {
  const document = player.ownerDocument;
  const stage = document.createElement("section");
  stage.className = "kp-carrier-preserving-simplification-stage";
  stage.dataset["kpCarrierPreservingSimplificationStage"] = "preparing";
  stage.dataset["kpEquationGovernanceCompilerId"] =
    definition.governance.compilerId;
  stage.dataset["kpEquationGovernancePlanId"] =
    definition.governance.presentationPlan.id;
  stage.dataset["kpEquationEvaluationAuthorityId"] =
    definition.governance.presentationPlan.transitions[0]!
      .evaluationAuthority!.authorityId;
  stage.setAttribute(
    "aria-label",
    definition.ariaLabel
  );
  const createRoot = (
    endpoint: KpCarrierPreservingSimplificationNativeEndpoint,
    active: boolean
  ): HTMLElement => {
      const root = document.createElement("div");
      root.className =
        "kp-carrier-preserving-simplification-stage__endpoint";
      root.dataset["kpCarrierPreservingSimplificationEndpoint"] =
        endpoint.side;
      root.innerHTML = endpoint.nativeHtmlAndMathml;
      root.style.opacity = active ? "1" : "0";
      setAccessibleEndpoint(root, active);
      bindKpCarrierPreservingSimplificationNativeEndpoint({ root, endpoint });
      return root;
    };
  const roots: [HTMLElement, HTMLElement] = [
    createRoot(definition.endpoints[0], true),
    createRoot(definition.endpoints[1], false)
  ];
  const materialLayer = document.createElement("div");
  materialLayer.className =
    "kp-carrier-preserving-simplification-stage__material-layer";
  materialLayer.dataset["kpEditorEquationMaterialLayer"] = "true";
  materialLayer.setAttribute("aria-hidden", "true");
  const status = document.createElement("output");
  status.className =
    "kp-carrier-preserving-simplification-stage__status";
  status.dataset["kpCarrierPreservingSimplificationStatus"] = "true";
  status.setAttribute("aria-live", "polite");
  status.textContent = definition.readyStatus;
  stage.append(...roots, materialLayer, status);
  slot.replaceChildren(stage);
  return {
    player,
    stage,
    definition,
    endpointRoots: Object.freeze(roots) as EndpointRoots,
    fontReadiness: createKpEquationFontReadiness(document),
    generation: 0,
    measurementRevision: 0,
    pendingState: state,
    invalidationQueued: false,
    replacementPreparing: false,
    pendingInvalidation: false,
    disposed: false
  };
}

async function prepareSurface(
  session: KpCarrierPreservingSimplificationSurfaceSession,
  generation: number
): Promise<void> {
  try {
    const [sourceEndpoint, targetEndpoint] = session.definition.endpoints;
    const targetRoot = session.endpointRoots[1];
    targetRoot.style.transform = "none";
    delete targetRoot.dataset["kpStationaryContextAlignment"];
    const [sourceObservation, initialTargetObservation] = await Promise.all([
      settleAndObserveKpCarrierPreservingSimplificationEndpoint({
        stage: session.stage,
        root: session.endpointRoots[0],
        endpoint: sourceEndpoint,
        fontReadiness: session.fontReadiness,
        viewportRevision: session.measurementRevision
      }),
      settleAndObserveKpCarrierPreservingSimplificationEndpoint({
        stage: session.stage,
        root: targetRoot,
        endpoint: targetEndpoint,
        fontReadiness: session.fontReadiness,
        viewportRevision: session.measurementRevision
      })
    ]);
    if (session.disposed || session.generation !== generation) return;
    const alignment = planKpNativeKatexStationaryContextAlignment({
      recipe: session.definition.recipe,
      source: sourceObservation,
      target: initialTargetObservation
    });
    targetRoot.style.transform =
      `translate(${alignment.translateX}px, ${alignment.translateY}px)`;
    targetRoot.dataset["kpStationaryContextAlignment"] =
      `${alignment.translateX},${alignment.translateY}`;
    const targetObservation = alignment.correspondenceRecordIds.length === 0
      ? initialTargetObservation
      : await settleAndObserveKpCarrierPreservingSimplificationEndpoint({
          stage: session.stage,
          root: targetRoot,
          endpoint: targetEndpoint,
          fontReadiness: session.fontReadiness,
          viewportRevision: session.measurementRevision
        });
    if (session.disposed || session.generation !== generation) return;
    const sourceHandle = createKpNativeKatexRenderedEndpointHandle({
      observation: sourceObservation
    });
    const targetHandle = createKpNativeKatexRenderedEndpointHandle({
      observation: targetObservation
    });
    const binding = bindKpNativeKatexCarrierPreservingSimplification({
      recipe: session.definition.recipe,
      sourceHandle,
      targetHandle
    });
    const motion = compileKpNativeKatexCarrierPreservingSimplificationMotion({
      binding, identityInkShrinkReview: session.definition.identityInkShrinkReview
    });
    const measuredRevisions = Object.freeze({
      source: sourceHandle.revision,
      target: targetHandle.revision
    });
    session.preparedFontRevision = session.fontReadiness.revision;
    session.preparedViewportFingerprint = viewportFingerprint(session.stage);
    const playback =
      createKpNativeKatexCarrierPreservingSimplificationSession({
        plan: motion,
        currentRevisions: () =>
          currentEndpointRevisions(session, measuredRevisions)
      });
    session.playback?.retire("measurement-invalidated");
    session.playback = playback;
    session.measuredRevisions = measuredRevisions;
    session.stage.dataset["kpCarrierPreservingSimplificationStage"] = "ready";
    if (import.meta.env.DEV) {
      session.stage.dataset["kpCarrierPreservingSimplificationRecipeId"] =
        session.definition.recipe.id;
      session.stage.dataset["kpCarrierPreservingSimplificationProfileId"] =
        session.definition.recipe.profileId;
      session.stage.dataset["kpCarrierPreservingSimplificationTreatment"] =
        session.definition.identityInkShrinkReview ? "identity-ink-shrink-review" :
          kpNativeKatexCarrierPreservingSimplificationOpticalProfile.treatment;
      session.stage.dataset["kpCarrierPreservingSimplificationCarrierTrackId"] =
        motion.carrierTrackId;
      session.stage.dataset[
        "kpCarrierPreservingSimplificationRemovedTrackCount"
      ] = String(motion.removedSyntaxTrackIds.length);
      session.stage.dataset[
        "kpCarrierPreservingSimplificationTerminalStableFrom"
      ] = String(playback.settlement.terminalStableFrom);
      session.stage.dataset[
        "kpCarrierPreservingSimplificationMeasurementRevision"
      ] = String(session.measurementRevision);
      session.stage.dataset[
        "kpCarrierPreservingSimplificationFontRevision"
      ] = String(sourceHandle.revision.fontRevision);
      session.stage.dataset[
        "kpCarrierPreservingSimplificationViewportKey"
      ] = sourceHandle.revision.viewportKey;
      session.stage.dataset[
        "kpCarrierPreservingSimplificationStationaryContextCount"
      ] = String(session.definition.recipe.stationaryContext.length);
    }
    installInvalidationLifecycle(session);
    applyFrame(session, session.pendingState);
    session.replacementPreparing = false;
    flushPendingInvalidation(session);
  } catch (error: unknown) {
    if (session.disposed || session.generation !== generation) return;
    session.replacementPreparing = false;
    session.stage.dataset["kpCarrierPreservingSimplificationStage"] =
      "failed";
    session.stage.dataset["kpCarrierPreservingSimplificationError"] =
      error instanceof Error ? error.message : String(error);
    showEndpoint(session, "source");
  }
}

function applyFrame(
  session: KpCarrierPreservingSimplificationSurfaceSession,
  state: KpEditorAnimationPlayerState
): void {
  if (
    session.playback === undefined ||
    session.stage.dataset["kpCarrierPreservingSimplificationStage"] !== "ready"
  ) return;
  // A seek or media change can arrive before ResizeObserver. Replace stale
  // measurements outside sampling, retaining the latest pending playhead.
  if (session.measuredRevisions !== undefined &&
    currentEndpointRevisions(session, session.measuredRevisions) !== session.measuredRevisions) {
    scheduleMeasurementReplacement(session);
    return;
  }
  const directedProgress = state.direction === "rewind"
    ? 1 - state.progress
    : state.progress;
  const progress = accessibleProgress(session.player, directedProgress);
  session.endpointRoots.forEach((root) => setAccessibleEndpoint(root, false));
  const ownership = session.playback.apply(progress);
  const accessibleSide = ownership.visualOwner === "source-native"
    ? "source"
    : ownership.visualOwner === "target-native"
      ? "target"
      : progress < 0.5 ? "source" : "target";
  setAccessibleEndpoint(
    session.endpointRoots[accessibleSide === "source" ? 0 : 1],
    true
  );
  session.stage.dataset["kpCarrierPreservingSimplificationProgress"] =
    String(progress);
  session.stage.dataset["kpCarrierPreservingSimplificationVisualOwner"] =
    ownership.visualOwner;
  const status = session.stage.querySelector<HTMLOutputElement>(
    "[data-kp-carrier-preserving-simplification-status]"
  );
  if (status !== null) {
    status.textContent = progress === 0
      ? session.definition.readyStatus
      : progress === 1
        ? session.definition.completeStatus
        : session.definition.activeStatus;
  }
}

function currentEndpointRevisions(
  session: KpCarrierPreservingSimplificationSurfaceSession,
  measured: {
    readonly source: KpNativeKatexRenderedEndpointRevision;
    readonly target: KpNativeKatexRenderedEndpointRevision;
  }
) {
  const currentViewport = viewportFingerprint(session.stage);
  if (
    session.preparedViewportFingerprint === currentViewport &&
    session.preparedFontRevision === session.fontReadiness.revision
  ) return measured;
  // A changed key makes stale geometry fail closed before the compositor can
  // paint even one frame from the prior measurement transaction.
  return Object.freeze({
    source: Object.freeze({
      fontRevision: session.fontReadiness.revision,
      viewportKey: `${measured.source.viewportKey}:stale`
    }),
    target: Object.freeze({
      fontRevision: session.fontReadiness.revision,
      viewportKey: `${measured.target.viewportKey}:stale`
    })
  });
}

function installInvalidationLifecycle(
  session: KpCarrierPreservingSimplificationSurfaceSession
): void {
  if (session.unsubscribeFonts !== undefined) return;
  session.unsubscribeFonts = session.fontReadiness.subscribe(() =>
    scheduleMeasurementReplacement(session)
  );
  const view = session.stage.ownerDocument.defaultView;
  if (view !== null) {
    const onResize = (): void => scheduleMeasurementReplacement(session);
    view.addEventListener("resize", onResize);
    session.removeWindowResizeListener = () =>
      view.removeEventListener("resize", onResize);
  }
  if (typeof ResizeObserver !== "undefined") {
    session.resizeObserver = new ResizeObserver(() =>
      scheduleMeasurementReplacement(session)
    );
    session.resizeObserver.observe(session.stage);
  }
}

function scheduleMeasurementReplacement(
  session: KpCarrierPreservingSimplificationSurfaceSession
): void {
  if (session.disposed) return;
  session.pendingInvalidation = true;
  if (session.invalidationQueued || session.replacementPreparing) return;
  session.invalidationQueued = true;
  queueMicrotask(() => {
    session.invalidationQueued = false;
    if (session.disposed) return;
    session.pendingInvalidation = false;
    const changed =
      session.preparedFontRevision !== session.fontReadiness.revision ||
      session.preparedViewportFingerprint !== viewportFingerprint(session.stage);
    if (!changed) return;
    session.replacementPreparing = true;
    session.playback?.retire("measurement-invalidated");
    session.playback = undefined;
    syncKpEquationMaterialLayer({ stage: session.stage, owners: [] });
    showEndpoint(session, "source");
    session.measurementRevision += 1;
    session.stage.dataset["kpCarrierPreservingSimplificationStage"] =
      "preparing";
    const generation = ++session.generation;
    void prepareSurface(session, generation);
  });
}

function flushPendingInvalidation(
  session: KpCarrierPreservingSimplificationSurfaceSession
): void {
  if (session.pendingInvalidation) scheduleMeasurementReplacement(session);
}

function viewportFingerprint(stage: HTMLElement): string {
  const rect = stage.getBoundingClientRect();
  const dpr = stage.ownerDocument.defaultView?.devicePixelRatio ?? 1;
  return `${rect.width}x${rect.height}@${dpr}`;
}

function accessibleProgress(player: HTMLElement, progress: number): number {
  const mode = player.dataset["kpEditorAnimationAccessibilityMode"];
  return mode === "reduced-motion" || mode === "static"
    ? progress < 0.5 ? 0 : 1
    : Math.max(0, Math.min(1, progress));
}

function showEndpoint(
  session: KpCarrierPreservingSimplificationSurfaceSession,
  side: "source" | "target"
): void {
  session.endpointRoots.forEach((root, index) => {
    const active = index === (side === "source" ? 0 : 1);
    root.style.opacity = active ? "1" : "0";
    setAccessibleEndpoint(root, active);
  });
}

function setAccessibleEndpoint(root: HTMLElement, active: boolean): void {
  root.setAttribute("aria-hidden", active ? "false" : "true");
  if (active) root.removeAttribute("inert");
  else root.setAttribute("inert", "");
}

function disposeSurface(
  player: HTMLElement,
  session: KpCarrierPreservingSimplificationSurfaceSession
): void {
  if (session.disposed) return;
  session.disposed = true;
  session.generation += 1;
  session.resizeObserver?.disconnect();
  session.removeWindowResizeListener?.();
  session.unsubscribeFonts?.();
  session.playback?.retire("surface-disposed");
  syncKpEquationMaterialLayer({ stage: session.stage, owners: [] });
  session.fontReadiness.dispose();
  sessions.delete(player);
}
