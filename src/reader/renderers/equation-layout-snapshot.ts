import type {
  KpReaderEquationAnchorPlan,
  KpReaderEquationMaterialPlan,
  KpReaderEquationTransitionMaterialPlan
} from "./equation-material-plan.ts";
import {
  createKpEquationStageMeasurementIdentity,
  type KpEquationStageMeasurementIdentity
} from "../runtime/equation-stage-layout.ts";

export interface KpReaderLayoutRect {
  readonly left: number;
  readonly top: number;
  readonly width: number;
  readonly height: number;
}

export interface KpReaderEquationAnchorMeasurement {
  readonly anchorId: string;
  readonly rect: KpReaderLayoutRect;
}

export interface KpReaderEquationLayoutSnapshot {
  readonly id: string;
  readonly kind: "reader-equation-layout-snapshot";
  readonly materialPlanId: string;
  readonly transitionId: string;
  readonly revision: number;
  readonly measurementIdentity: KpEquationStageMeasurementIdentity;
  readonly viewport: { readonly width: number; readonly height: number };
  readonly anchors: readonly KpReaderEquationMeasuredAnchor[];
  readonly owners: readonly KpReaderEquationMeasuredOwner[];
}

export interface KpReaderEquationMeasuredAnchor extends KpReaderEquationAnchorPlan {
  readonly rect: KpReaderLayoutRect;
  readonly center: { readonly x: number; readonly y: number };
}

export interface KpReaderEquationMeasuredOwner {
  readonly ownerId: string;
  readonly sourceBounds?: KpReaderLayoutRect | undefined;
  readonly targetBounds?: KpReaderLayoutRect | undefined;
}

export function measureKpReaderEquationLayoutSnapshot(input: {
  readonly materialPlan: KpReaderEquationMaterialPlan;
  readonly transitionId: string;
  readonly measurementRoot: HTMLElement;
  readonly revision: number;
  readonly coordinateSpaceId: string;
}): KpReaderEquationLayoutSnapshot {
  if (
    input.measurementRoot.dataset["kpReaderEquationMeasurement"] !== "true" ||
    input.measurementRoot.getAttribute("aria-hidden") !== "true"
  ) {
    throw new Error(
      "Equation layout measurement requires an aria-hidden reader measurement root."
    );
  }
  const rootRect = domRect(input.measurementRoot.getBoundingClientRect());
  const measurements = [
    ...input.measurementRoot.querySelectorAll<HTMLElement>(
      "[data-kp-reader-equation-anchor-id]"
    )
  ].map((element): KpReaderEquationAnchorMeasurement => {
    const anchorId = element.dataset["kpReaderEquationAnchorId"];
    if (anchorId === undefined || anchorId === "") {
      throw new Error("Equation measurement anchor is missing its stable id.");
    }
    return { anchorId, rect: domRect(element.getBoundingClientRect()) };
  });
  return createKpReaderEquationLayoutSnapshot({
    materialPlan: input.materialPlan,
    transitionId: input.transitionId,
    revision: input.revision,
    coordinateSpaceId: input.coordinateSpaceId,
    rootRect,
    measurements
  });
}

export function createKpReaderEquationLayoutSnapshot(input: {
  readonly materialPlan: KpReaderEquationMaterialPlan;
  readonly transitionId: string;
  readonly revision: number;
  readonly coordinateSpaceId: string;
  readonly rootRect: KpReaderLayoutRect;
  readonly measurements: readonly KpReaderEquationAnchorMeasurement[];
}): KpReaderEquationLayoutSnapshot {
  if (!Number.isInteger(input.revision) || input.revision < 0) {
    throw new Error("Equation layout revision must be a non-negative integer.");
  }
  const measurementIdentity = createKpEquationStageMeasurementIdentity({
    revision: input.revision,
    coordinateSpaceId: input.coordinateSpaceId
  });
  assertRect(input.rootRect, "Equation measurement root", false);
  const transition = input.materialPlan.transitions.find(
    (candidate) => candidate.transitionId === input.transitionId
  );
  if (transition === undefined) {
    throw new Error(
      `Material plan ${input.materialPlan.id} has no transition ${input.transitionId}.`
    );
  }
  const measuredByAnchorId = measurementIndex(input.measurements);
  const anchors = transition.anchors.map((anchor) => {
    const measurement = measuredByAnchorId.get(anchor.id);
    if (measurement === undefined) {
      throw new Error(`Equation layout is missing measurement ${anchor.id}.`);
    }
    assertRect(measurement.rect, `Equation anchor ${anchor.id}`, false);
    const rect = localRect(measurement.rect, input.rootRect);
    return {
      ...anchor,
      rect,
      center: {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2
      }
    };
  });
  const anchorsById = new Map(anchors.map((anchor) => [anchor.id, anchor]));

  return {
    id: `layout.${input.materialPlan.id}.${input.transitionId}.r${input.revision}`,
    kind: "reader-equation-layout-snapshot",
    materialPlanId: input.materialPlan.id,
    transitionId: input.transitionId,
    revision: input.revision,
    measurementIdentity,
    viewport: {
      width: input.rootRect.width,
      height: input.rootRect.height
    },
    anchors,
    owners: compileMeasuredOwners(transition, anchorsById)
  };
}

function compileMeasuredOwners(
  transition: KpReaderEquationTransitionMaterialPlan,
  anchorsById: ReadonlyMap<string, KpReaderEquationMeasuredAnchor>
): readonly KpReaderEquationMeasuredOwner[] {
  return transition.owners.map((owner) => {
    const sourceBounds = unionAnchorBounds(owner.sourceAnchorIds, anchorsById);
    const targetBounds = unionAnchorBounds(owner.targetAnchorIds, anchorsById);
    return {
      ownerId: owner.id,
      ...(sourceBounds === undefined ? {} : { sourceBounds }),
      ...(targetBounds === undefined ? {} : { targetBounds })
    };
  });
}

function unionAnchorBounds(
  anchorIds: readonly string[],
  anchorsById: ReadonlyMap<string, KpReaderEquationMeasuredAnchor>
): KpReaderLayoutRect | undefined {
  if (anchorIds.length === 0) return undefined;
  const rects = anchorIds.map((anchorId) => {
    const anchor = anchorsById.get(anchorId);
    if (anchor === undefined) {
      throw new Error(`Material owner references unmeasured anchor ${anchorId}.`);
    }
    return anchor.rect;
  });
  const left = Math.min(...rects.map((rect) => rect.left));
  const top = Math.min(...rects.map((rect) => rect.top));
  const right = Math.max(...rects.map((rect) => rect.left + rect.width));
  const bottom = Math.max(...rects.map((rect) => rect.top + rect.height));
  return { left, top, width: right - left, height: bottom - top };
}

function measurementIndex(
  measurements: readonly KpReaderEquationAnchorMeasurement[]
): ReadonlyMap<string, KpReaderEquationAnchorMeasurement> {
  const byId = new Map<string, KpReaderEquationAnchorMeasurement>();
  for (const measurement of measurements) {
    if (byId.has(measurement.anchorId)) {
      throw new Error(
        `Equation layout repeats measurement ${measurement.anchorId}.`
      );
    }
    byId.set(measurement.anchorId, measurement);
  }
  return byId;
}

function localRect(
  rect: KpReaderLayoutRect,
  root: KpReaderLayoutRect
): KpReaderLayoutRect {
  return {
    left: rect.left - root.left,
    top: rect.top - root.top,
    width: rect.width,
    height: rect.height
  };
}

function assertRect(
  rect: KpReaderLayoutRect,
  label: string,
  allowZeroSize: boolean
): void {
  const values = [rect.left, rect.top, rect.width, rect.height];
  if (!values.every(Number.isFinite)) {
    throw new Error(`${label} must have finite geometry.`);
  }
  if (rect.width < 0 || rect.height < 0) {
    throw new Error(`${label} must not have negative dimensions.`);
  }
  if (!allowZeroSize && (rect.width === 0 || rect.height === 0)) {
    throw new Error(`${label} is not measurably rendered.`);
  }
}

function domRect(rect: DOMRect): KpReaderLayoutRect {
  return {
    left: rect.left,
    top: rect.top,
    width: rect.width,
    height: rect.height
  };
}
