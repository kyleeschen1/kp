import type { KpLispBoundValuePropagationPlan } from
  "./lisp-bound-value-propagation.ts";
import type { KpLispExpressionBead } from
  "./lisp-s-expression-beads.ts";
import type {
  KpLispCanonicalMaterialState,
  KpLispSourceMaterialProjection
} from "./lisp-s-expression-material-projection.ts";
import type { KpLispLambdaApplicationFixture } from
  "../semantic/lisp-lambda-application-fixture.ts";
import { collectKpLispExpressions } from
  "../semantic/lisp-semantic-model.ts";

export interface KpLispReconstructionPlan {
  readonly id: "reconstruction.lisp.lambda-application";
  readonly sourceStateId: "application";
  readonly reconstructedStateId: "reconstructed";
  readonly reconstructedNativeCode: string;
  readonly ledger: readonly {
    readonly sourceMaterialId: string;
    readonly disposition: "reconstructed" | "provenance-bead";
    readonly reason: "native-reconstruction" | "application-shell-consumed";
    readonly targetMaterialIds: readonly string[];
    readonly foldOwnerExpressionId:
      | "expr.parameters"
      | "expr.lambda"
      | "expr.application"
      | null;
  }[];
  readonly shellFold: readonly {
    readonly expressionId: "expr.parameters" | "expr.lambda" | "expr.application";
    readonly contents: { readonly start: number; readonly end: number };
    readonly parentheses: { readonly start: number; readonly end: number };
  }[];
  readonly provenanceBead: {
    readonly id: "bead.provenance.application-consumption";
    readonly sourceBeadId: string;
    readonly consumedMaterialIds: readonly string[];
    readonly temporary: true;
    readonly exitReason: "native-reconstruction-settled";
  };
  readonly intervals: {
    readonly foldShells: { readonly start: 0; readonly end: 0.38 };
    readonly holdProvenance: { readonly start: 0.38; readonly end: 0.56 };
    readonly reconstruct: { readonly start: 0.56; readonly end: 0.82 };
    readonly recenter: { readonly start: 0.82; readonly end: 1 };
  };
}

export interface KpLispReconstructionSample {
  readonly phase: "fold-shells" | "hold-provenance" | "reconstruct" | "recenter";
  readonly sourceMaterials: readonly {
    readonly materialId: string;
    readonly disposition: KpLispReconstructionPlan["ledger"][number]["disposition"];
    readonly compression: number;
    readonly opacity: number;
  }[];
  readonly provenanceBead: {
    readonly opacity: number;
    readonly scale: number;
  };
  readonly reconstructed: {
    readonly nativeCode: string;
    readonly opacity: number;
    readonly scale: number;
    readonly recenterProgress: number;
  };
}

const intervals = Object.freeze({
  foldShells: Object.freeze({ start: 0 as const, end: 0.38 as const }),
  holdProvenance: Object.freeze({ start: 0.38 as const, end: 0.56 as const }),
  reconstruct: Object.freeze({ start: 0.56 as const, end: 0.82 as const }),
  recenter: Object.freeze({ start: 0.82 as const, end: 1 as const })
});

const shellFold = Object.freeze([
  fold("expr.parameters", [0, 0.08], [0.03, 0.12]),
  fold("expr.lambda", [0.12, 0.2], [0.15, 0.26]),
  fold("expr.application", [0.26, 0.32], [0.29, 0.38])
] as const);

export function compileKpLispReconstructionChoreography(
  fixture: KpLispLambdaApplicationFixture,
  material: KpLispSourceMaterialProjection,
  beads: readonly KpLispExpressionBead[],
  propagation: KpLispBoundValuePropagationPlan
): KpLispReconstructionPlan {
  const application = canonical(material, "application");
  const reconstructed = canonical(material, "reconstructed");
  if (reconstructed.nativeCode !== fixture.evaluation.reconstructed.text ||
      propagation.bindingId !== fixture.evaluation.bindingId) {
    throw new Error("Certified reconstruction endpoint is inconsistent.");
  }
  const destination = fixture.semantic.destinations.find(({ id }) =>
    id === fixture.evaluation.destinationId);
  const body = collectKpLispExpressions(fixture.semantic.root).find(({ id }) =>
    id === destination?.parentExpressionId);
  if (body?.kind !== "list") {
    throw new Error("Certified reconstruction body is missing.");
  }
  const requiredOrigins = new Set([
    body.delimiters.open.id,
    body.delimiters.close.id,
    ...fixture.evaluation.occurrences.flatMap(({ originExpressionIds }) =>
      originExpressionIds)
  ]);
  const projectedOrigins = new Set(reconstructed.tokens.flatMap(({ originIds }) =>
    originIds));
  if ([...requiredOrigins].some((id) => !projectedOrigins.has(id))) {
    throw new Error("Native reconstruction is missing certified source provenance.");
  }
  const applicationBead = beads.find(({ expressionId }) =>
    expressionId === fixture.semantic.root.id);
  if (applicationBead === undefined) {
    throw new Error("Application provenance bead source is missing.");
  }
  const ledger = application.tokens.map((source) => {
    const targets = reconstructed.tokens.filter(({ originIds }) =>
      originIds.includes(source.id)).map(({ id }) => id);
    const reconstructedMaterial = targets.length > 0;
    return Object.freeze({
      sourceMaterialId: source.id,
      disposition: reconstructedMaterial
        ? "reconstructed" as const
        : "provenance-bead" as const,
      reason: reconstructedMaterial
        ? "native-reconstruction" as const
        : "application-shell-consumed" as const,
      targetMaterialIds: Object.freeze(targets),
      foldOwnerExpressionId: reconstructedMaterial
        ? null
        : requireFoldOwner(source.ownerExpressionId)
    });
  });
  const consumedMaterialIds = ledger.filter(({ disposition }) =>
    disposition === "provenance-bead").map(({ sourceMaterialId }) => sourceMaterialId);
  if (consumedMaterialIds.length === 0) {
    throw new Error("Reconstruction requires explicit consumed shell material.");
  }
  return Object.freeze({
    id: "reconstruction.lisp.lambda-application",
    sourceStateId: "application",
    reconstructedStateId: "reconstructed",
    reconstructedNativeCode: reconstructed.nativeCode,
    ledger: Object.freeze(ledger),
    shellFold,
    provenanceBead: Object.freeze({
      id: "bead.provenance.application-consumption",
      sourceBeadId: applicationBead.id,
      consumedMaterialIds: Object.freeze(consumedMaterialIds),
      temporary: true,
      exitReason: "native-reconstruction-settled"
    }),
    intervals
  });
}

export function sampleKpLispReconstructionChoreography(
  plan: KpLispReconstructionPlan,
  progress: number
): KpLispReconstructionSample {
  const p = stableUnit(progress);
  const reconstructionProgress = smoothstep(intervalProgress(intervals.reconstruct, p));
  const recenterProgress = smoothstep(intervalProgress(intervals.recenter, p));
  const phase = p < intervals.foldShells.end
    ? "fold-shells"
    : p < intervals.holdProvenance.end
      ? "hold-provenance"
      : p < intervals.reconstruct.end
        ? "reconstruct"
        : "recenter";
  const shellCompression = new Map(plan.shellFold.map((fold) => [
    fold.expressionId,
    smoothstep(intervalProgress(fold.parentheses, p))
  ]));
  const beadEntrance = smoothstep(intervalProgress(intervals.foldShells, p));

  return Object.freeze({
    phase,
    sourceMaterials: Object.freeze(plan.ledger.map((entry) => {
      const compression = entry.foldOwnerExpressionId === null
        ? 0
        : shellCompression.get(entry.foldOwnerExpressionId) ?? 0;
      return Object.freeze({
        materialId: entry.sourceMaterialId,
        disposition: entry.disposition,
        compression,
        opacity: entry.disposition === "provenance-bead"
          ? stableUnit(1 - compression)
          : stableUnit(1 - reconstructionProgress)
      });
    })),
    provenanceBead: Object.freeze({
      opacity: phase === "fold-shells"
        ? beadEntrance
        : phase === "recenter"
          ? stableUnit(1 - recenterProgress)
          : 1,
      scale: phase === "fold-shells"
        ? round(0.58 + beadEntrance * 0.42)
        : phase === "recenter"
          ? round(1 - recenterProgress * 0.18)
          : 1
    }),
    reconstructed: Object.freeze({
      nativeCode: plan.reconstructedNativeCode,
      opacity: reconstructionProgress,
      scale: round(0.9 + reconstructionProgress * 0.1),
      recenterProgress
    })
  });
}

function canonical(
  projection: KpLispSourceMaterialProjection,
  id: KpLispCanonicalMaterialState["id"]
): KpLispCanonicalMaterialState {
  const state = projection.canonicalStates.find((candidate) => candidate.id === id);
  if (state === undefined) throw new Error(`Missing canonical Lisp state ${id}.`);
  return state;
}

function requireFoldOwner(ownerExpressionId: string) {
  if (ownerExpressionId !== "expr.parameters" &&
      ownerExpressionId !== "expr.lambda" &&
      ownerExpressionId !== "expr.application") {
    throw new Error(
      `Consumed material ${ownerExpressionId} has no application-shell fold reason.`
    );
  }
  return ownerExpressionId;
}

function fold(
  expressionId: "expr.parameters" | "expr.lambda" | "expr.application",
  contents: readonly [number, number],
  parentheses: readonly [number, number]
) {
  return Object.freeze({
    expressionId,
    contents: Object.freeze({ start: contents[0], end: contents[1] }),
    parentheses: Object.freeze({ start: parentheses[0], end: parentheses[1] })
  });
}

function intervalProgress(
  interval: { readonly start: number; readonly end: number },
  progress: number
): number {
  return stableUnit((progress - interval.start) / (interval.end - interval.start));
}

function smoothstep(value: number): number {
  return stableUnit(value * value * (3 - 2 * value));
}

function stableUnit(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return round(Math.max(0, Math.min(1, value)));
}

function round(value: number): number {
  return Math.round(value * 1e9) / 1e9;
}
