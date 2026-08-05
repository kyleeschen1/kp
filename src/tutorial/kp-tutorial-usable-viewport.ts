export interface KpTutorialUsableViewportProjection {
  readonly viewportHeightPx: number;
  readonly topPx: number;
  readonly bottomPx: number;
  readonly heightPx: number;
}

/**
 * Persistent chrome is removed once from the physical viewport. Every reading
 * and stage anchor can then share this local interval instead of accumulating
 * unrelated header-specific offsets.
 */
export function projectKpTutorialUsableViewport(input: {
  readonly viewportHeightPx: number;
  readonly persistentTopInsetPx?: number | undefined;
  readonly persistentBottomInsetPx?: number | undefined;
}): KpTutorialUsableViewportProjection {
  const viewportHeight = finiteNonNegative(
    input.viewportHeightPx,
    "viewport height"
  );
  if (viewportHeight === 0) {
    throw new Error("Tutorial viewport height must be positive.");
  }
  const top = finiteNonNegative(
    input.persistentTopInsetPx ?? 0,
    "persistent top inset"
  );
  const bottomInset = finiteNonNegative(
    input.persistentBottomInsetPx ?? 0,
    "persistent bottom inset"
  );
  const bottom = viewportHeight - bottomInset;
  if (bottom <= top) {
    throw new Error("Tutorial persistent chrome must leave a usable viewport.");
  }
  return Object.freeze({
    viewportHeightPx: viewportHeight,
    topPx: top,
    bottomPx: bottom,
    heightPx: bottom - top
  });
}

function finiteNonNegative(value: number, label: string): number {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`Tutorial ${label} must be finite and non-negative.`);
  }
  return value;
}
