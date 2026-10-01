import { sample, DotPassageGap } from './model.ts';

export interface DotDepthSettings {
  readonly backgroundOpacity: number;
  readonly foregroundLift: boolean;
  readonly shadowStrength: number;
  readonly reducedMotion: boolean;
}
export const defaultDotDepth: DotDepthSettings = Object.freeze({ backgroundOpacity: .4, foregroundLift: true, shadowStrength: .7, reducedMotion: false });
const smooth = (p: number) => { const t = Math.max(0, Math.min(1, p)); return t * t * t * (t * (t * 6 - 15) + 10); };

/** Hold the lifted contributors before pairing; every adapter samples the same
 * interval so geometry, scale and context opacity remain still together. */
export function sampleDotDeparture(local: number) {
  return { rise: smooth(local / .2), travel: Math.max(0, Math.min(1, (local - .6) / .4)) };
}

/** Paint-only shadow follows the same lift as geometry, including its dwell.
 * A small settled shadow preserves continuity at the material/native handoff. */
export function sampleDotShadow(progress: number, settings: DotDepthSettings = defaultDotDepth) {
  if (!Number.isFinite(settings.shadowStrength) || settings.shadowStrength < 0 || settings.shadowStrength > 1) throw new DotPassageGap('Unsupported shadow strength.');
  const frame = sample(progress);
  if (frame.index === 0 || settings.shadowStrength === 0) return 'none';
  const pose = sampleDotDeparture(frame.local);
  const rise = frame.index === 1 && !settings.reducedMotion ? pose.rise : 1;
  const lift = frame.index === 1 && !settings.reducedMotion ? pose.rise * (1 - smooth(pose.travel)) : 0;
  const strength = settings.shadowStrength * rise;
  return `0 ${1 + 2 * lift}px ${.5 + .5 * lift}px rgba(0, 0, 0, ${strength}), 0 ${2 + 8 * lift}px ${2 + 6 * lift}px rgba(0, 0, 0, ${strength * .65})`;
}

/** Presentation-group depth is separate from each bracket's presence and each
 * token's mathematical identity. Native endpoints always retain normal scale. */
export function sampleDotDepth(progress: number, settings: DotDepthSettings = defaultDotDepth) {
  if (!Number.isFinite(settings.backgroundOpacity) || settings.backgroundOpacity < 0 || settings.backgroundOpacity > 1) throw new DotPassageGap('Unsupported dot depth settings.');
  const frame = sample(progress);
  const pose = sampleDotDeparture(frame.local);
  const departure = frame.index === 0 ? 0 : frame.index === 1 ? pose.rise : 1;
  const lift = frame.index === 1 ? pose.rise * (1 - smooth(pose.travel)) : 0;
  const scaleEnabled = !settings.reducedMotion && settings.foregroundLift;
  return {
    backgroundOpacity: 1 + (settings.backgroundOpacity - 1) * departure,
    backgroundScale: 1,
    foregroundScale: scaleEnabled ? 1 + .03 * lift : 1,
  };
}
