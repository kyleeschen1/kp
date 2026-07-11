import {
  createKpInterpreter,
  type KpInterpreter,
  type KpInterpreterDiagnostic,
  type KpInterpreterResultInput
} from "./asset-interpreter.ts";
import type { KpLawCheckLevel } from "./asset-transformation.ts";

export type KpEquationFrameSurface =
  | "katex-dom"
  | "static-latex"
  | "custom";

export type KpEquationFrameObjectRole =
  | "source"
  | "target"
  | "current"
  | "context";

export type KpEquationFrameSelectorRole =
  | "persistent"
  | "introduced"
  | "exiting"
  | "focus"
  | "context";

export interface KpEquationFrameObjectRef {
  readonly objectId: string;
  readonly role?: KpEquationFrameObjectRole | undefined;
}

export interface KpEquationFrameTransformationRef {
  readonly transformationId: string;
  readonly sourceObjectIds: readonly string[];
  readonly targetObjectIds: readonly string[];
  readonly progress: number;
}

export interface KpEquationFrameSelectorRef {
  readonly selectorId: string;
  readonly objectId: string;
  readonly role?: KpEquationFrameSelectorRole | undefined;
}

export interface KpEquationFrame {
  readonly id: string;
  readonly assetId: string;
  readonly progress: number;
  readonly surface: KpEquationFrameSurface;
  readonly activeTransformationIds: readonly string[];
  readonly objectRefs: readonly KpEquationFrameObjectRef[];
  readonly transformationRefs: readonly KpEquationFrameTransformationRef[];
  readonly selectorRefs: readonly KpEquationFrameSelectorRef[];
  readonly drillDownIds?: readonly string[] | undefined;
  readonly flashcardIds?: readonly string[] | undefined;
  readonly diagnostics: readonly KpInterpreterDiagnostic[];
}

export type KpEquationFrameInterpreter<TInput> =
  KpInterpreter<TInput, KpEquationFrame> & {
    readonly target: "katex-dom";
  };

export interface CreateKpEquationFrameInterpreterInput<TInput> {
  readonly id: string;
  readonly inputKind: string;
  readonly preservation: KpLawCheckLevel;
  readonly interpret: (
    input: TInput
  ) => KpInterpreterResultInput<KpEquationFrame>;
}

export function createKpEquationFrameInterpreter<TInput>(
  input: CreateKpEquationFrameInterpreterInput<TInput>
): KpEquationFrameInterpreter<TInput> {
  return createKpInterpreter({
    id: input.id,
    target: "katex-dom",
    inputKind: input.inputKind,
    preservation: input.preservation,
    interpret: input.interpret
  }) as KpEquationFrameInterpreter<TInput>;
}
