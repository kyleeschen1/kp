export type KpReaderEquationMaterialVisualContract =
  | {
      readonly kind: "computed-style-clone";
      readonly geometryAuthority: "source-layout-context";
      readonly paintAuthority: "computed-style";
    }
  | {
      readonly kind: "measured-fraction-rule";
      readonly geometryAuthority: "material-fragment-rect";
      readonly paintAuthority: "computed-border";
    };

/**
 * Structural KaTeX artifacts can encode placement in their surrounding layout.
 * The reader infers those cases so ordinary glyphs retain lossless cloning while
 * measured artifacts do not apply their source-context offset a second time.
 */
export function resolveKpReaderEquationMaterialVisualContract(
  source: Element
): KpReaderEquationMaterialVisualContract {
  if (source.classList.contains("frac-line")) {
    return {
      kind: "measured-fraction-rule",
      geometryAuthority: "material-fragment-rect",
      paintAuthority: "computed-border"
    };
  }
  return {
    kind: "computed-style-clone",
    geometryAuthority: "source-layout-context",
    paintAuthority: "computed-style"
  };
}
