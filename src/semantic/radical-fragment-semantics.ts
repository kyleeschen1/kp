import type { KpSemanticTransformation } from "./asset-transformation.ts";
import type { SelectorCorrespondenceRecord } from "./correspondence.ts";

export interface KpRadicalFragmentSemantics {
  readonly transformation: KpSemanticTransformation;
  readonly baseRecord: SelectorCorrespondenceRecord;
  readonly notationRecords: readonly SelectorCorrespondenceRecord[];
  readonly source: {
    readonly numeratorSelectorId: string;
    readonly fractionRuleSelectorId: string;
    readonly denominatorSelectorId: string;
  };
  readonly target: {
    readonly hookSelectorId: string;
    readonly overbarSelectorId: string;
    readonly rootIndexSelectorId?: string | undefined;
    readonly radicandSelectorId: string;
    readonly radicandExponentSelectorId?: string | undefined;
  };
}

export function resolveKpRadicalFragmentSemantics(
  transformation: KpSemanticTransformation
): KpRadicalFragmentSemantics {
  if (transformation.transformType !== "rewritePowerAsRoot") {
    throw new Error(
      `Transformation ${transformation.id} is not a radical rewrite.`
    );
  }
  const map = transformation.correspondenceMap;
  if (map === undefined) {
    throw new Error(`Radical rewrite ${transformation.id} has no correspondence map.`);
  }
  const baseRecord = record(map.records, "base-becomes-radicand");
  const notationRecords = map.records.filter((candidate) => candidate !== baseRecord);
  const sourceSelectorIds = notationRecords.flatMap(
    (candidate) => candidate.sourceSelectorIds
  );
  const targetSelectorIds = notationRecords.flatMap(
    (candidate) => candidate.targetSelectorIds
  );
  return {
    transformation,
    baseRecord,
    notationRecords,
    source: {
      numeratorSelectorId: selector(sourceSelectorIds, "exponent-numerator"),
      fractionRuleSelectorId: selector(
        sourceSelectorIds,
        "exponent-fraction-line"
      ),
      denominatorSelectorId: selector(
        sourceSelectorIds,
        "exponent-denominator"
      )
    },
    target: {
      hookSelectorId: selector(targetSelectorIds, "radical-hook"),
      overbarSelectorId: selector(targetSelectorIds, "radical-overbar"),
      rootIndexSelectorId: optionalSelector(targetSelectorIds, "root-index"),
      radicandSelectorId: selector(
        baseRecord.targetSelectorIds,
        "radicand"
      ),
      radicandExponentSelectorId: optionalSelector(
        targetSelectorIds,
        "radicand-exponent"
      )
    }
  };
}

function record(
  records: readonly SelectorCorrespondenceRecord[],
  id: string
): SelectorCorrespondenceRecord {
  const result = records.find((candidate) => candidate.id === id);
  if (result === undefined) {
    throw new Error(`Radical correspondence is missing record ${id}.`);
  }
  return result;
}

function selector(selectorIds: readonly string[], suffix: string): string {
  const result = optionalSelector(selectorIds, suffix);
  if (result === undefined) {
    throw new Error(`Radical fragment semantics are missing ${suffix}.`);
  }
  return result;
}

function optionalSelector(
  selectorIds: readonly string[],
  suffix: string
): string | undefined {
  return selectorIds.find((candidate) => candidate.endsWith(`.${suffix}`));
}
