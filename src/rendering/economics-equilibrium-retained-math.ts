import retainedMathSource from
  "./economics-equilibrium-retained-math.generated.json" with { type: "json" };

interface KpEconomicsRetainedMathArtifact {
  readonly schemaVersion: "kp.economics-retained-math.v1";
  readonly engine: "katex";
  readonly engineVersion: string;
  readonly output: "htmlAndMathml";
  readonly trust: false;
  readonly sourceLatex: readonly string[];
  readonly fragments: Readonly<Record<string, string>>;
}

const retainedMath = retainedMathSource as KpEconomicsRetainedMathArtifact;

export function renderKpEconomicsRetainedInlineLatex(latex: string): string {
  const html = retainedMath.fragments[latex];
  if (html === undefined) {
    throw new Error(`Missing retained economics math fragment: ${latex}.`);
  }
  return html;
}

export function listKpEconomicsRetainedMathSources(): readonly string[] {
  return retainedMath.sourceLatex;
}
