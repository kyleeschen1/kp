import type {
  KpDependencyCouplingKind,
  KpModuleDependencyReference
} from "./kp-dependency-direction-policy.ts";

export type KpDependencyRetirementOwner =
  | "renderer-theme-inversion"
  | "legacy-equation-sdk-disposition";

export type KpDependencyRetirementSlice =
  | "s20"
  | "s22";

export interface KpDependencyDirectionException {
  readonly id: string;
  readonly importer: string;
  readonly target: string;
  readonly kind: KpDependencyCouplingKind;
  readonly owner: KpDependencyRetirementOwner;
  readonly retireWhen: string;
  readonly plannedSlice: KpDependencyRetirementSlice;
}

const legacySdkRetirement = {
  owner: "legacy-equation-sdk-disposition",
  retireWhen: "The legacy public equation SDK is retired or isolated behind a neutral API.",
  plannedSlice: "s22"
} as const;

export const kpDependencyDirectionExceptions: readonly KpDependencyDirectionException[] =
  Object.freeze([
    exception(
      "renderer-theme.distribution-area",
      "src/rendering/distribution-area-exemplar-svg.ts",
      "src/app-adapters/concept-room-theme.ts",
      "runtime",
      {
        owner: "renderer-theme-inversion",
        retireWhen: "The distribution renderer receives a neutral theme reference from its host.",
        plannedSlice: "s20"
      }
    ),
    exception(
      "legacy-sdk.manifest-type",
      "src/public/equation-animation-manifest.ts",
      "src/editor/equation-animation-catalog.ts",
      "type-only",
      legacySdkRetirement
    ),
    exception(
      "legacy-sdk.catalog-type",
      "src/public/kp-animation-sdk.ts",
      "src/editor/equation-animation-catalog.ts",
      "type-only",
      legacySdkRetirement
    ),
    exception(
      "legacy-sdk.catalog-runtime",
      "src/public/kp-animation-sdk.ts",
      "src/editor/equation-animation-catalog.ts",
      "runtime",
      legacySdkRetirement
    )
  ]);

const exceptionByEdge = new Map(
  kpDependencyDirectionExceptions.map((entry) => [
    kpDependencyDirectionExceptionKey(entry),
    entry
  ])
);

export function resolveKpDependencyDirectionException(
  reference: Pick<KpModuleDependencyReference, "importer" | "target" | "kind">
): KpDependencyDirectionException | undefined {
  return exceptionByEdge.get(kpDependencyDirectionExceptionKey(reference));
}

export function kpDependencyDirectionExceptionKey(
  reference: Pick<KpModuleDependencyReference, "importer" | "target" | "kind">
): string {
  return `${reference.kind}:${reference.importer}->${reference.target}`;
}

function exception(
  id: string,
  importer: string,
  target: string,
  kind: KpDependencyCouplingKind,
  retirement: Pick<
    KpDependencyDirectionException,
    "owner" | "retireWhen" | "plannedSlice"
  >
): KpDependencyDirectionException {
  return Object.freeze({ id, importer, target, kind, ...retirement });
}
