/// <reference types="vite/client" />

import {
  createKpLogExponentAnimationAsset,
  kpLogExponentAnimationId
} from "../animation/log-exponent-adapter.ts";
import {
  createKpCanonicalFunctionWrapChoreography,
  createKpCausalStructuralIntroductionChoreography
} from "../animation/equation-operation-choreography.ts";
import {
  kpCanonicalLogExponentSymbolMotionPlans
} from "../animation/log-exponent-symbol-motion.ts";
import type {
  KpCompiledSymbolMotionContract
} from "../animation/symbol-motion-contract.ts";
import {
  sampleKpLogExponentSequenceFrame
} from "../animation/log-exponent-timeline.ts";
import {
  createKpEquationFontReadiness
} from "../rendering/equation-font-readiness.ts";
import {
  bindKpLogExponentNativeEndpointOwnership,
  kpCanonicalLogExponentNativeEndpoints,
  settleAndObserveKpLogExponentNativeEndpoint
} from "../rendering/log-exponent-native-endpoints.ts";
import {
  createKpLogExponentTransitSession,
  type KpLogExponentTransitSession
} from "../rendering/log-exponent-transit-session.ts";
import {
  syncKpEquationMaterialLayer
} from "../rendering/equation-material-layer-dom.ts";
import type {
  KpNativeKatexRenderedSceneObservation
} from "../rendering/native-katex-rendered-scene.ts";
import type {
  KpNativeKatexFeaturePack
} from "../rendering/native-katex-feature-pack-contract.ts";
import {
  kpNativeKatexFeaturePackLoader
} from "../rendering/native-katex-feature-pack-loader.ts";
import type {
  KpCompiledLogExponentOperation
} from "../semantic/log-exponent-transformation-compiler.ts";
import {
  compileKpEquationOperationChoreography
} from "../reader/renderers/equation-operation-choreography-compiler.ts";
import type {
  KpEquationOperationChoreography
} from "../rendering/native-katex-operation-choreography.ts";
import {
  kpCanonicalLogExponentTransformationTree
} from "../semantic/log-exponent-transformation-tree.ts";
import type { KpLogExponentOperationKind } from "../semantic/log-exponent-operation-dispatch.ts";
import {
  createKpClosedDispatchRegistry,
  requireKpClosedDispatchEntry
} from "../domain-ir/equation-extension-registry.ts";
import {
  KP_EDITOR_ANIMATION_DISPOSE_EVENT
} from "./animation-player-controller.ts";
import type {
  KpEditorAnimationPlayerState
} from "./animation-player-state.ts";
import type {
  KpEditorAnimationSurfaceAdapter
} from "./animation-surface-adapter-registry.ts";

interface KpLogExponentSurfaceSession {
  readonly player: HTMLElement;
  readonly fontReadiness: ReturnType<typeof createKpEquationFontReadiness>;
  readonly stage: HTMLElement;
  readonly endpointRoots: readonly HTMLElement[];
  generation: number;
  pendingState: KpEditorAnimationPlayerState;
  preparedOperations?: readonly KpLogExponentPreparedOperation[] | undefined;
  activeTransit?: {
    readonly operationIndex: number;
    readonly transit: KpLogExponentTransitSession;
  } | undefined;
  disposed: boolean;
}

interface KpLogExponentPreparedOperation {
  readonly operation: KpCompiledLogExponentOperation;
  readonly nativeKatex: KpNativeKatexFeaturePack;
  readonly sourceEndpoint:
    (typeof kpCanonicalLogExponentNativeEndpoints)[number];
  readonly targetEndpoint:
    (typeof kpCanonicalLogExponentNativeEndpoints)[number];
  readonly source: KpNativeKatexRenderedSceneObservation;
  readonly target: KpNativeKatexRenderedSceneObservation;
  readonly operationChoreography?: KpEquationOperationChoreography | undefined;
  readonly symbolMotionContract: KpCompiledSymbolMotionContract;
  readonly horizontalAxisSemanticEntityIds?: readonly string[] | undefined;
}

const sessions = new WeakMap<HTMLElement, KpLogExponentSurfaceSession>();
const canonicalAnimation = createKpLogExponentAnimationAsset();

interface KpLogExponentSurfaceDispatchEntry {
  readonly id: KpLogExponentOperationKind;
  readonly sourceStatus: string;
  readonly activeStatus: string;
  readonly targetStatus: string;
  readonly horizontalAxisSemanticEntityIds?: readonly string[] | undefined;
  readonly compileChoreography: (input: {
    readonly operation: KpCompiledLogExponentOperation;
    readonly functionWrapInvocationGroup:
      (typeof kpCanonicalLogExponentSymbolMotionPlans)[number]["functionWrapInvocationGroup"];
  }) => KpEquationOperationChoreography | undefined;
}

const kpLogExponentSurfaceDispatch =
  createKpClosedDispatchRegistry<KpLogExponentOperationKind, KpLogExponentSurfaceDispatchEntry>(
    "log-exponent surface",
    [
      surfaceDispatch({
        id: "apply-natural-log-both-sides",
        sourceStatus: "Exponential equation ready.",
        activeStatus: "Applying the natural logarithm to both sides.",
        targetStatus: "Both sides are inside natural logarithms.",
        horizontalAxisSemanticEntityIds: [
          "source.base",
          "logged.base",
          "source.exponent",
          "logged.exponent",
          "source.equality",
          "logged.equality",
          "source.right",
          "logged.right"
        ],
        compileChoreography: ({ functionWrapInvocationGroup }) => {
          if (functionWrapInvocationGroup === undefined) {
            throw new Error("Apply-log surface requires function-wrap authority.");
          }
          return createKpCanonicalFunctionWrapChoreography({
            invocationGroup: functionWrapInvocationGroup,
            direction: "forward"
          });
        }
      }),
      surfaceDispatch({
        id: "extract-log-power-exponent",
        sourceStatus: "Both sides are inside natural logarithms.",
        activeStatus: "Moving x from exponent to coefficient.",
        targetStatus: "The exponent is now a coefficient.",
        compileChoreography: ({ operation }) =>
          compileKpEquationOperationChoreography({
            animation: canonicalAnimation,
            transformation: operation.transformation,
            motifKind: "append-after-shift",
            direction: "forward"
          })
      }),
      surfaceDispatch({
        id: "divide-both-sides-by-log-base",
        sourceStatus: "The exponent is now a coefficient.",
        activeStatus: "Dividing both sides by the logarithm of two.",
        targetStatus: "x is isolated as a quotient of logarithms.",
        horizontalAxisSemanticEntityIds: [
          "extracted.coefficient",
          "solved.left",
          "extracted.equality",
          "solved.equality"
        ],
        compileChoreography: ({ operation }) =>
          createKpCausalStructuralIntroductionChoreography({
            id: "operation-choreography.transformation.log-exponent.divide-by-log-base.structural-entry.forward",
            transformationId: operation.transformation.id,
            direction: "forward",
            semanticEntityIds: ["solved.right"],
            entryWindow: { start: 0.62, end: 0.9 }
          })
      })
    ]
  );

export const kpEditorLogExponentSurfaceAdapter = Object.freeze({
  id: "editor-animation-surface.log-exponent.canonical-native-katex",
  slotKind: "equation" as const,
  priority: 130,
  supports(state) {
    return state.animationId === kpLogExponentAnimationId;
  },
  render({ player, slot, state }) {
    let session = sessions.get(player);
    if (session === undefined) {
      session = mountSurface(player, slot, state);
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
    if (session.preparedOperations !== undefined) applyFrame(session, state);
  }
} satisfies KpEditorAnimationSurfaceAdapter);

function mountSurface(
  player: HTMLElement,
  slot: HTMLElement,
  state: KpEditorAnimationPlayerState
): KpLogExponentSurfaceSession {
  const document = player.ownerDocument;
  const stage = document.createElement("section");
  stage.className = "kp-log-exponent-stage";
  stage.dataset["kpLogExponentStage"] = "preparing";
  stage.setAttribute("aria-label", "Solve two to the x equals seven");

  const endpointRoots = kpCanonicalLogExponentNativeEndpoints.map(
    (endpoint, index) => {
      const root = document.createElement("div");
      root.className = "kp-log-exponent-stage__endpoint";
      root.dataset["kpLogExponentEndpointStateId"] = endpoint.stateId;
      root.dataset["kpLogExponentEndpointIndex"] = String(index);
      root.innerHTML = endpoint.nativeHtmlAndMathml;
      root.style.opacity = index === 0 ? "1" : "0";
      root.setAttribute("aria-hidden", index === 0 ? "false" : "true");
      if (index !== 0) root.setAttribute("inert", "");
      bindKpLogExponentNativeEndpointOwnership({ root, endpoint });
      return root;
    }
  );
  const materialLayer = document.createElement("div");
  materialLayer.className = "kp-log-exponent-stage__material-layer";
  materialLayer.dataset["kpEditorEquationMaterialLayer"] = "true";
  materialLayer.setAttribute("aria-hidden", "true");
  const status = document.createElement("output");
  status.className = "kp-log-exponent-stage__status";
  status.dataset["kpLogExponentStatus"] = "true";
  status.setAttribute("aria-live", "polite");
  status.textContent = "Exponential equation ready.";
  stage.append(...endpointRoots, materialLayer, status);
  slot.replaceChildren(stage);

  return {
    player,
    fontReadiness: createKpEquationFontReadiness(document),
    stage,
    endpointRoots: Object.freeze(endpointRoots),
    generation: 0,
    pendingState: state,
    disposed: false
  };
}

async function prepareSurface(
  session: KpLogExponentSurfaceSession,
  generation: number
): Promise<void> {
  try {
    const nativeKatex = await kpNativeKatexFeaturePackLoader.load();
    if (session.disposed || session.generation !== generation) return;
    const preparedOperations: KpLogExponentPreparedOperation[] = [];
    for (
      let index = 0;
      index < kpCanonicalLogExponentTransformationTree.operations.length;
      index += 1
    ) {
      const operation =
        kpCanonicalLogExponentTransformationTree.operations[index]!;
      const sourceEndpoint = kpCanonicalLogExponentNativeEndpoints[index]!;
      const targetEndpoint = kpCanonicalLogExponentNativeEndpoints[index + 1]!;
      const symbolMotionPlan =
        kpCanonicalLogExponentSymbolMotionPlans[index]!;
      if (symbolMotionPlan.operationId !== operation.operation.id) {
        throw new Error(
          `Log-exponent symbol motion crossed operation ${operation.operation.id}.`
        );
      }
      const sourceRoot = session.endpointRoots[index]!;
      const targetRoot = session.endpointRoots[index + 1]!;
      const source = await settleAndObserveKpLogExponentNativeEndpoint({
        endpointSide: "source",
        stage: session.stage,
        root: sourceRoot,
        endpoint: sourceEndpoint,
        fontReadiness: session.fontReadiness,
        observe: nativeKatex.observe.settleAndObserve
      });
      const target = await settleAndObserveKpLogExponentNativeEndpoint({
        endpointSide: "target",
        stage: session.stage,
        root: targetRoot,
        endpoint: targetEndpoint,
        fontReadiness: session.fontReadiness,
        observe: nativeKatex.observe.settleAndObserve
      });
      if (session.disposed || session.generation !== generation) return;
      const surfaceDispatch = requireKpClosedDispatchEntry(
        kpLogExponentSurfaceDispatch,
        operation.operation.kind
      );
      const operationChoreography = surfaceDispatch.compileChoreography({
        operation,
        functionWrapInvocationGroup:
          symbolMotionPlan.functionWrapInvocationGroup
      });
      preparedOperations.push({
        operation,
        nativeKatex,
        symbolMotionContract: symbolMotionPlan.contract,
        sourceEndpoint,
        targetEndpoint,
        source,
        target,
        ...(operationChoreography === undefined
          ? {}
          : { operationChoreography }),
        ...(surfaceDispatch.horizontalAxisSemanticEntityIds === undefined
          ? {}
          : {
              horizontalAxisSemanticEntityIds:
                surfaceDispatch.horizontalAxisSemanticEntityIds
            })
      });
    }
    if (session.disposed || session.generation !== generation) {
      return;
    }
    session.preparedOperations = Object.freeze(preparedOperations);
    session.stage.dataset["kpLogExponentStage"] = "ready";
    applyFrame(session, session.pendingState);
  } catch (error: unknown) {
    if (session.disposed || session.generation !== generation) return;
    session.stage.dataset["kpLogExponentStage"] = "failed";
    session.stage.dataset["kpLogExponentError"] =
      error instanceof Error ? error.message : String(error);
    session.endpointRoots.forEach((root, index) => {
      root.style.opacity = index === 0 ? "1" : "0";
      setAccessibleEndpoint(root, index === 0);
    });
  }
}

function applyFrame(
  session: KpLogExponentSurfaceSession,
  state: KpEditorAnimationPlayerState
): void {
  const preparedOperations = session.preparedOperations;
  if (preparedOperations === undefined) return;
  const accessibilityMode =
    session.player.dataset["kpEditorAnimationAccessibilityMode"] ??
    "full-motion";
  const reducedMotion =
    accessibilityMode === "reduced-motion" ||
    accessibilityMode === "static";
  const frame = sampleKpLogExponentSequenceFrame({
    progress: state.progress,
    direction: state.direction,
    reducedMotion
  });
  let activeTransit = session.activeTransit;
  if (activeTransit?.operationIndex !== frame.operationIndex) {
    activeTransit?.transit.retire();
    // A native KaTeX material layer has one renderer-session authority.
    // Clearing it before an operation boundary prevents generic track IDs
    // from reusing the preceding operation's computed-style clone.
    syncKpEquationMaterialLayer({ stage: session.stage, owners: [] });
    const prepared = preparedOperations[frame.operationIndex]!;
    activeTransit = {
      operationIndex: frame.operationIndex,
      transit: createKpLogExponentTransitSession(prepared)
    };
    session.activeTransit = activeTransit;
    session.stage.dataset["kpLogExponentOperationChoreographyId"] =
      prepared.operationChoreography?.id ?? "none";
    session.stage.dataset["kpLogExponentSymbolMotionContractId"] =
      prepared.symbolMotionContract.id;
  }
  const operationProgress = frame.obligationFrames[0]?.progress ?? 0;

  // Shared endpoint roots survive operation boundaries. Hiding all four first
  // prevents a session used earlier in the sequence from retaining paint.
  session.endpointRoots.forEach((root) => {
    root.style.opacity = "0";
    setAccessibleEndpoint(root, false);
  });
  const ownership = activeTransit.transit.apply({
    progress: operationProgress,
    direction: "forward",
    reducedMotion
  });
  const accessibleIndex = ownership.visualOwner === "source-native"
    ? frame.operationIndex
    : frame.operationIndex + 1;
  setAccessibleEndpoint(session.endpointRoots[accessibleIndex]!, true);
  session.stage.dataset["kpLogExponentOperationIndex"] =
    String(frame.operationIndex);
  session.stage.dataset["kpLogExponentOperationId"] = frame.operationId;
  session.stage.dataset["kpLogExponentAttentionStageId"] =
    frame.attentionStageId;
  session.stage.dataset["kpLogExponentOperationProgress"] =
    String(operationProgress);
  session.stage.dataset["kpLogExponentVisualOwner"] = ownership.visualOwner;
  const status = session.stage.querySelector<HTMLOutputElement>(
    "[data-kp-log-exponent-status]"
  );
  if (status !== null) {
    status.textContent = statusText(
      preparedOperations[frame.operationIndex]!.operation.operation.kind,
      operationProgress
    );
  }
}

function setAccessibleEndpoint(root: HTMLElement, active: boolean): void {
  root.setAttribute("aria-hidden", active ? "false" : "true");
  if (active) root.removeAttribute("inert");
  else root.setAttribute("inert", "");
}

function disposeSurface(
  player: HTMLElement,
  session: KpLogExponentSurfaceSession
): void {
  if (session.disposed) return;
  session.disposed = true;
  session.generation += 1;
  session.activeTransit?.transit.retire();
  syncKpEquationMaterialLayer({ stage: session.stage, owners: [] });
  session.fontReadiness.dispose();
  sessions.delete(player);
}

function statusText(
  operationKind: KpLogExponentOperationKind,
  progress: number
): string {
  const dispatch = requireKpClosedDispatchEntry(
    kpLogExponentSurfaceDispatch,
    operationKind
  );
  if (progress > 0 && progress < 1) {
    return dispatch.activeStatus;
  }
  return progress >= 1 ? dispatch.targetStatus : dispatch.sourceStatus;
}

function surfaceDispatch(
  input: KpLogExponentSurfaceDispatchEntry
): KpLogExponentSurfaceDispatchEntry {
  return Object.freeze({
    ...input,
    ...(input.horizontalAxisSemanticEntityIds === undefined
      ? {}
      : {
          horizontalAxisSemanticEntityIds: Object.freeze([
            ...input.horizontalAxisSemanticEntityIds
          ])
        })
  });
}
