export interface KpReaderViewportAnchorCache {
  readonly read: () => number;
  readonly invalidate: () => void;
}

export function createKpReaderViewportAnchorCache(
  measure: () => number
): KpReaderViewportAnchorCache {
  let cached: number | undefined;
  return {
    read() {
      if (cached === undefined) cached = measure();
      return cached;
    },
    invalidate() {
      cached = undefined;
    }
  };
}
