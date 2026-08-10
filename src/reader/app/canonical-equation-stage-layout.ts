import type {
  KpAnimationTransformationPhaseCohort
} from "../../animation/transformation-phase-cohorts.ts";
import {
  applyKpReaderEquationResponsiveFit,
  measureKpReaderAppliedEquationStageLayoutSnapshot,
  measureKpReaderEquationLayoutSnapshot,
  planKpReaderCertifiedEquationStageResponsiveFit,
  planKpReaderEquationPerceptualAlignment,
  planKpReaderEquationSequenceResponsiveFit,
  type KpReaderEquationLayoutSnapshot,
  type KpReaderEquationMaterialPlan,
  type KpReaderEquationPerceptualAlignmentPlan,
  type KpReaderEquationRenderPlan,
  type KpReaderEquationResponsiveFitPlan
} from "../renderers/learner-public-api.ts";
import {
  createKpEquationStageMeasurementIdentity,
  resetKpAppliedEquationStageLayout,
  type KpAppliedEquationStageLayout,
  type KpCorridorCertifiedEquationStageLayout
} from "../runtime/learner-public-api.ts";
import type { KpEquationStageLayoutIntent } from "../runtime/public-api.ts";
import type {
  KpReaderEquationStageLayoutCompiler
} from "./equation-lesson-descriptor.ts";

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
}

/**
 * Measurement and corridor certification are canonical host behavior, not
 * page layout. Hosts supply only their viewport and semantic stage intent.
 */
export function measureKpCanonicalEquationStageLayout(input: {
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
  const measured: Omit<KpCanonicalEquationTransitionLayout, "fit">[] = [];
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
    fitSurface.style.transform = "none";
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
      resetKpAppliedEquationStageLayout(measurementRoot);
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
    const layout = appliedStageLayout === undefined
      ? measureKpReaderEquationLayoutSnapshot({
          materialPlan: plans.materialPlan,
          transitionId: id,
          measurementRoot,
          revision: input.revision,
          coordinateSpaceId
        })
      : measureKpReaderAppliedEquationStageLayoutSnapshot({
          materialPlan: plans.materialPlan,
          transitionId: id,
          measurementRoot,
          revision: input.revision,
          coordinateSpaceId,
          appliedStageLayout
        });
    const alignment = planKpReaderEquationPerceptualAlignment({
      materialPlan: plans.materialPlan,
      layout
    });
    measured.push({
      id,
      element,
      fitSurface,
      measurementRoot,
      renderPlan: plans.renderPlan,
      materialPlan: plans.materialPlan,
      anchorElements: anchorElementIndex(measurementRoot),
      layout,
      alignment,
      ...(appliedStageLayout === undefined ? {} : { appliedStageLayout })
    });
  }
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
  const contexts = new Map(measured.map((context) => {
    const certifiedFit = context.appliedStageLayout === undefined
      ? undefined
      : planKpReaderCertifiedEquationStageResponsiveFit({
          layout: context.appliedStageLayout.certificate,
          viewportWidth: input.viewport.clientWidth,
          viewportHeight: input.viewport.clientHeight,
          horizontalPadding: 18,
          verticalPadding: 18,
          minScale: 0.68
        });
    if (certifiedFit?.kind === "unsatisfied") {
      throw new Error(
        `Certified equation stage ${context.id} requires scale ` +
        `${certifiedFit.requiredScale.toFixed(3)}, below its readable ` +
        `${certifiedFit.minimumReadableScale.toFixed(3)} floor.`
      );
    }
    const fit = certifiedFit?.fit ?? sequenceFit;
    applyKpReaderEquationResponsiveFit(context.fitSurface, fit);
    return [context.id, { ...context, fit }] as const;
  }));
  return Object.freeze({ contexts });
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
