/** A translucent sheet cannot conceal sticky release. Withdraw during the
 * reserved exit travel, without changing the mathematical endpoint. */
export function documentTheaterExitPresence(position: number, lastBottom: number, lastHold: number, stageHeight: number) {
  const t = Math.min(1, Math.max(0, (lastBottom + lastHold + stageHeight - position) / stageHeight));
  return t * t * (3 - 2 * t);
}

const smooth = (value: number) => {
  const t = Math.min(1, Math.max(0, value));
  return t * t * (3 - 2 * t);
};

/** Natural, untransformed text bounds own the handoff. The leading edge
 * emerges at stage center, settles, then scrolls away at ordinary scale.
 * Sampling never reads the transformed paint back into its own geometry. */
export function documentRailEmergence(stageTop: number, stageHeight: number,
  passages: readonly { top: number; bottom: number }[]) {
  const center = stageTop + stageHeight / 2;
  const prose = passages.map(passage => {
    const travel = center - passage.top;
    const presence = smooth(travel / 24);
    const settle = smooth(travel / 96);
    const attention = presence * smooth((passage.bottom - stageTop + 24) / 48);
    return { presence, lift: 1 - settle, attention };
  });
  return { prose, stage: 1 - Math.max(0, ...prose.map(passage => passage.attention)) };
}
