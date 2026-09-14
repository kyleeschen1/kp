import { assertEnergyDerivationPlan, type EnergyDerivationPlan } from "../semantic/momentum-energy-derivation-plan.ts";
import { createKpEquationFontReadiness } from "./equation-font-readiness.ts";
import { observeKpNativeKatexRenderedScene, createKpNativeKatexRenderedSceneObservation,
  type KpNativeKatexRenderedSceneObservation } from "./native-katex-rendered-scene.ts";
import { compileKpCanonicalNativeKatexScenePlan, createKpCanonicalNativeKatexSceneSession } from "./native-katex-scene-compositor.ts";
import { createKpNativeKatexTrackProjection } from "./native-katex-track-projection.ts";
import { sampleKpNativeKatexContributorFusionPaint } from "./native-katex-contributor-fusion-sampling.ts";
import type { KpNativeKatexPaintMeasuredSceneTrack } from "./native-katex-base-scene-plan.ts";
import { easedProgressBetweenSemanticBeat, linearEquationDemoBeatTimeline } from "./semantic-beat-compiler.ts";

/** One candidate renderer binding, not a new paint owner. Native observation,
 * material ownership, optical ink-knot sampling and endpoint handoff are shared.
 * Only the bounded proof selects which fragments persist or are rewritten. */
export async function mountMomentumEnergyDerivationSession(stage: HTMLElement, compiled: EnergyDerivationPlan, index: number) {
  assertEnergyDerivationPlan(compiled);
  const move = compiled.moves[index];
  if (!move) throw new Error("Unsupported energy derivation step");
  const sourceRoot = stage.querySelector<HTMLElement>("[data-derivation-source]")!;
  const targetRoot = stage.querySelector<HTMLElement>("[data-derivation-target]")!;
  const font = createKpEquationFontReadiness(stage.ownerDocument);
  await font.whenReady();
  const observe = (endpoint: "source" | "target", root: HTMLElement) => compactGroups(observeKpNativeKatexRenderedScene({
    endpoint, stage, root, semanticEntityId: "energy", presentationGroupId: "group.energy", fontReadiness: font
  }));
  const source = observe("source", sourceRoot), target = observe("target", targetRoot);
  const sid = (role: string) => `energy.${move.id}.0.${role}`;
  const tid = (role: string) => `energy.${move.id}.1.${role}`;
  const relations = move.persist.map(role => ({ id: `persist.${role}`, relation: "persist" as const,
    sourceEntityIds: [sid(role)], targetEntityIds: [tid(role)] }));
  const split = move.split ? [{ id: "square-homogeneity", relation: "split" as const,
    sourceEntityIds: [sid("power")], targetEntityIds: [tid("power-top"), tid("power-bottom")] }] : [];
  const projection = move.exits.length === 0 ? undefined : createKpNativeKatexTrackProjection({
    id: `projection.physics.energy.${move.id}`,
    project({ tracks }) {
      const before = source.atoms.filter(a => move.exits.some(role => a.semanticEntityId === sid(role)));
      const after = target.atoms.filter(a => move.entries.some(role => a.semanticEntityId === tid(role)));
      if (!before.length || !after.length) throw new Error("Missing checked substitution/cancellation paint cohort");
      const input = (atoms: typeof before) => atoms.map(a => ({ rect: a.rect,
        pivot: { x: a.rect.left + a.rect.width / 2, y: a.rect.top + a.rect.height / 2 }, role: "successor-source:material-input" }));
      const beforeInput = input(before), afterInput = input(after);
      const sample = (p: number) => sampleKpNativeKatexContributorFusionPaint({ source: beforeInput, target: afterInput, progress: p });
      return tracks.map((track): KpNativeKatexPaintMeasuredSceneTrack => {
        const sourceIndex = before.findIndex(a => a.id === track.sourceAtomId);
        const targetIndex = after.findIndex(a => a.id === track.targetAtomId);
        const exiting = sourceIndex >= 0 && track.lifecycle === "eliminate";
        const entering = targetIndex >= 0 && track.lifecycle === "introduce";
        if (!exiting && !entering) return Object.freeze({ ...track,
          sampleProgress: (p: number) => easedProgressBetweenSemanticBeat(linearEquationDemoBeatTimeline, p, "layout-shift")
        });
        const pose = (p: number) => exiting ? sample(p).source[sourceIndex]! : sample(p).target[targetIndex]!;
        const native = exiting ? track.startRect : track.endRect;
        const paint = exiting ? track.startPaintRect : track.endPaintRect;
        // The shared ink-knot sampler owns compression and recognition. The
        // geometry mapping only projects its measured pivot into compositor
        // tracks; it never mutates DOM or creates an external material layer.
        const start = pose(0), end = pose(1);
        return Object.freeze({ ...track,
          // These exact proof-selected contributors intentionally converge to
          // one ink knot. Declare their contact, as the shared evaluation motif
          // does, without exempting any persistent context from collision checks.
          intentionalContactGroupId: `contact.physics.energy.${move.id}.ink-knot`,
          startRect: { ...native, left: native.left + start.translateX, top: native.top + start.translateY },
          endRect: { ...native, left: native.left + end.translateX, top: native.top + end.translateY },
          ...(paint ? { startPaintRect: { ...paint, left: paint.left + start.translateX, top: paint.top + start.translateY },
            endPaintRect: { ...paint, left: paint.left + end.translateX, top: paint.top + end.translateY } } : {}),
          motionPath: undefined, motionPathSampling: undefined,
          sampleProgress: (p: number) => {
            const current = pose(p);
            const dx = end.translateX - start.translateX, dy = end.translateY - start.translateY;
            return Math.abs(dx) > Math.abs(dy) ? (dx ? (current.translateX - start.translateX) / dx : 0)
              : (dy ? (current.translateY - start.translateY) / dy : 0);
          },
          sampleMaterialScale: (p: number) => pose(p).scale,
          samplePaintPresence: (p: number) => p === 0 ? (exiting ? 1 : 0) : p === 1 ? (entering ? 1 : 0) : Number(pose(p).present),
          opacityScheduleAuthority: "semantic-choreography", timingGroupId: `cohort.${move.id}`
        });
      });
    }
  });
  const plan = compileKpCanonicalNativeKatexScenePlan({ source, target, relations: [...relations, ...split],
    ...(projection ? { trackProjection: projection } : {}), copyFanOutRouting: move.split });
  if (plan.disposition.mode !== "motion") throw new Error(`Energy derivation requires repair: ${plan.disposition.reason}`);
  const canonical = createKpCanonicalNativeKatexSceneSession(plan);
  stage.dataset["derivationRenderer"] = canonical.kind;
  return { apply: canonical.session.apply, sample: canonical.session.sample,
    dispose() { canonical.session.retire({ kind: "native-katex-paint-preserving-retirement", reason: "scene-replaced", structuralSuccession: "retire-preserving-paint" }); font.dispose(); } };
}

/** Compound semantic fragments travel as chunks. Only groups containing no
 * differently owned descendants can become a subtree atom; fraction rules
 * surrounding independently tracked numerator/denominator keep native atoms. */
function compactGroups(scene: KpNativeKatexRenderedSceneObservation) {
  const consumed = new Set<string>();
  const atoms = scene.groups.flatMap(group => {
    const members = scene.atoms.filter(a => group.atomIds.includes(a.id));
    if (!group.sourceElement || !members.length || members.some(a => a.semanticEntityId !== group.semanticEntityId)) return [];
    members.forEach(a => consumed.add(a.id));
    return [{ ...members[0]!, id: `${scene.endpoint}.${group.id}`, paintKind: "glyph" as const,
      paintMeasurement: "subtree" as const, sourceElement: group.sourceElement,
      rect: group.rect, baselineY: group.baselineY, visualKey: group.sourceElement.textContent ?? "", presentationGroupId: group.id }];
  });
  const all = [...scene.atoms.filter(a => !consumed.has(a.id)), ...atoms];
  return createKpNativeKatexRenderedSceneObservation({ ...scene, atoms: all,
    groups: scene.groups.map(group => ({ ...group, atomIds: all.filter(a => group.sourceElement?.contains(a.sourceElement)).map(a => a.id) })) });
}
