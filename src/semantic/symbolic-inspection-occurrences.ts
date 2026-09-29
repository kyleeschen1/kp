import { projectKpSymbolicInspectionEvidence, type KpSymbolicInspectionInput } from "./symbolic-inspection-evidence.ts";
import type { KpSymbolicInspectionOccurrence } from "./symbolic-inspection-types.ts";

export function projectKpSymbolicInspectionOccurrences(input: KpSymbolicInspectionInput): readonly KpSymbolicInspectionOccurrence[] {
  const evidence = projectKpSymbolicInspectionEvidence(input);
  return Object.freeze((["source", "target"] as const).flatMap(side =>
    evidence[`${side}ObjectIds`].flatMap(id => {
      const object = input.bundle.objects.find(candidate => candidate.id === id)!;
      const provenance = object.provenance;
      return object.selectors.map(selector => Object.freeze({
        side, objectId: object.id, selectorId: selector.id,
        label: selector.label ?? selector.id, kind: selector.kind,
        // This is equation-object provenance, not a fabricated token source span.
        ...(provenance ? { provenance: Object.freeze({ ...provenance,
          sourceIds: Object.freeze([...provenance.sourceIds]),
          ...(provenance.diagnostics ? { diagnostics: Object.freeze(provenance.diagnostics.map(item => Object.freeze({ ...item }))) } : {})
        }) } : {})
      }));
    })
  ));
}
