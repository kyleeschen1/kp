import { beats } from "./model.ts";
import { MatrixColumnGap } from "../matrix-column-product/environment.ts";

export function readColumnProgress(hash: string): number {
  if (hash.startsWith("#p=")) {
    const text = hash.slice(3), progress = Number(text);
    if (!text.trim() || !Number.isFinite(progress) || progress < 0 || progress > 1) {
      throw new MatrixColumnGap("Animation progress must be a number between 0 and 1.");
    }
    return progress;
  }
  const index = beats.findIndex(beat => `#${beat.id}` === hash);
  return index < 0 ? 0 : index / (beats.length - 1);
}

export function columnProgressHash(progress: number): string {
  if (!Number.isFinite(progress) || progress < 0 || progress > 1) {
    throw new MatrixColumnGap("Animation progress must be a number between 0 and 1.");
  }
  const index = progress * (beats.length - 1);
  // Preserve fractional positions exactly; existing milestone links stay readable.
  return Number.isInteger(index) ? `#${beats[index]!.id}` : `#p=${progress}`;
}

export function sameColumnSelection(a: URL, b: URL): boolean {
  return a.pathname === b.pathname && a.search === b.search;
}
