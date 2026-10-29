import { createFractionalRisingScroll, fractionalPassageCadence, fractionalPassageIndex } from './fractional-rising-scroll.ts';
import { sampleKpReaderScrollProgress, type KpReaderPiecewiseScrollGeometry } from '../runtime/learner-public-api.ts';
import { fractionalPassageOperation } from './fractional-passage-progress.ts';
import { fractionalPassageTrace, compileFractionalTheaterFocus } from './fractional-theater-focus.ts';

/** Real article paragraphs, native sticky holds, and the existing semantic clock. */
export function mountFractionalRisingPassages(input: {
  readonly story: HTMLElement;
  readonly beats: readonly HTMLElement[];
  readonly onLayout: () => void;
}) {
  const document = input.story.ownerDocument;
  const window = document.defaultView!;
  const passages = input.beats.map((beat) => {
    const passage = beat.querySelector<HTMLElement>('.kp-rising-passage');
    if (passage === null) throw new Error('Document passage requires its compiled prose.');
    return passage;
  });
  // Operations still own their scroll intervals and URL restoration even
  // though this presentation no longer mounts an operation control.
  const operations = input.beats.map(beat => {
    const id = beat.dataset['kpOperationId'];
    if (id === undefined) return undefined;
    if (!id || beat.dataset['kpOperationStart'] === undefined || beat.dataset['kpOperationEnd'] === undefined)
      throw new Error('An operation passage requires its checked source and result.');
    return fractionalPassageOperation(Number(beat.dataset['kpOperationStart']), Number(beat.dataset['kpOperationEnd']));
  });
  const masthead = document.querySelector<HTMLElement>('.kp-reader-masthead')!;
  const toc = document.querySelector<HTMLElement>('.kp-lesson-toc')!;
  const tocHome = document.createComment('document passage navigation home');
  toc.before(tocHome);
  const navigation = masthead.querySelector<HTMLDetailsElement>('.kp-rising-navigation');
  const options = navigation?.querySelector<HTMLElement>('[data-kp-reader-options-reading]');
  if (!navigation || !options) throw new Error('Document reader requires its compiled options menu.');
  options.append(toc);
  const motionControl = document.querySelector<HTMLElement>('.kp-reader-motion-control');
  if (motionControl === null) throw new Error('Document reader requires its motion preference control.');
  const motionHome = document.createComment('motion preference home');
  motionControl.before(motionHome);
  // A reader-wide preference belongs in the toolbar menu, outside the scene.
  // Move the bound control rather than creating a second preference owner.
  toc.append(motionControl);
  const closeNavigation = (event: Event) => {
    if (event.target instanceof Element && event.target.closest('a')) navigation.open = false;
  };
  const dismissNavigation = (event: Event) => {
    // A closed menu must not steal Escape from reading or review controls.
    if (!navigation.open) return;
    if (event instanceof KeyboardEvent && event.key === 'Escape') {
      navigation.open = false;
      navigation.querySelector('summary')?.focus();
    } else if (event.type === 'pointerdown' && event.target instanceof Node && !navigation.contains(event.target)) navigation.open = false;
  };
  navigation.addEventListener('click', closeNavigation);
  document.addEventListener('keydown', dismissNavigation);
  document.addEventListener('pointerdown', dismissNavigation);
  let headerHeight = masthead.getBoundingClientRect().height;
  let readingLine = 0;
  let positions: readonly number[] = [];
  let heights: readonly number[] = [];
  let holds: readonly number[] = [];
  let frameTop = 0, frameBottom = 0;
  let focusAt = compileFractionalTheaterFocus({ positions: [], holds: [] });
  let selectedPassages = new Set<number>();
  let painted = new Set(passages.map((_, index) => index));
  let selected = -1;
  let geometry: KpReaderPiecewiseScrollGeometry | undefined;
  let readAll = false;
  let returnIndex = 0;
  const indexAtPosition = () => fractionalPassageIndex(positions, window.scrollY + readingLine);
  const readingMode = document.createElement('button');
  readingMode.type = 'button';
  readingMode.className = 'kp-caption-reading-mode';
  readingMode.textContent = 'Read all';
  readingMode.setAttribute('aria-pressed', 'false');
  options.prepend(readingMode);
  const render = () => {
    const active = readAll ? returnIndex : indexAtPosition();
    const position = window.scrollY + readingLine;
    const opacity = focusAt(position);
    // Only adjacent traces can approach the theater. A distant seek clears the
    // last painted set and samples the new neighborhood without replaying it.
    const neighbors = [active - 1, active, active + 1];
    const changed = new Set([...painted, ...opacity.keys(), ...selectedPassages, selected, ...neighbors]);
    const nextPainted = new Set<number>();
    for (const index of changed) {
      const passage = passages[index];
      if (passage === undefined) continue;
      const activeValue = String(index === active);
      const focus = opacity.get(index) ?? 0;
      const front = selectedPassages.has(index) || focus > 0;
      const alpha = selectedPassages.has(index) ? 1 : focus > 0 ? focus : neighbors.includes(index)
        ? fractionalPassageTrace({ position, arrival: positions[index]!, hold: holds[index]!, height: heights[index]!, frameTop, frameBottom }) : 0;
      const paint = String(alpha);
      const present = String(front);
      const layer = front ? 'front' : 'back';
      if (passage.dataset['kpPassageLayer'] !== layer) passage.dataset['kpPassageLayer'] = layer;
      if (passage.dataset['kpCaptionPresent'] !== present) passage.dataset['kpCaptionPresent'] = present;
      if (passage.dataset['kpCaptionActive'] !== activeValue) passage.dataset['kpCaptionActive'] = activeValue;
      if (passage.style.getPropertyValue('--kp-passage-opacity') !== paint)
        passage.style.setProperty('--kp-passage-opacity', paint);
      if (alpha > 0) nextPainted.add(index);
    }
    painted = nextPainted;
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
    const groupHeight = maxHeight + 14 + 82;
    const cardHeight = Math.max(320, groupHeight + 64);
    const cardTop = headerHeight + Math.max(16, (available - cardHeight) / 2);
    const lineWithinCard = (cardHeight - groupHeight) / 2 + maxHeight;
    frameTop = -lineWithinCard;
    frameBottom = cardHeight - lineWithinCard;
    readingLine = cardTop + lineWithinCard;
    const cadence = fractionalPassageCadence(available);
    const style = document.body.style;
    style.setProperty('--kp-rising-header-height', `${headerHeight}px`);
    style.setProperty('--kp-caption-card-height', `${cardHeight}px`);
    style.setProperty('--kp-caption-card-top', `${cardTop}px`);
    style.setProperty('--kp-flow-line', `${readingLine}px`);
    style.setProperty('--kp-flow-line-in-card', `${lineWithinCard}px`);
    // Keep the theater pinned beyond both semantic endpoints so the first
    // and last paragraphs retreat relative to it, rather than riding with it.
    const edgeRoom = 48;
    style.setProperty('--kp-flow-leading', `${lineWithinCard - heights[0]! + edgeRoom}px`);
    style.setProperty('--kp-flow-tail', `${cardHeight - lineWithinCard + edgeRoom}px`);
    style.setProperty('--kp-flow-hold', `${cadence.hold}px`);
    // Restore the generous strip spacing. Readability bridges this distance;
    // paragraph height must not be subtracted to compress the handoff.
    style.setProperty('--kp-flow-gap', `${cardHeight - lineWithinCard + 4}px`);
    holds = passages.map((_, index) => operations[index] ? cadence.hold : cadence.read);
    passages.forEach((passage, index) => {
      passage.style.setProperty('--kp-passage-top', `${Math.max(headerHeight + 12, readingLine - heights[index]!)}px`);
      input.beats[index]!.style.setProperty('--kp-flow-hold', `${holds[index]}px`);
    });
    positions = input.beats.map((beat, index) => window.scrollY + beat.getBoundingClientRect().top + heights[index]!);
    focusAt = compileFractionalTheaterFocus({ positions, holds });
  };
  measure();
  const toggleReading = () => {
    navigation.open = false;
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
  // Native find and text selection must reveal their real paragraph even away
  // from its presentation window. No duplicate transcript or search handler.
  const onSelectionChange = () => {
    const selection = document.getSelection();
    selectedPassages = new Set(passages.flatMap((passage, index) =>
      selection && !selection.isCollapsed && selection.containsNode(passage, true) ? [index] : []));
    render();
  };
  document.addEventListener('selectionchange', onSelectionChange);
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
      const operation = operations[index];
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
      document.removeEventListener('selectionchange', onSelectionChange);
      observer.disconnect();
      readingMode.removeEventListener('click', toggleReading);
      readingMode.remove();
      navigation.removeEventListener('click', closeNavigation);
      document.removeEventListener('keydown', dismissNavigation);
      document.removeEventListener('pointerdown', dismissNavigation);
      motionHome.replaceWith(motionControl);
      tocHome.replaceWith(toc);
    }
  };
}
