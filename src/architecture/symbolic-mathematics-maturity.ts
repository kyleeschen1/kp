export const kpSymbolicCoverageMaturityDimensions = Object.freeze([
  maturity(
    "notation-paintable",
    "Notation paintable",
    "The selected renderer can paint the notation without asserting its meaning."
  ),
  maturity(
    "semantic-representable",
    "Semantic shape representable",
    "Typed roles, grouping, scope, identity, domain, and branch evidence can represent the source and target."
  ),
  maturity(
    "operation-authoritative",
    "Operation authoritative",
    "A registered semantic operation validates the transformation or returns an exact typed gap."
  ),
  maturity(
    "exemplar-executable",
    "Exemplar executable",
    "One deterministic, seekable, reversible caller exercises the operation through a real renderer."
  ),
  maturity(
    "family-promoted",
    "Family promoted",
    "A reviewed exemplar and structurally different caller prove a bounded shared recipe."
  ),
  maturity(
    "generation-governed",
    "Generation governed",
    "Natural-language or ordered-source authoring resolves only through registered evidence and typed repair."
  )
] as const);

function maturity(
  id: string,
  label: string,
  claim: string
): Readonly<{ id: string; label: string; claim: string }> {
  return Object.freeze({ id, label, claim });
}
