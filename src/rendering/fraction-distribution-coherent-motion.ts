import type { KpVerifiedDistributionPresentationPlan } from "../animation/operation-presentation-plan-types.ts";
import { sampleKpCanonicalNativeKatexCopyFanOutMotion } from "../animation/copy-fan-out-motion-profile.ts";
import { createKpNativeKatexTrackProjection } from "./native-katex-track-projection.ts";
import { sampleKpNativeKatexCopyFanOutTrack } from "./native-katex-copy-fan-out-motion.ts";
import { planKpEquationMotionPathBetweenPoints } from "./equation-motion-path-planner.ts";

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
    const groups = new Map<string, { id: string; clearance: number; variant: "arc-above" | "arc-below" }>();
    targets.forEach(target => {
      const members = input.tracks.filter(track => track.lifecycle === "split" &&
        source.semanticEntityIds.includes(sourceAtoms.get(track.sourceAtomId ?? "")?.semanticEntityId ?? "") &&
        target.semanticEntityIds.includes(targetAtoms.get(track.targetAtomId ?? "")?.semanticEntityId ?? ""));
      if (members.length === 0 || target.semanticEntityIds.some(id => !members.some(track => targetAtoms.get(track.targetAtomId!)?.semanticEntityId === id))) {
        throw new Error("kp.fraction-distribution.coherent-motion.incomplete-native-bundle");
      }
      const bounds = (["start", "end"] as const).map(side => {
        const rects = members.map(track => side === "start"
          ? track.startPaintRect ?? track.startRect : track.endPaintRect ?? track.endRect);
        const top = Math.min(...rects.map(rect => rect.top));
        const bottom = Math.max(...rects.map(rect => rect.top + rect.height));
        return { top, bottom, height: bottom - top };
      });
      const height = Math.max(...bounds.map(rect => rect.height));
      // A lower equation row identifies the existing inter-row corridor;
      // routing above that compact first row would clip the whole fraction.
      const hasLowerRow = input.tracks.some(track => track.startRect.top > bounds[0]!.bottom + height / 2);
      const variant = hasLowerRow ? "arc-below" : "arc-above";
      members.forEach(track => groups.set(track.id, { id: target.id, clearance: 1.6 * height, variant }));
    });
    return input.tracks.map(track => {
      const unit = groups.get(track.id);
      if (!unit) return Object.freeze({ ...track,
        sampleProgress: (progress: number) => sampleKpNativeKatexCopyFanOutTrack({ track, tracks: input.tracks, progress })[1],
        sampleOpacityProgress: (progress: number) => sampleKpNativeKatexCopyFanOutTrack({ track, tracks: input.tracks, progress })[2] ?? progress });
      const start = track.startPaintRect ?? track.startRect;
      const end = track.endPaintRect ?? track.endRect;
      const path = planKpEquationMotionPathBetweenPoints({
        id: `${unit.id}.${track.id}.direct-arc`,
        start: { x: start.left + start.width / 2, y: start.top + start.height / 2 },
        end: { x: end.left + end.width / 2, y: end.top + end.height / 2 },
        variants: [unit.variant], clearance: unit.clearance
      }).selected;
      return Object.freeze({ ...track,
        semanticMotionUnitId: unit.id, routingMemberId: unit.id, routingCohortId: branch.id,
        timingGroupId: unit.id,
        // One bundle-sized arc clears contextual paint without independently
        // routing its numerator, bar and denominator. The factor is provisional
        // visual policy; the existing compositor still certifies actual paint.
        // Clear the intervening expression before descending into the target.
        motionPath: { ...path, control: { ...path.control, x: path.start.x + (path.end.x - path.start.x) * 0.75 } },
        motionPathSampling: "planned-curve" as const,
        // All paint in each bundle enters its measured route together, retaining
        // internal shape. Both copies depart at once; separation comes
        // from diverging destinations, not a delayed follower or launch bump.
        sampleProgress: (progress: number) =>
          sampleKpCanonicalNativeKatexCopyFanOutMotion(progress).leaderProgress
      });
    });
  } });
}
