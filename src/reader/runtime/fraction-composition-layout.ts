import {
  createKpLawfulFractionSolveMacro
} from "../../semantic/fraction-solve-macro.ts";
import type {
  KpEquationStageLayoutIntent,
  KpEquationStagePhaseIntent,
  KpEquationStageRowIntent
} from "./equation-stage-layout.ts";

export type KpFractionCompositionViewport = "wide" | "phone";

export interface KpFractionCompositionLayoutRow
  extends KpEquationStageRowIntent<
    "equation" | "left-expression" | "right-relation"
  > {}

export interface KpFractionCompositionPhaseLayout
  extends KpEquationStagePhaseIntent<KpFractionCompositionLayoutRow> {}

export interface KpFractionCompositionLayoutIntent
  extends KpEquationStageLayoutIntent<KpFractionCompositionPhaseLayout> {
  readonly schemaVersion: "kp.fraction-composition-layout.v1";
  readonly viewport: KpFractionCompositionViewport;
}

export function planKpFractionCompositionLayout(input: {
  readonly viewport: KpFractionCompositionViewport;
}): KpFractionCompositionLayoutIntent {
  const macro = createKpLawfulFractionSolveMacro();
  return Object.freeze({
    schemaVersion: "kp.fraction-composition-layout.v1" as const,
    executionState: "intent" as const,
    viewport: input.viewport,
    phases: Object.freeze(macro.steps.map((step) =>
      input.viewport === "wide"
        ? Object.freeze({
            nodeId: step.id,
            policy: "single-row" as const,
            rows: Object.freeze([
              row(
                step.id,
                "equation",
                "equation",
                step.sourceStateId,
                step.targetStateId
              )
            ])
          })
        : Object.freeze({
            nodeId: step.id,
            policy: "semantic-two-row-stage" as const,
            lineChangeReason: "viewport-semantic-staging" as const,
            rows: Object.freeze([
              row(
                step.id,
                "left",
                "left-expression",
                step.sourceStateId,
                step.targetStateId,
                "left-side"
              ),
              row(
                step.id,
                "right",
                "right-relation",
                step.sourceStateId,
                step.targetStateId,
                "right-relation"
              )
            ])
          })
    )),
    geometryAuthority: "native-measurement" as const,
    operationSpecificCoordinates: false as const
  });
}

function row(
  stepId: string,
  suffix: string,
  role: KpFractionCompositionLayoutRow["role"],
  sourceStateId: string,
  targetStateId: string,
  envelopeSuffix = "equation"
): KpFractionCompositionLayoutRow {
  return Object.freeze({
    id: `row.${stepId}.${suffix}`,
    role,
    envelopeIds: Object.freeze([
      `${sourceStateId}.${envelopeSuffix}`,
      `${targetStateId}.${envelopeSuffix}`
    ])
  });
}
