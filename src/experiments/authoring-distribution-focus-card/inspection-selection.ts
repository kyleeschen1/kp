import { createKpReaderSemanticFocusService } from "../../reader/runtime/semantic-focus.ts";
import type { createKpSymbolicInspectionLease } from "../../semantic/symbolic-inspection-lease.ts";
import type { KpSymbolicInspectionOccurrence } from "../../semantic/symbolic-inspection-types.ts";

export function createKpInspectionSelection(lease: ReturnType<typeof createKpSymbolicInspectionLease>) {
  const snapshot = lease.capture();
  const key = (item: KpSymbolicInspectionOccurrence) => JSON.stringify([item.side, item.selectorId]);
  const occurrences = new Map(snapshot.occurrences.map(item => [key(item), item]));
  const focus = createKpReaderSemanticFocusService([...occurrences.keys()]);
  return Object.freeze({
    snapshot,
    select(side: KpSymbolicInspectionOccurrence["side"], selectorId: string, source: "pointer" | "keyboard") {
      const result = lease.read(snapshot, side, selectorId);
      focus.set(source, [key(result.occurrence)]);
    },
    clear(source: "pointer" | "keyboard") { focus.clear(source); },
    read() {
      const id = focus.getSnapshot().objectRefs[0];
      const occurrence = id ? occurrences.get(id) : undefined;
      return occurrence ? lease.read(snapshot, occurrence.side, occurrence.selectorId) : undefined;
    },
    paintFocus() {
      const state = focus.getSnapshot();
      const selected = state.objectRefs.map(id => occurrences.get(id)!).map(item => {
        lease.read(snapshot, item.side, item.selectorId);
        return item.selectorId;
      });
      return Object.freeze({ ...state, objectRefs: Object.freeze(selected) });
    },
    subscribe(listener: () => void) { return focus.subscribe(listener); },
    dispose() { focus.dispose(); }
  });
}

export type KpInspectionSelection = ReturnType<typeof createKpInspectionSelection>;

export function bindKpInspectionStageSelection(input: {
  readonly stage: HTMLElement;
  readonly selection: KpInspectionSelection;
  readonly pause: () => void;
}) {
  const click = (event: MouseEvent) => {
    if (!(event.target instanceof Element)) return;
    const element = event.target.closest<HTMLElement>("[data-kp-reader-selector-id]");
    if (!element || !input.stage.contains(element)) return;
    const candidates = input.selection.snapshot.occurrences.filter(item => item.selectorId === element.dataset["kpReaderSelectorId"]);
    // Ambiguous native anchors need the explicit occurrence chooser, never a guess.
    if (candidates.length !== 1) return;
    const occurrence = candidates[0]!;
    input.pause();
    input.selection.clear("keyboard");
    input.selection.select(occurrence.side, occurrence.selectorId, "pointer");
  };
  input.stage.addEventListener("click", click);
  return () => input.stage.removeEventListener("click", click);
}
