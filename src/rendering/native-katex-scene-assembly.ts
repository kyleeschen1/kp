import { inspectKpEquationProtectedTransitTracks, type KpProtectedTransitAudit } from "./equation-motion-path-planner.ts";
import { sampleKpNativeKatexSceneTrackFrames } from "./native-katex-scene-track-sampling.ts";
import type { KpNativeKatexPaintMeasuredSceneTrack } from "./native-katex-base-scene-plan.ts";
import type { KpNativeKatexRenderedSceneObservation } from "./native-katex-rendered-scene.ts";
import { assertKpNativeKatexContributionMeasurement, type KpNativeKatexSceneContribution } from "./native-katex-scene-contribution.ts";

const assemblyAuthority: unique symbol = Symbol("native-katex-scene-assembly");
const liveAssemblies = new WeakSet<KpNativeKatexSceneAssembly>();

export interface KpNativeKatexSceneAssembly {
  readonly [assemblyAuthority]: true;
  readonly tracks: readonly KpNativeKatexPaintMeasuredSceneTrack[];
  readonly contributions: readonly KpNativeKatexSceneContribution[];
  readonly sample: ReturnType<typeof assembleKpNativeKatexScene>["sample"];
  readonly audit: KpProtectedTransitAudit;
  readonly sampleCount: number;
}

/** The routed ordinary tracks and actual contributions are inspected together. */
function assembleKpNativeKatexScene(input: {
  readonly source: KpNativeKatexRenderedSceneObservation;
  readonly target: KpNativeKatexRenderedSceneObservation;
  readonly tracks: readonly KpNativeKatexPaintMeasuredSceneTrack[];
  readonly contributions: readonly KpNativeKatexSceneContribution[];
  readonly copyFanOut?: boolean | undefined;
}) {
  if (input.source.stage !== input.target.stage) throw new Error("Final scene endpoints require one stage.");
  const tracks = Object.freeze([...input.tracks]);
  const contributions = Object.freeze([...input.contributions]);
  if (new Set(contributions.map(item => item.id)).size !== contributions.length)
    throw new Error("Scene contribution identities must be unique.");
  contributions.forEach(item => assertKpNativeKatexContributionMeasurement(item, input.source, input.target));
  const ownerId = (id: string) => `native-scene-owner.${id}`;
  const participants = [...tracks.map(track => ownerId(track.id)),
    ...contributions.flatMap(item => item.participantIds)];
  if (new Set(participants).size !== participants.length)
    throw new Error("Final scene paint participants must be unique.");
  const sample = (progress: number) => {
    const frames = sampleKpNativeKatexSceneTrackFrames(tracks, progress, input.copyFanOut === true)
      .map(frame => {
        if (!frame.expectedPaintRect) throw new Error(`Missing final track paint: ${frame.trackId}.`);
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
  const sourceFrame = sample(0), targetFrame = sample(1);
  const targets = new Map(targetFrame.owners.map(owner => [owner.ownerId, owner]));
  const ordinary = tracks.map(track => ({ ...track, id: ownerId(track.id) }));
  const extensions = sourceFrame.owners.map(owner => ({
    id: owner.ownerId, componentId: contributions.find(item => item.participantIds.includes(owner.ownerId))!.id,
    lifecycle: "persist" as const, startRect: owner.expectedPaintRect,
    endRect: targets.get(owner.ownerId)!.expectedPaintRect
  }));
  const sampleCount = 100;
  const audit = inspectKpEquationProtectedTransitTracks({
    tracks: [...ordinary, ...extensions], sampleCount,
    sampleFrames: (_, progress) => sample(progress).occupancy
  });
  return { tracks, contributions, sample, audit, sampleCount };
}

export function createKpNativeKatexSceneAssembly(
  input: Parameters<typeof assembleKpNativeKatexScene>[0]
): KpNativeKatexSceneAssembly {
  const assembly = Object.freeze({ [assemblyAuthority]: true as const, ...assembleKpNativeKatexScene(input) });
  liveAssemblies.add(assembly);
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
