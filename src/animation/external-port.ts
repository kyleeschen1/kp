import {
  validateKpAnimationAsset,
  type KpAnimationAsset
} from "./asset.ts";
import type {
  KpLawCheckLevel
} from "../semantic/asset-transformation.ts";
import type {
  KpPortDiagnostic
} from "../semantic/asset-port.ts";

export interface KpExternalAnimationPortImportResult {
  readonly animation: KpAnimationAsset;
  readonly preservation?: KpLawCheckLevel | undefined;
  readonly diagnostics?: readonly KpPortDiagnostic[] | undefined;
}

export interface KpExternalAnimationPort<TInput> {
  readonly id: string;
  readonly title: string;
  readonly sourceSystem: string;
  readonly version: string;
  readonly preservation: KpLawCheckLevel;
  importAnimation(input: TInput): KpExternalAnimationPortImportResult;
}

export interface CreateKpExternalAnimationPortInput<TInput> {
  readonly id: string;
  readonly title: string;
  readonly sourceSystem: string;
  readonly version: string;
  readonly preservation: KpLawCheckLevel;
  readonly importAnimation: (
    input: TInput
  ) => KpExternalAnimationPortImportResult;
}

export interface KpExternalAnimationPortRunResult {
  readonly portId: string;
  readonly title: string;
  readonly sourceSystem: string;
  readonly version: string;
  readonly preservation: KpLawCheckLevel;
  readonly animation: KpAnimationAsset;
  readonly diagnostics: readonly KpPortDiagnostic[];
}

export function createKpExternalAnimationPort<TInput>(
  input: CreateKpExternalAnimationPortInput<TInput>
): KpExternalAnimationPort<TInput> {
  assertNonEmpty(input.id, "Animation port id");
  assertNonEmpty(input.title, `Animation port ${input.id} title`);
  assertNonEmpty(input.sourceSystem, "sourceSystem");
  assertNonEmpty(input.version, `Animation port ${input.id} version`);

  return {
    id: input.id,
    title: input.title,
    sourceSystem: input.sourceSystem,
    version: input.version,
    preservation: input.preservation,
    importAnimation: input.importAnimation
  };
}

export function runKpExternalAnimationPort<TInput>(
  port: KpExternalAnimationPort<TInput>,
  input: TInput
): KpExternalAnimationPortRunResult {
  const result = port.importAnimation(input);
  const diagnostics = [
    ...(result.diagnostics ?? []).map(clonePortDiagnostic),
    ...animationValidationDiagnostics(result.animation)
  ];

  return {
    portId: port.id,
    title: port.title,
    sourceSystem: port.sourceSystem,
    version: port.version,
    preservation: result.preservation ?? port.preservation,
    animation: result.animation,
    diagnostics
  };
}

function animationValidationDiagnostics(
  animation: KpAnimationAsset
): readonly KpPortDiagnostic[] {
  return validateKpAnimationAsset(animation).map((issue) => ({
    severity: "error",
    code: "animation-validation",
    message: formatAnimationValidationMessage(animation, issue.message),
    path: issue.path
  }));
}

function formatAnimationValidationMessage(
  animation: KpAnimationAsset,
  message: string
): string {
  const prefix = `Animation ${animation.id} `;
  const detail = message.startsWith(prefix)
    ? uppercaseFirst(message.slice(prefix.length))
    : message;

  return `Animation ${animation.id} failed validation: ${detail}`;
}

function clonePortDiagnostic(diagnostic: KpPortDiagnostic): KpPortDiagnostic {
  return {
    severity: diagnostic.severity,
    code: diagnostic.code,
    message: diagnostic.message,
    ...(diagnostic.lossKind === undefined
      ? {}
      : { lossKind: diagnostic.lossKind }),
    ...(diagnostic.path === undefined ? {} : { path: diagnostic.path })
  };
}

function uppercaseFirst(value: string): string {
  return value.length === 0
    ? value
    : `${value[0]!.toUpperCase()}${value.slice(1)}`;
}

function assertNonEmpty(value: string, label: string): void {
  if (value.trim().length === 0) {
    throw new Error(`${label} must not be empty.`);
  }
}
