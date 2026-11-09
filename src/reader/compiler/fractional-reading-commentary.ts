import type { KpAnimationAsset } from '../../animation/asset.ts';
import { AnchoredAlgebraGap, type CommentaryStop, type KpLessonDocument } from '../document/public-api.ts';

/** State-named beats use their own prose and focus refs as a stationary note.
 * The fractional asset alone decides which state and selectors exist there. */
export function fractionalReadingCommentary(document: KpLessonDocument, animation: KpAnimationAsset): readonly CommentaryStop[] {
  const states = [animation.transformations[0]?.sourceObjectIds[0], ...animation.transformations.map(item => item.targetObjectIds[0])];
  return document.blocks.flatMap(block => block.kind !== 'animation-story' ? [] : block.beats.flatMap(beat => {
    if (!beat.id.startsWith('equation.fractional-linear.')) return [];
    const state = animation.bundle.objects.find(object => object.id === beat.id);
    const index = states.indexOf(beat.id);
    if (!state || index < 0 || beat.checkpoint.progressPermille !== Math.round(index / (states.length - 1) * 1000))
      throw new AnchoredAlgebraGap(beat.id, 'Attach the note to its exact checked native state.');
    if (!beat.focusRefs.length || new Set(beat.focusRefs).size !== beat.focusRefs.length
      || beat.focusRefs.some(ref => state.selectors.filter(selector => selector.id === ref).length !== 1))
      throw new AnchoredAlgebraGap(beat.id, 'Anchor the note to distinct selectors in its own native state.');
    const text = beat.content.map(inline => {
      if (inline.kind !== 'text') throw new AnchoredAlgebraGap(beat.id, 'Use plain-language note text; mathematical notation stays in the native equation.');
      return inline.value;
    }).join('');
    if (!text.trim()) throw new AnchoredAlgebraGap(beat.id, 'Write the observation this note helps the learner make.');
    return [{ stateId: beat.id, notes: [{ id: beat.id, text, detail: '', side: 'above' as const,
      views: { [state.id]: beat.focusRefs } }] }];
  }));
}
