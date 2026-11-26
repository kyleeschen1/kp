/** A translucent sheet cannot conceal sticky release. Withdraw during the
 * reserved exit travel, without changing the mathematical endpoint. */
export function documentTheaterExitPresence(position: number, lastBottom: number, lastHold: number, stageHeight: number) {
  const t = Math.min(1, Math.max(0, (lastBottom + lastHold + stageHeight - position) / stageHeight));
  return t * t * (3 - 2 * t);
}

/** Switch order while the frame edges are still separated. The prose stays
 * foremost throughout overlap; a direct reverse samples the same exchange. */
export function documentFrameExchange(stageTop: number, stageHeight: number, textTop: number, textBottom: number) {
  const smooth = (value: number) => {
    const t = Math.min(1, Math.max(0, value));
    return t * t * (3 - 2 * t);
  };
  const prose = smooth((stageTop + stageHeight + 48 - textTop) / 24)
    * smooth((textBottom + 48 - stageTop) / 24);
  return { prose, front: prose >= .5 ? 'prose' : 'stage' } as const;
}
