import type {
  KpDependencyCouplingKind,
  KpModuleDependencyReference
} from "./kp-dependency-direction-policy.ts";

export type KpDependencyRetirementOwner =
  | "program-trace-neutralization"
  | "linear-solve-cycle-retirement"
  | "html-output-encoding-convergence"
  | "renderer-theme-inversion"
  | "legacy-equation-sdk-disposition";

export type KpDependencyRetirementSlice =
  | "s12"
  | "s15"
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

const programTraceRetirement = {
  owner: "program-trace-neutralization",
  retireWhen: "Program-trace contracts and fixtures are owned below tutorial composition.",
  plannedSlice: "s12"
} as const;

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
      "program-trace.external-port.fixture",
      "src/animation/external-programming-port.ts",
      "src/tutorial/programming-execution-trace-fixture.ts",
      "runtime",
      programTraceRetirement
    ),
    exception(
      "program-trace.external-port.contract",
      "src/animation/external-programming-port.ts",
      "src/tutorial/programming-execution-trace.ts",
      "type-only",
      programTraceRetirement
    ),
    exception(
      "program-trace.sampled-frame.contract",
      "src/animation/non-equation-sampled-frame-adapter.ts",
      "src/tutorial/programming-execution-trace.ts",
      "type-only",
      programTraceRetirement
    ),
    exception(
      "program-trace.preview.fixture",
      "src/animation/program-trace-frame-preview.ts",
      "src/tutorial/programming-execution-trace-fixture.ts",
      "runtime",
      programTraceRetirement
    ),
    exception(
      "program-trace.preview.contract",
      "src/animation/program-trace-frame-preview.ts",
      "src/tutorial/programming-execution-trace.ts",
      "type-only",
      programTraceRetirement
    ),
    exception(
      "program-trace.runtime-frame.fixture",
      "src/animation/programming-addition-runtime-frame.ts",
      "src/tutorial/programming-execution-trace-fixture.ts",
      "runtime",
      programTraceRetirement
    ),
    exception(
      "program-trace.runtime-frame.contract",
      "src/animation/programming-addition-runtime-frame.ts",
      "src/tutorial/programming-execution-trace.ts",
      "type-only",
      programTraceRetirement
    ),
    exception(
      "program-trace.semantic-asset.fixture",
      "src/semantic/program-trace-asset.ts",
      "src/tutorial/programming-execution-trace-fixture.ts",
      "runtime",
      programTraceRetirement
    ),
    exception(
      "program-trace.semantic-asset.contract",
      "src/semantic/program-trace-asset.ts",
      "src/tutorial/programming-execution-trace.ts",
      "type-only",
      programTraceRetirement
    ),
    exception(
      "linear-solve.semantic-card-cycle",
      "src/semantic/linear-solve-asset.ts",
      "src/tutorial/linear-solve-card-sample.ts",
      "runtime",
      {
        owner: "linear-solve-cycle-retirement",
        retireWhen: "The unused tutorial behavior no longer owns semantic asset construction.",
        plannedSlice: "s15"
      }
    ),
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
