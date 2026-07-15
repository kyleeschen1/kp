export type KpSelectorAnnotatedLatexSegment =
  | {
      readonly kind: "latex";
      readonly latex: string;
    }
  | {
      readonly kind: "selector";
      readonly selectorId: string;
      readonly latex: string;
    };

export interface KpSelectorLatexAnnotation {
  readonly selectorId: string;
  readonly motionId: string;
  readonly latex: string;
}

export interface KpSelectorAnnotatedLatex {
  readonly id: string;
  readonly kind: "selector-annotated-latex";
  readonly rawLatex: string;
  readonly annotatedLatex: string;
  readonly annotations: readonly KpSelectorLatexAnnotation[];
}

export interface CreateKpSelectorAnnotatedLatexInput {
  readonly id: string;
  readonly expectedSelectorIds: readonly string[];
  readonly segments: readonly KpSelectorAnnotatedLatexSegment[];
}

export function createKpSelectorAnnotatedLatex(
  input: CreateKpSelectorAnnotatedLatexInput
): KpSelectorAnnotatedLatex {
  assertSafeId(input.id, "Selector-annotated LaTeX id");
  const expected = new Set(input.expectedSelectorIds);
  if (expected.size !== input.expectedSelectorIds.length) {
    throw new Error(`Selector-annotated LaTeX ${input.id} repeats an expected selector id.`);
  }

  const seen = new Set<string>();
  const annotations: KpSelectorLatexAnnotation[] = [];
  const rawParts: string[] = [];
  const annotatedParts: string[] = [];

  for (const segment of input.segments) {
    if (segment.kind === "latex") {
      rawParts.push(segment.latex);
      annotatedParts.push(segment.latex);
      continue;
    }
    assertSafeId(segment.selectorId, `Selector-annotated LaTeX ${input.id} selector id`);
    if (!expected.has(segment.selectorId)) {
      throw new Error(
        `Selector-annotated LaTeX ${input.id} includes unexpected selector ${segment.selectorId}.`
      );
    }
    if (seen.has(segment.selectorId)) {
      throw new Error(
        `Selector-annotated LaTeX ${input.id} repeats selector ${segment.selectorId}.`
      );
    }
    if (segment.latex.length === 0) {
      throw new Error(
        `Selector-annotated LaTeX ${input.id} selector ${segment.selectorId} has empty LaTeX.`
      );
    }

    seen.add(segment.selectorId);
    const motionId = `${input.id}.${segment.selectorId}`;
    const annotation = {
      selectorId: segment.selectorId,
      motionId,
      latex: segment.latex
    };
    annotations.push(annotation);
    rawParts.push(segment.latex);
    // KaTeX owns the HTML structure; KP only asks its trusted htmlData command
    // to attach a stable semantic identity to the rendered subtree.
    annotatedParts.push(`\\htmlData{kp-motion-id=${motionId}}{${segment.latex}}`);
  }

  for (const selectorId of input.expectedSelectorIds) {
    if (!seen.has(selectorId)) {
      throw new Error(
        `Selector-annotated LaTeX ${input.id} leaves selector ${selectorId} unannotated.`
      );
    }
  }

  return {
    id: input.id,
    kind: "selector-annotated-latex",
    rawLatex: rawParts.join(""),
    annotatedLatex: annotatedParts.join(""),
    annotations
  };
}

function assertSafeId(value: string, label: string): void {
  if (!/^[a-zA-Z0-9][a-zA-Z0-9._:-]*$/.test(value)) {
    throw new Error(`${label} must be a non-empty data-attribute-safe id.`);
  }
}
