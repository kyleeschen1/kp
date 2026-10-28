import { createFractionalRisingScroll, fractionalPassageCadence, fractionalPassageIndex } from './fractional-rising-scroll.ts';
import { sampleKpReaderScrollProgress, type KpReaderPiecewiseScrollGeometry } from '../runtime/learner-public-api.ts';
import { mountFractionalPassageSliders } from './fractional-passage-sliders.ts';
import { fractionalSliderPresence, compileFractionalTheaterFocus } from './fractional-theater-focus.ts';

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
  const motionControl = document.querySelector<HTMLElement>('.kp-reader-motion-control');
  if (motionControl === null) throw new Error('Document reader requires its motion preference control.');
  const motionHome = document.createComment('motion preference home');
  motionControl.before(motionHome);
  // A reader-wide preference belongs in the toolbar menu, outside the scene.
  // Move the bound control rather than creating a second preference owner.
  toc.append(motionControl);
  masthead.append(navigation);
  const closeNavigation = (event: Event) => {
    if (event.target instanceof Element && event.target.closest('a')) navigation.open = false;
  };
  navigation.addEventListener('click', closeNavigation);
  let headerHeight = masthead.getBoundingClientRect().height;
  let readingLine = 0;
  let positions: readonly number[] = [];
  let heights: readonly number[] = [];
  let focusAt = compileFractionalTheaterFocus({ positions: [], heights: [], stageOffset: 14 });
  let painted = new Set(passages.map((_, index) => index));
  let selected = -1;
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
  const host = input.story.querySelector('.kp-caption-pin');
  if (!(host instanceof HTMLElement)) throw new Error('Theater control requires its stage host.');
  const sliders = mountFractionalPassageSliders({ beats: input.beats, host, geometry: () => geometry, seek: input.onSeek });
  const render = (progress = renderedProgress) => {
    renderedProgress = progress;
    const active = readAll ? returnIndex : indexAtPosition();
    const position = window.scrollY + readingLine;
    const operation = sliders.operationAt(active);
    const presence = operation && geometry ? fractionalSliderPresence(position, operation.seek(geometry, 1).position) : 0;
    sliders.render(active, progress, readAll ? 0 : presence);
    const opacity = focusAt(position);
    const changed = new Set([...painted, ...opacity.keys(), selected, active]);
    for (const index of changed) {
      const passage = passages[index];
      if (passage === undefined) continue;
      const activeValue = String(index === active);
      const paint = String(opacity.get(index) ?? .12);
      if (passage.dataset['kpCaptionActive'] !== activeValue) passage.dataset['kpCaptionActive'] = activeValue;
      if (passage.style.getPropertyValue('--kp-passage-opacity') !== paint)
        passage.style.setProperty('--kp-passage-opacity', paint);
    }
    painted = new Set(opacity.keys());
    selected = active;
  };
  const measure = () => {
    if (readAll) return;
    headerHeight = masthead.getBoundingClientRect().height;
    const available = window.innerHeight - headerHeight;
    heights = passages.map((passage) => passage.getBoundingClientRect().height);
    const maxHeight = Math.max(...heights);
    // Paragraph height affects layout once, not the equation's position on each
    // passage exchange. A short caption shares the same bottom reading line.
    const groupHeight = maxHeight + 14 + 82 + 6 + 24;
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
    // Release brings the next real paragraph into the theater immediately.
    // Both paragraphs then travel at the same native scroll velocity.
    style.setProperty('--kp-flow-gap', `${cardHeight - lineWithinCard + 4}px`);
    passages.forEach((passage, index) => {
      passage.style.setProperty('--kp-passage-top', `${Math.max(headerHeight + 12, readingLine - heights[index]!)}px`);
      input.beats[index]!.style.setProperty('--kp-flow-hold', `${sliders.operationAt(index) ? cadence.hold : cadence.read}px`);
    });
    positions = input.beats.map((beat, index) => window.scrollY + beat.getBoundingClientRect().top + heights[index]!);
    focusAt = compileFractionalTheaterFocus({ positions, heights, stageOffset: 14 });
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
      if (index < 0) return undefined;
      const operation = sliders.operationAt(index);
      if (operation === undefined) return progress === Number(beat.dataset['kpCheckpoint']) ? positions[index] : undefined;
      const start = Number(beat.dataset['kpOperationStart']);
      const end = Number(beat.dataset['kpOperationEnd']);
      if (progress < start || progress > end) return undefined;
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
      motionHome.replaceWith(motionControl);
      tocHome.replaceWith(toc);
      navigation.remove();
    }
  };
}
