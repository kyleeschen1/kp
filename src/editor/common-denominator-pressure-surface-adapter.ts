/// <reference types="vite/client" />

import {
  kpCommonDenominatorPressureAnimationId,
  kpCommonDenominatorPressureTimeline,
  sampleKpCommonDenominatorPressureTimeline,
  type KpCommonDenominatorPressureTimelineSegment
} from "../animation/common-denominator-pressure-exemplar.ts";
import {
  kpCanonicalCommonDenominatorPressurePresentationPlan
} from "../animation/common-denominator-pressure-presentation-plan.ts";
import { createKpEquationFontReadiness } from
  "../rendering/equation-font-readiness.ts";
import { syncKpEquationMaterialLayer } from
  "../rendering/equation-material-layer-dom.ts";
import {
  createKpFractionEquivalenceTransitSession,
  type KpFractionEquivalenceTransitSession
} from "../rendering/fraction-equivalence-transit-session.ts";
import {
  bindKpCommonDenominatorPressureIntroductionTarget,
  bindKpCommonDenominatorPressureNativeEndpoint,
  coalesceKpCommonDenominatorPressureIntroductionTarget,
  kpCanonicalCommonDenominatorPressureNativeEndpoints,
  type KpCommonDenominatorPressureNativeEndpoint
} from "../rendering/common-denominator-pressure-native-endpoints.ts";
import {
  compileKpCanonicalNativeKatexScenePlan,
  createKpCanonicalNativeKatexSceneSession,
  type KpCanonicalNativeKatexSceneSession
} from "../rendering/native-katex-scene-compositor.ts";
import type {
  KpNativeKatexSemanticPaintRelation
} from "../rendering/native-katex-base-scene-plan.ts";
import {
  settleAndObserveKpNativeKatexRenderedScene
} from "../rendering/native-katex-rendered-scene.ts";
import { KP_EDITOR_ANIMATION_DISPOSE_EVENT } from
  "./animation-player-controller.ts";
import type { KpEditorAnimationPlayerState } from
  "./animation-player-state.ts";
import type { KpEditorAnimationSurfaceAdapter } from
  "./animation-surface-adapter-registry.ts";

interface KpCommonDenominatorPressureSurfaceSession {
  readonly player: HTMLElement;
  readonly stage: HTMLElement;
  readonly roots: ReadonlyMap<
    KpCommonDenominatorPressureNativeEndpoint["kind"],
    HTMLElement
  >;
  readonly fontReadiness: ReturnType<typeof createKpEquationFontReadiness>;
  generation: number;
  pendingState: KpEditorAnimationPlayerState;
  introduction?: KpCanonicalNativeKatexSceneSession | undefined;
  equivalence?: KpFractionEquivalenceTransitSession | undefined;
  evaluation?: KpCanonicalNativeKatexSceneSession | undefined;
  disposed: boolean;
}

const sessions = new WeakMap<
  HTMLElement,
  KpCommonDenominatorPressureSurfaceSession
>();
const plan = kpCanonicalCommonDenominatorPressurePresentationPlan;

export const kpEditorCommonDenominatorPressureSurfaceAdapter = Object.freeze({
  id: "editor-animation-surface.fraction-equivalence.common-denominator-pressure",
  slotKind: "equation" as const,
  priority: 134,
  supports(state) {
    return state.animationId === kpCommonDenominatorPressureAnimationId;
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
    if (isReady(session)) applyFrame(session, state);
  }
} satisfies KpEditorAnimationSurfaceAdapter);

function mountSurface(
  player: HTMLElement,
  slot: HTMLElement,
  state: KpEditorAnimationPlayerState
): KpCommonDenominatorPressureSurfaceSession {
  const document = player.ownerDocument;
  const stage = document.createElement("section");
  stage.className = "kp-common-denominator-pressure-stage";
  stage.dataset["kpCommonDenominatorPressureStage"] = "preparing";
  stage.setAttribute(
    "aria-label",
    "Give one third a denominator of six"
  );
  const roots = new Map<
    KpCommonDenominatorPressureNativeEndpoint["kind"],
    HTMLElement
  >();
  kpCanonicalCommonDenominatorPressureNativeEndpoints.forEach(
    (endpoint, index) => {
      const root = document.createElement("div");
      root.className =
        "kp-common-denominator-pressure-stage__endpoint";
      root.dataset["kpCommonDenominatorPressureEndpoint"] = endpoint.kind;
      root.innerHTML = endpoint.nativeHtmlAndMathml;
      root.style.opacity = index === 0 ? "1" : "0";
      setAccessibleEndpoint(root, index === 0);
      roots.set(endpoint.kind, root);
      stage.append(root);
    }
  );
  const materialLayer = document.createElement("div");
  materialLayer.className =
    "kp-common-denominator-pressure-stage__material-layer";
  materialLayer.dataset["kpEditorEquationMaterialLayer"] = "true";
  materialLayer.setAttribute("aria-hidden", "true");
  const status = document.createElement("output");
  status.className = "kp-common-denominator-pressure-stage__status";
  status.dataset["kpCommonDenominatorPressureStatus"] = "true";
  status.setAttribute("aria-live", "polite");
  status.textContent = "One third plus one sixth.";
  stage.append(materialLayer, status);
  slot.replaceChildren(stage);
  return {
    player,
    stage,
    roots,
    fontReadiness: createKpEquationFontReadiness(document),
    generation: 0,
    pendingState: state,
    disposed: false
  };
}

async function prepareSurface(
  session: KpCommonDenominatorPressureSurfaceSession,
  generation: number
): Promise<void> {
  const endpoints = Object.fromEntries(
    kpCanonicalCommonDenominatorPressureNativeEndpoints.map((endpoint) => [
      endpoint.kind,
      endpoint
    ])
  ) as Record<
    KpCommonDenominatorPressureNativeEndpoint["kind"],
    KpCommonDenominatorPressureNativeEndpoint
  >;
  try {
    bindKpCommonDenominatorPressureNativeEndpoint({
      root: requiredRoot(session, endpoints.problem.kind),
      endpoint: endpoints.problem
    });
    bindKpCommonDenominatorPressureIntroductionTarget({
      root: requiredRoot(session, endpoints["equivalence-source"].kind),
      endpoint: endpoints["equivalence-source"]
    });
    const [problemSource, rawEquivalenceTarget] = await Promise.all([
      observe(session, endpoints.problem, "source"),
      observe(session, endpoints["equivalence-source"], "target")
    ]);
    const equivalenceTarget =
      coalesceKpCommonDenominatorPressureIntroductionTarget({
        observation: rawEquivalenceTarget,
        endpoint: endpoints["equivalence-source"]
      });
    bindKpCommonDenominatorPressureNativeEndpoint({
      root: requiredRoot(session, endpoints["equivalence-source"].kind),
      endpoint: endpoints["equivalence-source"]
    });
    bindKpCommonDenominatorPressureNativeEndpoint({
      root: requiredRoot(session, endpoints.product.kind),
      endpoint: endpoints.product
    });
    const [equivalenceSource, productTarget] = await Promise.all([
      observe(session, endpoints["equivalence-source"], "source"),
      observe(session, endpoints.product, "target")
    ]);
    bindKpCommonDenominatorPressureNativeEndpoint({
      root: requiredRoot(session, endpoints.evaluated.kind),
      endpoint: endpoints.evaluated
    });
    const [productSource, evaluatedTarget] = await Promise.all([
      observe(session, endpoints.product, "source"),
      observe(session, endpoints.evaluated, "target")
    ]);
    if (session.disposed || session.generation !== generation) return;
    session.introduction = createKpCanonicalNativeKatexSceneSession(
      compileKpCanonicalNativeKatexScenePlan({
        source: problemSource,
        target: equivalenceTarget,
        relations: introductionRelations(),
        fanInRouting: false,
        copyFanOutRouting: false,
        endpointDwellFraction: 0
      })
    );
    session.equivalence = createKpFractionEquivalenceTransitSession({
      source: equivalenceSource,
      target: productTarget,
      semantic: plan.equivalence.focus.semantic,
      presentation: plan.equivalence.focus.presentation,
      contextRelations: equivalenceContextRelations()
    });
    session.evaluation = createKpCanonicalNativeKatexSceneSession(
      compileKpCanonicalNativeKatexScenePlan({
        source: productSource,
        target: evaluatedTarget,
        relations: evaluationPersistenceRelations(),
        successorSyntheses: plan.evaluation.bindings.map((binding) => ({
          binding,
          direction: "forward" as const,
          motion: "full" as const
        })),
        fanInRouting: false,
        copyFanOutRouting: false,
        endpointDwellFraction: 0
      })
    );
    session.stage.dataset["kpCommonDenominatorPressureStage"] = "ready";
    applyFrame(session, session.pendingState);
  } catch (error: unknown) {
    if (session.disposed || session.generation !== generation) return;
    session.stage.dataset["kpCommonDenominatorPressureStage"] = "failed";
    session.stage.dataset["kpCommonDenominatorPressureError"] =
      error instanceof Error ? error.message : String(error);
    showOnly(session, "problem");
  }
}

function observe(
  session: KpCommonDenominatorPressureSurfaceSession,
  endpoint: KpCommonDenominatorPressureNativeEndpoint,
  side: "source" | "target"
) {
  return settleAndObserveKpNativeKatexRenderedScene({
    endpoint: side,
    stage: session.stage,
    root: requiredRoot(session, endpoint.kind),
    semanticEntityId: endpoint.stateId,
    presentationGroupId: endpoint.rootPresentationGroupId,
    fontReadiness: session.fontReadiness
  });
}

function applyFrame(
  session: KpCommonDenominatorPressureSurfaceSession,
  state: KpEditorAnimationPlayerState
): void {
  if (!isReady(session)) return;
  const forwardProgress = state.direction === "rewind"
    ? 1 - state.progress
    : state.progress;
  const progress = accessibleProgress(session.player, forwardProgress);
  const sampled = sampleKpCommonDenominatorPressureTimeline(progress);
  session.roots.forEach((root) => {
    root.style.opacity = "0";
    setAccessibleEndpoint(root, false);
  });
  const ownership = sampled.segment === "stage-unit-factor"
    ? session.introduction.session.apply(sampled.localProgress)
    : sampled.segment === "join-equivalent-fraction"
      ? session.equivalence.apply(sampled.localProgress)
      : session.evaluation.session.apply(sampled.localProgress);
  const [sourceKind, targetKind] = endpointKinds(sampled.segment);
  const accessibleKind = ownership.visualOwner === "source-native"
    ? sourceKind
    : ownership.visualOwner === "target-native"
      ? targetKind
      : sampled.localProgress < 0.5 ? sourceKind : targetKind;
  setAccessibleEndpoint(requiredRoot(session, accessibleKind), true);
  session.stage.dataset["kpCommonDenominatorPressureSegment"] =
    sampled.segment;
  session.stage.dataset["kpCommonDenominatorPressureProgress"] =
    String(progress);
  session.stage.dataset["kpCommonDenominatorPressureLocalProgress"] =
    String(sampled.localProgress);
  session.stage.dataset["kpCommonDenominatorPressureVisualOwner"] =
    ownership.visualOwner;
  const status = session.stage.querySelector<HTMLOutputElement>(
    "[data-kp-common-denominator-pressure-status]"
  );
  if (status !== null) status.textContent = statusText(
    sampled.segment,
    sampled.localProgress
  );
}

function introductionRelations():
readonly KpNativeKatexSemanticPaintRelation[] {
  const local = plan.equivalence.focus.semantic.source;
  return Object.freeze([
    same("intro.first.numerator", local.numerator.entityId),
    same("intro.first.denominator", local.denominator.entityId),
    same("intro.first.division", local.divisionEntityId),
    ...plan.equivalence.contextTransfers.flatMap((transfer) =>
      visibleContextRole(transfer.role)
        ? [same(`intro.${transfer.role}`, transfer.sourceEntityId)]
        : []
    )
  ]);
}

function equivalenceContextRelations():
readonly KpNativeKatexSemanticPaintRelation[] {
  return Object.freeze(plan.equivalence.contextTransfers.flatMap(
    (transfer) => visibleContextRole(transfer.role) ? [oneToOne(
      `pressure-equivalence.${transfer.role}`,
      transfer.sourceEntityId,
      transfer.targetEntityId
    )] : []
  ));
}

function evaluationPersistenceRelations():
readonly KpNativeKatexSemanticPaintRelation[] {
  const ids = [
    plan.equivalence.focus.semantic.target.divisionEntityId,
    ...plan.evaluation.persistentEntityIds.filter((id) =>
      !id.includes(".term") && !id.includes(".fraction")
    )
  ];
  return Object.freeze([...new Set(ids)].map((id) =>
    same(`pressure-evaluation.${id}`, id)
  ));
}

function oneToOne(
  id: string,
  sourceEntityId: string,
  targetEntityId: string
): KpNativeKatexSemanticPaintRelation {
  return Object.freeze({
    id,
    relation: "persist" as const,
    sourceEntityIds: Object.freeze([sourceEntityId]),
    targetEntityIds: Object.freeze([targetEntityId])
  });
}

function same(
  id: string,
  entityId: string
): KpNativeKatexSemanticPaintRelation {
  return oneToOne(id, entityId, entityId);
}

function visibleContextRole(
  role: typeof plan.equivalence.contextTransfers[number]["role"]
): boolean {
  return role === "addition-operator" ||
    role === "untouched-division" ||
    role === "untouched-numerator" ||
    role === "untouched-denominator";
}

function endpointKinds(
  segment: KpCommonDenominatorPressureTimelineSegment
): readonly [
  KpCommonDenominatorPressureNativeEndpoint["kind"],
  KpCommonDenominatorPressureNativeEndpoint["kind"]
] {
  switch (segment) {
    case "stage-unit-factor": return ["problem", "equivalence-source"];
    case "join-equivalent-fraction":
      return ["equivalence-source", "product"];
    case "evaluate-products": return ["product", "evaluated"];
  }
}

function accessibleProgress(player: HTMLElement, progress: number): number {
  const mode = player.dataset["kpEditorAnimationAccessibilityMode"] ??
    "full-motion";
  const bounded = Math.max(0, Math.min(1, progress));
  if (mode !== "reduced-motion" && mode !== "static") return bounded;
  const checkpoints = [
    0,
    kpCommonDenominatorPressureTimeline.stageUnitFactorEnd,
    kpCommonDenominatorPressureTimeline.joinEquivalentFractionEnd,
    1
  ];
  return checkpoints.reduce((nearest, candidate) =>
    Math.abs(candidate - bounded) < Math.abs(nearest - bounded)
      ? candidate
      : nearest
  );
}

function statusText(
  segment: KpCommonDenominatorPressureTimelineSegment,
  localProgress: number
): string {
  if (segment === "stage-unit-factor") {
    return localProgress === 0
      ? "One third plus one sixth."
      : "Introduce two over two, which equals one.";
  }
  if (segment === "join-equivalent-fraction") {
    return "Join the unit factor with one third; one sixth stays fixed.";
  }
  return localProgress === 1
    ? "Two sixths plus one sixth."
    : "Evaluate the numerator and denominator products together.";
}

function isReady(
  session: KpCommonDenominatorPressureSurfaceSession
): session is KpCommonDenominatorPressureSurfaceSession & {
  readonly introduction: KpCanonicalNativeKatexSceneSession;
  readonly equivalence: KpFractionEquivalenceTransitSession;
  readonly evaluation: KpCanonicalNativeKatexSceneSession;
} {
  return session.introduction !== undefined &&
    session.equivalence !== undefined &&
    session.evaluation !== undefined;
}

function showOnly(
  session: KpCommonDenominatorPressureSurfaceSession,
  kind: KpCommonDenominatorPressureNativeEndpoint["kind"]
): void {
  session.roots.forEach((root, candidate) => {
    const active = candidate === kind;
    root.style.opacity = active ? "1" : "0";
    setAccessibleEndpoint(root, active);
  });
}

function requiredRoot(
  session: KpCommonDenominatorPressureSurfaceSession,
  kind: KpCommonDenominatorPressureNativeEndpoint["kind"]
): HTMLElement {
  const root = session.roots.get(kind);
  if (root === undefined) {
    throw new Error(`Missing common-denominator pressure root ${kind}.`);
  }
  return root;
}

function setAccessibleEndpoint(root: HTMLElement, active: boolean): void {
  root.setAttribute("aria-hidden", active ? "false" : "true");
  if (active) root.removeAttribute("inert");
  else root.setAttribute("inert", "");
}

function disposeSurface(
  player: HTMLElement,
  session: KpCommonDenominatorPressureSurfaceSession
): void {
  if (session.disposed) return;
  session.disposed = true;
  session.generation += 1;
  const retirement = {
    kind: "native-katex-paint-preserving-retirement" as const,
    reason: "surface-disposed" as const,
    structuralSuccession: "retire-preserving-paint" as const
  };
  session.introduction?.session.retire(retirement);
  session.equivalence?.retire();
  session.evaluation?.session.retire(retirement);
  syncKpEquationMaterialLayer({ stage: session.stage, owners: [] });
  session.fontReadiness.dispose();
  sessions.delete(player);
}
