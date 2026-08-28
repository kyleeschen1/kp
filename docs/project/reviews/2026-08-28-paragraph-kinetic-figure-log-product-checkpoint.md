# Paragraph Kinetic Figure: Log-Product Checkpoint

Date: 2026-08-28
Status: human checkpoint

## Candidate

The **Paragraph Kinetic Figure** is a local, stateful figure attached to one
ordinary explanatory paragraph. Its numbered controls select conceptual
reading states, while linked phrases and semantic figure entities exchange
salience in both directions.

The first exemplar is available at:

`/experiments/kinetic-figure/log-product/`

It reuses the canonical
`animation.algebra.log-product.product-to-sum` artifact and its existing
Native KaTeX compositor. The experiment owns only the paragraph, the four
reading-state projections, and their quiet document-scale styling.

## Canonical Declaration

- **Artifact:** canonical binary log-product animation.
- **Host:** isolated ordinary-document experiment route.
- **Renderers:** DOM prose salience and the canonical Native KaTeX
  log-product surface.
- **Semantic source of truth:** stable reading-state IDs plus the existing
  log-product semantic entities and transformation.

## Observable Acceptance Criteria

- Four numbered conceptual states remain directly revisitable.
- States 1 and 2 share the source equation while expressing different
  attentional intent.
- State 3 visibly pauses during the structural separation.
- State 4 settles on the canonical target.
- Selecting a state focuses its linked prose phrase; activating a prose phrase
  selects or replays the same state.
- The paragraph text and layout remain constant.
- Reduced motion reaches the same endpoints directly.

## Preservation and Rollback

- Preserve the animation asset, Native KaTeX ownership path, frozen
  `kp.article.v1` contract, catalogue, and Rule Ledger Passage candidate.
- The smallest rollback unit is the experiment route, its local state model,
  stylesheet, tests, and bootstrap branch.
- This checkpoint does not authorize a shared Kinetic Figure schema, Markdown
  DSL, global focus store, or caller migration.

## Review Question

Does this feel like an expert “look here, now see this change” gesture embedded
in a readable document, or does operating the paragraph still interrupt the
act of reading?
