import { AnchoredAlgebraGap, type CommentaryStop } from '../reader/document/public-api.ts';
import type { DocumentAnnotationProjector } from '../reader/app/document-theater-attention.ts';
import { objectCommentArrival } from '../reader/app/object-comment-arrival.ts';

/** One local editorial binding, not a new authoring schema. The existing
 * paragraph supplies text; the native source selectors supply the subject. */
export function createFractionObjectComment(beats: readonly HTMLElement[]) {
  const index = beats.findIndex(beat => beat.dataset['kpBeat'] === 'beat.cancel-additive');
  const beat = beats[index];
  const stateId = 'equation.fractional-linear.after-subtract';
  if (!beat || beat.dataset['kpOperationStart'] !== '167')
    throw new AnchoredAlgebraGap('beat.cancel-additive', 'Require the checked additive-cancellation source.');
  const passage = beat.querySelector<HTMLElement>('.kp-rising-passage');
  if (!passage) throw new AnchoredAlgebraGap(beat.id, 'Keep a real scroll passage for this explanation.');
  passage.dataset['kpObjectCommentSource'] = 'true';
  const project: DocumentAnnotationProjector = input => {
    if (input.readingDocument || input.hasSelection) return undefined;
    const arrival = input.positions[index]!;
    const priorEnd = input.positions[index - 1]! + input.holds[index - 1]!;
    const approach = Math.min(180, arrival - priorEnd - 16);
    const offset = input.position - arrival;
    const pose = objectCommentArrival(offset, approach, input.motionMode === 'essential');
    if (!pose) return undefined;
    return { kind: 'annotation', stateId, presence: 1, objectComment: pose };
  };
  const resolve = (id: string): CommentaryStop | undefined => {
    if (id !== stateId) return undefined;
    const text = beat.querySelector('.kp-beat-copy > p')?.textContent ?? '';
    if (!text.trim()) throw new AnchoredAlgebraGap(id, 'Keep the explanatory paragraph available.');
    return { stateId, notes: [{ id: 'comment.cancel-additive', text, detail: '', side: 'above',
      views: { [stateId]: [`${stateId}.lhs.plus3`, `${stateId}.lhs.minus3`] } }] };
  };
  return { project, resolve, dispose: () => { delete passage.dataset['kpObjectCommentSource']; } };
}
