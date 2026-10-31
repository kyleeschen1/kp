import { assertKpComposedAlgebraPresentationV2, type KpComposedAlgebraPresentationV2 } from "../../authoring/composed-algebra-presentation-v2.ts";

// Editorial claims are valid for these exact source bytes, not every expression
// with similarly named selectors. A source edit needs an explicit editorial review.
export const commentaryRevision = "sha256:7b2d98b4554f80a3456ee6891df12dfdf069f76c11af05471b727908e37f2c61";
export class AnchoredAlgebraGap extends Error {
  readonly code = "kp.anchored-algebra.repair-gap";
  readonly path: string;
  constructor(path: string, expected: string) { super(`${path}: ${expected}`); this.path = path; }
}
export interface CommentaryNote {
  readonly id: string;
  readonly text: string;
  readonly detail: string;
  readonly side: "above" | "below";
  readonly views: Readonly<Record<string, readonly string[]>>;
}
export interface CommentaryStop {
  readonly stateId: string;
  readonly notes: readonly CommentaryNote[];
}
const state = (name: string) => `state.what-counts.${name}`;
const view = (name: string, roles: readonly string[]) => ({ [state(name)]: roles.map(role => `${state(name)}.paint.${role}`) });
const stops: readonly CommentaryStop[] = [
  { stateId: state("repeated"), notes: [
    { id: "whole.first", side: "above", text: "Treat this whole as one quantity.", detail: "You can count it before you know its value.", views: view("repeated", ["left-factor"]) },
    { id: "whole.again", side: "below", text: "The same whole appears again.", detail: "That sameness lets the counts combine.", views: view("repeated", ["right-factor"]) }
  ] },
  { stateId: state("collected"), notes: [
    { id: "counts.together", side: "above", text: "Only the counts meet.", detail: "Three copies plus two copies.", views: view("collected", ["left-paren", "left-term", "plus", "right-term", "right-paren"]) },
    { id: "whole.intact", side: "below", text: "The whole stays intact.", detail: "Nothing inside it has been added to the count.", views: view("collected", ["factor"]) }
  ] },
  { stateId: state("counted"), notes: [
    { id: "count.five", side: "above", text: "Five copies of the whole.", detail: "The count changed; the quantity did not.", views: { ...view("counted", ["result"]), ...view("counted.view.members", ["coefficient"]) } },
    { id: "whole.look-inside", side: "below", text: "Now look inside one copy.", detail: "It contains both parts. What will five copies contain?", views: { ...view("counted", ["factor"]), ...view("counted.view.members", ["group-open", "member-0", "group-plus", "member-1", "group-close"]) } }
  ] },
  { stateId: state("opened"), notes: [
    { id: "parts.x", side: "above", text: "Five contributions of the first part.", detail: "Each of the five copies contained it.", views: view("opened", ["factor-0", "member-0"]) },
    { id: "parts.y", side: "below", text: "And five of the second part.", detail: "Opening the group preserves every contribution.", views: view("opened", ["factor-1", "member-1"]) }
  ] }
];

export function bindAnchoredCommentary(draft: KpComposedAlgebraPresentationV2) {
  assertKpComposedAlgebraPresentationV2(draft);
  if (draft.revisionId !== commentaryRevision) throw new AnchoredAlgebraGap("source.revision", "Review the commentary against this source revision before mounting it.");
  for (const [index, stop] of stops.entries()) {
    if (draft.checked.source.states[index]?.id !== stop.stateId) throw new AnchoredAlgebraGap(`stops.${index}`, "Resolve the declared mathematical state.");
    for (const note of stop.notes) for (const [objectId, selectorIds] of Object.entries(note.views)) {
      const object = draft.animation.bundle.objects.find(candidate => candidate.id === objectId);
      if (!object || selectorIds.length === 0 || selectorIds.some(id => object.selectors.filter(selector => selector.id === id).length !== 1))
        throw new AnchoredAlgebraGap(note.id, "Each anchor must resolve once in its declared canonical endpoint view.");
    }
  }
  return Object.freeze({ revision: draft.revisionId, stops,
    at(progress: number) {
      // Native endpoint ownership exists only at exact stops. Nearness must not
      // attach a label to a hidden endpoint while material still owns the ink.
      const index = draft.checkpointProgress.findIndex(point => point === progress);
      return index < 0 ? undefined : stops[index];
    },
    progressFor(stateId: string) {
      const index = stops.findIndex(stop => stop.stateId === stateId);
      if (index < 0) throw new AnchoredAlgebraGap("location.state", "Use a declared stop in this explanation.");
      return draft.checkpointProgress[index]!;
    }
  });
}
