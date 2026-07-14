import {
  validateKpAnimationAsset,
  type KpAnimationAsset
} from "./asset.ts";
import type {
  KpLawCheckLevel
} from "../semantic/asset-transformation.ts";
import type {
  KpPortDiagnostic,
  KpPortDiagnosticSeverity,
  KpPortLossKind
} from "../semantic/asset-port.ts";
import type {
  KpLawCheckResult,
  KpLawFailure
} from "../semantic/asset-laws.ts";

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
  readonly diagnosticSummary: KpExternalAnimationPortDiagnosticSummary;
}

export interface KpExternalAnimationPortDiagnosticSummary {
  readonly total: number;
  readonly bySeverity: Readonly<Record<KpPortDiagnosticSeverity, number>>;
  readonly byLossKind: Readonly<Partial<Record<KpPortLossKind, number>>>;
  readonly codes: readonly string[];
  readonly hasErrors: boolean;
  readonly hasLoss: boolean;
  readonly preservation: KpLawCheckLevel;
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
    diagnostics,
    diagnosticSummary: summarizeKpExternalAnimationPortDiagnostics({
      preservation: result.preservation ?? port.preservation,
      diagnostics
    })
  };
}

export function summarizeKpExternalAnimationPortDiagnostics(
  result: Pick<KpExternalAnimationPortRunResult, "preservation" | "diagnostics">
): KpExternalAnimationPortDiagnosticSummary {
  const bySeverity: Record<KpPortDiagnosticSeverity, number> = {
    info: 0,
    warning: 0,
    error: 0
  };
  const byLossKind: Partial<Record<KpPortLossKind, number>> = {};
  const codes: string[] = [];

  result.diagnostics.forEach((diagnostic) => {
    bySeverity[diagnostic.severity] += 1;

    if (diagnostic.lossKind !== undefined) {
      byLossKind[diagnostic.lossKind] =
        (byLossKind[diagnostic.lossKind] ?? 0) + 1;
    }

    if (!codes.includes(diagnostic.code)) {
      codes.push(diagnostic.code);
    }
  });

  return {
    total: result.diagnostics.length,
    bySeverity,
    byLossKind,
    codes,
    hasErrors: bySeverity.error > 0,
    hasLoss: result.diagnostics.some(
      (diagnostic) => diagnostic.lossKind !== undefined
    ),
    preservation: result.preservation
  };
}

export function checkKpExternalAnimationPortLossDiagnostics(
  result: KpExternalAnimationPortRunResult
): KpLawCheckResult {
  const failures: KpLawFailure[] = [];

  if (result.preservation !== "strict" && result.diagnostics.length === 0) {
    failures.push({
      path: "diagnostics",
      message:
        `Animation port ${result.portId} must report diagnostics when preservation is ${result.preservation}.`
    });
  }

  result.diagnostics.forEach((diagnostic, index) => {
    if (
      (diagnostic.severity === "warning" || diagnostic.severity === "error") &&
      diagnostic.lossKind === undefined
    ) {
      failures.push({
        path: `diagnostics[${index}].lossKind`,
        message:
          `Animation port ${result.portId} diagnostic ${diagnostic.code} must name the loss kind.`
      });
    }
  });

  if (
    result.preservation === "strict" &&
    result.diagnostics.some((diagnostic) => diagnostic.lossKind !== undefined)
  ) {
    failures.push({
      path: "diagnostics",
      message:
        `Animation port ${result.portId} cannot claim strict preservation while reporting loss diagnostics.`
    });
  }

  return {
    lawId: "animation-port.loss-reporting",
    passed: failures.length === 0,
    failures
  };
}

function animationValidationDiagnostics(
  animation: KpAnimationAsset
): readonly KpPortDiagnostic[] {
  return validateKpAnimationAsset(animation).map((issue) => ({
    severity: "error",
    code: "animation-validation",
    lossKind: "unsupported",
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
