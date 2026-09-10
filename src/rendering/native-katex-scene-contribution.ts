import type { KpEquationMaterialLayerOwnerFrame } from "./equation-material-layer-types.ts";
import type { KpEquationProtectedTransitFrame } from "./equation-motion-path-planner.ts";
import type { KpNativeKatexRenderedSceneObservation } from "./native-katex-rendered-scene.ts";


export interface KpNativeKatexMeasuredMaterialFrame extends KpEquationMaterialLayerOwnerFrame {
  readonly expectedPaintRect: NonNullable<KpEquationMaterialLayerOwnerFrame["expectedPaintRect"]>;
}

const contributionAuthority: unique symbol = Symbol("native-katex-scene-contribution");
export interface KpNativeKatexSceneContribution {
  readonly [contributionAuthority]: true;
  readonly id: string;
  readonly participantIds: readonly string[];
  readonly sample: (progress: number) => {
    readonly owners: readonly KpNativeKatexMeasuredMaterialFrame[];
    readonly occupancy: readonly KpEquationProtectedTransitFrame[];
  };
}

const liveContributions = new WeakSet<KpNativeKatexSceneContribution>();
const contributionMeasurements = new WeakMap<KpNativeKatexSceneContribution, {
  readonly stage: HTMLElement;
  readonly sourceRoot: HTMLElement;
  readonly targetRoot: HTMLElement;
  readonly paintNodes: readonly HTMLElement[];
  readonly signature: string;
}>();

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

export function assertKpNativeKatexContributionMeasurement(
  contribution: KpNativeKatexSceneContribution,
  source: KpNativeKatexRenderedSceneObservation,
  target: KpNativeKatexRenderedSceneObservation
): void {
  const measured = contributionMeasurements.get(contribution);
  const nodes = measurementNodes(source, target);
  if (!measured || source.stage !== measured.stage || target.stage !== measured.stage ||
      source.root !== measured.sourceRoot || target.root !== measured.targetRoot ||
      nodes.length !== measured.paintNodes.length || nodes.some((node, i) => node !== measured.paintNodes[i]) ||
      measurementSignature(source, target) !== measured.signature) {
    throw new Error("Material contribution requires its current measured endpoints and coordinate frame.");
  }
}

/** Narrow legacy frame producers at the measured-paint boundary, without a cast. */
export function requireKpNativeKatexMeasuredMaterialFrame(
  owner: KpEquationMaterialLayerOwnerFrame
): KpNativeKatexMeasuredMaterialFrame {
  const rect = owner.expectedPaintRect;
  if (!rect || ![rect.left, rect.top, rect.width, rect.height, owner.opacity].every(Number.isFinite) ||
      rect.width < 0 || rect.height < 0 || owner.opacity < 0 || owner.opacity > 1) {
    throw new Error(`Invalid measured material paint: ${owner.ownerId}.`);
  }
  return Object.freeze({ ...owner, rect: Object.freeze({ ...owner.rect }),
    expectedPaintRect: Object.freeze({ ...rect }) });
}

export function createKpNativeKatexSceneContribution(input: {
  readonly id: string;
  readonly source: KpNativeKatexRenderedSceneObservation;
  readonly target: KpNativeKatexRenderedSceneObservation;
  readonly participantIds: readonly string[];
  readonly sample: (progress: number) => readonly KpNativeKatexMeasuredMaterialFrame[];
}): KpNativeKatexSceneContribution {
  if (!input.id.trim()) throw new Error("A material contribution requires an identity.");
  if (input.source.stage !== input.target.stage) throw new Error("Contribution endpoints require one coordinate frame.");
  const participantIds = Object.freeze([...input.participantIds]);
  const expected = new Set(participantIds);
  if (expected.size !== participantIds.length || participantIds.some(id => !id.trim()))
    throw new Error("Contribution participant identities must be unique and nonempty.");
  const { id, sample } = input;
  // Only this issuer couples occupancy to actual paint; callers cannot supply
  // a second, conveniently incomplete occupancy sampler.
  const contribution = Object.freeze({
    [contributionAuthority]: true as const,
    id,
    participantIds,
    sample(progress: number) {
      if (!Number.isFinite(progress)) throw new Error("Material progress must be finite.");
      const owners = Object.freeze(sample(Math.max(0, Math.min(1, progress)))
        .map(requireKpNativeKatexMeasuredMaterialFrame));
      const actual = new Set(owners.map(owner => owner.ownerId));
      if (owners.length !== participantIds.length || actual.size !== owners.length ||
          owners.some(owner => !expected.has(owner.ownerId)))
        throw new Error(`Contribution ${id} has missing, duplicate or unexpected participants.`);
      return Object.freeze({ owners,
        occupancy: Object.freeze(projectKpNativeKatexMaterialOccupancy(owners, id)) });
    }
  });
  liveContributions.add(contribution);
  contributionMeasurements.set(contribution, {
    stage: input.source.stage, sourceRoot: input.source.root, targetRoot: input.target.root,
    paintNodes: Object.freeze(measurementNodes(input.source, input.target)),
    signature: measurementSignature(input.source, input.target)
  });
  return contribution;
}

export function isKpNativeKatexSceneContribution(value: unknown): value is KpNativeKatexSceneContribution {
  return typeof value === "object" && value !== null &&
    liveContributions.has(value as KpNativeKatexSceneContribution);
}

/** Occupancy follows transformed measured ink, never a layout-box fallback. */
export function projectKpNativeKatexMaterialOccupancy(
  owners: readonly KpEquationMaterialLayerOwnerFrame[],
  componentId: string
): readonly KpEquationProtectedTransitFrame[] {
  return owners.map(owner => {
    const rect = owner.expectedPaintRect;
    if (rect === undefined) throw new Error(`Missing measured material paint: ${owner.ownerId}.`);
    return { trackId: owner.ownerId, componentId, rect, opacity: owner.opacity };
  });
}
