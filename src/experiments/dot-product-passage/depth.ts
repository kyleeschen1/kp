import { sample, DotPassageGap } from './model.ts';

export interface DotDepthSettings {
  readonly backgroundOpacity: number;
  readonly foregroundLift: boolean;
  readonly reducedMotion: boolean;
}
export const defaultDotDepth: DotDepthSettings = Object.freeze({ backgroundOpacity: .4, foregroundLift: true, reducedMotion: false });
const smooth = (p: number) => { const t = Math.max(0, Math.min(1, p)); return t * t * t * (t * (t * 6 - 15) + 10); };

/** Presentation-group depth is separate from each bracket's presence and each
 * token's mathematical identity. Native endpoints always retain normal scale. */
export function sampleDotDepth(progress: number, settings: DotDepthSettings = defaultDotDepth) {
  if (!Number.isFinite(settings.backgroundOpacity) || settings.backgroundOpacity < 0 || settings.backgroundOpacity > 1) throw new DotPassageGap('Unsupported dot depth settings.');
  const frame = sample(progress);
  const departure = frame.index === 0 ? 0 : frame.index === 1 ? smooth(frame.local / .4) : 1;
  const lift = frame.index === 1 ? Math.sin(Math.PI * smooth(frame.local)) ** 2 : 0;
  const scaleEnabled = !settings.reducedMotion && settings.foregroundLift;
  return {
    backgroundOpacity: 1 + (settings.backgroundOpacity - 1) * departure,
    backgroundScale: 1,
    foregroundScale: scaleEnabled ? 1 + .03 * lift : 1,
  };
}
