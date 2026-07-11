import type { KpAssetBundle } from "./asset.ts";
import type { KpLawCheckLevel } from "./asset-transformation.ts";

export type KpPortDiagnosticSeverity =
  | "info"
  | "warning"
  | "error";

export type KpPortLossKind =
  | "approximate"
  | "lossy"
  | "opaque"
  | "partial"
  | "unsupported";

export interface KpPortDiagnostic {
  readonly severity: KpPortDiagnosticSeverity;
  readonly code: string;
  readonly message: string;
  readonly lossKind?: KpPortLossKind | undefined;
  readonly path?: string | undefined;
}

export interface KpExternalPortImportResult {
  readonly bundle: KpAssetBundle;
  readonly preservation?: KpLawCheckLevel | undefined;
  readonly diagnostics?: readonly KpPortDiagnostic[] | undefined;
}

export interface KpExternalPort<TInput> {
  readonly id: string;
  readonly title: string;
  readonly sourceSystem: string;
  readonly version: string;
  readonly preservation: KpLawCheckLevel;
  importAsset(input: TInput): KpExternalPortImportResult;
}

export interface CreateKpExternalPortInput<TInput> {
  readonly id: string;
  readonly title: string;
  readonly sourceSystem: string;
  readonly version: string;
  readonly preservation: KpLawCheckLevel;
  readonly importAsset: (input: TInput) => KpExternalPortImportResult;
}

export interface KpExternalPortRunResult {
  readonly portId: string;
  readonly title: string;
  readonly sourceSystem: string;
  readonly version: string;
  readonly preservation: KpLawCheckLevel;
  readonly bundle: KpAssetBundle;
  readonly diagnostics: readonly KpPortDiagnostic[];
}

export function createKpExternalPort<TInput>(
  input: CreateKpExternalPortInput<TInput>
): KpExternalPort<TInput> {
  assertNonEmpty(input.id, "Port id");
  assertNonEmpty(input.title, `Port ${input.id} title`);
  assertNonEmpty(input.sourceSystem, "sourceSystem");
  assertNonEmpty(input.version, `Port ${input.id} version`);

  return {
    id: input.id,
    title: input.title,
    sourceSystem: input.sourceSystem,
    version: input.version,
    preservation: input.preservation,
    importAsset: input.importAsset
  };
}

export function runKpExternalPort<TInput>(
  port: KpExternalPort<TInput>,
  input: TInput
): KpExternalPortRunResult {
  const result = port.importAsset(input);

  return {
    portId: port.id,
    title: port.title,
    sourceSystem: port.sourceSystem,
    version: port.version,
    preservation: result.preservation ?? port.preservation,
    bundle: result.bundle,
    diagnostics: (result.diagnostics ?? []).map((diagnostic) => ({
      severity: diagnostic.severity,
      code: diagnostic.code,
      message: diagnostic.message,
      ...(diagnostic.lossKind === undefined
        ? {}
        : { lossKind: diagnostic.lossKind }),
      ...(diagnostic.path === undefined ? {} : { path: diagnostic.path })
    }))
  };
}

function assertNonEmpty(value: string, label: string): void {
  if (value.trim().length === 0) {
    throw new Error(`${label} must not be empty.`);
  }
}
