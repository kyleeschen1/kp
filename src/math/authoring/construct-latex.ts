import { expressionToLatex } from "../expression.ts";
import type { KpLawEvidence } from "../algebra/law-evidence.ts";
import type { KpTypedMatrix } from "../typed-semantic-math.ts";
import type { KpMathAuthoringNotation } from "./context.ts";
import type {
  KpConstructCapabilityRequirement,
  KpConstructProjectionForm,
  KpSemanticConstructDescriptor
} from "./construct-descriptor.ts";

export interface KpLatexBasisMetadata {
  readonly id: string;
  readonly label: string;
}

export interface KpConstructLatexAuthority {
  readonly derivativeMapId?: string | undefined;
  readonly secondDerivativeMapId?: string | undefined;
  readonly domainBasis?: KpLatexBasisMetadata | undefined;
  readonly codomainBasis?: KpLatexBasisMetadata | undefined;
  readonly symmetryEvidence?: KpLawEvidence | undefined;
}

export interface KpConstructLatexProjection {
  readonly status: "projected";
  readonly kind: "construct-latex-projection";
  readonly id: string;
  readonly descriptorId: string;
  readonly form: KpConstructProjectionForm;
  readonly latex: string;
  readonly authorityIds: readonly string[];
}

export interface KpConstructLatexRepairGap {
  readonly status: "repair-required";
  readonly code: "kp.latex.construct-capability-required";
  readonly sourceId: string;
  readonly descriptorId: string;
  readonly form: KpConstructProjectionForm;
  readonly missing: readonly string[];
  readonly message: string;
  readonly repair: string;
}

export type KpConstructLatexResult =
  | KpConstructLatexProjection
  | KpConstructLatexRepairGap;

export function projectKpConstructToLatex(input: {
  readonly id: string;
  readonly descriptor: KpSemanticConstructDescriptor;
  readonly form: KpConstructProjectionForm;
  readonly source: Readonly<{
    readonly id: string;
    readonly name: string;
    readonly parameterNames: readonly string[];
  }>;
  readonly authority: KpConstructLatexAuthority;
  readonly notation: KpMathAuthoringNotation;
  readonly matrix?: KpTypedMatrix | undefined;
}): KpConstructLatexResult {
  requireText(input.id, "Construct LaTeX projection id");
  requireText(input.source.id, "Construct LaTeX source id");
  const projection = input.descriptor.projections.find(
    ({ form }) => form === input.form
  );
  if (projection === undefined) {
    throw new Error(
      `Construct ${input.descriptor.id} does not declare ${input.form}.`
    );
  }
  const missing = projection.requires.filter((requirement) =>
    !hasCapability(input.authority, requirement)
  );
  if (input.form === "expanded" && input.matrix === undefined) {
    missing.push("matrix" as KpConstructCapabilityRequirement);
  }
  if (missing.length > 0) {
    return Object.freeze({
      status: "repair-required" as const,
      code: "kp.latex.construct-capability-required" as const,
      sourceId: input.source.id,
      descriptorId: input.descriptor.id,
      form: input.form,
      missing: Object.freeze([...missing]),
      message: `${input.descriptor.construct} ${input.form} LaTeX requires ` +
        `${missing.join(", ")}.`,
      repair: "Supply the missing semantic capability metadata; no notation is inferred."
    });
  }

  const name = formatIdentifier(input.source.name);
  const parameters = input.source.parameterNames.map(formatIdentifier).join(", ");
  const application = `${name}(${parameters})`;
  const compactOperator = input.descriptor.construct === "jacobian"
    ? input.notation.jacobian
    : input.notation.hessian;
  const compact = `${compactOperator}_{${name}}(${parameters})`;
  const operator = input.descriptor.construct === "jacobian"
    ? `${input.notation.derivative}\\,${application}`
    : `${input.notation.derivative}^{2}\\,${application}`;
  const latex = input.form === "compact"
    ? compact
    : input.form === "operator"
      ? operator
      : `${compact}${basisSuperscript(input)} = ${matrixLatex(input.matrix!)}`;

  return Object.freeze({
    status: "projected" as const,
    kind: "construct-latex-projection" as const,
    id: input.id,
    descriptorId: input.descriptor.id,
    form: input.form,
    latex,
    authorityIds: Object.freeze(authorityIds(input.authority))
  });
}

function hasCapability(
  authority: KpConstructLatexAuthority,
  requirement: KpConstructCapabilityRequirement
): boolean {
  switch (requirement) {
    case "differentiable-map": return authority.derivativeMapId !== undefined;
    case "second-derivative-map":
      return authority.secondDerivativeMapId !== undefined;
    case "domain-basis": return authority.domainBasis !== undefined;
    case "codomain-basis": return authority.codomainBasis !== undefined;
    case "symmetry-evidence": return authority.symmetryEvidence !== undefined;
  }
}

function basisSuperscript(input: {
  readonly descriptor: KpSemanticConstructDescriptor;
  readonly authority: KpConstructLatexAuthority;
}): string {
  const domain = formatText(input.authority.domainBasis!.label);
  const codomain = formatText(input.authority.codomainBasis!.label);
  return input.descriptor.construct === "jacobian"
    ? `^{${codomain}\\leftarrow${domain}}`
    : `^{${codomain};${domain}}`;
}

function matrixLatex(matrix: KpTypedMatrix): string {
  return `\\begin{bmatrix}${matrix.rows.map((row) => row.map((entry) =>
    expressionToLatex(entry.expression)
  ).join(" & ")).join(" \\\\ ")}\\end{bmatrix}`;
}

function authorityIds(authority: KpConstructLatexAuthority): string[] {
  const evidence = authority.symmetryEvidence;
  return [
    authority.derivativeMapId,
    authority.secondDerivativeMapId,
    authority.domainBasis?.id,
    authority.codomainBasis?.id,
    evidence?.kind === "proved" ? evidence.authorityId :
      evidence?.kind === "tested" ? evidence.suiteId : evidence?.assumptionId
  ].filter((value): value is string => value !== undefined);
}

function formatIdentifier(value: string): string {
  requireText(value, "LaTeX semantic identifier");
  return /^[A-Za-z](?:[0-9]+)?$/.test(value) ? value : formatText(value);
}

function formatText(value: string): string {
  requireText(value, "LaTeX semantic label");
  const escaped = value.replace(/[\\{}_^%&#$~]/g, (character) =>
    `\\${character}`
  );
  return `\\mathrm{${escaped}}`;
}

function requireText(value: string, label: string): void {
  if (value.trim().length === 0) throw new Error(`${label} must not be empty.`);
}
