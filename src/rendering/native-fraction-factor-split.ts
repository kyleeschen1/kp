import { compileKpFractionChoreography, sampleKpFractionChoreography } from "../animation/fraction-choreography.ts";
import type { SelectorCorrespondenceRecord } from "../semantic/correspondence.ts";
import { createKpNativeKatexTrackProjection } from "./native-katex-track-projection.ts";
import { planKpEquationMotionPathBetweenPoints } from "./equation-motion-path-planner.ts";
import { unionKpStageRelativeRects } from "./native-katex-rendered-scene.ts";
import { createKpSemanticLineageGraph } from "../semantic/semantic-lineage-graph.ts";
import { compileKpFissionFusionPlan, sampleKpFissionFusion } from "../animation/fission-fusion.ts";

/** Numeric decomposition changes glyphs, unlike identity copying. Keep the
 * fission motif's exclusive source/descendant handoff through reconciliation. */
export function createKpNativeFractionFactorSplit(relations: readonly (Pick<SelectorCorrespondenceRecord, "relation" | "sourceSelectorIds" | "targetSelectorIds"> & { readonly recordId: string })[], direction: "forward" | "rewind") {
  const forward = direction === "forward";
  const branches = relations.filter(r => r.relation === "fan-out").map(r => ({
    id: r.recordId, source: forward ? r.sourceSelectorIds : r.targetSelectorIds,
    target: forward ? r.targetSelectorIds : r.sourceSelectorIds
  }));
  if (branches.length === 0 || branches.some(b => b.source.length !== 1 || b.target.length < 2))
    throw new Error("Fraction factor split requires explicit one-to-many correspondence.");
  const fissions = new Map(branches.map(b => [b.id, compileKpFissionFusionPlan({ id: `fraction.${b.id}`, mode: "fission",
    lineageGraph: createKpSemanticLineageGraph({ id: `fraction.${b.id}.lineage`, sourceEntityIds: b.source, targetEntityIds: b.target,
      edges: [{ id: b.id, relation: "split", sourceEntityIds: b.source, targetEntityIds: b.target, summary: "Expose the checked factors." }] }) })]));
  const plan = compileKpFractionChoreography({ id: "native.fraction-factor-split", operationKind: "split-factors",
    focusRecordIds: branches.map(b => b.id), structuralRecordIds: branches.map(b => b.id),
    continuantRecordIds: relations.filter(r => r.relation === "identity").map(r => r.recordId),
    artifactRecordIds: relations.filter(r => r.relation === "introduction").map(r => r.recordId),
    maximumBranchCount: Math.max(...branches.map(b => b.target.length)) });
  return createKpNativeKatexTrackProjection({ id: plan.id, project(input) {
    const source = forward ? input.source : input.target, target = forward ? input.target : input.source;
    const sources = new Map(source.atoms.map(a => [a.id, a]));
    const targets = new Map(target.atoms.map(a => [a.id, a]));
    for (const branch of branches) {
      if (branch.source.some(id => !source.atoms.some(a => a.semanticEntityId === id)) ||
          branch.target.some(id => !target.atoms.some(a => a.semanticEntityId === id)))
        throw new Error("Fraction factor split is missing native source or descendant paint.");
    }
    const frame = (p: number) => sampleKpFractionChoreography({ plan, progress: forward ? p : 1 - p });
    const fission = (id: string, p: number) => sampleKpFissionFusion({ plan: fissions.get(id)!, progress: forward ? p : 1 - p });
    const sample = (value: number) => forward ? value : 1 - value;
    return input.tracks.map(track => {
      const sourceAtom = sources.get((forward ? track.sourceAtomId : track.targetAtomId) ?? "");
      const targetAtom = targets.get((forward ? track.targetAtomId : track.sourceAtomId) ?? "");
      const branch = branches.find(b => targetAtom && b.target.includes(targetAtom.semanticEntityId));
      if (branch && targetAtom) {
        const origin = unionKpStageRelativeRects(source.atoms.filter(a => branch.source.includes(a.semanticEntityId)).map(a => a.rect));
        const endRect = forward ? track.endRect : track.startRect;
        const endPaint = forward ? track.endPaintRect : track.startPaintRect;
        const center = (r: typeof origin) => ({ x: r.left + r.width / 2, y: r.top + r.height / 2 });
        const from = center(origin), to = center(endPaint);
        const offset = { x: from.x - to.x, y: from.y - to.y };
        const shift = (r: typeof origin) => ({ ...r, left: r.left + offset.x, top: r.top + offset.y });
        const index = branch.target.indexOf(targetAtom.semanticEntityId);
        // Keep numerator/denominator branches in their native lanes. Generic
        // vertical arcs cross the fraction bar; branching contact is intentional.
        const path = planKpEquationMotionPathBetweenPoints({ id: `${plan.id}.${track.id}`, start: from, end: to, variants: ["direct"] }).selected;
        return Object.freeze({ ...track,
          ...(forward ? { startRect: shift(endRect), startPaintRect: shift(endPaint) }
            : { endRect: shift(endRect), endPaintRect: shift(endPaint) }),
          motionPath: forward ? path : { ...path, start: path.end, end: path.start },
          motionPathSampling: "planned-curve" as const,
          intentionalContactGroupId: `${plan.id}.${branch.id}`,
          sampleProgress: (p: number) => sample(fission(branch.id, p).targets[index]!.pathProgress),
          sampleOpacityProgress: (p: number) => sample(fission(branch.id, p).targets[index]!.opacity),
          opacityScheduleAuthority: "semantic-choreography" as const,
          sampleMaterialScale: (p: number) => {
            const pose = fission(branch.id, p);
            return track.lifecycle === "persist" && !pose.ownership.transferOccurred
              ? pose.sources[0]!.scale : pose.targets[index]!.scale;
          }
        });
      }
      const sourceBranch = sourceAtom && branches.find(b => b.source.includes(sourceAtom.semanticEntityId));
      if (sourceBranch) {
        const rect = forward ? track.startRect : track.endRect, paint = forward ? track.startPaintRect : track.endPaintRect;
        return Object.freeze({ ...track, startRect: rect, endRect: rect, startPaintRect: paint, endPaintRect: paint,
          motionPath: undefined,
          intentionalContactGroupId: `${plan.id}.${sourceBranch.id}`,
          sampleOpacityProgress: (p: number) => sample(1 - fission(sourceBranch.id, p).sources[0]!.opacity),
          opacityScheduleAuthority: "semantic-choreography" as const,
          sampleMaterialScale: (p: number) => fission(sourceBranch.id, p).sources[0]!.scale });
      }
      return Object.freeze({ ...track,
        sampleProgress: (p: number) => sample(frame(p).reflowProgress),
        sampleOpacityProgress: (p: number) => sample(frame(p).artifactProgress),
        opacityScheduleAuthority: "semantic-choreography" as const });
    });
  } });
}
