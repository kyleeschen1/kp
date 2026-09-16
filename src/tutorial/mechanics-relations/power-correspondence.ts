import { compileKpCrossViewAttentionPlan } from "../cross-view-attention.ts";
import { validateKpCrossViewCorrespondenceMap, type KpCrossViewCorrespondenceMap } from "../cross-view-correspondence.ts";

export const powerTerms = [
  { id: "speed", title: "Speed and direction", latex: String.raw`\lVert\mathbf v\rVert` },
  { id: "force", title: "Force along motion", latex: String.raw`F_{\parallel}` },
  { id: "energy", title: "Energy change", latex: String.raw`\frac{dK}{dt}` }
] as const;
export type PowerTerm = typeof powerTerms[number]["id"];
export function isPowerTerm(value: string): value is PowerTerm {
  return powerTerms.some(term => term.id === value);
}
const views = ["symbol", "meaning", "straight", "turning"] as const;
export const powerCorrespondenceMap: KpCrossViewCorrespondenceMap = {
  id: "physics.power.correspondence",
  members: powerTerms.flatMap(term => views.map(view => ({ id: `${term.id}.${view}`,
    viewId: view, selectorId: `physics.power.${term.id}.${view}`, role: term.title }))),
  // Geometry is evidence for the component/rate, not the same quantity as an
  // arrow's length or an energy bar. Do not assert a false identity across views.
  identities: [],
  correspondences: powerTerms.flatMap(term => views.filter(view => view !== "symbol").map(view => ({
    id: `${term.id}.${view}`, sourceMemberId: `${term.id}.symbol`, targetMemberId: `${term.id}.${view}`,
    kind: "evidence-to-claim", reversible: true, summary: `Connect ${term.title.toLowerCase()} to its ${view} reading.`
  })))
};
const diagnostics = validateKpCrossViewCorrespondenceMap(powerCorrespondenceMap);
if (diagnostics.length) throw new Error(diagnostics[0]!.message);

/** Resolve all views together from a semantic selection. No clock, geometry or
 * renderer state participates in deciding what the learner is inspecting. */
export function projectPowerCorrespondence(term: PowerTerm | null) {
  if (term !== null && !isPowerTerm(term)) throw new Error("Unknown power correspondence term");
  const plan = compileKpCrossViewAttentionPlan({ id: "physics.power.inspect", map: powerCorrespondenceMap,
    correspondenceIds: term === null ? [] : powerCorrespondenceMap.correspondences.filter(c => c.sourceMemberId === `${term}.symbol`).map(c => c.id) });
  const focused = new Set(plan.salience.intents.flatMap(intent => intent.kind === "transmit"
    ? [...intent.sourceEntityIds, ...intent.targetEntityIds] : []));
  return powerCorrespondenceMap.members.map(member => ({ id: member.selectorId,
    salience: focused.has(member.selectorId) ? "focus" : "normal" }));
}
