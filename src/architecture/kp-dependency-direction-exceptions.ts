import type {
  KpDependencyCouplingKind,
  KpModuleDependencyReference
} from "./kp-dependency-direction-policy.ts";

export type KpDependencyRetirementOwner =
  | "html-output-encoding-convergence"
  | "renderer-theme-inversion"
  | "legacy-equation-sdk-disposition";

export type KpDependencyRetirementSlice =
  | "s18"
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

const htmlEncodingRetirement = {
  owner: "html-output-encoding-convergence",
  retireWhen: "Code HTML renderers use the neutral context-specific output encoder.",
  plannedSlice: "s18"
} as const;

const legacySdkRetirement = {
  owner: "legacy-equation-sdk-disposition",
  retireWhen: "The legacy public equation SDK is retired or isolated behind a neutral API.",
  plannedSlice: "s22"
} as const;

export const kpDependencyDirectionExceptions: readonly KpDependencyDirectionException[] =
  Object.freeze([
    exception(
      "html-output.python",
      "src/rendering/python-refactor-code-html.ts",
      "src/editor/html-output-encoding.ts",
      "runtime",
      htmlEncodingRetirement
    ),
    exception(
      "html-output.scheme-first-expansion",
      "src/rendering/scheme-factorial-first-expansion-html.ts",
      "src/editor/html-output-encoding.ts",
      "runtime",
      htmlEncodingRetirement
    ),
    exception(
      "html-output.scheme-full",
      "src/rendering/scheme-factorial-html.ts",
      "src/editor/html-output-encoding.ts",
      "runtime",
      htmlEncodingRetirement
    ),
    exception(
      "html-output.typescript",
      "src/rendering/typescript-refactor-code-html.ts",
      "src/editor/html-output-encoding.ts",
      "runtime",
      htmlEncodingRetirement
    ),
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
