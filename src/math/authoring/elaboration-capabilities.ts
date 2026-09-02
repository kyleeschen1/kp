import type {
  KpTypedLatexElaborationResult,
  KpTypedLatexSourceSpan
} from "../typed-latex-elaborator.ts";
import type { KpTypedFunction, KpTypedMathValue } from "../typed-semantic-math.ts";
import type {
  KpConstructProjectionForm,
  KpSemanticConstructDescriptor
} from "./construct-descriptor.ts";

export type KpElaborationCapabilityGapCode =
  | "kp.elaboration.domain-space-required"
  | "kp.elaboration.codomain-space-required"
  | "kp.elaboration.domain-basis-required"
  | "kp.elaboration.codomain-basis-required"
  | "kp.elaboration.domain-unit-required"
  | "kp.elaboration.codomain-unit-required"
  | "kp.elaboration.static-shape-required";

export interface KpElaborationAuthorityRef {
  readonly id: string;
}

export interface KpElaborationCapabilityGap {
  readonly status: "repair-required";
  readonly code: KpElaborationCapabilityGapCode;
  readonly path: string;
  readonly message: string;
  readonly repair: string;
  readonly sourceSpan?: KpTypedLatexSourceSpan | undefined;
}

export interface KpElaboratedFunctionCapabilityResult<
  Value extends KpTypedFunction<readonly never[], KpTypedMathValue> |
    KpTypedFunction = KpTypedFunction
> {
  readonly status: "ready" | "repair-required";
  readonly value: Value;
  readonly sourceSpans: readonly KpTypedLatexSourceSpan[];
  readonly gaps: readonly KpElaborationCapabilityGap[];
  readonly authorityIds: readonly string[];
}

type Elaborated<Value> = Extract<
  KpTypedLatexElaborationResult<Value>,
  { status: "elaborated" }
>;

export function assessKpElaboratedFunctionCapabilities<
  Value extends KpTypedFunction
>(input: {
  readonly elaboration: Elaborated<Value>;
  readonly descriptor: KpSemanticConstructDescriptor;
  readonly form: KpConstructProjectionForm;
  readonly requireUnits?: boolean | undefined;
  readonly authority?: Readonly<{
    readonly domainSpace?: KpElaborationAuthorityRef | undefined;
    readonly codomainSpace?: KpElaborationAuthorityRef | undefined;
    readonly domainBasis?: KpElaborationAuthorityRef | undefined;
    readonly codomainBasis?: KpElaborationAuthorityRef | undefined;
    readonly domainUnit?: KpElaborationAuthorityRef | undefined;
    readonly codomainUnit?: KpElaborationAuthorityRef | undefined;
    readonly staticShape?: KpElaborationAuthorityRef | undefined;
  }> | undefined;
}): KpElaboratedFunctionCapabilityResult<Value> {
  const projection = input.descriptor.projections.find(
    ({ form }) => form === input.form
  );
  if (projection === undefined) {
    throw new Error(
      `Construct ${input.descriptor.id} does not declare ${input.form}.`
    );
  }
  const firstSpan = [...input.elaboration.sourceSpans].sort(
    (left, right) => left.startOffset - right.startOffset
  )[0];
  const gaps: KpElaborationCapabilityGap[] = [];
  const addGap = (
    code: KpElaborationCapabilityGapCode,
    path: string,
    message: string,
    repair: string
  ) => gaps.push(Object.freeze({
    status: "repair-required" as const,
    code,
    path,
    message,
    repair,
    ...(firstSpan === undefined ? {} : { sourceSpan: firstSpan })
  }));
  const authority = input.authority;
  if (authority?.domainSpace === undefined) {
    addGap(
      "kp.elaboration.domain-space-required",
      "function.domain",
      "LaTeX syntax does not declare a semantic domain space.",
      "Attach an explicit domain-space authority."
    );
  }
  if (authority?.codomainSpace === undefined) {
    addGap(
      "kp.elaboration.codomain-space-required",
      "function.codomain",
      "LaTeX syntax does not declare a semantic codomain space.",
      "Attach an explicit codomain-space authority."
    );
  }
  if (
    projection.requires.includes("domain-basis") &&
    authority?.domainBasis === undefined
  ) {
    addGap(
      "kp.elaboration.domain-basis-required",
      "projection.domainBasis",
      "LaTeX syntax does not declare an ordered domain basis.",
      "Attach a validated finite domain basis."
    );
  }
  if (
    projection.requires.includes("codomain-basis") &&
    authority?.codomainBasis === undefined
  ) {
    addGap(
      "kp.elaboration.codomain-basis-required",
      "projection.codomainBasis",
      "LaTeX syntax does not declare an ordered codomain basis.",
      "Attach a validated finite codomain basis."
    );
  }
  if (input.requireUnits === true && authority?.domainUnit === undefined) {
    addGap(
      "kp.elaboration.domain-unit-required",
      "function.domainUnit",
      "LaTeX syntax does not establish a domain unit.",
      "Attach an explicit domain-unit authority."
    );
  }
  if (input.requireUnits === true && authority?.codomainUnit === undefined) {
    addGap(
      "kp.elaboration.codomain-unit-required",
      "function.codomainUnit",
      "LaTeX syntax does not establish a codomain unit.",
      "Attach an explicit codomain-unit authority."
    );
  }
  if (authority?.staticShape === undefined) {
    addGap(
      "kp.elaboration.static-shape-required",
      "function.shape",
      "Parsed dimensions are runtime values, not literal static dimensions.",
      "Use a checked runtime adapter or provide a static-shape authority."
    );
  }

  const authorityIds = Object.freeze(Object.values(authority ?? {})
    .filter((value): value is KpElaborationAuthorityRef => value !== undefined)
    .map(({ id }) => id)
    .sort());
  return Object.freeze({
    status: gaps.length === 0 ? "ready" as const : "repair-required" as const,
    value: input.elaboration.value,
    sourceSpans: input.elaboration.sourceSpans,
    gaps: Object.freeze(gaps),
    authorityIds
  });
}
