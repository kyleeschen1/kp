import { createFractionalRisingScroll, fractionalPassageCadence, fractionalPassageIndex } from './fractional-rising-scroll.ts';
import { sampleKpReaderScrollProgress, type KpReaderPiecewiseScrollGeometry } from '../runtime/learner-public-api.ts';
import { mountFractionalPassageSliders } from './fractional-passage-sliders.ts';
import { fractionalPassageOperation } from './fractional-passage-progress.ts';

/** Real article paragraphs, native sticky holds, and the existing semantic clock. */
export function mountFractionalRisingPassages(input: {
  readonly story: HTMLElement;
  readonly beats: readonly HTMLElement[];
  readonly onSeek: (progress: number, position: number) => void;
  readonly onLayout: () => void;
}) {
  const document = input.story.ownerDocument;
  const window = document.defaultView!;
  const passages = input.beats.map((beat) => {
    const passage = beat.querySelector<HTMLElement>('.kp-rising-passage');
    if (passage === null) throw new Error('Document passage requires its compiled prose.');
    return passage;
  });
  const masthead = document.querySelector<HTMLElement>('.kp-reader-masthead')!;
  const toc = document.querySelector<HTMLElement>('.kp-lesson-toc')!;
  const tocHome = document.createComment('document passage navigation home');
  toc.before(tocHome);
  const navigation = document.createElement('details');
  navigation.className = 'kp-rising-navigation';
  const summary = document.createElement('summary');
  summary.textContent = 'Steps';
  navigation.append(summary, toc);
  masthead.append(navigation);
  const closeNavigation = (event: Event) => {
    if (event.target instanceof Element && event.target.closest('a')) navigation.open = false;
  };
  navigation.addEventListener('click', closeNavigation);
  let headerHeight = masthead.getBoundingClientRect().height;
  let readingLine = 0;
  let positions: readonly number[] = [];
  let geometry: KpReaderPiecewiseScrollGeometry | undefined;
  let readAll = false;
  let returnIndex = 0;
  let renderedProgress = 0;
  const indexAtPosition = () => fractionalPassageIndex(positions, window.scrollY + readingLine);
  const readingMode = document.createElement('button');
  readingMode.type = 'button';
  readingMode.className = 'kp-caption-reading-mode';
  readingMode.textContent = 'Read all';
  readingMode.setAttribute('aria-pressed', 'false');
  masthead.insertBefore(readingMode, navigation);
  const sliders = mountFractionalPassageSliders({ beats: input.beats, passages, geometry: () => geometry, seek: input.onSeek });
  const render = (progress = renderedProgress) => {
    renderedProgress = progress;
    sliders.render(progress);
    const active = readAll ? returnIndex : indexAtPosition();
    passages.forEach((passage, index) => {
      passage.dataset['kpCaptionActive'] = String(index === active);
    });
  };
  const measure = () => {
    if (readAll) return;
    headerHeight = masthead.getBoundingClientRect().height;
    const available = window.innerHeight - headerHeight;
    const heights = passages.map((passage) => passage.getBoundingClientRect().height);
    const maxHeight = Math.max(...heights);
    // Paragraph height affects layout once, not the equation's position on each
    // passage exchange. A short caption shares the same bottom reading line.
    const groupHeight = maxHeight + 14 + 82;
    const cardHeight = Math.max(320, groupHeight + 64);
    const cardTop = headerHeight + Math.max(16, (available - cardHeight) / 2);
    const lineWithinCard = (cardHeight - groupHeight) / 2 + maxHeight;
    readingLine = cardTop + lineWithinCard;
    const cadence = fractionalPassageCadence(available);
    const style = document.body.style;
    style.setProperty('--kp-rising-header-height', `${headerHeight}px`);
    style.setProperty('--kp-caption-card-height', `${cardHeight}px`);
    style.setProperty('--kp-caption-card-top', `${cardTop}px`);
    style.setProperty('--kp-flow-line', `${readingLine}px`);
    style.setProperty('--kp-flow-line-in-card', `${lineWithinCard}px`);
    style.setProperty('--kp-flow-leading', `${lineWithinCard - heights[0]!}px`);
    style.setProperty('--kp-flow-tail', `${cardHeight - lineWithinCard}px`);
    style.setProperty('--kp-flow-hold', `${cadence.hold}px`);
    // At release the next real paragraph is still below the viewport. Its
    // subsequent arrival is ordinary document motion, never a timed reveal.
    style.setProperty('--kp-flow-gap', `${Math.max(32, window.innerHeight - readingLine + 24)}px`);
    passages.forEach((passage, index) => {
      passage.style.setProperty('--kp-passage-top', `${Math.max(headerHeight + 12, readingLine - heights[index]!)}px`);
    });
    positions = input.beats.map((beat, index) => window.scrollY + beat.getBoundingClientRect().top + heights[index]!);
  };
  measure();
  const toggleReading = () => {
    if (!readAll) returnIndex = indexAtPosition();
    readAll = !readAll;
    readingMode.setAttribute('aria-pressed', String(readAll));
    document.body.dataset['kpCaptionMode'] = readAll ? 'document' : 'captions';
    // Rebuild the host geometry before restoring the selected real paragraph.
    // A generic progress seek can otherwise choose an earlier identical state.
    input.onLayout();
    if (readAll) passages[returnIndex]!.scrollIntoView({ block: 'center' });
    else {
      measure();
      window.scrollTo(0, Math.ceil(positions[returnIndex]! - readingLine));
    }
    render();
  };
  readingMode.addEventListener('click', toggleReading);
  // Observe intrinsic prose metrics, not sticky locations or scroll progress.
  // Font loading, wrapping and edited text must invalidate the same geometry.
  let metrics = passages.map((passage) => passage.getBoundingClientRect().height).join(',');
  const observer = new ResizeObserver(() => {
    if (readAll) return;
    const next = passages.map((passage) => passage.getBoundingClientRect().height).join(',');
    if (next === metrics) return;
    metrics = next;
    input.onLayout();
  });
  passages.forEach((passage) => observer.observe(passage));
  return {
    readingDocument: () => readAll,
    scrollGeometry(narrative: KpReaderPiecewiseScrollGeometry) {
      geometry = createFractionalRisingScroll(narrative, window.innerHeight - headerHeight);
      return geometry;
    },
    activeBeat: () => input.beats[readAll ? returnIndex : indexAtPosition()],
    positionFor(beat: HTMLElement | undefined, progress: number) {
      if (beat === undefined || geometry === undefined) return undefined;
      const index = input.beats.indexOf(beat);
      if (index === 0 && progress === 0) return positions[0];
      if (index < 1) return undefined;
      const start = Number(input.beats[index - 1]!.dataset['kpCheckpoint']);
      const end = Number(beat.dataset['kpCheckpoint']);
      if (progress < start || progress > end) return undefined;
      const operation = fractionalPassageOperation(start, end);
      return operation.seek(geometry, operation.fraction(progress)).position;
    },
    arrival(beat: HTMLElement) {
      const index = input.beats.indexOf(beat);
      if (index < 0) return undefined;
      if (readAll) returnIndex = index;
      return { position: readAll ? window.scrollY + passages[index]!.getBoundingClientRect().top : positions[index]!,
        progress: Number(input.beats[Math.max(0, index - 1)]!.dataset['kpCheckpoint']) };
    },
    encodeHref(href: URL) {
      if (geometry === undefined || readAll) return href;
      const start = geometry.stops[0]!.positionPx;
      const end = geometry.stops.at(-1)!.positionPx;
      const fraction = Math.min(1, Math.max(0, (window.scrollY + readingLine - start) / (end - start)));
      href.searchParams.set('kpReading', fraction.toFixed(6));
      return href;
    },
    restoreReadingPosition(href: string, progress: number) {
      const value = new URL(href).searchParams.get('kpReading');
      if (value === null || value.trim() === '' || geometry === undefined) return;
      const fraction = Number(value);
      if (!Number.isFinite(fraction) || fraction < 0 || fraction > 1) return;
      const start = geometry.stops[0]!.positionPx;
      const position = start + fraction * (geometry.stops.at(-1)!.positionPx - start);
      if (Math.abs(sampleKpReaderScrollProgress(position, geometry) * 1000 - progress) > 1) return;
      window.scrollTo(0, position - readingLine);
    },
    viewportAnchorFraction: () => readingLine / window.innerHeight,
    anchorTop(beat: HTMLElement) {
      const index = input.beats.indexOf(beat);
      if (index < 0) throw new Error('Document clock requires its authored beat.');
      return positions[index]! - window.scrollY;
    },
    measure,
    render,
    dispose() {
      observer.disconnect();
      sliders.dispose();
      readingMode.removeEventListener('click', toggleReading);
      readingMode.remove();
      navigation.removeEventListener('click', closeNavigation);
      tocHome.replaceWith(toc);
      navigation.remove();
    }
  };
}
