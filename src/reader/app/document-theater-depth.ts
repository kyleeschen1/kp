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

/** Reveal behind the stage, clear its top, then exchange depth. The raised
 * reading shelf ends before the existing mathematical operation corridor.
 * Geometry is always intrinsic: transformed paint cannot advance this clock. */
export function documentRailEmergence(stageTop: number, stageHeight: number,
  passages: readonly { top: number; bottom: number }[]) {
  const center = stageTop + stageHeight / 2;
  const prose = passages.map(passage => {
    const travel = center - passage.top;
    const height = passage.bottom - passage.top;
    const shelf = stageTop - height - 24;
    const holdEnd = stageHeight / 2 + height + 24;
    const rise = smooth(travel / 96);
    const targetTop = travel < 96
      ? stageTop + 32 + (shelf - stageTop - 32) * rise
      : Math.min(shelf, passage.top);
    const attention = smooth((travel - 96) / 48) * (1 - smooth((travel - holdEnd) / 48));
    return { presence: travel < 0 ? 0 : 1, lift: attention, attention,
      offset: targetTop - passage.top, front: travel >= 96,
      active: travel > 0 && travel < holdEnd + 48 };
  });
  return { prose, stage: 1 - Math.max(0, ...prose.map(passage => passage.attention)) };
}
