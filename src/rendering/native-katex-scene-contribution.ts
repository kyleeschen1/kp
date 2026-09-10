import type { KpEquationMaterialLayerOwnerFrame } from "./equation-material-layer-types.ts";
import type { KpEquationProtectedTransitFrame } from "./equation-motion-path-planner.ts";
import type { KpNativeKatexRenderedSceneObservation } from "./native-katex-rendered-scene.ts";


export interface KpNativeKatexMeasuredMaterialFrame extends KpEquationMaterialLayerOwnerFrame {
  readonly expectedPaintRect: NonNullable<KpEquationMaterialLayerOwnerFrame["expectedPaintRect"]>;
}

const realizationAuthority: unique symbol = Symbol("native-katex-material-realization");
const liveRealizations = new WeakSet<KpNativeKatexMaterialRealization>();
export interface KpNativeKatexMaterialRealization {
  readonly [realizationAuthority]: true;
  readonly sample: (owners: readonly KpEquationMaterialLayerOwnerFrame[], progress: number) => readonly KpNativeKatexMeasuredMaterialFrame[];
}

/** Renderer-owned optical projection, never independent occupancy authority. */
export function createKpNativeKatexMaterialRealization(sample: KpNativeKatexMaterialRealization["sample"]): KpNativeKatexMaterialRealization {
  const realization = Object.freeze({ [realizationAuthority]: true as const, sample });
  liveRealizations.add(realization);
  return realization;
}

export function assertKpNativeKatexMaterialRealization(realization: KpNativeKatexMaterialRealization): void {
  if (!liveRealizations.has(realization)) throw new Error("Material realization requires its issued sampler.");
}

export function sampleKpNativeKatexEndpointDwellProgress(progress: number, dwellFraction: number): number {
  if (!Number.isFinite(progress)) throw new Error("Native KaTeX endpoint dwell progress must be finite.");
  if (!Number.isFinite(dwellFraction) || dwellFraction < 0 || dwellFraction > 0.25)
    throw new Error("Native KaTeX endpoint dwell ratio must be between 0 and 0.25.");
  const bounded = Math.max(0, Math.min(1, progress));
  return dwellFraction === 0 || bounded === 0 || bounded === 1 ? bounded : Math.min(1, bounded / (1 - dwellFraction));
}

const contributionAuthority: unique symbol = Symbol("native-katex-scene-contribution");
export interface KpNativeKatexSceneContribution {
  readonly [contributionAuthority]: true;
  readonly id: string;
  readonly participantIds: readonly string[];
  readonly realization?: KpNativeKatexMaterialRealization | undefined;
  readonly sample: (progress: number) => {
    readonly owners: readonly KpNativeKatexMeasuredMaterialFrame[];
    readonly occupancy: readonly KpEquationProtectedTransitFrame[];
  };
}

const liveContributions = new WeakSet<KpNativeKatexSceneContribution>();
const contributionMeasurements = new WeakMap<KpNativeKatexSceneContribution, ReturnType<typeof captureKpNativeKatexMeasurement>>();

function measurementSignature(source: KpNativeKatexRenderedSceneObservation,
  target: KpNativeKatexRenderedSceneObservation): string {
  return JSON.stringify([source, target].map(scene => ({
    font: scene.fontRevision, viewport: scene.viewportKey,
    atoms: scene.atoms.map(atom => ({ id: atom.id, semantic: atom.semanticEntityId,
      group: atom.presentationGroupId, kind: atom.paintKind, metric: atom.paintMeasurement,
      visual: atom.visualKey, style: atom.styleFingerprint, font: atom.fontRevision,
      rect: atom.rect, baseline: atom.baselineY, order: atom.zOrder })),
    groups: scene.groups.map(group => ({ id: group.id, semantic: group.semanticEntityId,
      parent: group.parentGroupId, members: group.atomIds,
      rect: group.rect, style: group.styleFingerprint, baseline: group.baselineY }))
  })));
}

function measurementNodes(source: KpNativeKatexRenderedSceneObservation,
  target: KpNativeKatexRenderedSceneObservation): readonly HTMLElement[] {
  return [source, target].flatMap(scene => [...scene.atoms.map(atom => atom.sourceElement),
    ...scene.groups.flatMap(group => group.sourceElement ? [group.sourceElement] : [])]);
}

/** Capture measured authority once; cache reuse compares supplied observations,
 * never forces layout reads on the animation clock. Hosts own remeasurement. */
export function captureKpNativeKatexMeasurement(
  source: KpNativeKatexRenderedSceneObservation,
  target: KpNativeKatexRenderedSceneObservation
) {
  const stage = source.stage, sourceRoot = source.root, targetRoot = target.root;
  const paintNodes = measurementNodes(source, target);
  const signature = measurementSignature(source, target);
  return (currentSource: KpNativeKatexRenderedSceneObservation, currentTarget: KpNativeKatexRenderedSceneObservation): void => {
    const nodes = measurementNodes(currentSource, currentTarget);
    if (currentSource.stage !== stage || currentTarget.stage !== stage ||
        currentSource.root !== sourceRoot || currentTarget.root !== targetRoot ||
        nodes.length !== paintNodes.length || nodes.some((node, i) => node !== paintNodes[i]) ||
        measurementSignature(currentSource, currentTarget) !== signature)
      throw new Error("Scene requires its current measured endpoints and coordinate frame.");
  };
}

export function assertKpNativeKatexContributionMeasurement(
  contribution: KpNativeKatexSceneContribution,
  source: KpNativeKatexRenderedSceneObservation,
  target: KpNativeKatexRenderedSceneObservation
): void {
  const assertCurrent = contributionMeasurements.get(contribution);
  if (!assertCurrent) throw new Error("Contribution lacks current measured authority.");
  assertCurrent(source, target);
}

/** Narrow legacy frame producers at the measured-paint boundary, without a cast. */
export function requireKpNativeKatexMeasuredMaterialFrame(
  owner: KpEquationMaterialLayerOwnerFrame
): KpNativeKatexMeasuredMaterialFrame {
  const rect = owner.expectedPaintRect;
  if (!rect) throw new Error(`Invalid measured material paint: ${owner.ownerId}.`);
  assertKpNativeKatexMeasuredPaint(owner.ownerId, [owner.rect, rect,
    ...(owner.paintAlignmentRect ? [owner.paintAlignmentRect] : [])], owner.opacity);
  return Object.freeze({ ...owner, rect: Object.freeze({ ...owner.rect }),
    ...(owner.paintAlignmentRect ? { paintAlignmentRect: Object.freeze({ ...owner.paintAlignmentRect }) } : {}),
    expectedPaintRect: Object.freeze({ ...rect }) });
}

/** Contact is diagnostic; malformed paint must never reach inspection or DOM. */
export function assertKpNativeKatexMeasuredPaint(id: string,
  rects: readonly KpEquationMaterialLayerOwnerFrame["rect"][], opacity: number): void {
  if (!Number.isFinite(opacity) || opacity < 0 || opacity > 1 || rects.some(rect =>
    ![rect.left, rect.top, rect.width, rect.height].every(Number.isFinite) || rect.width < 0 || rect.height < 0)) {
    throw new Error(`Invalid measured material paint: ${id}.`);
  }
}

export function createKpNativeKatexSceneContribution(input: {
  readonly id: string;
  readonly source: KpNativeKatexRenderedSceneObservation;
  readonly target: KpNativeKatexRenderedSceneObservation;
  readonly participantIds: readonly string[];
} & ({
  readonly realization: KpNativeKatexMaterialRealization;
  readonly sample: (progress: number) => readonly KpEquationMaterialLayerOwnerFrame[];
} | {
  readonly realization?: never;
  readonly sample: (progress: number) => readonly KpNativeKatexMeasuredMaterialFrame[];
})): KpNativeKatexSceneContribution {
  if (!input.id.trim()) throw new Error("A material contribution requires an identity.");
  if (input.source.stage !== input.target.stage) throw new Error("Contribution endpoints require one coordinate frame.");
  const participantIds = Object.freeze([...input.participantIds]);
  const expected = new Set(participantIds);
  if (expected.size !== participantIds.length || participantIds.some(id => !id.trim()))
    throw new Error("Contribution participant identities must be unique and nonempty.");
  const { id, sample, realization } = input;
  if (realization) assertKpNativeKatexMaterialRealization(realization);
  // Only this issuer couples occupancy to actual paint; callers cannot supply
  // a second, conveniently incomplete occupancy sampler.
  const contribution = Object.freeze({
    [contributionAuthority]: true as const,
    id,
    participantIds,
    realization,
    sample(progress: number) {
      if (!Number.isFinite(progress)) throw new Error("Material progress must be finite.");
      const bounded = Math.max(0, Math.min(1, progress));
      const sampled = sample(bounded);
      const owners = Object.freeze((realization ? realization.sample(sampled, bounded) : sampled)
        .map(requireKpNativeKatexMeasuredMaterialFrame));
      const actual = new Set(owners.map(owner => owner.ownerId));
      if (owners.length !== participantIds.length || actual.size !== owners.length ||
          owners.some(owner => !expected.has(owner.ownerId)))
        throw new Error(`Contribution ${id} has missing, duplicate or unexpected participants.`);
      return Object.freeze({ owners,
        occupancy: Object.freeze(projectKpNativeKatexMaterialOccupancy(owners)) });
    }
  });
  liveContributions.add(contribution);
  contributionMeasurements.set(contribution, captureKpNativeKatexMeasurement(input.source, input.target));
  return contribution;
}

export function isKpNativeKatexSceneContribution(value: unknown): value is KpNativeKatexSceneContribution {
  return typeof value === "object" && value !== null &&
    liveContributions.has(value as KpNativeKatexSceneContribution);
}

/** Occupancy follows transformed measured ink, never a layout-box fallback. */
export function projectKpNativeKatexMaterialOccupancy(
  owners: readonly KpEquationMaterialLayerOwnerFrame[]
): readonly KpEquationProtectedTransitFrame[] {
  return owners.map(owner => {
    const rect = owner.expectedPaintRect;
    if (rect === undefined) throw new Error(`Missing measured material paint: ${owner.ownerId}.`);
    // One producer is not one rigid paint object: its internal contacts remain
    // observable. Intentional fusion never needs diagnostic suppression.
    return { trackId: owner.ownerId, componentId: owner.ownerId, rect, opacity: owner.opacity };
  });
}
