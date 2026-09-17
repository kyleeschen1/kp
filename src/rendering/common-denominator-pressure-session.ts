/// <reference types="vite/client" />

import {
  createKpCommonDenominatorPressureAnimationAsset,
  kpCommonDenominatorPressureTimeline,
  sampleKpCommonDenominatorPressureTimeline,
  type KpCommonDenominatorPressureTimelineSegment
} from "../animation/common-denominator-pressure-exemplar.ts";
import { compileKpFractionRootMigrationV2 } from
  "../domain-ir/fraction-root-migration-v2.ts";
import {
  createKpAdjacentPhaseEquivalentPoseSeamIntent
} from "../animation/paint-continuity-plan-types.ts";
import {
  kpCanonicalCommonDenominatorPressurePresentationPlan,
  type KpCommonDenominatorPressurePresentationPlan
} from "../animation/common-denominator-pressure-presentation-plan.ts";
import { createKpEquationFontReadiness } from
  "./equation-font-readiness.ts";
import { syncKpEquationMaterialLayer } from
  "./equation-material-layer-dom.ts";
import {
  createKpFractionEquivalenceTransitSession,
  type KpFractionEquivalenceTransitSession
} from "./fraction-equivalence-transit-session.ts";
import {
  bindKpCommonDenominatorPressureNativeEndpoint,
  createKpCommonDenominatorPressureNativeEndpoints,
  type KpCommonDenominatorPressureNativeEndpoint
} from "./common-denominator-pressure-native-endpoints.ts";
import {
  compileKpCanonicalNativeKatexScenePlan,
  createKpCanonicalNativeKatexSceneSession,
  type KpCanonicalNativeKatexSceneSession
} from "./native-katex-scene-compositor.ts";
import type {
  KpNativeKatexSemanticPaintRelation
} from "./native-katex-base-scene-plan.ts";
import type {
  KpNativeKatexPaintPreservingRetirement
} from "./native-katex-scene-track-contract.ts";
import {
  settleAndCreateKpNativeKatexRenderedEndpointHandle,
  type KpNativeKatexRenderedEndpointHandle
} from "./native-katex-rendered-scene.ts";
import {
  createKpNativeKatexEndpointOwnershipView
} from "./native-katex-endpoint-ownership.ts";
import {
  validateAndMintKpNativeKatexEquivalentPoseSeam,
  type KpNativeKatexEquivalentPoseSeamCertificate
} from "./native-katex-equivalent-pose-seam.ts";
interface PressureSample { readonly direction: "forward" | "rewind"; readonly progress: number }

interface KpCommonDenominatorPressureSurfaceSession {
  readonly plan: KpCommonDenominatorPressurePresentationPlan;
  readonly endpoints: ReturnType<typeof createKpCommonDenominatorPressureNativeEndpoints>;
  readonly player: HTMLElement;
  readonly stage: HTMLElement;
  readonly roots: ReadonlyMap<
    KpCommonDenominatorPressureNativeEndpoint["kind"],
    HTMLElement
  >;
  readonly fontReadiness: ReturnType<typeof createKpEquationFontReadiness>;
  endpointHandles?: ReadonlyMap<
    KpCommonDenominatorPressureNativeEndpoint["kind"],
    KpNativeKatexRenderedEndpointHandle
  > | undefined;
  measuredEndpointRevisions: Set<string>;
  introductionToEquivalenceSeam?:
    KpNativeKatexEquivalentPoseSeamCertificate | undefined;
  generation: number;
  pendingState: PressureSample;
  introduction?: KpCanonicalNativeKatexSceneSession | undefined;
  equivalence?: KpFractionEquivalenceTransitSession | undefined;
  evaluation?: KpCanonicalNativeKatexSceneSession | undefined;
  measurementRevision: number;
  preparedFontRevision?: number | undefined;
  preparedViewportFingerprint?: string | undefined;
  invalidationQueued: boolean;
  replacementPreparing: boolean;
  readonly pendingInvalidationReasons: Set<"fonts" | "viewport">;
  resizeObserver?: ResizeObserver | undefined;
  removeWindowResizeListener?: (() => void) | undefined;
  unsubscribeFonts?: (() => void) | undefined;
  disposed: boolean;
}

const introductionToEquivalenceIntent =
  createKpAdjacentPhaseEquivalentPoseSeamIntent({
    id: "seam.common-denominator-pressure.introduction-to-equivalence",
    fromPhaseId: "stage-unit-factor",
    toPhaseId: "join-equivalent-fraction"
  });

/** One native owner for both editor and passage hosts. Hosts supply samples;
 * preparation, equivalent-pose seams and invalidation remain renderer-owned. */
export function mountCanonicalCommonDenominatorPressure(player: HTMLElement, slot: HTMLElement,
  plan: KpCommonDenominatorPressurePresentationPlan = kpCanonicalCommonDenominatorPressurePresentationPlan) {
  const session = mountSurface(player, slot, { direction: "forward", progress: 0 }, plan);
  const ready = prepareSurface(session, ++session.generation).then(() => {
    if (!isReady(session) || session.stage.dataset["kpCommonDenominatorPressureStage"] !== "ready")
      throw new Error(session.stage.dataset["kpCommonDenominatorPressureError"] ?? "Alignment preparation failed.");
  });
  return {
    stage: session.stage, ready,
    sample(state: PressureSample) {
      if (session.disposed) throw new Error("Alignment session is disposed.");
      if (!Number.isFinite(state.progress) || state.progress < 0 || state.progress > 1) throw new RangeError("Invalid alignment progress.");
      session.pendingState = state;
      if (isReady(session)) applyFrame(session, state);
    },
    dispose() { disposeSurface(session); }
  };
}

function mountSurface(
  player: HTMLElement,
  slot: HTMLElement,
  state: PressureSample,
  plan: KpCommonDenominatorPressurePresentationPlan
): KpCommonDenominatorPressureSurfaceSession {
  const governance = compileKpFractionRootMigrationV2(createKpCommonDenominatorPressureAnimationAsset(plan));
  const endpoints = createKpCommonDenominatorPressureNativeEndpoints(plan);
  const document = player.ownerDocument;
  const stage = document.createElement("section");
  stage.className = "kp-common-denominator-pressure-stage";
  stage.dataset["kpCommonDenominatorPressureStage"] = "preparing";
  stage.dataset["kpEquationPresentationPlanId"] =
    governance.presentationPlan.id;
  stage.setAttribute(
    "aria-label",
    "Give the fractions a shared denominator"
  );
  const roots = new Map<
    KpCommonDenominatorPressureNativeEndpoint["kind"],
    HTMLElement
  >();
  endpoints.forEach(
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
  status.textContent = endpoints[0].accessibleText;
  stage.append(materialLayer, status);
  slot.replaceChildren(stage);
  return {
    plan, endpoints,
    player,
    stage,
    roots,
    fontReadiness: createKpEquationFontReadiness(document),
    measuredEndpointRevisions: new Set(),
    generation: 0,
    measurementRevision: 0,
    invalidationQueued: false,
    replacementPreparing: false,
    pendingInvalidationReasons: new Set(),
    pendingState: state,
    disposed: false
  };
}

async function prepareSurface(
  session: KpCommonDenominatorPressureSurfaceSession,
  generation: number
): Promise<void> {
  const plan = session.plan;
  const endpoints = Object.fromEntries(
    session.endpoints.map((endpoint) => [
      endpoint.kind,
      endpoint
    ])
  ) as Record<
    KpCommonDenominatorPressureNativeEndpoint["kind"],
    KpCommonDenominatorPressureNativeEndpoint
  >;
  const measurements = new Set<string>();
  try {
    session.endpoints.forEach((endpoint) =>
      bindKpCommonDenominatorPressureNativeEndpoint({
        root: requiredRoot(session, endpoint.kind),
        endpoint
      })
    );
    const [problemHandle, equivalenceHandle, productHandle, evaluatedHandle] =
      await Promise.all([
        observeHandle(session, endpoints.problem, "source", measurements),
        observeHandle(
          session,
          endpoints["equivalence-source"],
          "target",
          measurements
        ),
        observeHandle(session, endpoints.product, "target", measurements),
        observeHandle(session, endpoints.evaluated, "target", measurements)
      ]);
    const problemSource = createKpNativeKatexEndpointOwnershipView({
      handle: problemHandle,
      endpoint: "source"
    });
    const equivalenceTarget = createKpNativeKatexEndpointOwnershipView({
      handle: equivalenceHandle,
      endpoint: "target",
      collapsedGroupIds: endpoints["equivalence-source"].introductionNodes
        .map(({ presentationGroupId }) => presentationGroupId)
    });
    const equivalenceSource = createKpNativeKatexEndpointOwnershipView({
      handle: equivalenceHandle,
      endpoint: "source"
    });
    const productTarget = createKpNativeKatexEndpointOwnershipView({
      handle: productHandle,
      endpoint: "target"
    });
    const productSource = createKpNativeKatexEndpointOwnershipView({
      handle: productHandle,
      endpoint: "source"
    });
    const evaluatedTarget = createKpNativeKatexEndpointOwnershipView({
      handle: evaluatedHandle,
      endpoint: "target"
    });
    const seam = validateAndMintKpNativeKatexEquivalentPoseSeam({
      intent: introductionToEquivalenceIntent,
      from: equivalenceTarget,
      to: equivalenceSource
    });
    if (seam.status !== "verified") {
      throw new Error(
        "Common-denominator introduction seam failed: " +
        seam.issues.map(({ code, leafId }) =>
          `${code}${leafId === undefined ? "" : `:${leafId}`}`
        ).join(", ")
      );
    }
    if (session.disposed || session.generation !== generation) return;
    const endpointHandles = new Map<
      KpCommonDenominatorPressureNativeEndpoint["kind"],
      KpNativeKatexRenderedEndpointHandle
    >([
      ["problem", problemHandle],
      ["equivalence-source", equivalenceHandle],
      ["product", productHandle],
      ["evaluated", evaluatedHandle]
    ]);
    const introduction = createKpCanonicalNativeKatexSceneSession(
      compileKpCanonicalNativeKatexScenePlan({
        source: problemSource,
        target: equivalenceTarget,
        relations: introductionRelations(plan),
        fanInRouting: false,
        copyFanOutRouting: false
      })
    );
    const equivalence = createKpFractionEquivalenceTransitSession({
      source: equivalenceSource,
      target: productTarget,
      semantic: plan.equivalence.focus.semantic,
      presentation: plan.equivalence.focus.presentation,
      contextRelations: equivalenceContextRelations(plan)
    });
    const evaluation = createKpCanonicalNativeKatexSceneSession(
      compileKpCanonicalNativeKatexScenePlan({
        source: productSource,
        target: evaluatedTarget,
        relations: evaluationPersistenceRelations(plan),
        successorSyntheses: plan.evaluation.bindings.map((binding) => ({
          binding,
          direction: "forward" as const,
          motion: "full" as const
        })),
        fanInRouting: false,
        copyFanOutRouting: false
      })
    );
    if (session.disposed || session.generation !== generation) {
      retirePreparedSessions({ introduction, equivalence, evaluation });
      return;
    }
    // A replacement is installed as one ownership transaction. The old scene
    // keeps its last paint until the new scene can sample the exact playhead.
    retireSurfaceSessions(session, "measurement-invalidated");
    session.endpointHandles = endpointHandles;
    session.measuredEndpointRevisions = measurements;
    session.introductionToEquivalenceSeam = seam.certificate;
    session.introduction = introduction;
    session.equivalence = equivalence;
    session.evaluation = evaluation;
    session.preparedFontRevision = session.fontReadiness.revision;
    session.preparedViewportFingerprint = pressureViewportFingerprint(
      session.stage
    );
    session.stage.dataset["kpCommonDenominatorPressureMeasurementCount"] =
      String(measurements.size);
    session.stage.dataset["kpCommonDenominatorPressureMeasurementRevision"] =
      String(session.measurementRevision);
    session.stage.dataset["kpCommonDenominatorPressureFontRevision"] =
      String(session.preparedFontRevision);
    session.stage.dataset["kpCommonDenominatorPressureViewportKey"] =
      equivalenceHandle.revision.viewportKey;
    session.stage.dataset["kpCommonDenominatorPressureSeam"] = "verified";
    session.stage.dataset["kpCommonDenominatorPressureSeamLeafCount"] =
      String(seam.certificate.leaves.length);
    session.stage.dataset["kpCommonDenominatorPressureStage"] = "ready";
    session.replacementPreparing = false;
    delete session.stage.dataset[
      "kpCommonDenominatorPressureInvalidationReason"
    ];
    installSurfaceInvalidationLifecycle(session);
    applyFrame(session, session.pendingState);
    flushPendingSurfaceInvalidation(session);
  } catch (error: unknown) {
    if (session.disposed || session.generation !== generation) return;
    session.replacementPreparing = false;
    session.stage.dataset["kpCommonDenominatorPressureStage"] = "failed";
    session.stage.dataset["kpCommonDenominatorPressureError"] =
      error instanceof Error ? error.message : String(error);
    showOnly(session, "problem");
  }
}

async function observeHandle(
  session: KpCommonDenominatorPressureSurfaceSession,
  endpoint: KpCommonDenominatorPressureNativeEndpoint,
  side: "source" | "target",
  measurements: Set<string>
) {
  const handle = await settleAndCreateKpNativeKatexRenderedEndpointHandle({
    endpoint: side,
    stage: session.stage,
    root: requiredRoot(session, endpoint.kind),
    semanticEntityId: endpoint.stateId,
    presentationGroupId: endpoint.rootPresentationGroupId,
    fontReadiness: session.fontReadiness,
    viewportRevision: session.measurementRevision
  });
  const measurementKey = [
    endpoint.kind,
    handle.revision.fontRevision,
    handle.revision.viewportKey
  ].join("|");
  if (measurements.has(measurementKey)) {
    throw new Error(
      `Pressure endpoint ${endpoint.kind} was measured twice for one revision.`
    );
  }
  measurements.add(measurementKey);
  return handle;
}

function installSurfaceInvalidationLifecycle(
  session: KpCommonDenominatorPressureSurfaceSession
): void {
  if (session.unsubscribeFonts !== undefined) return;
  session.unsubscribeFonts = session.fontReadiness.subscribe(() =>
    scheduleSurfaceMeasurementReplacement(session, "fonts")
  );
  const view = session.stage.ownerDocument.defaultView;
  if (view !== null) {
    const onWindowResize = (): void =>
      scheduleSurfaceMeasurementReplacement(session, "viewport");
    view.addEventListener("resize", onWindowResize);
    session.removeWindowResizeListener = () =>
      view.removeEventListener("resize", onWindowResize);
  }
  if (typeof ResizeObserver !== "undefined") {
    session.resizeObserver = new ResizeObserver(() =>
      scheduleSurfaceMeasurementReplacement(session, "viewport")
    );
    session.resizeObserver.observe(session.stage);
  }
}

function scheduleSurfaceMeasurementReplacement(
  session: KpCommonDenominatorPressureSurfaceSession,
  reason: "fonts" | "viewport"
): void {
  if (session.disposed) return;
  session.pendingInvalidationReasons.add(reason);
  if (session.invalidationQueued || session.replacementPreparing) return;
  session.invalidationQueued = true;
  queueMicrotask(() => {
    session.invalidationQueued = false;
    if (session.disposed) return;
    const fontChanged = session.pendingInvalidationReasons.has("fonts") &&
      session.fontReadiness.revision !== session.preparedFontRevision;
    const viewportFingerprint = pressureViewportFingerprint(session.stage);
    const viewportChanged =
      session.pendingInvalidationReasons.has("viewport") &&
      viewportFingerprint !== session.preparedViewportFingerprint;
    session.pendingInvalidationReasons.clear();
    if (!fontChanged && !viewportChanged) return;
    session.replacementPreparing = true;
    session.measurementRevision += 1;
    const generation = ++session.generation;
    session.stage.dataset["kpCommonDenominatorPressureStage"] = "preparing";
    session.stage.dataset["kpCommonDenominatorPressureInvalidationReason"] =
      fontChanged && viewportChanged
        ? "fonts-and-viewport"
        : fontChanged ? "fonts" : "viewport";
    void prepareSurface(session, generation);
  });
}

function flushPendingSurfaceInvalidation(
  session: KpCommonDenominatorPressureSurfaceSession
): void {
  const nextReason = session.pendingInvalidationReasons.has("fonts")
    ? "fonts"
    : session.pendingInvalidationReasons.has("viewport")
      ? "viewport"
      : undefined;
  if (nextReason !== undefined) {
    scheduleSurfaceMeasurementReplacement(session, nextReason);
  }
}

function pressureViewportFingerprint(stage: HTMLElement): string {
  const rect = stage.getBoundingClientRect();
  const dpr = stage.ownerDocument.defaultView?.devicePixelRatio ?? 1;
  return `${rect.width}x${rect.height}@${dpr}`;
}

function applyFrame(
  session: KpCommonDenominatorPressureSurfaceSession,
  state: PressureSample
): void {
  if (
    !isReady(session) ||
    session.stage.dataset["kpCommonDenominatorPressureStage"] !== "ready"
  ) return;
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
    sampled.localProgress, session.endpoints
  );
}

function introductionRelations(plan: KpCommonDenominatorPressurePresentationPlan):
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

function equivalenceContextRelations(plan: KpCommonDenominatorPressurePresentationPlan):
readonly KpNativeKatexSemanticPaintRelation[] {
  return Object.freeze(plan.equivalence.contextTransfers.flatMap(
    (transfer) => visibleContextRole(transfer.role) ? [oneToOne(
      `pressure-equivalence.${transfer.role}`,
      transfer.sourceEntityId,
      transfer.targetEntityId
    )] : []
  ));
}

function evaluationPersistenceRelations(plan: KpCommonDenominatorPressurePresentationPlan):
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
  role: KpCommonDenominatorPressurePresentationPlan["equivalence"]["contextTransfers"][number]["role"]
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
  localProgress: number,
  endpoints: ReturnType<typeof createKpCommonDenominatorPressureNativeEndpoints>
): string {
  if (segment === "stage-unit-factor") {
    return localProgress === 0
      ? endpoints[0].accessibleText
      : endpoints[1].accessibleText;
  }
  if (segment === "join-equivalent-fraction") {
    return "Join the unit factor with the first fraction; the second stays fixed.";
  }
  return localProgress === 1
    ? endpoints[3].accessibleText
    : "Evaluate the numerator and denominator products together.";
}

function isReady(
  session: KpCommonDenominatorPressureSurfaceSession
): session is KpCommonDenominatorPressureSurfaceSession & {
  readonly introduction: KpCanonicalNativeKatexSceneSession;
  readonly equivalence: KpFractionEquivalenceTransitSession;
  readonly evaluation: KpCanonicalNativeKatexSceneSession;
  readonly introductionToEquivalenceSeam:
    KpNativeKatexEquivalentPoseSeamCertificate;
} {
  return session.introduction !== undefined &&
    session.equivalence !== undefined &&
    session.evaluation !== undefined &&
    session.introductionToEquivalenceSeam !== undefined;
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

function retirePreparedSessions(input: {
  readonly introduction: KpCanonicalNativeKatexSceneSession;
  readonly equivalence: KpFractionEquivalenceTransitSession;
  readonly evaluation: KpCanonicalNativeKatexSceneSession;
}): void {
  const retirement = paintPreservingRetirement("measurement-invalidated");
  input.introduction.session.retire(retirement);
  input.equivalence.retire("measurement-invalidated");
  input.evaluation.session.retire(retirement);
}

function retireSurfaceSessions(
  session: KpCommonDenominatorPressureSurfaceSession,
  reason: KpNativeKatexPaintPreservingRetirement["reason"]
): void {
  const retirement = paintPreservingRetirement(reason);
  session.introduction?.session.retire(retirement);
  session.equivalence?.retire(reason);
  session.evaluation?.session.retire(retirement);
}

function paintPreservingRetirement(
  reason: KpNativeKatexPaintPreservingRetirement["reason"]
): KpNativeKatexPaintPreservingRetirement {
  return {
    kind: "native-katex-paint-preserving-retirement",
    reason,
    structuralSuccession: "retire-preserving-paint"
  };
}

function disposeSurface(
  session: KpCommonDenominatorPressureSurfaceSession
): void {
  if (session.disposed) return;
  session.disposed = true;
  session.generation += 1;
  retireSurfaceSessions(session, "surface-disposed");
  session.resizeObserver?.disconnect();
  session.removeWindowResizeListener?.();
  session.unsubscribeFonts?.();
  syncKpEquationMaterialLayer({ stage: session.stage, owners: [] });
  session.fontReadiness.dispose();
}
