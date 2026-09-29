import { createKpSymbolicInspectionIndex, type KpSymbolicInspectionIndex } from "./symbolic-inspection-index.ts";
import { KpSymbolicInspectionGap, type KpSymbolicInspectionInput } from "./symbolic-inspection-evidence.ts";
import type { KpSymbolicInspectionOccurrence } from "./symbolic-inspection-types.ts";

/** Owns only audit-data lifetime. Selection and playback remain reader-owned. */
export function createKpSymbolicInspectionLease(input: KpSymbolicInspectionInput) {
  let current = createKpSymbolicInspectionIndex(input);
  let disposed = false;
  const requireActive = () => { if (disposed) throw new KpSymbolicInspectionGap("lifecycle", "Inspection evidence has been disposed."); };
  return Object.freeze({
    capture() { requireActive(); return current; },
    replace(next: KpSymbolicInspectionInput) {
      requireActive();
      // Validate before replacing: a rejected draft cannot retire valid evidence.
      const replacement = createKpSymbolicInspectionIndex(next);
      current = replacement;
      return current;
    },
    read(snapshot: KpSymbolicInspectionIndex, side: KpSymbolicInspectionOccurrence["side"], selectorId: string) {
      requireActive();
      // Reference identity distinguishes generations even if version labels repeat.
      if (snapshot !== current) throw new KpSymbolicInspectionGap("revision", "Inspection request belongs to a stale or foreign snapshot.");
      return current.lookup(side, selectorId);
    },
    dispose() { disposed = true; }
  });
}
