import { assertKpComposedAlgebraPresentation, type KpComposedAlgebraPresentation } from "../../authoring/composed-algebra-presentation.ts";
import { assertKpComposedAlgebraPresentationV2, type KpComposedAlgebraPresentationV2 } from "../../authoring/composed-algebra-presentation-v2.ts";
import { createKpFocusDeckCheckpointMap, resolveKpFocusDeckVisibleBeat } from "../../tutorial/focus-deck-beat-navigation.ts";
import { encodeKpHtmlAttribute } from "../../rendering/html-output-encoding.ts";

const brand = Symbol("composed-algebra-reader-sequence");
const issued = new WeakSet<object>();
export interface KpComposedAlgebraReaderSequence {
  readonly [brand]: true;
  readonly revisionId: string;
  readonly checkpointProgress: readonly number[];
  readonly checkpoints: ReturnType<typeof createKpFocusDeckCheckpointMap>;
  readonly beats: readonly { readonly slug: string; readonly title: string; readonly html: string }[];
}
export function composedAlgebraSequence(draft: KpComposedAlgebraPresentation): KpComposedAlgebraReaderSequence {
  assertKpComposedAlgebraPresentation(draft);
  return bindSequence(draft, ["Count the copies", "Factor the shared expression", "Evaluate the count"]);
}
export function composedAlgebraSequenceV2(draft: KpComposedAlgebraPresentationV2): KpComposedAlgebraReaderSequence {
  assertKpComposedAlgebraPresentationV2(draft);
  return bindSequence(draft, ["Recognize the repeated group", "Collect the counts", "Evaluate the count", "Track every contribution", "Evaluate the constant contribution"]);
}
function bindSequence(draft: KpComposedAlgebraPresentation | KpComposedAlgebraPresentationV2, titles: readonly string[]): KpComposedAlgebraReaderSequence {
  if (draft.checkpointProgress.length !== draft.checked.source.states.length) throw new Error("A composed state must have exactly one beat and clock checkpoint.");
  const sequence: KpComposedAlgebraReaderSequence = Object.freeze({ [brand]: true as const, revisionId: draft.revisionId,
    checkpointProgress: draft.checkpointProgress, checkpoints: createKpFocusDeckCheckpointMap(draft.checkpointProgress),
    beats: Object.freeze(draft.checked.source.states.map((state, index) => Object.freeze({ slug: state.id, title: titles[index]!,
      html: `<p>${encodeKpHtmlAttribute(state.narration)}</p>` }))) });
  issued.add(sequence);
  return sequence;
}
export function sampleComposedAlgebraSequence(sequence: KpComposedAlgebraReaderSequence, elapsedProgress: number, previousVisible: number) {
  if (!issued.has(sequence)) throw new TypeError("Use an issued composed reader sequence.");
  const position = sequence.checkpoints.positionAt(elapsedProgress), total = sequence.beats.length;
  const visible = resolveKpFocusDeckVisibleBeat(position, previousVisible, sequence.checkpoints.last);
  return Object.freeze({ position, visible, total, beat: sequence.beats[visible]!, fraction: `${visible + 1} / ${total}`,
    accessiblePosition: `Step ${visible + 1} of ${total}: ${sequence.beats[visible]!.title}` });
}
