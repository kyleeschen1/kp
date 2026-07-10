export interface LatexFormObject {
  id: string;
  type: "latex-form";
  label: string;
  latex: string;
  summary: string;
  tags: readonly string[];
}

export interface LatexComparisonObject {
  id: string;
  type: "latex-comparison";
  label: string;
  formIds: readonly string[];
  summary: string;
}

interface CreateLatexFormObjectInput {
  id: string;
  label: string;
  latex: string;
  summary: string;
  tags?: readonly string[];
}

interface CreateLatexComparisonObjectInput {
  id: string;
  label: string;
  formIds: readonly string[];
  summary: string;
}

export function createLatexFormObject(
  input: CreateLatexFormObjectInput
): LatexFormObject {
  assertNonEmpty(input.id, "LaTeX form id");
  assertNonEmpty(input.label, `LaTeX form ${input.id} label`);
  assertNonEmpty(input.latex, `LaTeX form ${input.id} latex`);

  return {
    id: input.id,
    type: "latex-form",
    label: input.label,
    latex: input.latex,
    summary: input.summary,
    tags: input.tags ?? []
  };
}

export function createLatexComparisonObject(
  input: CreateLatexComparisonObjectInput
): LatexComparisonObject {
  assertNonEmpty(input.id, "LaTeX comparison id");
  assertNonEmpty(input.label, `LaTeX comparison ${input.id} label`);

  if (input.formIds.length < 2) {
    throw new Error(`LaTeX comparison ${input.id} must reference at least two formulas.`);
  }

  if (new Set(input.formIds).size !== input.formIds.length) {
    throw new Error(`LaTeX comparison ${input.id} must reference unique formulas.`);
  }

  return {
    id: input.id,
    type: "latex-comparison",
    label: input.label,
    formIds: input.formIds,
    summary: input.summary
  };
}

export function latexFormObjectToLatex(formula: LatexFormObject): string {
  return formula.latex;
}

function assertNonEmpty(value: string, label: string): void {
  if (value.trim().length === 0) {
    throw new Error(`${label} must not be empty.`);
  }
}
