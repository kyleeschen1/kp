/** Measured text bounds are cached at layout, never read from transformed
 * stage paint. This keeps a scroll reversal or direct seek history-independent. */
export function documentTheaterOffset(center: number, text: readonly { top: number; bottom: number }[], equationHeight: number, reduced = false) {
  const equationTop = center - equationHeight / 2;
  let offset = 0;
  for (const bounds of text) {
    const contact = equationTop + equationHeight + 12 - bounds.top;
    if (contact <= 0 || bounds.bottom + 12 <= equationTop) continue;
    // Use a short scroll interval to tuck below the incoming text, then follow
    // its lower edge until the normal stage position has room again.
    const t = reduced ? 1 : Math.min(1, contact / 32);
    offset = Math.max(offset, (bounds.bottom + 12 - equationTop) * t * t * (3 - 2 * t));
  }
  return offset;
}

/** A translucent sheet cannot conceal sticky release. Withdraw during the
 * reserved exit travel, without changing the mathematical endpoint. */
export function documentTheaterExitPresence(position: number, lastBottom: number, lastHold: number, stageHeight: number) {
  const t = Math.min(1, Math.max(0, (lastBottom + lastHold + stageHeight - position) / stageHeight));
  return t * t * (3 - 2 * t);
}
