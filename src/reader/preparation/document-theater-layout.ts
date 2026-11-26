/**
 * The compiler embeds this dependency-free function as a small classic
 * script after the prose. It runs after CSS, before the animation module graph,
 * so static and interactive reading share geometry from the first paint.
 * Keep runtime dependencies in the arguments: the emitted script is tested.
 */
export function measureDocumentTheaterLayout(
  document: Document,
  equationHeight: number,
  cadence: { readonly read: number; readonly hold: number }
) {
  const window = document.defaultView!;
  const masthead = document.querySelector<HTMLElement>('.kp-reader-masthead');
  const beats = [...document.querySelectorAll<HTMLElement>('[data-kp-beat]')];
  const passages = beats.map(beat => beat.querySelector<HTMLElement>('.kp-rising-passage'));
  if (!masthead || !beats.length || passages.some(passage => !passage))
    throw new Error('Document layout requires its compiled masthead and passages.');
  const headerHeight = masthead.getBoundingClientRect().height;
  const recessed = document.body.dataset['kpRecessedRail'] === 'true';
  if (recessed) {
    // Foreground prose covers the stage between openings. The spacer must
    // include the complete stage height as well as the operation's travel.
    // The annotation adapter bounds complete labels against the stage. Reuse
    // the document reader's commentary reserve even in the compact rail view.
    const commentaryHeight = beats.some(beat => beat.dataset['kpAnnotationState'])
      ? Math.max(...passages.map(passage => passage!.querySelector<HTMLElement>('.kp-caption-copy')!.offsetHeight)) * 2 + 210 : 0;
    const stageHeight = Math.max(180, equationHeight + 96, commentaryHeight);
    const top = headerHeight + Math.max(16, (window.innerHeight - headerHeight - stageHeight) / 2);
    const style = document.body.style;
    style.setProperty('--kp-document-equation-height', `${equationHeight}px`);
    style.setProperty('--kp-caption-card-height', `${stageHeight}px`);
    style.setProperty('--kp-caption-card-top', `${top}px`);
    style.setProperty('--kp-flow-line-in-card', `${(stageHeight - equationHeight) / 2 - 14}px`);
    style.setProperty('--kp-flow-line', `${top}px`);
    // Let the expression appear at the page surface before the first sheet.
    style.setProperty('--kp-flow-leading', `${stageHeight + cadence.read}px`);
    style.setProperty('--kp-flow-tail', '0px');
    style.setProperty('--kp-flow-gap', '0px');
    const holds = beats.map(beat => beat.dataset['kpOperationId'] ? cadence.hold : cadence.read);
    beats.forEach((beat, index) => beat.style.setProperty('--kp-flow-hold', `${stageHeight + holds[index]!}px`));
    const heights = passages.map(passage => passage!.getBoundingClientRect().height);
    const positions = beats.map((beat, index) => window.scrollY + beat.getBoundingClientRect().top + heights[index]!);
    return { headerHeight, heights, holds, positions, readingLine: top, frameTop: 0, frameBottom: stageHeight };
  }
  const heights = passages.map(passage => passage!.getBoundingClientRect().height);
  const maxHeight = Math.max(...heights);
  const annotations = beats.some(beat => beat.dataset['kpAnnotationState']);
  const groupHeight = maxHeight + 14 + equationHeight;
  const cardHeight = Math.max(320, groupHeight + 64, annotations ? maxHeight * 2 + 210 : 0);
  const cardTop = headerHeight + Math.max(16, (window.innerHeight - headerHeight - cardHeight) / 2);
  const lineWithinCard = annotations ? cardHeight / 2 - 14 - equationHeight / 2 : (cardHeight - groupHeight) / 2 + maxHeight;
  const readingLine = cardTop + lineWithinCard;
  const style = document.body.style;
  style.setProperty('--kp-document-equation-height', `${equationHeight}px`);
  style.setProperty('--kp-rising-header-height', `${headerHeight}px`);
  style.setProperty('--kp-caption-card-height', `${cardHeight}px`);
  style.setProperty('--kp-caption-card-top', `${cardTop}px`);
  style.setProperty('--kp-flow-line', `${readingLine}px`);
  style.setProperty('--kp-flow-line-in-card', `${lineWithinCard}px`);
  // Preserve room beyond both semantic endpoints for the real prose to retreat.
  style.setProperty('--kp-flow-leading', `${lineWithinCard - heights[0]! + 48}px`);
  style.setProperty('--kp-flow-tail', `${cardHeight - lineWithinCard + 48}px`);
  style.setProperty('--kp-flow-hold', `${cadence.hold}px`);
  style.setProperty('--kp-flow-gap', `${cardHeight - lineWithinCard + 4}px`);
  const holds = beats.map(beat => beat.dataset['kpOperationId'] ? cadence.hold : cadence.read);
  passages.forEach((passage, index) => {
    passage!.style.setProperty('--kp-passage-top', `${Math.max(headerHeight + 12, readingLine - heights[index]!)}px`);
    beats[index]!.style.setProperty('--kp-flow-hold', `${holds[index]}px`);
  });
  const positions = beats.map((beat, index) => window.scrollY + beat.getBoundingClientRect().top + heights[index]!);
  return { headerHeight, heights, holds, positions, readingLine,
    frameTop: -lineWithinCard, frameBottom: cardHeight - lineWithinCard };
}
