export interface KpMaterialJunctionRect {
  readonly left: number;
  readonly top: number;
  readonly width: number;
  readonly height: number;
}

export interface KpMaterialJunctionAnnotation {
  readonly id: string;
  readonly semanticRole: string;
  readonly selectorIds: readonly string[];
  readonly propagationRank: number;
}

export interface KpMaterialJunctionLineage {
  readonly id: string;
  readonly sourceAnnotationIds: readonly string[];
  readonly targetAnnotationIds: readonly string[];
}

export type KpMaterialJunctionAnchorPolicy =
  | "shared-centroid"
  | "source-contraction"
  | "target-opposite-corner";

export type KpMaterialJunctionPathFamily =
  | "arc-above"
  | "arc-below"
  | "opposite-corner";

export interface KpMaterialJunctionPlan {
  readonly kind: "material-junction-plan";
  readonly id: string;
  readonly ownershipMode:
    | "continuant"
    | "replacement"
    | "persistent-source-copying"
    | "fission-fusion";
  readonly sourceBundle: KpMaterialJunctionBundle;
  readonly targetBundle: KpMaterialJunctionBundle;
  readonly lineages: readonly KpMaterialJunctionLineage[];
  readonly junction: { readonly x: number; readonly y: number };
  readonly pathFamily: KpMaterialJunctionPathFamily;
  readonly targetSeedReadiness: number;
  readonly targetRecognition: number;
  readonly nativeSettlementStart: number;
  readonly nativeSettlementEnd: number;
  readonly geometryTolerancePx: number;
}

export interface KpMaterialJunctionBundle {
  readonly id: string;
  readonly members: readonly KpMaterialJunctionMember[];
  readonly rect: KpMaterialJunctionRect;
  readonly anchor: { readonly x: number; readonly y: number };
}

export interface KpMaterialJunctionMember extends KpMaterialJunctionAnnotation {
  readonly rect: KpMaterialJunctionRect;
}

export interface KpMaterialJunctionPose {
  readonly x: number;
  readonly y: number;
  readonly scale: number;
  readonly opacity: number;
}

export interface KpMaterialJunctionFrame {
  readonly kind: "material-junction-frame";
  readonly planId: string;
  readonly progress: number;
  readonly phase: "approach" | "reconcile" | "recognize" | "native-handoff" | "settled";
  readonly allRequiredSourcesReady: boolean;
  readonly targetRecognizable: boolean;
  readonly nativeGeometryReady: boolean;
  readonly sources: readonly {
    readonly annotationId: string;
    readonly arrivalProgress: number;
    readonly pose: KpMaterialJunctionPose;
  }[];
  readonly targets: readonly {
    readonly annotationId: string;
    readonly revealProgress: number;
    readonly materialPose: KpMaterialJunctionPose;
    readonly nativeOpacity: number;
  }[];
}

export function createKpMaterialJunctionPlan(input: {
  readonly id: string;
  readonly ownershipMode: KpMaterialJunctionPlan["ownershipMode"];
  readonly sourceAnnotations: readonly KpMaterialJunctionAnnotation[];
  readonly targetAnnotations: readonly KpMaterialJunctionAnnotation[];
  readonly lineages: readonly KpMaterialJunctionLineage[];
  readonly measurements: Readonly<Record<string, KpMaterialJunctionRect>>;
  readonly anchorPolicy: KpMaterialJunctionAnchorPolicy;
  readonly pathFamily: KpMaterialJunctionPathFamily;
  readonly targetSeedReadiness?: number | undefined;
  readonly targetRecognition?: number | undefined;
  readonly geometryTolerancePx?: number | undefined;
}): KpMaterialJunctionPlan {
  const sourceBundle = bundle(
    `${input.id}.source-bundle`,
    input.sourceAnnotations,
    input.measurements
  );
  const targetBundle = bundle(
    `${input.id}.target-bundle`,
    input.targetAnnotations,
    input.measurements
  );
  validateLineage(input.lineages, sourceBundle, targetBundle);
  const targetSeedReadiness = input.targetSeedReadiness ?? 0.96;
  const targetRecognition = input.targetRecognition ?? 0.72;
  const geometryTolerancePx = input.geometryTolerancePx ?? 0.25;
  requireUnit(targetSeedReadiness, "targetSeedReadiness");
  requireUnit(targetRecognition, "targetRecognition");
  if (!Number.isFinite(geometryTolerancePx) || geometryTolerancePx <= 0) {
    throw new Error("geometryTolerancePx must be a positive finite number.");
  }
  return {
    kind: "material-junction-plan",
    id: input.id,
    ownershipMode: input.ownershipMode,
    sourceBundle,
    targetBundle,
    lineages: input.lineages.map((lineage) => ({
      ...lineage,
      sourceAnnotationIds: [...lineage.sourceAnnotationIds],
      targetAnnotationIds: [...lineage.targetAnnotationIds]
    })),
    junction: junctionAnchor(input.anchorPolicy, sourceBundle, targetBundle),
    pathFamily: input.pathFamily,
    targetSeedReadiness,
    targetRecognition,
    nativeSettlementStart: 0.88,
    nativeSettlementEnd: 0.98,
    geometryTolerancePx
  };
}

export function sampleKpMaterialJunction(input: {
  readonly plan: KpMaterialJunctionPlan;
  readonly progress: number;
  readonly targetGeometryResidualPx?: Readonly<Record<string, number>> | undefined;
}): KpMaterialJunctionFrame {
  const progress = clamp01(input.progress);
  const maximumRank = Math.max(
    0,
    ...input.plan.sourceBundle.members.map((member) => member.propagationRank)
  );
  const sources = input.plan.sourceBundle.members.map((member) => {
    const rankOffset = maximumRank === 0
      ? 0
      : member.propagationRank / maximumRank * 0.1;
    const arrivalProgress = easeInOut(interval(progress, 0.12 + rankOffset, 0.56 + rankOffset));
    return {
      annotationId: member.id,
      arrivalProgress,
      pose: travelPose({
        rect: member.rect,
        from: center(member.rect),
        to: input.plan.junction,
        progress: arrivalProgress,
        pathFamily: input.plan.pathFamily,
        scaleFrom: 1,
        scaleTo: 0.38,
        opacity: 1
      })
    };
  });
  const allRequiredSourcesReady = requiredSourceIds(input.plan).every((id) =>
    sources.find((source) => source.annotationId === id)!.arrivalProgress >=
      input.plan.targetSeedReadiness
  );
  const targetRevealBase = allRequiredSourcesReady
    ? easeOut(interval(progress, 0.56, 0.82))
    : 0;
  const targetRecognizable = targetRevealBase >= input.plan.targetRecognition;
  const residuals = input.plan.targetBundle.members.map((member) =>
    input.targetGeometryResidualPx?.[member.id] ?? Number.POSITIVE_INFINITY
  );
  const nativeGeometryReady = residuals.length > 0 && residuals.every(
    (residual) => Number.isFinite(residual) && residual <= input.plan.geometryTolerancePx
  );
  const nativeProgress = nativeGeometryReady
    ? easeOut(interval(
        progress,
        input.plan.nativeSettlementStart,
        input.plan.nativeSettlementEnd
      ))
    : 0;
  const sourceRelease = targetRecognizable
    ? easeInOut(interval(progress, 0.76, 0.92))
    : 0;
  const sourcesWithRelease = sources.map((source) => ({
    ...source,
    pose: { ...source.pose, opacity: 1 - sourceRelease }
  }));
  const targets = input.plan.targetBundle.members.map((member) => ({
    annotationId: member.id,
    revealProgress: targetRevealBase,
    materialPose: travelPose({
      rect: member.rect,
      from: input.plan.junction,
      to: center(member.rect),
      progress: targetRevealBase,
      pathFamily: input.plan.pathFamily,
      scaleFrom: 0.38,
      scaleTo: 1,
      opacity: targetRevealBase * (1 - nativeProgress)
    }),
    nativeOpacity: nativeProgress
  }));
  return {
    kind: "material-junction-frame",
    planId: input.plan.id,
    progress,
    phase: nativeProgress >= 1
      ? "settled"
      : nativeProgress > 0
        ? "native-handoff"
        : targetRecognizable
          ? "recognize"
          : allRequiredSourcesReady
            ? "reconcile"
            : "approach",
    allRequiredSourcesReady,
    targetRecognizable,
    nativeGeometryReady,
    sources: sourcesWithRelease,
    targets
  };
}

function bundle(
  id: string,
  annotations: readonly KpMaterialJunctionAnnotation[],
  measurements: Readonly<Record<string, KpMaterialJunctionRect>>
): KpMaterialJunctionBundle {
  if (annotations.length === 0) throw new Error(`${id} requires an annotation.`);
  const ids = new Set<string>();
  const members = annotations.map((annotation) => {
    if (ids.has(annotation.id)) throw new Error(`Duplicate junction annotation ${annotation.id}.`);
    ids.add(annotation.id);
    const rect = measurements[annotation.id];
    if (rect === undefined) throw new Error(`Junction annotation ${annotation.id} lacks measured geometry.`);
    validateRect(rect, annotation.id);
    return {
      ...annotation,
      selectorIds: [...annotation.selectorIds],
      rect: { ...rect }
    };
  });
  const rect = unionRect(members.map((member) => member.rect));
  return { id, members, rect, anchor: center(rect) };
}

function validateLineage(
  lineages: readonly KpMaterialJunctionLineage[],
  source: KpMaterialJunctionBundle,
  target: KpMaterialJunctionBundle
): void {
  if (lineages.length === 0) throw new Error("Material junction requires semantic lineage.");
  const sourceIds = new Set(source.members.map((member) => member.id));
  const targetIds = new Set(target.members.map((member) => member.id));
  const coveredTargets = new Set<string>();
  lineages.forEach((lineage) => {
    if (lineage.sourceAnnotationIds.length === 0 || lineage.targetAnnotationIds.length === 0) {
      throw new Error(`Material junction lineage ${lineage.id} requires source and target annotations.`);
    }
    lineage.sourceAnnotationIds.forEach((id) => {
      if (!sourceIds.has(id)) throw new Error(`Material junction lineage ${lineage.id} references missing source ${id}.`);
    });
    lineage.targetAnnotationIds.forEach((id) => {
      if (!targetIds.has(id)) throw new Error(`Material junction lineage ${lineage.id} references missing target ${id}.`);
      coveredTargets.add(id);
    });
  });
  targetIds.forEach((id) => {
    if (!coveredTargets.has(id)) throw new Error(`Material junction target ${id} lacks lineage.`);
  });
}

function requiredSourceIds(plan: KpMaterialJunctionPlan): readonly string[] {
  return [...new Set(plan.lineages.flatMap((lineage) => lineage.sourceAnnotationIds))];
}

function junctionAnchor(
  policy: KpMaterialJunctionAnchorPolicy,
  source: KpMaterialJunctionBundle,
  target: KpMaterialJunctionBundle
): { readonly x: number; readonly y: number } {
  if (policy === "shared-centroid") {
    return point(
      (source.anchor.x + target.anchor.x) / 2,
      (source.anchor.y + target.anchor.y) / 2
    );
  }
  if (policy === "source-contraction") {
    return point(
      source.anchor.x + (target.anchor.x - source.anchor.x) * 0.36,
      source.anchor.y + (target.anchor.y - source.anchor.y) * 0.36
    );
  }
  const x = source.anchor.x <= target.anchor.x
    ? target.rect.left + target.rect.width
    : target.rect.left;
  const y = source.anchor.y <= target.anchor.y
    ? target.rect.top + target.rect.height
    : target.rect.top;
  return point(x, y);
}

function travelPose(input: {
  readonly rect: KpMaterialJunctionRect;
  readonly from: { readonly x: number; readonly y: number };
  readonly to: { readonly x: number; readonly y: number };
  readonly progress: number;
  readonly pathFamily: KpMaterialJunctionPathFamily;
  readonly scaleFrom: number;
  readonly scaleTo: number;
  readonly opacity: number;
}): KpMaterialJunctionPose {
  const bend = Math.max(12, Math.abs(input.to.x - input.from.x) * 0.18);
  const control = input.pathFamily === "arc-below"
    ? point((input.from.x + input.to.x) / 2, (input.from.y + input.to.y) / 2 + bend)
    : input.pathFamily === "arc-above"
      ? point((input.from.x + input.to.x) / 2, (input.from.y + input.to.y) / 2 - bend)
      : point(
          input.to.x,
          input.from.y + (input.to.y - input.from.y) * 0.28
        );
  const position = quadratic(input.from, control, input.to, input.progress);
  const origin = center(input.rect);
  return {
    x: round(position.x - origin.x),
    y: round(position.y - origin.y),
    scale: round(input.scaleFrom + (input.scaleTo - input.scaleFrom) * input.progress),
    opacity: round(input.opacity)
  };
}

function quadratic(
  start: { readonly x: number; readonly y: number },
  control: { readonly x: number; readonly y: number },
  end: { readonly x: number; readonly y: number },
  progress: number
) {
  const inverse = 1 - progress;
  return point(
    inverse * inverse * start.x + 2 * inverse * progress * control.x + progress * progress * end.x,
    inverse * inverse * start.y + 2 * inverse * progress * control.y + progress * progress * end.y
  );
}

function unionRect(rects: readonly KpMaterialJunctionRect[]): KpMaterialJunctionRect {
  const left = Math.min(...rects.map((rect) => rect.left));
  const top = Math.min(...rects.map((rect) => rect.top));
  const right = Math.max(...rects.map((rect) => rect.left + rect.width));
  const bottom = Math.max(...rects.map((rect) => rect.top + rect.height));
  return { left, top, width: right - left, height: bottom - top };
}

function center(rect: KpMaterialJunctionRect) {
  return point(rect.left + rect.width / 2, rect.top + rect.height / 2);
}

function validateRect(rect: KpMaterialJunctionRect, id: string): void {
  if (![rect.left, rect.top, rect.width, rect.height].every(Number.isFinite)) {
    throw new Error(`Junction annotation ${id} has non-finite geometry.`);
  }
  if (rect.width <= 0 || rect.height <= 0) {
    throw new Error(`Junction annotation ${id} requires positive geometry.`);
  }
}

function requireUnit(value: number, label: string): void {
  if (!Number.isFinite(value) || value < 0 || value > 1) {
    throw new Error(`${label} must be between zero and one.`);
  }
}

function interval(value: number, start: number, end: number): number {
  return clamp01((value - start) / (end - start));
}

function easeInOut(value: number): number {
  return value * value * (3 - 2 * value);
}

function easeOut(value: number): number {
  return 1 - (1 - value) * (1 - value);
}

function clamp01(value: number): number {
  return Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 0;
}

function point(x: number, y: number) {
  return { x: round(x), y: round(y) };
}

function round(value: number): number {
  const rounded = Math.round(value * 1_000_000) / 1_000_000;
  return Object.is(rounded, -0) ? 0 : rounded;
}
