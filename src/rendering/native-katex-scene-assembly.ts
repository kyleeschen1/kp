import { inspectKpEquationProtectedTransitTracks, type KpProtectedTransitAudit } from "./equation-motion-path-planner.ts";
import { sampleKpNativeKatexSceneTrackFrames } from "./native-katex-scene-track-sampling.ts";
import type { KpNativeKatexPaintMeasuredSceneTrack } from "./native-katex-base-scene-plan.ts";
import type { KpNativeKatexRenderedSceneObservation } from "./native-katex-rendered-scene.ts";
import { assertKpNativeKatexContributionMeasurement, assertKpNativeKatexMeasuredPaint, captureKpNativeKatexMeasurement, type KpNativeKatexSceneContribution } from "./native-katex-scene-contribution.ts";
import { sampleKpNativeKatexEndpointDwellProgress } from "./native-katex-scene-contribution.ts";

const assemblyAuthority: unique symbol = Symbol("native-katex-scene-assembly");
const liveAssemblies = new WeakSet<KpNativeKatexSceneAssembly>();
const assemblyMeasurements = new WeakMap<KpNativeKatexSceneAssembly, ReturnType<typeof captureKpNativeKatexMeasurement>>();

/** Snapshot pure track/audit records; function identities remain unchanged. */
function snapshot<T>(value: T): T {
  if (value === null || typeof value !== "object") return value;
  if (Array.isArray(value)) return Object.freeze(value.map(snapshot)) as T;
  return Object.freeze(Object.fromEntries(Object.entries(value).map(([key, item]) => [key, snapshot(item)]))) as T;
}

export interface KpNativeKatexSceneAssembly {
  readonly [assemblyAuthority]: true;
  readonly tracks: readonly KpNativeKatexPaintMeasuredSceneTrack[];
  readonly contributions: readonly KpNativeKatexSceneContribution[];
  readonly copyFanOut: boolean;
  readonly sample: ReturnType<typeof assembleKpNativeKatexScene>["sample"];
  readonly audit: KpProtectedTransitAudit;
  readonly contactPolicy: "diagnostic-only";
  readonly sampleCount: number;
}

/** The routed ordinary tracks and actual contributions are inspected together. */
function assembleKpNativeKatexScene(input: {
  readonly source: KpNativeKatexRenderedSceneObservation;
  readonly target: KpNativeKatexRenderedSceneObservation;
  readonly tracks: readonly KpNativeKatexPaintMeasuredSceneTrack[];
  readonly contributions: readonly KpNativeKatexSceneContribution[];
  readonly copyFanOut?: boolean | undefined;
  readonly endpointDwellFraction?: number | undefined;
}) {
  if (input.source.stage !== input.target.stage) throw new Error("Final scene endpoints require one stage.");
  const tracks = snapshot(input.tracks);
  const copyFanOut = input.copyFanOut === true;
  const dwell = input.endpointDwellFraction ?? 0;
  const contributions = Object.freeze([...input.contributions]);
  if (new Set(contributions.map(item => item.id)).size !== contributions.length)
    throw new Error("Scene contribution identities must be unique.");
  contributions.forEach(item => assertKpNativeKatexContributionMeasurement(item, input.source, input.target));
  const ownerId = (id: string) => `native-scene-owner.${id}`;
  const participants = [...tracks.map(track => ownerId(track.id)),
    ...contributions.flatMap(item => item.participantIds)];
  if (new Set(participants).size !== participants.length)
    throw new Error("Final scene paint participants must be unique.");
  const sampleFrame = (progress: number) => {
    const frames = sampleKpNativeKatexSceneTrackFrames(tracks, sampleKpNativeKatexEndpointDwellProgress(progress, dwell), copyFanOut)
      .map(frame => {
        if (!frame.expectedPaintRect) throw new Error(`Missing final track paint: ${frame.trackId}.`);
        assertKpNativeKatexMeasuredPaint(frame.trackId, [frame.rect, frame.expectedPaintRect], frame.opacity);
        return Object.freeze({ ...frame, expectedPaintRect: frame.expectedPaintRect });
      });
    const contributionsAt = contributions.map(item => item.sample(progress));
    const owners = Object.freeze(contributionsAt.flatMap(item => item.owners));
    const occupancy = Object.freeze([
      ...frames.map(frame => ({ ...frame, trackId: ownerId(frame.trackId) })),
      ...contributionsAt.flatMap(item => item.occupancy)
    ]);
    return Object.freeze({ frames: Object.freeze(frames), owners, occupancy });
  };
  // Rendering ordinary and extension paint at one playhead must consume one
  // sample, not invoke a potentially stateful extension twice per frame.
  let previousProgress = NaN;
  let previousFrame: ReturnType<typeof sampleFrame> | undefined;
  const sample = (progress: number) => {
    if (!Number.isFinite(progress)) throw new Error("Scene progress must be finite.");
    const bounded = Math.max(0, Math.min(1, progress));
    if (previousFrame && bounded === previousProgress) return previousFrame;
    const frame = sampleFrame(bounded);
    previousProgress = bounded;
    previousFrame = frame;
    return previousFrame;
  };
  const sourceFrame = sample(0), targetFrame = sample(1);
  const targets = new Map(targetFrame.owners.map(owner => [owner.ownerId, owner]));
  const ordinary = tracks.map(track => ({ ...track, id: ownerId(track.id) }));
  const extensions = sourceFrame.owners.map(owner => ({
    id: owner.ownerId, componentId: owner.ownerId,
    lifecycle: "persist" as const, startRect: owner.expectedPaintRect,
    endRect: targets.get(owner.ownerId)!.expectedPaintRect
  }));
  const sampleCount = 100;
  const audit = inspectKpEquationProtectedTransitTracks({
    tracks: [...ordinary, ...extensions], sampleCount,
    sampleFrames: (_, progress) => sample(progress).occupancy
  });
  return { tracks, contributions, copyFanOut, sample, audit: snapshot(audit), sampleCount,
    contactPolicy: "diagnostic-only" as const };
}

export function assertKpNativeKatexSceneAssembly(input: {
  readonly sceneAssembly?: KpNativeKatexSceneAssembly | undefined;
  readonly reconciliation: { readonly source: KpNativeKatexRenderedSceneObservation; readonly target: KpNativeKatexRenderedSceneObservation };
  readonly tracks: readonly object[];
  readonly copyFanOut?: boolean | undefined;
  readonly supplementalMaterialOwners?: unknown;
}): void {
  const assembly = input.sceneAssembly;
  if (!assembly) return;
  if (!liveAssemblies.has(assembly) || input.supplementalMaterialOwners !== undefined ||
      assembly.copyFanOut !== (input.copyFanOut === true) ||
      input.tracks.length !== assembly.tracks.length ||
      input.tracks.some((track, i) => track !== assembly.tracks[i]))
    throw new Error("Rendering requires the exact issued scene assembly and sampler.");
  assembly.contributions.forEach(contribution => assertKpNativeKatexContributionMeasurement(
    contribution, input.reconciliation.source, input.reconciliation.target));
  assemblyMeasurements.get(assembly)!(input.reconciliation.source, input.reconciliation.target);
}

export function createKpNativeKatexSceneAssembly(
  input: Parameters<typeof assembleKpNativeKatexScene>[0]
): KpNativeKatexSceneAssembly {
  const assembly = Object.freeze({ [assemblyAuthority]: true as const, ...assembleKpNativeKatexScene(input) });
  liveAssemblies.add(assembly);
  assemblyMeasurements.set(assembly, captureKpNativeKatexMeasurement(input.source, input.target));
  return assembly;
}

export function requireKpNativeKatexContributionInspection(
  assembly: KpNativeKatexSceneAssembly,
  contribution: KpNativeKatexSceneContribution
): KpProtectedTransitAudit {
  if (!liveAssemblies.has(assembly) || !assembly.contributions.includes(contribution))
    throw new Error("Contribution publication requires its issued final-scene inspection.");
  return assembly.audit;
}
