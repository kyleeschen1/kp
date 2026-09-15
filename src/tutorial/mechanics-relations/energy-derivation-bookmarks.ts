export interface EnergyInspectionPosition {
  readonly transition: string;
  readonly move: number;
  readonly progress: number;
}

/** Inactive bookmarks only: the shared playback clock still owns live progress.
 * An explicit edge identity distinguishes B-as-destination from B-as-source. */
export function createEnergyInspectionBookmarks(revision: string, transitions: readonly string[]) {
  if (!revision || !transitions.length || transitions.some(id => !id) || new Set(transitions).size !== transitions.length)
    throw new Error("Invalid inspection bookmark boundary");
  const ids = [...transitions];
  const saved = new Map<string, number>();
  const position = (currentRevision: string, transition: string, progress: number): EnergyInspectionPosition => {
    const move = ids.indexOf(transition);
    if (currentRevision !== revision || move < 0 || !Number.isFinite(progress) || progress < 0 || progress > 1)
      throw new Error("Stale or invalid inspection bookmark");
    return Object.freeze({ transition, move, progress });
  };
  return {
    snapshot: () => Object.freeze([...saved].map(([transition, progress]) => position(revision, transition, progress))),
    position,
    remember(transition: string, progress: number) {
      const checked = position(revision, transition, progress);
      saved.set(checked.transition, checked.progress);
    },
    recall(currentRevision: string, transition: string, restart = false): EnergyInspectionPosition {
      return position(currentRevision, transition, restart ? 0 : saved.get(transition) ?? 0);
    }
  };
}
