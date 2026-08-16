export interface KpFunctionWrapMotionWindow {
  readonly start: number;
  readonly end: number;
}

export interface KpFunctionWrapMotionProfile {
  readonly materialTransit: KpFunctionWrapMotionWindow;
  readonly enclosureReception: KpFunctionWrapMotionWindow;
  readonly syntaxResolution: KpFunctionWrapMotionWindow;
}

/**
 * Function wrapping reads causally when material settles first, delimiters
 * receive it next, and the remaining operational syntax resolves last. The
 * windows overlap slightly so the target assembles continuously rather than
 * becoming three disconnected reveals.
 */
export const kpCanonicalFunctionWrapMotionProfile = Object.freeze({
  materialTransit: Object.freeze({ start: 0, end: 0.4 }),
  enclosureReception: Object.freeze({ start: 0.42, end: 0.7 }),
  syntaxResolution: Object.freeze({ start: 0.5, end: 0.78 })
} satisfies KpFunctionWrapMotionProfile);

export function offsetKpFunctionWrapMotionWindow(
  window: KpFunctionWrapMotionWindow,
  offset: number
): KpFunctionWrapMotionWindow {
  if (!Number.isFinite(offset)) {
    throw new Error("Function-wrap motion offsets must be finite.");
  }
  const shifted = Object.freeze({
    start: window.start + offset,
    end: window.end + offset
  });
  if (shifted.start < 0 || shifted.end > 1) {
    throw new Error("Offset function-wrap motion windows must remain within unit progress.");
  }
  return shifted;
}
