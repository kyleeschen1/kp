import { compile } from '../../authoring/algebra/compile.ts';
import { bindAnchoredCommentary } from './what-counts-commentary.ts';
import { mountDocumentAnnotations } from './document-annotations.ts';

/** The original reader still pins its editorial score to checked algebra. */
export function mountWhatCountsAnnotations(story: HTMLElement, source: unknown) {
  const commentary = bindAnchoredCommentary(compile(source));
  const requestedState = window.location.hash.slice(1);
  const unknownState = requestedState.startsWith('state.what-counts.') && !commentary.stops.some(stop => stop.stateId === requestedState);
  return mountDocumentAnnotations(story, commentary.stops, unknownState
    ? 'This link names an unknown explanation state. Open /reader/what-counts/ for the current explanation.' : undefined);
}
