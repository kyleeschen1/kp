# Paragraph Kinetic Figure: Log-Product Checkpoint

Date: 2026-08-28
Status: human checkpoint
Revision: 2

## Candidate

The **Paragraph Kinetic Figure** is a local, stateful figure attached to one
ordinary explanatory paragraph inside a larger lesson passage. Its numbered
controls select conceptual reading states, while linked phrases and semantic
figure entities exchange salience in both directions.

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
- The rewrite is an entry transition rather than a resting state: entering
  state 3 replays the canonical transformation and settles on valid target
  notation with introduced logarithm syntax and the connector emphasized.
- States 3 and 4 share the target equation while expressing change-focused
  and whole-result attention respectively.
- Selecting a state focuses its linked prose phrase; activating a prose phrase
  selects or replays the same state.
- Hover previews prose/control correspondence without moving the semantic
  playhead or changing the URL.
- A quiet, optional disclosure exposes the product-law template and domain
  conditions without making it permanent stage content.
- The paragraph text and layout remain constant.
- Reduced motion reaches the same endpoints directly.
- The figure is embedded between ordinary surrounding lesson paragraphs and
  followed by a non-example that pressures structural reading.

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
