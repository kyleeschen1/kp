import type { KpVerifiedDistributionPresentationPlan } from "../animation/operation-presentation-plan-types.ts";
import { sampleKpCanonicalNativeKatexCopyFanOutMotion } from "../animation/copy-fan-out-motion-profile.ts";
import { createKpNativeKatexTrackProjection } from "./native-katex-track-projection.ts";
import { sampleKpNativeKatexCopyFanOutTrack } from "./native-katex-copy-fan-out-motion.ts";

/** Review treatment: shorten ambiguous near-overlap, not the attention phrase.
 * The bump has zero value and slope at both ends, retaining the slow start and
 * rejoining the existing motion before follower departure and settlement. */
function sampleKpFractionSeparationProgress(progress: number): number {
  const end = 0.42;
  if (progress <= 0 || progress >= end) return progress;
  const t = progress / end;
  return progress + 0.045 * 16 * t * t * (1 - t) * (1 - t);
}

/** Review-only lowering of verified factor bundles. Primitive identities stay
 * intact; one timing/routing unit transports each unchanged factor. */
export function createKpFractionDistributionCoherentMotion(plans: readonly KpVerifiedDistributionPresentationPlan[]) {
  const plan = plans.find(plan => plan.id === "operation-presentation.fraction-solve.step.distribute.fraction-factor");
  if (!plan) throw new Error("kp.fraction-distribution.coherent-motion.authority-gap");
  const branch = plan.roles.groups.find(group => group.id === plan.branchGroupId)!;
  const bundles = plan.roles.bundles.filter(bundle => branch.bundleIds.includes(bundle.id));
  const source = bundles.find(bundle => bundle.role === "source-material")!;
  const targets = bundles.filter(bundle => bundle.role === "target-material");
  return createKpNativeKatexTrackProjection({ id: `${plan.id}.coherent-factor-v1`, project(input) {
    const sourceAtoms = new Map(input.source.atoms.map(atom => [atom.id, atom]));
    const targetAtoms = new Map(input.target.atoms.map(atom => [atom.id, atom]));
    const groups = new Map<string, { id: string; ordinal: number }>();
    targets.forEach((target, ordinal) => {
      const members = input.tracks.filter(track => track.lifecycle === "split" &&
        source.semanticEntityIds.includes(sourceAtoms.get(track.sourceAtomId ?? "")?.semanticEntityId ?? "") &&
        target.semanticEntityIds.includes(targetAtoms.get(track.targetAtomId ?? "")?.semanticEntityId ?? ""));
      if (members.length === 0 || target.semanticEntityIds.some(id => !members.some(track => targetAtoms.get(track.targetAtomId!)?.semanticEntityId === id))) {
        throw new Error("kp.fraction-distribution.coherent-motion.incomplete-native-bundle");
      }
      members.forEach(track => groups.set(track.id, { id: target.id, ordinal }));
    });
    return input.tracks.map(track => {
      const unit = groups.get(track.id);
      if (!unit) return Object.freeze({ ...track,
        sampleProgress: (progress: number) => sampleKpNativeKatexCopyFanOutTrack({ track, tracks: input.tracks, progress })[1],
        sampleOpacityProgress: (progress: number) => sampleKpNativeKatexCopyFanOutTrack({ track, tracks: input.tracks, progress })[2] ?? progress });
      return Object.freeze({ ...track,
        semanticMotionUnitId: unit.id, routingMemberId: unit.id, routingCohortId: branch.id,
        timingGroupId: unit.id,
        // All paint in a branch shares progress. Direct native-to-native
        // interpolation preserves the internal fraction instead of collapsing
        // each follower onto a separate primitive leader's centre.
        sampleProgress: (progress: number) => {
          const motion = sampleKpCanonicalNativeKatexCopyFanOutMotion(progress);
          return unit.ordinal === 0 ? sampleKpFractionSeparationProgress(motion.leaderProgress) : motion.followerProgress;
        }
      });
    });
  } });
}
