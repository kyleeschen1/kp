import { KpSymbolicInspectionGap, projectKpSymbolicInspectionEvidence, type KpSymbolicInspectionInput } from "./symbolic-inspection-evidence.ts";
import { projectKpSymbolicInspectionOccurrences } from "./symbolic-inspection-occurrences.ts";
import type { KpSymbolicInspectionOccurrence } from "./symbolic-inspection-types.ts";

export function createKpSymbolicInspectionIndex(input: KpSymbolicInspectionInput) {
  const evidence = projectKpSymbolicInspectionEvidence(input);
  const occurrences = projectKpSymbolicInspectionOccurrences(input);
  const key = (side: string, id: string) => JSON.stringify([side, id]);
  const byId = new Map(occurrences.map(item => [key(item.side, item.selectorId), item]));
  const relations = new Map(occurrences.map(item => [key(item.side, item.selectorId), Object.freeze(
    evidence.correspondence.filter(record => record[`${item.side}SelectorIds`].includes(item.selectorId))
  )]));
  return Object.freeze({
    evidence, occurrences,
    lookup(side: KpSymbolicInspectionOccurrence["side"], selectorId: string) {
      const id = key(side, selectorId), occurrence = byId.get(id);
      if (!occurrence) throw new KpSymbolicInspectionGap("selection", `Unknown ${side} occurrence ${selectorId}.`);
      const records = relations.get(id)!;
      // Reverse lookup preserves the authored relation and causal direction.
      // It is navigation through evidence, not a mathematical inverse.
      const opposite = side === "source" ? "target" : "source";
      const ids = [...new Set(records.flatMap(record => record[`${opposite}SelectorIds`]))];
      return Object.freeze({ occurrence, records,
        counterparts: Object.freeze(ids.map(target => byId.get(key(opposite, target))!)) });
    }
  });
}

export type KpSymbolicInspectionIndex = ReturnType<typeof createKpSymbolicInspectionIndex>;
