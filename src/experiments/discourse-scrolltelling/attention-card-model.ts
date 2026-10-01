import { projectKpTutorialCorridorTravel, type KpTutorialMotionCorridor } from '../../tutorial/kp-tutorial-motion.ts';

export const pairingAttentionCorridor: KpTutorialMotionCorridor = {
  startViewportRatio: 0, endViewportRatio: -3,
  keyframes: [{ travel: 0, progress: 0 }, { travel: 1, progress: 1 }],
};
export function pairingAttentionFrame(travel: number, reduced = false) {
  if (!Number.isFinite(travel)) throw new Error('Attention-card travel must be finite.');
  const t = Math.max(0, Math.min(1, travel));
  const phase = t < .2 ? 'read' : t < .3 ? 'watch' : t < .8 ? 'move' : 'inspect';
  const progress = projectKpTutorialCorridorTravel({
    ...pairingAttentionCorridor,
    keyframes: [{ travel: 0, progress: 0 }, { travel: .3, progress: 0 },
      { travel: .8, progress: 1 }, { travel: 1, progress: 1 }],
  }, t);
  return { phase, progress: reduced ? (t < .8 ? 0 : 1) : progress } as const;
}
