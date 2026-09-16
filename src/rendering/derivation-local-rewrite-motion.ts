import { DerivationLocalRewriteGap, type DerivationLocalRewrite } from "../semantic/derivation-local-rewrite.ts";
import type { KpNativeKatexPaintMeasuredSceneTrack } from "./native-katex-base-scene-plan.ts";
import type { KpNativeKatexRenderedSceneObservation } from "./native-katex-rendered-scene.ts";
import { projectKpNativeKatexInkWithdrawal } from "./native-katex-carrier-preserving-simplification-motion.ts";
import { sampleKpNativeKatexCarrierPreservingSimplificationOptics as optics } from "./native-katex-carrier-preserving-simplification-profile.ts";
import { planKpEquationMotionPathBetweenPoints } from "./equation-motion-path-planner.ts";

type Track = KpNativeKatexPaintMeasuredSceneTrack;
type Input = { readonly rewrite: DerivationLocalRewrite; readonly tracks: readonly Track[];
  readonly source: KpNativeKatexRenderedSceneObservation; readonly target: KpNativeKatexRenderedSceneObservation;
  readonly sourceId: (role: string) => string; readonly targetId: (role: string) => string; readonly id: string };

/** The native compositor remains the only paint owner. This candidate chooses
 * existing optical phases from checked roles; unknown roles never reach fusion. */
export function projectDerivationLocalRewrite(input: Input): readonly Track[] {
  const { rewrite, source, target, sourceId, targetId, id } = input;
  const before = new Map(source.atoms.map(atom => [atom.id, atom.semanticEntityId]));
  const after = new Map(target.atoms.map(atom => [atom.id, atom.semanticEntityId]));
  const sourceRole = (track: Track, role: string) => before.get(track.sourceAtomId ?? "") === sourceId(role);
  const targetRole = (track: Track, role: string) => after.get(track.targetAtomId ?? "") === targetId(role);
  const fail = (reason: string): never => { throw new DerivationLocalRewriteGap(`${id}: ${reason}`); };
  const requireSource = (role: string) => {
    if (!input.tracks.some(track => sourceRole(track, role))) fail(`Missing source paint for ${role}`);
  };
  const persist = (track: Track): Track => {
    if (track.lifecycle !== "persist") return fail(`Unclassified ${track.lifecycle} paint`);
    return direct(track, id);
  };
  const strategies = {
    "equal-term-collection": (): readonly Track[] => {
      if (rewrite.kind !== "equal-term-collection") return fail("Wrong collection binding");
      [rewrite.anchor, rewrite.duplicate, ...rewrite.removedSyntax].forEach(requireSource);
      for (const role of [rewrite.anchor, rewrite.duplicate]) {
        if (!input.tracks.some(track => sourceRole(track, role) && targetRole(track, rewrite.anchor) && track.lifecycle === "merge"))
          fail(`Common term ${role} lacks its checked merge correspondence`);
      }
      if (!input.tracks.some(track => targetRole(track, rewrite.coefficient) && track.lifecycle === "introduce"))
        fail("Missing collection coefficient");
      return input.tracks.map(track => {
        if (track.lifecycle === "merge" && targetRole(track, rewrite.anchor)) {
          const duplicate = sourceRole(track, rewrite.duplicate);
          // Exact convergence of these two equal-term representatives is
          // intentional. No other context participates in that contact group.
          return Object.freeze({ ...direct(track, id), intentionalContactGroupId: `${id}.equal-terms`,
            sampleOpacityProgress: () => 0, sampleMaterialScale: () => 1,
            samplePaintPresence: (p: number) => duplicate ? Number(optics(p).carrier.transitProgress < 1) : 1,
            opacityScheduleAuthority: "semantic-choreography" as const });
        }
        if (track.lifecycle === "eliminate" && rewrite.removedSyntax.some(role => sourceRole(track, role)))
          return projectKpNativeKatexInkWithdrawal(track, `${id}.obsolete-syntax`);
        if (track.lifecycle === "introduce" && targetRole(track, rewrite.coefficient)) {
          // The count resolves after the equal expressions have consolidated.
          // Reuse the profile's settlement phase, not a lesson-local delay.
          const growth = (p: number) => optics(p).carrier.nativeSettlementProgress;
          return Object.freeze({ ...track, startRect: track.endRect, startPaintRect: track.endPaintRect,
            sampleProgress: () => 1, sampleMaterialScale: (p: number) => Math.max(Number.EPSILON, growth(p)),
            samplePaintPresence: (p: number) => Number(growth(p) > 0), opacityScheduleAuthority: "semantic-choreography" as const });
        }
        return persist(track);
      });
    },
    "matched-factor-cancellation": (): readonly Track[] => {
      if (rewrite.kind !== "matched-factor-cancellation") return fail("Wrong cancellation binding");
      rewrite.pair.forEach(requireSource);
      rewrite.survivors.forEach(role => {
        if (!input.tracks.some(track => sourceRole(track, role) && targetRole(track, role) && track.lifecycle === "persist"))
          fail(`Cancellation replaced survivor ${role}`);
      });
      return input.tracks.map(track => track.lifecycle === "eliminate" && rewrite.pair.some(role => sourceRole(track, role))
        ? projectKpNativeKatexInkWithdrawal(track, `${id}.matched-pair`) : persist(track));
    },
    "scalar-reassociation": (): readonly Track[] => {
      if (rewrite.kind !== "scalar-reassociation") return fail("Wrong reassociation binding");
      requireSource(rewrite.unit);
      [rewrite.carrier, ...rewrite.survivors].forEach(role => {
        if (!input.tracks.some(track => sourceRole(track, role) && targetRole(track, role) && track.lifecycle === "persist"))
          fail(`Reassociation replaced survivor ${role}`);
      });
      return input.tracks.map(track => {
        if (track.lifecycle === "eliminate" && sourceRole(track, rewrite.unit))
          return projectKpNativeKatexInkWithdrawal(track, `${id}.unit`);
        const projected = persist(track);
        // Entering the numerator may cross its bar. Only that carrier/bar
        // contact is licensed; the denominator and other factors stay protected.
        return sourceRole(track, rewrite.carrier) || sourceRole(track, rewrite.fractionRule)
          ? Object.freeze({ ...projected, intentionalContactGroupId: `${id}.numerator-entry` }) : projected;
      });
    }
  } satisfies Record<DerivationLocalRewrite["kind"], () => readonly Track[]>;
  const project = strategies[rewrite.kind];
  if (!project) return fail("No registered local rewrite projection");
  return Object.freeze(project());
}

function direct(track: Track, id: string): Track {
  const center = (r: Track["startRect"]) => ({ x: r.left + r.width / 2, y: r.top + r.height / 2 });
  const path = planKpEquationMotionPathBetweenPoints({ id: `${id}.${track.id}`, variants: ["direct"],
    start: center(track.startPaintRect ?? track.startRect), end: center(track.endPaintRect ?? track.endRect) });
  return Object.freeze({ ...track, motionPath: path.selected,
    sampleProgress: (p: number) => optics(p).carrier.transitProgress });
}
