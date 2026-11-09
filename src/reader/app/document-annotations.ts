import { AnchoredAlgebraGap, readEndpointCommentary } from '../document/public-api.ts';
import { mountAnchoredLabels } from './what-counts-anchors.ts';
import type { DocumentReadingAttention } from './document-theater-attention.ts';

/** Both readers use the same native label adapter and sole reading playhead.
 * Their compilers retain responsibility for the meaning of each authored note. */
export function mountDocumentAnnotations(story: HTMLElement, source: unknown, locationError?: string) {
  const stops = readEndpointCommentary(source);
  const plane = story.querySelector<HTMLElement>('.kp-caption-pin');
  if (!plane) throw new AnchoredAlgebraGap('reader.layout', 'Require the document annotation plane.');
  const labels = mountAnchoredLabels(plane), alert = document.createElement('p');
  alert.setAttribute('role', 'alert'); alert.hidden = true; alert.dataset['anchoredError'] = '';
  story.append(alert);
  let layoutRevision = -1, invalidated = true;
  return {
    invalidate() { invalidated = true; },
    render(attention: Extract<DocumentReadingAttention, { kind: 'annotation' }> | undefined, revision: number) {
      try {
        if (locationError) throw new AnchoredAlgebraGap('location.state', locationError);
        const stateId = attention?.stateId;
        const stop = stateId === undefined ? undefined : stops.find(stop => stop.stateId === stateId);
        if (stateId && !stop) throw new AnchoredAlgebraGap(stateId, 'Use a declared annotation stop.');
        labels.render(stop, invalidated || layoutRevision !== revision, attention?.presence ?? 0);
        layoutRevision = revision; invalidated = false;
        alert.hidden = true; alert.textContent = ''; story.dataset['anchoredStatus'] = 'ready';
      } catch (error) {
        labels.render(undefined);
        if (!(error instanceof AnchoredAlgebraGap)) throw error;
        alert.textContent = error.message; alert.hidden = false; story.dataset['anchoredStatus'] = 'repair-gap';
      }
    },
    dispose() { labels.dispose(); alert.remove(); }
  };
}
