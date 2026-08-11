import {
  createKpEquationLinearRearrangementBindings
} from "../../rendering/equation-linear-rearrangement-bindings.ts";
import {
  createKpWitnessedAnnihilationBinding
} from "../../animation/witnessed-annihilation.ts";
import type { KpAnimationAsset } from "../../animation/asset.ts";
import {
  compileKpAnimationTransformationPhaseCohorts
} from "../../animation/transformation-phase-cohorts.ts";
import {
  createKpEquationFontReadiness
} from "../../rendering/equation-font-readiness.ts";
import {
  kpEquationPresentationProfile
} from "../../rendering/equation-presentation-policy.ts";
import {
  applyKpReaderEquationResponsiveFit,
  compileKpReaderEquationMaterialPlan,
  loadKpReaderEquationSceneCompositorAdapter,
  projectKpCertifiedTransferMaterialPlan,
  projectKpReaderEquationIdentityWitness,
  projectKpReaderEquationRenderPlan,
  sampleKpReaderEquationSymbolMotion
} from "../renderers/public-api.ts";
import {
  createKpReaderClockSample,
  sampleKpReaderAnimationFrame,
  type KpEquationStageLayoutIntent,
  type KpReaderClockSample,
  type KpReaderFocusSnapshot
} from "../runtime/public-api.ts";
import type {
  KpReaderEquationPresentationProfile
} from "../document/public-api.ts";
import {
  applyKpCanonicalEquationSemanticFocus,
  compileKpCanonicalEquationSemanticFocusLineage,
  projectKpCanonicalEquationSemanticFocus
} from "./canonical-equation-semantic-focus.ts";
import {
  createKpCanonicalEquationAccessibleOwnership,
  syncKpCanonicalEquationNativeEndpointEvidence
} from "./canonical-equation-endpoint-ownership.ts";
import {
  planKpReaderCanonicalEquationFrame
} from "./canonical-equation-frame-plan.ts";
import {
  measureKpCanonicalEquationStageLayout,
  type KpCanonicalEquationStageLayout,
  type KpCanonicalEquationStaticPlan
} from "./canonical-equation-stage-layout.ts";
import type {
  KpCanonicalEquationStageShell
} from "./canonical-equation-stage-shell.ts";
import {
  compileKpReaderCanonicalTransitionPolicy,
  type KpReaderEquationLessonDescriptor
} from "./equation-lesson-descriptor.ts";
import {
  createKpReaderCanonicalEquationSession
} from "./reader-canonical-equation-session.ts";

export interface KpChromeFreeCanonicalEquationSalienceFrame {
  readonly root: HTMLElement;
  readonly stage: HTMLElement;
  readonly sourceStateId?: string | undefined;
  readonly targetStateId?: string | undefined;
  readonly operationIds: readonly string[];
  readonly phaseProgress: number;
  readonly focusTargetIds: readonly string[];
}

export interface KpChromeFreeCanonicalEquationSampleInput {
  readonly clock: KpReaderClockSample;
  readonly animationProgress?: number | undefined;
  readonly motionMode?: "continuous" | "essential" | "checkpoint" | undefined;
  readonly focus?: KpReaderFocusSnapshot | undefined;
  readonly presentationRevision?: string | undefined;
}

export interface KpChromeFreeCanonicalEquationSnapshot {
  readonly progressPermille: number;
  readonly animationProgressPermille: number;
  readonly phaseProgressPermille: number;
  readonly transitionId: string;
  readonly activePhase: string;
  readonly activeTransformationIds: readonly string[];
  readonly accessibleEquationState: string;
  readonly nativeEndpoint?: "source" | "target" | undefined;
  readonly nativeEndpointPassed: boolean;
  readonly canonicalPaintOwner: boolean;
  readonly motionAuthority: string;
  readonly fitStatus: string;
  readonly fitScale: number;
  readonly layoutRevision: number;
  readonly layoutReadCount: number;
  readonly fontRevision: number;
  readonly fontReady: boolean;
  readonly ownerIds: readonly string[];
  readonly layoutPolicy?: string | undefined;
}

export interface KpChromeFreeCanonicalEquationSession {
  readonly stage: HTMLElement;
  readonly sample: (
    input: KpChromeFreeCanonicalEquationSampleInput
  ) => KpChromeFreeCanonicalEquationSnapshot;
  readonly seek: (progress: number) => KpChromeFreeCanonicalEquationSnapshot;
  readonly subscribe: (
    listener: (snapshot: KpChromeFreeCanonicalEquationSnapshot) => void
  ) => () => void;
  readonly invalidate: () => void;
  readonly dispose: () => void;
}

/**
 * Mounts canonical equation paint without reader page chrome or an internal
 * timeline loop. Hosts provide samples; this session owns only stage state.
 */
export async function createKpChromeFreeCanonicalEquationSession(input: {
  readonly shell: KpCanonicalEquationStageShell;
  readonly animation: KpAnimationAsset;
  readonly descriptor: KpReaderEquationLessonDescriptor;
  readonly equationPresentationProfile: KpReaderEquationPresentationProfile;
  readonly linkRoot: ParentNode;
  readonly createStageLayoutIntent: (input: {
    readonly viewport: "wide" | "phone";
  }) => KpEquationStageLayoutIntent;
  readonly renderSalience?: ((
    frame: KpChromeFreeCanonicalEquationSalienceFrame
  ) => string) | undefined;
}): Promise<KpChromeFreeCanonicalEquationSession> {
  const { stage, viewport, materialFitSurface } = input.shell;
  const cohorts = compileKpAnimationTransformationPhaseCohorts(input.animation);
  const presentation = kpEquationPresentationProfile(input.animation);
  const transitionElements = input.shell.transitions.filter((element) =>
    cohorts.some((cohort) =>
      cohort.id === requiredData(element, "kpReaderTransition")
    )
  );
  const staticPlans = new Map<string, KpCanonicalEquationStaticPlan>(
    cohorts.map((cohort, index) => {
      const runtimeFrame = sampleKpReaderAnimationFrame({
        animation: input.animation,
        clock: createKpReaderClockSample({
          source: "initial",
          progress: (index + 0.5) / cohorts.length
        })
      });
      const renderPlan = projectKpReaderEquationRenderPlan({
        animation: input.animation,
        runtimeFrame
      });
      if (renderPlan.transitions[0]?.id !== cohort.id) {
        throw new Error(
          `Canonical phase ${cohort.id} did not compile its reader transition.`
        );
      }
      return [cohort.id, Object.freeze({
        renderPlan,
        materialPlan: projectKpCertifiedTransferMaterialPlan(
          compileKpReaderEquationMaterialPlan(renderPlan)
        )
      })] as const;
    })
  );
  const semanticFocusLineage = compileKpCanonicalEquationSemanticFocusLineage(
    [...staticPlans.values()].map(({ renderPlan }) => renderPlan)
  );
  const transitionPolicy = compileKpReaderCanonicalTransitionPolicy({
    descriptor: input.descriptor,
    animation: input.animation
  });
  if (transitionPolicy === undefined) {
    throw new Error("Chrome-free session requires a canonical transition policy.");
  }
  for (const transitionId of transitionPolicy.transitionIds) {
    const element = transitionElements.find((candidate) =>
      requiredData(candidate, "kpReaderTransition") === transitionId
    );
    if (element === undefined) {
      throw new Error(`Canonical stage is missing transition ${transitionId}.`);
    }
    requireDescendant<HTMLElement>(
      element,
      "[data-kp-reader-fit-surface]"
    ).classList.add("kp-canonical-equation-stage");
    requireDescendant<HTMLElement>(
      element,
      "[data-kp-reader-equation-measurement]"
    ).classList.add("kp-canonical-equation-content");
  }
  const adapter = await loadKpReaderEquationSceneCompositorAdapter();
  const compositor = createKpReaderCanonicalEquationSession({
    transitionIds: transitionPolicy.transitionIds,
    createSession: adapter.createKpReaderEquationSceneCompositorSession,
    compilePurePlan: adapter.compileKpReaderEquationPureScenePlan,
    enableAdjacentPrewarm: true,
    enablePurePlanCache: true,
    requireAppliedStageLayout: input.descriptor.stageLayoutCompiler !== undefined
  });
  stage.dataset["kpReaderCanonicalEquationSession"] =
    compositor.transitionIds.join(",");
  stage.dataset["kpCanonicalEquationHost"] = "chrome-free-v1";
  stage.dataset["kpReaderAnimationId"] = input.animation.id;
  stage.dataset["kpReaderEquationPresentationRecipe"] = presentation.recipe;
  stage.dataset["kpReaderEquationHandoffRecipe"] = presentation.handoff;
  stage.dataset["kpReaderEquationCancellationRecipe"] = presentation.cancellation;
  stage.dataset["kpReaderEquationZeroWitnessRecipe"] = presentation.zeroWitness;
  stage.dataset["kpReaderEquationSuccessorRecipe"] = presentation.successor;
  stage.dataset["kpReaderEquationDepthRecipe"] = presentation.depth;
  stage.dataset["kpReaderEquationContinuantRecipe"] = presentation.continuants;
  stage.dataset["kpReaderEquationProfile"] = input.equationPresentationProfile.id;
  stage.dataset["kpReaderEquationDerivationMode"] =
    input.equationPresentationProfile.derivation;
  stage.dataset["kpReaderEquationIdentityMode"] =
    input.equationPresentationProfile.identity;

  const fontReadiness = createKpEquationFontReadiness(stage.ownerDocument);
  await fontReadiness.whenReady();
  const accessible = createKpCanonicalEquationAccessibleOwnership({ stage });
  const equationObjectRefs = new Set(
    input.animation.bundle.objects.map((object) => object.id)
  );
  const rearrangements = createKpEquationLinearRearrangementBindings(
    input.animation
  );
  const witnessedBindings = new Map(input.animation.transformations.flatMap(
    (transformation) => {
      if (input.equationPresentationProfile.identity !== "hold-until-settled-v1") {
        return [];
      }
      if (
        presentation.cancellation !== "witnessed-annihilation-v1" &&
        presentation.zeroWitness !== "embedded-v1"
      ) {
        return [];
      }
      const operationId = cancellationOperationId(transformation.transformType);
      const cancellation = transformation.correspondenceMap?.records.find(
        (record) => record.relation === "cancelation"
      );
      return operationId === undefined || cancellation === undefined
        ? []
        : [[transformation.id, createKpWitnessedAnnihilationBinding({
            operationId,
            transformation,
            bundle: input.animation.bundle,
            cancellationRecordId: cancellation.id
          })] as const];
    }
  ));
  const annihilationWitness = requireDescendant<HTMLElement>(
    stage,
    "[data-kp-reader-annihilation-witness]"
  );
  const identityWitnessValues = new Map(
    [...annihilationWitness.querySelectorAll<HTMLElement>(
      "[data-kp-reader-identity-value]"
    )].map((element) => [
      requiredData(element, "kpReaderIdentityValue"),
      element
    ] as const)
  );
  const independentZeroWitness = requireDescendant<HTMLElement>(
    stage,
    "[data-kp-reader-independent-zero-witness]"
  );
  const listeners = new Set<(
    snapshot: KpChromeFreeCanonicalEquationSnapshot
  ) => void>();
  let layout: KpCanonicalEquationStageLayout | undefined;
  let layoutRevision = 0;
  let layoutReadCount = 0;
  let layoutInvalidated = false;
  let sequence = 0;
  let previousProgress = 0;
  let disposed = false;

  const invalidate = (): void => {
    if (disposed) return;
    layoutInvalidated = true;
  };
  const unsubscribeFonts = fontReadiness.subscribe(invalidate);
  const readLayout = (): KpCanonicalEquationStageLayout => {
    if (layoutInvalidated) {
      // During page teardown ResizeObserver can invalidate after the stage has
      // left paint. Reusing the last certificate matches the legacy reader
      // boundary and prevents transient viewport collapse from becoming a
      // false readability failure; the next visible sample remeasures.
      if (layout !== undefined && stage.getClientRects().length === 0) {
        return layout;
      }
      layout = undefined;
      layoutRevision += 1;
      compositor.invalidate();
      layoutInvalidated = false;
    }
    if (layout === undefined) {
      layoutReadCount += 1;
      layout = measureKpCanonicalEquationStageLayout({
        animationId: input.animation.id,
        revision: layoutRevision,
        viewport,
        transitionElements,
        phaseCohorts: cohorts,
        staticPlans,
        stageLayoutIntent: input.createStageLayoutIntent({
          viewport: viewport.ownerDocument.defaultView?.innerWidth !== undefined &&
              viewport.ownerDocument.defaultView.innerWidth > 880
            ? "wide"
            : "phone"
        }),
        ...(input.descriptor.stageLayoutCompiler === undefined
          ? {}
          : { stageLayoutCompiler: input.descriptor.stageLayoutCompiler })
      });
    }
    return layout;
  };
  const sample = (
    sampleInput: KpChromeFreeCanonicalEquationSampleInput
  ): KpChromeFreeCanonicalEquationSnapshot => {
    if (disposed) throw new Error("Chrome-free canonical session is disposed.");
    const animationProgress = sampleInput.animationProgress ??
      sampleInput.clock.progress;
    const framePlan = planKpReaderCanonicalEquationFrame({
      animation: input.animation,
      clock: sampleInput.clock,
      animationProgress,
      cohorts
    });
    if (framePlan === undefined) {
      throw new Error("Canonical session could not plan an equation frame.");
    }
    const measured = readLayout();
    const context = measured.contexts.get(framePlan.transitionId);
    if (context === undefined) {
      throw new Error(`Canonical stage has no ${framePlan.transitionId} layout.`);
    }
    const choreography = rearrangements.find(
      (step) => step.transformationId === framePlan.transitionId
    );
    const motionMode = sampleInput.motionMode ?? "continuous";
    const motion = sampleKpReaderEquationSymbolMotion({
      materialPlan: context.materialPlan,
      alignment: context.alignment,
      layout: context.layout,
      linearRearrangementKind: choreography?.kind,
      branchSchedule: choreography?.branchSchedule,
      cancellationPresentationRecipe:
        input.equationPresentationProfile.identity === "hold-until-settled-v1"
          ? "witnessed-annihilation-v1"
          : presentation.cancellation,
      zeroWitnessPresentationRecipe: "none",
      successorPresentationRecipe: presentation.successor,
      continuantPresentationRecipe: presentation.continuants,
      nativeHandoffMode: presentation.handoff,
      depthPresentationRecipe:
        motionMode === "continuous" ? presentation.depth : "flat-v1",
      witnessedAnnihilationBinding: witnessedBindings.get(framePlan.transitionId),
      successorSynthesisBinding:
        presentation.successor === "successor-synthesis-v1" ||
        presentation.successor === "convergence-v1" ||
        presentation.successor === "counter-convergence-v1"
          ? choreography?.successorSynthesisBinding
          : undefined,
      progress: framePlan.phaseProgress
    });
    if (motion.linearRearrangement === undefined) {
      delete stage.dataset["kpReaderEquationPersistentReflowProgress"];
      delete stage.dataset["kpReaderEquationFocalTransitProgress"];
      delete stage.dataset["kpReaderEquationBranchSchedule"];
      delete stage.dataset["kpReaderEquationBranchProgress"];
    } else {
      stage.dataset["kpReaderEquationPersistentReflowProgress"] =
        String(motion.linearRearrangement.persistentReflowProgress);
      stage.dataset["kpReaderEquationFocalTransitProgress"] =
        String(motion.linearRearrangement.focalTransitProgress);
      if (motion.linearRearrangement.branchScheduleId === undefined) {
        delete stage.dataset["kpReaderEquationBranchSchedule"];
        delete stage.dataset["kpReaderEquationBranchProgress"];
      } else {
        stage.dataset["kpReaderEquationBranchSchedule"] =
          motion.linearRearrangement.branchScheduleId;
        stage.dataset["kpReaderEquationBranchProgress"] = JSON.stringify(
          motion.linearRearrangement.scheduledBranchProgress
        );
      }
    }
    const focus: KpReaderFocusSnapshot = sampleInput.focus ?? Object.freeze({
      objectRefs: Object.freeze([]),
      revision: 0
    });
    const projectedFocus = projectKpCanonicalEquationSemanticFocus({
      snapshot: focus,
      equationObjectRefs
    });
    const focusProjection = Object.freeze({
      ...projectedFocus,
      visualFocusRefs: semanticFocusLineage.expand(
        projectedFocus.visualFocusRefs
      )
    });
    applyKpCanonicalEquationSemanticFocus({
      stage,
      linkRoot: input.linkRoot,
      projection: focusProjection
    });
    const transition = context.renderPlan.transitions[0];
    const salienceRevision = input.renderSalience?.({
      root: context.element,
      stage,
      sourceStateId: transition?.source[0]?.objectId,
      targetStateId: transition?.target[0]?.objectId,
      operationIds: framePlan.runtimeFrame.activeTransformationIds,
      phaseProgress: framePlan.phaseProgress,
      focusTargetIds: focusProjection.visualFocusRefs
    }) ?? "none";
    for (const candidate of measured.contexts.values()) {
      const active = candidate.id === framePlan.transitionId;
      candidate.element.hidden = !active;
      candidate.element.dataset["kpReaderTransitionActive"] = String(active);
    }
    applyKpReaderEquationResponsiveFit(materialFitSurface, context.fit);
    const accessibleObjectId = framePlan.phaseProgress < 1
      ? transition?.source[0]?.objectId
      : transition?.target[0]?.objectId;
    if (accessibleObjectId === undefined) {
      throw new Error("Canonical frame has no accessible equation endpoint.");
    }
    accessible.sync(accessibleObjectId);
    const endpointEvidence = syncKpCanonicalEquationNativeEndpointEvidence({
      stage,
      motion,
      alignment: context.alignment,
      phaseProgress: framePlan.phaseProgress
    });
    const canonicalPaintOwner = compositor.apply({
      renderPlan: context.renderPlan,
      materialPlan: context.materialPlan,
      fitSurface: context.fitSurface,
      progress: framePlan.phaseProgress,
      motionMode,
      fontReadiness,
      presentationRevision: [
        sampleInput.presentationRevision ?? "host",
        focus.activeSource ?? "none",
        ...focusProjection.visualFocusRefs,
        salienceRevision
      ].join(":"),
      measurementIdentity: context.fit.measurementIdentity,
      appliedStageLayout: context.appliedStageLayout
    });
    if (!canonicalPaintOwner) {
      throw new Error(
        `Canonical compositor rejected ${framePlan.transitionId}.`
      );
    }
    const activeIndex = transitionPolicy.transitionIds.indexOf(
      framePlan.transitionId
    );
    compositor.prewarm([activeIndex - 1, activeIndex + 1].flatMap((index) => {
      const adjacentId = transitionPolicy.transitionIds[index];
      const adjacent = adjacentId === undefined
        ? undefined
        : measured.contexts.get(adjacentId);
      return adjacent === undefined ? [] : [{
        renderPlan: adjacent.renderPlan,
        materialPlan: adjacent.materialPlan,
        fitSurface: adjacent.fitSurface,
        progress: 0,
        motionMode,
        fontReadiness,
        presentationRevision: "adjacent-prewarm",
        measurementIdentity: adjacent.fit.measurementIdentity,
        appliedStageLayout: adjacent.appliedStageLayout
      }];
    }));
    syncAnnihilationWitness({
      stage,
      witness: annihilationWitness,
      witnessValues: identityWitnessValues,
      witnessed: motion.witnessedAnnihilation,
      identityMode: input.equationPresentationProfile.identity,
      decorativeMotion: motionMode !== "essential"
    });
    syncIndependentZeroWitness({
      stage,
      witness: independentZeroWitness,
      witnessed: motion.independentZeroWitness
    });
    stage.dataset["kpReaderCanonicalEquationSessionActive"] = "true";
    stage.dataset["kpReaderMotionAuthority"] = motion.samplingAuthority;
    stage.dataset["kpReaderEquationEffectiveDepthRecipe"] =
      motionMode === "continuous" ? presentation.depth : "flat-v1";
    const snapshot = Object.freeze({
      progressPermille: sampleInput.clock.progressPermille,
      animationProgressPermille: Math.round(animationProgress * 1_000),
      phaseProgressPermille: Math.round(framePlan.phaseProgress * 1_000),
      transitionId: framePlan.transitionId,
      activePhase: framePlan.runtimeFrame.phase.phaseId,
      activeTransformationIds: Object.freeze([
        ...framePlan.runtimeFrame.activeTransformationIds
      ]),
      accessibleEquationState: accessibleObjectId,
      ...(endpointEvidence.endpoint === undefined
        ? {}
        : { nativeEndpoint: endpointEvidence.endpoint }),
      nativeEndpointPassed: endpointEvidence.passed,
      canonicalPaintOwner,
      motionAuthority: motion.samplingAuthority,
      fitStatus: context.fit.status,
      fitScale: context.fit.scale,
      layoutRevision,
      layoutReadCount,
      fontRevision: fontReadiness.revision,
      fontReady: fontReadiness.status === "ready",
      ownerIds: Object.freeze(motion.owners.map((owner) => owner.ownerId)),
      ...(context.appliedStageLayout === undefined
        ? {}
        : { layoutPolicy: context.appliedStageLayout.certificate.policy })
    });
    // Host-neutral review evidence lets embedding surfaces prove that they
    // sampled the same semantic frame without reaching into compositor state.
    stage.dataset["kpReaderCanonicalReviewFrame"] = JSON.stringify([
      snapshot.animationProgressPermille,
      snapshot.phaseProgressPermille,
      snapshot.activePhase,
      snapshot.activeTransformationIds
    ]);
    stage.dataset["kpReaderCanonicalPaintOwner"] =
      String(snapshot.canonicalPaintOwner);
    stage.dataset["kpReaderCanonicalFitStatus"] = snapshot.fitStatus;
    stage.dataset["kpReaderCanonicalBaselineResidual"] =
      String(measured.baselineAlignment.maximumResidualPx);
    stage.dataset["kpReaderCanonicalContinuityResidual"] =
      String(measured.transitionContinuity.maximumResidualPx);
    stage.dataset["kpReaderCanonicalContinuitySeams"] =
      String(measured.transitionContinuity.seams.length);
    if (snapshot.layoutPolicy === undefined) {
      delete stage.dataset["kpReaderCanonicalLayoutPolicy"];
    } else {
      stage.dataset["kpReaderCanonicalLayoutPolicy"] = snapshot.layoutPolicy;
    }
    for (const listener of listeners) listener(snapshot);
    previousProgress = sampleInput.clock.progress;
    sequence = Math.max(sequence, sampleInput.clock.sequence);
    return snapshot;
  };
  return Object.freeze({
    stage,
    sample,
    seek(progress: number) {
      sequence += 1;
      return sample({
        clock: createKpReaderClockSample({
          source: "controls",
          progress,
          previousProgress,
          sequence,
          settled: true
        })
      });
    },
    subscribe(listener: (
      snapshot: KpChromeFreeCanonicalEquationSnapshot
    ) => void) {
      if (disposed) throw new Error("Chrome-free canonical session is disposed.");
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    invalidate,
    dispose() {
      if (disposed) return;
      disposed = true;
      unsubscribeFonts();
      fontReadiness.dispose();
      compositor.dispose();
      listeners.clear();
    }
  });
}

function cancellationOperationId(transformType: string): string | undefined {
  switch (transformType) {
    case "cancelAdditiveInverses":
      return "kp.algebra.cancel-additive-inverses";
    case "cancelMultiplicativeInverses":
      return "kp.algebra.cancel-multiplicative-inverses";
    default:
      return undefined;
  }
}

function syncAnnihilationWitness(input: {
  readonly stage: HTMLElement;
  readonly witness: HTMLElement;
  readonly witnessValues: ReadonlyMap<string, HTMLElement>;
  readonly witnessed: ReturnType<typeof sampleKpReaderEquationSymbolMotion>["witnessedAnnihilation"];
  readonly identityMode: KpReaderEquationPresentationProfile["identity"];
  readonly decorativeMotion: boolean;
}): void {
  const projection = projectKpReaderEquationIdentityWitness({
    mode: input.identityMode,
    witness: input.witnessed === undefined ? undefined : {
      latex: input.witnessed.frame.witness.latex,
      readable: input.witnessed.frame.witnessReadable,
      ready: input.witnessed.frame.sources.every(
        (source) => source.pose.opacity === 0
      ),
      progress: input.witnessed.frame.progress
    }
  });
  input.stage.dataset["kpReaderIdentityWitnessState"] = projection.state;
  input.witness.style.opacity = String(projection.opacity);
  if (input.witnessed === undefined || projection.latex === undefined) {
    delete input.stage.dataset["kpReaderAnnihilationPhase"];
    delete input.stage.dataset["kpReaderAnnihilationWitnessReadable"];
    return;
  }
  for (const [latex, element] of input.witnessValues) {
    element.hidden = latex !== projection.latex;
  }
  const pose = input.witnessed.frame.witness.pose;
  input.witness.style.left = `${input.witnessed.contactPoint.x}px`;
  input.witness.style.top = `${input.witnessed.contactPoint.y}px`;
  input.witness.style.transform =
    `translate(calc(-50% + ${pose.x}px), calc(-50% + ${pose.y}px)) ` +
    `scale(${pose.scale})`;
  input.witness.style.filter = !input.decorativeMotion ||
      input.witnessed.frame.inwardPulse <= 0
    ? "none"
    : `drop-shadow(0 ${2 * input.witnessed.frame.inwardPulse}px ` +
      `${5 * input.witnessed.frame.inwardPulse}px rgb(223 112 71 / ` +
      `${0.32 * input.witnessed.frame.inwardPulse}))`;
  input.stage.dataset["kpReaderAnnihilationPhase"] = input.witnessed.frame.phase;
  input.stage.dataset["kpReaderAnnihilationWitnessReadable"] =
    String(projection.readable);
}

function syncIndependentZeroWitness(input: {
  readonly stage: HTMLElement;
  readonly witness: HTMLElement;
  readonly witnessed: ReturnType<typeof sampleKpReaderEquationSymbolMotion>["independentZeroWitness"];
}): void {
  if (input.witnessed === undefined) {
    input.witness.style.opacity = "0";
    delete input.stage.dataset["kpReaderIndependentZeroPhase"];
    delete input.stage.dataset["kpReaderIndependentZeroReadable"];
    return;
  }
  const pose = input.witnessed.frame.pose;
  input.witness.style.left = `${input.witnessed.contactPoint.x}px`;
  input.witness.style.top = `${input.witnessed.contactPoint.y}px`;
  input.witness.style.opacity = String(pose.opacity);
  input.witness.style.transform =
    `translate(calc(-50% + ${pose.x}px), calc(-50% + ${pose.y}px)) ` +
    `scale(${pose.scale})`;
  input.stage.dataset["kpReaderIndependentZeroPhase"] =
    input.witnessed.frame.phase;
  input.stage.dataset["kpReaderIndependentZeroReadable"] =
    String(input.witnessed.frame.readable);
}

function requiredData(element: HTMLElement, key: string): string {
  const value = element.dataset[key];
  if (value === undefined || value === "") {
    throw new Error(`Missing data-${key}.`);
  }
  return value;
}

function requireDescendant<T extends Element>(
  root: ParentNode,
  selector: string
): T {
  const element = root.querySelector<T>(selector);
  if (element === null) throw new Error(`Expected descendant ${selector}.`);
  return element;
}
