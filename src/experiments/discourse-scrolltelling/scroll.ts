import { projectKpTutorialCorridorTravel, type KpTutorialMotionCorridor } from '../../tutorial/kp-tutorial-motion.ts';

/** The measured reading landings own geometry; existing math owns progress.
 * Hold each endpoint around its paragraph, scrub only the intervening edge. */
export function discourseCorridor(landings: readonly number[]) {
  if (landings.length !== 5 || landings.some((value, i) => !Number.isFinite(value) || (i > 0 && value <= landings[i - 1]!))) {
    throw new Error('The dot discourse needs five strictly ordered finite reading landings.');
  }
  const start = landings[0]!, span = landings[4]! - start;
  const keyframes = [{ travel: 0, progress: 0 }];
  for (let i = 0; i < 4; i++) {
    const from = landings[i]!, distance = landings[i + 1]! - from;
    keyframes.push({ travel: (from + distance * .2 - start) / span, progress: i / 4 },
      { travel: (from + distance * .8 - start) / span, progress: (i + 1) / 4 });
  }
  keyframes.push({ travel: 1, progress: 1 });
  const corridor: KpTutorialMotionCorridor = { startViewportRatio: 1, endViewportRatio: 0, keyframes };
  return { start, span, corridor };
}

export function discourseProgress(landings: readonly number[], scrollY: number, reducedMotion = false) {
  if (!Number.isFinite(scrollY)) throw new Error('Scroll position must be finite.');
  const geometry = discourseCorridor(landings);
  const travel = Math.max(0, Math.min(1, (scrollY - geometry.start) / geometry.span));
  const progress = projectKpTutorialCorridorTravel(geometry.corridor, travel);
  return reducedMotion ? Math.round(progress * 4) / 4 : progress;
}
