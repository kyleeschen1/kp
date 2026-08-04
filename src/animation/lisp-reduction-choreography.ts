import type { KpLispReconstructionPlan } from
  "./lisp-reconstruction-choreography.ts";
import type {
  KpLispCanonicalMaterialState,
  KpLispSourceMaterialProjection
} from "./lisp-s-expression-material-projection.ts";
import type { KpLispLambdaApplicationFixture } from
  "../semantic/lisp-lambda-application-fixture.ts";
import { collectKpLispExpressions } from
  "../semantic/lisp-semantic-model.ts";

export interface KpLispReductionPlan {
  readonly id: "reduction.lisp.integer-addition";
  readonly operation: "reduce";
  readonly preservesStructure: false;
  readonly sourceStateId: "reconstructed";
  readonly resultStateId: "result";
  readonly sourceNativeCode: string;
  readonly resultNativeCode: string;
  readonly operator: {
    readonly materialId: string;
    readonly nativeCode: string;
    readonly structuralBeadId: string;
  };
  readonly operands: readonly {
    readonly materialId: string;
    readonly nativeCode: string;
    readonly originIds: readonly string[];
  }[];
  readonly result: {
    readonly materialId: string;
    readonly exactInteger: number;
    readonly nativeCode: string;
    readonly emittedFromOperatorId: string;
    readonly inputOriginIds: readonly string[];
  };
  readonly ledger: readonly {
    readonly materialId: string;
    readonly disposition: "operator-root" | "input-consumed" | "reduction-shell-consumed";
    readonly reason: "causal-operator" | "evaluated-input" | "native-result-settlement";
  }[];
  readonly intervals: {
    readonly structuralHold: { readonly start: 0; readonly end: 0.2 };
    readonly gather: { readonly start: 0.2; readonly end: 0.56 };
    readonly operate: { readonly start: 0.56; readonly end: 0.72 };
    readonly emit: { readonly start: 0.72; readonly end: 0.9 };
    readonly settle: { readonly start: 0.9; readonly end: 1 };
  };
}

export interface KpLispReductionSample {
  readonly phase: "structural-hold" | "gather" | "operate" | "emit" | "settle";
  readonly shellOpacity: number;
  readonly operator: {
    readonly materialId: string;
    readonly beadOpacity: number;
    readonly scale: number;
    readonly causalPulse: number;
  };
  readonly operands: readonly {
    readonly materialId: string;
    readonly gatherProgress: number;
    readonly opacity: number;
    readonly absorbed: boolean;
  }[];
  readonly result: {
    readonly materialId: string;
    readonly nativeCode: string;
    readonly opacity: number;
    readonly scale: number;
    readonly emittedFromOperatorId: string;
  };
}

const intervals = Object.freeze({
  structuralHold: Object.freeze({ start: 0 as const, end: 0.2 as const }),
  gather: Object.freeze({ start: 0.2 as const, end: 0.56 as const }),
  operate: Object.freeze({ start: 0.56 as const, end: 0.72 as const }),
  emit: Object.freeze({ start: 0.72 as const, end: 0.9 as const }),
  settle: Object.freeze({ start: 0.9 as const, end: 1 as const })
});

export function compileKpLispReductionChoreography(
  fixture: KpLispLambdaApplicationFixture,
  material: KpLispSourceMaterialProjection,
  reconstruction: KpLispReconstructionPlan
): KpLispReductionPlan {
  const reconstructed = canonical(material, "reconstructed");
  const resultState = canonical(material, "result");
  if (reconstruction.reconstructedNativeCode !== reconstructed.nativeCode ||
      resultState.nativeCode !== String(fixture.evaluation.result.exactInteger)) {
    throw new Error("Certified reduction endpoints are inconsistent.");
  }
  const destination = fixture.semantic.destinations.find(({ id }) =>
    id === fixture.evaluation.destinationId);
  const body = collectKpLispExpressions(fixture.semantic.root).find(({ id }) =>
    id === destination?.parentExpressionId);
  const operatorOrigin = body?.kind === "list" ? body.children[0] : undefined;
  if (operatorOrigin?.kind !== "atom") {
    throw new Error("Certified reduction operator is missing.");
  }
  const operator = reconstructed.tokens.find(({ originIds }) =>
    originIds.includes(operatorOrigin.id));
  const resultToken = resultState.tokens[0];
  if (operator?.kind !== "atom" || resultToken?.kind !== "atom") {
    throw new Error("Certified reduction operator or result material is missing.");
  }
  const operands = reconstructed.tokens.filter((token) =>
    token.kind === "atom" && token.id !== operator.id);
  const resultOrigins = new Set(resultToken.originIds);
  if (operands.length === 0 || operands.some(({ originIds }) =>
    !originIds.some((id) => resultOrigins.has(id)))) {
    throw new Error("Reduction result is missing certified input provenance.");
  }
  const operandIds = new Set(operands.map(({ id }) => id));
  const ledger = reconstructed.tokens.map((token) => Object.freeze(
    token.id === operator.id
      ? {
        materialId: token.id,
        disposition: "operator-root" as const,
        reason: "causal-operator" as const
      }
      : operandIds.has(token.id)
        ? {
          materialId: token.id,
          disposition: "input-consumed" as const,
          reason: "evaluated-input" as const
        }
        : {
          materialId: token.id,
          disposition: "reduction-shell-consumed" as const,
          reason: "native-result-settlement" as const
        }
  ));
  return Object.freeze({
    id: "reduction.lisp.integer-addition",
    operation: "reduce",
    preservesStructure: false,
    sourceStateId: "reconstructed",
    resultStateId: "result",
    sourceNativeCode: reconstructed.nativeCode,
    resultNativeCode: resultState.nativeCode,
    operator: Object.freeze({
      materialId: operator.id,
      nativeCode: operator.lexeme,
      structuralBeadId: `bead.reduction.${operator.id}`
    }),
    operands: Object.freeze(operands.map((operand) => Object.freeze({
      materialId: operand.id,
      nativeCode: operand.lexeme,
      originIds: Object.freeze([...operand.originIds])
    }))),
    result: Object.freeze({
      materialId: resultToken.id,
      exactInteger: fixture.evaluation.result.exactInteger,
      nativeCode: resultToken.lexeme,
      emittedFromOperatorId: operator.id,
      inputOriginIds: Object.freeze([...resultToken.originIds])
    }),
    ledger: Object.freeze(ledger),
    intervals
  });
}

export function sampleKpLispReductionChoreography(
  plan: KpLispReductionPlan,
  progress: number
): KpLispReductionSample {
  const p = stableUnit(progress);
  const gatherProgress = smoothstep(intervalProgress(intervals.gather, p));
  const operateProgress = intervalProgress(intervals.operate, p);
  const emitProgress = smoothstep(intervalProgress(intervals.emit, p));
  const settleProgress = smoothstep(intervalProgress(intervals.settle, p));
  const phase = p < intervals.structuralHold.end
    ? "structural-hold"
    : p < intervals.gather.end
      ? "gather"
      : p < intervals.operate.end
        ? "operate"
        : p < intervals.emit.end
          ? "emit"
          : "settle";
  const operandOpacity = stableUnit(1 - smoothstep(
    stableUnit((gatherProgress - 0.62) / 0.38)
  ));

  return Object.freeze({
    phase,
    shellOpacity: stableUnit(1 - gatherProgress),
    operator: Object.freeze({
      materialId: plan.operator.materialId,
      beadOpacity: phase === "settle" ? stableUnit(1 - settleProgress) : 1,
      scale: phase === "operate"
        ? round(1 + Math.sin(Math.PI * operateProgress) * 0.08)
        : 1,
      causalPulse: phase === "operate"
        ? round(Math.sin(Math.PI * operateProgress))
        : 0
    }),
    operands: Object.freeze(plan.operands.map((operand) => Object.freeze({
      materialId: operand.materialId,
      gatherProgress,
      opacity: operandOpacity,
      absorbed: p >= intervals.gather.end
    }))),
    result: Object.freeze({
      materialId: plan.result.materialId,
      nativeCode: plan.result.nativeCode,
      opacity: emitProgress,
      scale: round(0.45 + emitProgress * 0.55),
      emittedFromOperatorId: plan.result.emittedFromOperatorId
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
