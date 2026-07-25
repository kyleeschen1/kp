import type {
  KpNativeKatexRenderedSceneObservation
} from "./native-katex-rendered-scene.ts";

export type KpNativeKatexAtomLifecycle =
  | "persist"
  | "merge"
  | "split"
  | "introduce"
  | "eliminate"
  | "unsupported";

export interface KpNativeKatexAtomDisposition {
  readonly id: string;
  readonly lifecycle: KpNativeKatexAtomLifecycle;
  readonly sourceAtomIds: readonly string[];
  readonly targetAtomIds: readonly string[];
  readonly semanticEntityIds: readonly string[];
  readonly reason?: string | undefined;
}

export interface KpNativeKatexSceneReconciliation {
  readonly kind: "native-katex-scene-reconciliation";
  readonly lifecycle: "renderer-session";
  readonly source: KpNativeKatexRenderedSceneObservation;
  readonly target: KpNativeKatexRenderedSceneObservation;
  readonly dispositions: readonly KpNativeKatexAtomDisposition[];
}

export function createKpNativeKatexSceneReconciliation(input: {
  readonly source: KpNativeKatexRenderedSceneObservation;
  readonly target: KpNativeKatexRenderedSceneObservation;
  readonly dispositions: readonly KpNativeKatexAtomDisposition[];
}): KpNativeKatexSceneReconciliation {
  if (input.source.endpoint !== "source" || input.target.endpoint !== "target") {
    throw new Error("Scene reconciliation requires source and target endpoints.");
  }
  const sourceIds = new Set(input.source.atoms.map(({ id }) => id));
  const targetIds = new Set(input.target.atoms.map(({ id }) => id));
  const usedSourceIds: string[] = [];
  const usedTargetIds: string[] = [];
  const dispositionIds = new Set<string>();
  for (const disposition of input.dispositions) {
    if (dispositionIds.has(disposition.id)) {
      throw new Error(`Scene disposition ${disposition.id} is duplicated.`);
    }
    dispositionIds.add(disposition.id);
    assertLifecycleArity(disposition);
    for (const id of disposition.sourceAtomIds) {
      if (!sourceIds.has(id)) {
        throw new Error(`Scene disposition ${disposition.id} has unknown source atom ${id}.`);
      }
      usedSourceIds.push(id);
    }
    for (const id of disposition.targetAtomIds) {
      if (!targetIds.has(id)) {
        throw new Error(`Scene disposition ${disposition.id} has unknown target atom ${id}.`);
      }
      usedTargetIds.push(id);
    }
  }
  assertTotalCoverage(sourceIds, usedSourceIds, "source");
  assertTotalCoverage(targetIds, usedTargetIds, "target");
  return Object.freeze({
    kind: "native-katex-scene-reconciliation",
    lifecycle: "renderer-session",
    source: input.source,
    target: input.target,
    dispositions: Object.freeze(input.dispositions.map((disposition) =>
      Object.freeze({
        ...disposition,
        sourceAtomIds: Object.freeze([...disposition.sourceAtomIds]),
        targetAtomIds: Object.freeze([...disposition.targetAtomIds]),
        semanticEntityIds: Object.freeze([...disposition.semanticEntityIds])
      })
    ))
  });
}

function assertLifecycleArity(
  disposition: KpNativeKatexAtomDisposition
): void {
  const sources = disposition.sourceAtomIds.length;
  const targets = disposition.targetAtomIds.length;
  const valid = {
    persist: sources === 1 && targets === 1,
    merge: sources >= 2 && targets === 1,
    split: sources === 1 && targets >= 2,
    introduce: sources === 0 && targets >= 1,
    eliminate: sources >= 1 && targets === 0,
    unsupported:
      (sources >= 1 || targets >= 1) &&
      disposition.reason !== undefined &&
      disposition.reason.trim() !== ""
  }[disposition.lifecycle];
  if (!valid) {
    throw new Error(
      `Scene disposition ${disposition.id} has invalid ${disposition.lifecycle} arity.`
    );
  }
}

function assertTotalCoverage(
  expected: ReadonlySet<string>,
  used: readonly string[],
  endpoint: "source" | "target"
): void {
  const duplicates = used.filter((id, index) => used.indexOf(id) !== index);
  if (duplicates.length > 0) {
    throw new Error(`Scene ${endpoint} atom ${duplicates[0]} has multiple dispositions.`);
  }
  const missing = [...expected].filter((id) => !used.includes(id));
  if (missing.length > 0) {
    throw new Error(`Scene ${endpoint} atom ${missing[0]} has no disposition.`);
  }
}
