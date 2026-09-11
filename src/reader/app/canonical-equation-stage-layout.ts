import type {
  KpAnimationTransformationPhaseCohort
} from "../../animation/transformation-phase-cohorts.ts";
import { measureKpNativeKatexSubtreePaintRect } from
  "../../rendering/native-katex-paint-geometry.ts";
import {
  applyKpReaderEquationResponsiveFit,
  measureKpReaderAppliedEquationStageLayoutSnapshot,
  measureKpReaderEquationLayoutSnapshot,
  planKpReaderCertifiedEquationStageSequenceResponsiveFit,
  planKpReaderEquationPerceptualAlignment,
  planKpReaderEquationSequenceResponsiveFit,
  type KpReaderEquationLayoutSnapshot,
  type KpReaderEquationMaterialPlan,
  type KpReaderEquationPerceptualAlignmentPlan,
  type KpReaderEquationRenderPlan,
  type KpReaderEquationResponsiveFitPlan
} from "../renderers/learner-public-api.ts";
import {
  alignKpEquationStageSequence,
  applyKpCertifiedEquationStageLayout,
  createKpEquationStageMeasurementIdentity,
  resetKpAppliedEquationStageLayout,
  translateKpEquationStageLayoutRows,
  type KpAppliedEquationStageLayout,
  type KpCorridorCertifiedEquationStageLayout
} from "../runtime/learner-public-api.ts";
import type { KpEquationStageLayoutIntent } from "../runtime/public-api.ts";
import type {
  KpReaderEquationStageLayoutCompiler
} from "./equation-lesson-descriptor.ts";
import {
  alignKpCanonicalEquationStateBaselines,
  type KpCanonicalEquationBaselineAlignmentCertificate
} from "./canonical-equation-baseline-alignment.ts";
import {
  certifyKpCanonicalEquationTransitionContinuity,
  planKpCanonicalEquationTransitionCorrections,
  type KpCanonicalEquationTransitionContinuityCertificate
} from "./canonical-equation-transition-continuity.ts";
import { measureKpCanonicalEquationNativeHandoff } from "./canonical-equation-native-handoff.ts";
import type { KpVerifiedEquationEndpointHandoff } from "../../semantic/equation-endpoint-handoff.ts";

export interface KpCanonicalEquationStaticPlan {
  readonly renderPlan: KpReaderEquationRenderPlan;
  readonly materialPlan: KpReaderEquationMaterialPlan;
}

export interface KpCanonicalEquationTransitionLayout {
  readonly id: string;
  readonly element: HTMLElement;
  readonly fitSurface: HTMLElement;
  readonly measurementRoot: HTMLElement;
  readonly renderPlan: KpReaderEquationRenderPlan;
  readonly materialPlan: KpReaderEquationMaterialPlan;
  readonly anchorElements: ReadonlyMap<string, HTMLElement>;
  readonly layout: KpReaderEquationLayoutSnapshot;
  readonly alignment: KpReaderEquationPerceptualAlignmentPlan;
  readonly fit: KpReaderEquationResponsiveFitPlan;
  readonly appliedStageLayout?:
    KpAppliedEquationStageLayout<
      KpCorridorCertifiedEquationStageLayout
    > | undefined;
}

export interface KpCanonicalEquationStageLayout {
  readonly contexts:
    ReadonlyMap<string, KpCanonicalEquationTransitionLayout>;
  readonly baselineAlignment:
    KpCanonicalEquationBaselineAlignmentCertificate;
  readonly transitionContinuity:
    KpCanonicalEquationTransitionContinuityCertificate;
}

/**
 * Measurement and corridor certification are canonical host behavior, not
 * page layout. Hosts supply only their viewport and semantic stage intent.
 */
export function measureKpCanonicalEquationStageLayout(input: {
  readonly nativeHandoffs?: { readonly handoffs: readonly KpVerifiedEquationEndpointHandoff[]; readonly fontRevision: number };
  readonly animationId: string;
  readonly revision: number;
  readonly viewport: HTMLElement;
  readonly transitionElements: readonly HTMLElement[];
  readonly phaseCohorts: readonly KpAnimationTransformationPhaseCohort[];
  readonly staticPlans: ReadonlyMap<string, KpCanonicalEquationStaticPlan>;
  readonly stageLayoutIntent?: KpEquationStageLayoutIntent | undefined;
  readonly stageLayoutCompiler?: KpReaderEquationStageLayoutCompiler | undefined;
}): KpCanonicalEquationStageLayout {
  if (
    (input.stageLayoutIntent === undefined) !==
    (input.stageLayoutCompiler === undefined)
  ) {
    throw new Error(
      "Reader stage layout requires both semantic intent and a descriptor compiler."
    );
  }
  if (
    input.stageLayoutIntent !== undefined &&
    input.stageLayoutIntent.phases.length !== input.transitionElements.length
  ) {
    throw new Error(
      "Reader stage layout must cover every equation transition exactly once."
    );
  }
  for (const element of input.transitionElements) {
    requireDescendant<HTMLElement>(
      element,
      "[data-kp-reader-fit-surface]"
    ).style.transform = "none";
    resetKpAppliedEquationStageLayout(requireDescendant<HTMLElement>(
      element,
      "[data-kp-reader-equation-measurement]"
    ));
  }
  // Baselines must be observed after every previous row transform is gone;
  // measuring through stale applied geometry made resize/reseek revisions drift.
  const baselineAlignment = alignKpCanonicalEquationStateBaselines({
    viewport: input.viewport,
    transitionElements: input.transitionElements
  });
  const staged: Omit<
    KpCanonicalEquationTransitionLayout,
    "layout" | "alignment" | "fit"
  >[] = [];
  for (const [index, element] of input.transitionElements.entries()) {
    const id = requiredData(element, "kpReaderTransition");
    const plans = input.staticPlans.get(id);
    if (plans === undefined) {
      throw new Error(`Equation transition ${id} is missing its reader plan.`);
    }
    const measurementRoot = requireDescendant<HTMLElement>(
      element,
      "[data-kp-reader-equation-measurement]"
    );
    const fitSurface = requireDescendant<HTMLElement>(
      element,
      "[data-kp-reader-fit-surface]"
    );
    const coordinateSpaceId = `${input.animationId}.equation-stage`;
    const measurementIdentity = createKpEquationStageMeasurementIdentity({
      revision: input.revision,
      coordinateSpaceId
    });
    const phaseIntent = input.stageLayoutIntent?.phases[index];
    const cohort = input.phaseCohorts[index];
    let appliedStageLayout:
      KpAppliedEquationStageLayout<
        KpCorridorCertifiedEquationStageLayout
      > | undefined;
    if (
      input.stageLayoutCompiler !== undefined &&
      phaseIntent !== undefined &&
      cohort !== undefined
    ) {
      appliedStageLayout = input.stageLayoutCompiler.apply({
        phaseIntent,
        sourceObjectIds: cohort.sourceObjectIds,
        targetObjectIds: cohort.targetObjectIds,
        measurementRoot,
        measurementIdentity
      });
      element.dataset["kpReaderStageLayoutApplied"] =
        appliedStageLayout.applicationId;
      element.dataset["kpReaderStageLayoutPhase"] = phaseIntent.nodeId;
      element.dataset["kpReaderStageLayoutPolicy"] =
        appliedStageLayout.certificate.policy;
    }
    staged.push({
      id,
      element,
      fitSurface,
      measurementRoot,
      renderPlan: plans.renderPlan,
      materialPlan: plans.materialPlan,
      anchorElements: anchorElementIndex(measurementRoot),
      ...(appliedStageLayout === undefined ? {} : { appliedStageLayout })
    });
  }
  const applied = staged.flatMap(({ appliedStageLayout }) =>
    appliedStageLayout === undefined ? [] : [appliedStageLayout]
  );
  if (applied.length !== 0 && applied.length !== staged.length) {
    throw new Error(
      "Canonical equation sequence cannot mix certified and uncertified phases."
    );
  }
  const alignedCertificates = alignKpEquationStageSequence(
    applied.map(({ certificate }) => certificate), input.nativeHandoffs?.handoffs
  );
  const alignedStaged = staged.map((context, index) => {
    if (context.appliedStageLayout === undefined) return context;
    const appliedStageLayout = applyKpCertifiedEquationStageLayout({
      certificate: alignedCertificates[index]!,
      measurementIdentity: context.appliedStageLayout.measurementIdentity,
      rows: context.appliedStageLayout.nativeRows
    });
    return { ...context, appliedStageLayout };
  });
  const preliminary = measureTransitionLayouts({
    staged: alignedStaged,
    animationId: input.animationId,
    revision: input.revision
  });
  // Keep the existing complete-anchor measurement path. Only operation subsets
  // require a sequence-wide projection from the certified native member set.
  const usesOperationSubset = input.phaseCohorts.length > 1 && preliminary.some(
    (context) => context.appliedStageLayout?.nativeRows.some((row) =>
      row.members.some((member) => !context.layout.anchors.some((anchor) =>
        anchor.selectorId === member.ownerId
      ))
    )
  );
  const corrections = planKpCanonicalEquationTransitionCorrections({
    handoffs: measureHandoffs(preliminary, input.phaseCohorts, input.nativeHandoffs),
    cohorts: input.phaseCohorts,
    contexts: new Map(preliminary.map((context) => [context.id, {
      layout: measureContinuityLayout(context, usesOperationSubset),
      ...(context.appliedStageLayout === undefined
        ? {}
        : { stageLayout: context.appliedStageLayout.certificate })
    }]))
  });
  const correctedStaged = alignedStaged.map((context) => {
    const correction = corrections.get(context.id) ?? new Map();
    if (context.appliedStageLayout === undefined) {
      if ([...correction.values()].some(({ x, y }) =>
        Math.abs(x) > 0.5 || Math.abs(y) > 0.5
      )) {
        throw new Error(
          `Canonical equation transition ${context.id} requires layout authority ` +
          "to repair its rigid endpoint offset."
        );
      }
      return context;
    }
    const appliedStageLayout = applyKpCertifiedEquationStageLayout({
      certificate: translateKpEquationStageLayoutRows(
        context.appliedStageLayout.certificate,
        correction
      ),
      measurementIdentity: context.appliedStageLayout.measurementIdentity,
      rows: context.appliedStageLayout.nativeRows
    });
    return { ...context, appliedStageLayout };
  });
  const measured = measureTransitionLayouts({
    staged: correctedStaged,
    animationId: input.animationId,
    revision: input.revision
  });
  // Snapshot native paint before fit writes; certification applies the fit once.
  const continuityLayouts = new Map(measured.map((context) =>
    [context.id, measureContinuityLayout(context, usesOperationSubset)] as const
  ));
  const nativeHandoffs = measureHandoffs(measured, input.phaseCohorts, input.nativeHandoffs);
  const sequenceFit = planKpReaderEquationSequenceResponsiveFit({
    id: `${input.animationId}.r${input.revision}`,
    alignments: measured.map((context) => context.alignment),
    viewportWidth: input.viewport.clientWidth,
    viewportHeight: input.viewport.clientHeight,
    horizontalPadding: 18,
    verticalPadding: 18,
    minScale: 0.68,
    overflowStrategy: "contain"
  });
  const certifiedLayouts = measured.flatMap(({ appliedStageLayout }) =>
    appliedStageLayout === undefined ? [] : [appliedStageLayout.certificate]
  );
  const certifiedSequenceFit = certifiedLayouts.length === 0
    ? undefined
    : planKpReaderCertifiedEquationStageSequenceResponsiveFit({
        id: `${input.animationId}.r${input.revision}`,
        layouts: certifiedLayouts,
        viewportWidth: input.viewport.clientWidth,
        viewportHeight: input.viewport.clientHeight,
        horizontalPadding: 18,
        verticalPadding: 18,
        minScale: 0.68
      });
  if (certifiedSequenceFit?.status === "overflow") {
    throw new Error(
      `Certified equation-stage sequence ${input.animationId} requires scale ` +
      `${certifiedSequenceFit.requiredScale.toFixed(3)}, below its readable ` +
      `${certifiedSequenceFit.scale.toFixed(3)} floor at ` +
      `${input.viewport.clientWidth}x${input.viewport.clientHeight}.`
    );
  }
  const contexts = new Map(measured.map((context) => {
    const fit = certifiedSequenceFit ?? sequenceFit;
    applyKpReaderEquationResponsiveFit(context.fitSurface, fit);
    return [context.id, { ...context, fit }] as const;
  }));
  const transitionContinuity =
    certifyKpCanonicalEquationTransitionContinuity({
      handoffs: nativeHandoffs,
      cohorts: input.phaseCohorts,
      contexts: new Map([...contexts].map(([id, context]) =>
        [id, { ...context, layout: continuityLayouts.get(id)! }]
      ))
    });
  return Object.freeze({
    contexts,
    baselineAlignment,
    transitionContinuity
  });
}

function measureHandoffs(contexts: readonly Pick<KpCanonicalEquationTransitionLayout, "id" | "measurementRoot" | "layout">[], cohorts: readonly KpAnimationTransformationPhaseCohort[],
  input: { readonly handoffs: readonly KpVerifiedEquationEndpointHandoff[]; readonly fontRevision: number } | undefined) {
  return (input?.handoffs ?? []).map(authority => {
    const index = cohorts.findIndex(cohort => cohort.targetObjectIds.length === 1 && cohort.targetObjectIds[0] === authority.source.object.id);
    const from = contexts[index], to = contexts[index + 1];
    if (index < 0 || !from || !to || JSON.stringify(cohorts[index + 1]?.sourceObjectIds) !== JSON.stringify([authority.target.object.id]))
      throw new Error("Native endpoint handoff is not attached to one adjacent phase boundary.");
    return measureKpCanonicalEquationNativeHandoff({ authority, from, to, fontRevision: input!.fontRevision });
  });
}
function measureContinuityLayout(context: {
  readonly layout: KpReaderEquationLayoutSnapshot;
  readonly measurementRoot: HTMLElement;
  readonly appliedStageLayout?: KpAppliedEquationStageLayout<
    KpCorridorCertifiedEquationStageLayout
  > | undefined;
}, usesOperationSubset: boolean): KpReaderEquationLayoutSnapshot {
  const applied = context.appliedStageLayout;
  if (applied === undefined || !usesOperationSubset) return context.layout;
  // Operation anchors may switch between a compound and its children. Certified
  // native members preserve complete endpoint identity across that switch.
  const sides = new Map(context.layout.anchors.map((anchor) =>
    [anchor.objectId, anchor.side] as const
  ));
  const anchors = applied.nativeRows.flatMap((row) => row.members).map(
    (member, selectorIndex) => {
      const envelopes = applied.certificate.measuredInput.envelopes.filter(
        (envelope) => envelope.memberOwnerIds.includes(member.ownerId)
      );
      const objectIds = new Set(envelopes.map((envelope) => envelope.endpointObjectId));
      const objectId = envelopes[0]?.endpointObjectId;
      const side = objectId === undefined ? undefined : sides.get(objectId);
      if (objectIds.size !== 1 || objectId === undefined || side === undefined) {
        throw new Error(`Native continuity member ${member.ownerId} lacks unique endpoint authority.`);
      }
      const rect = measureKpNativeKatexSubtreePaintRect(
        context.measurementRoot, member.element
      );
      if (rect === undefined) {
        throw new Error(`Native continuity member ${member.ownerId} has no paint.`);
      }
      return {
        id: `continuity.${side}.${member.ownerId}`,
        objectId, side, selectorId: member.ownerId, selectorIndex,
        anchorKind: "ink-center" as const, focused: false, rect,
        center: { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
      };
    }
  );
  return { ...context.layout, anchors };
}

function measureTransitionLayouts(input: {
  readonly staged: readonly Omit<
    KpCanonicalEquationTransitionLayout,
    "layout" | "alignment" | "fit"
  >[];
  readonly animationId: string;
  readonly revision: number;
}): Omit<KpCanonicalEquationTransitionLayout, "fit">[] {
  return input.staged.map((context) => {
    const coordinateSpaceId = `${input.animationId}.equation-stage`;
    const layout = context.appliedStageLayout === undefined
      ? measureKpReaderEquationLayoutSnapshot({
          materialPlan: context.materialPlan,
          transitionId: context.id,
          measurementRoot: context.measurementRoot,
          revision: input.revision,
          coordinateSpaceId
        })
      : measureKpReaderAppliedEquationStageLayoutSnapshot({
          materialPlan: context.materialPlan,
          transitionId: context.id,
          measurementRoot: context.measurementRoot,
          revision: input.revision,
          coordinateSpaceId,
          appliedStageLayout: context.appliedStageLayout
        });
    return {
      ...context,
      layout,
      alignment: planKpReaderEquationPerceptualAlignment({
        materialPlan: context.materialPlan,
        layout
      })
    };
  });
}

function anchorElementIndex(
  root: HTMLElement
): ReadonlyMap<string, HTMLElement> {
  return new Map([...root.querySelectorAll<HTMLElement>(
    "[data-kp-reader-equation-anchor-id]"
  )].map((element) => [
    requiredData(element, "kpReaderEquationAnchorId"),
    element
  ]));
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
