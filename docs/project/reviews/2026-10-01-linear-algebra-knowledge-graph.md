# Linear algebra knowledge graph experiment

Status: research exemplar implemented; ready for inspection

The user approved building a substantial exploratory graph from Beezer,
Hefferon, Axler and Margalit/Rabinoff to inform authoring APIs. The primary
questions concern focusing, contrasting conflations, alternative representations
and transformations. Genuine definitions and proofs belong in the corpus.

This is research data and an inspection host, not a replacement mathematical
runtime or a claim that extracted knowledge is executable animation support.
Preserve source identity, assumptions, license, revision and exact location.
Separate explicit source references, proof containment, and authored semantic
connections. Extracted proofs are not formally verified proofs.

Deliver one reproducible corpus import, a dense local graph with inspectable
mathematics and proof records, and API findings grounded in its neighborhoods.
Prefer structured source over scraping pixels. Use a bounded interpreted layer
to connect books without conflating distinct source statements. Clearly expose
unresolved links, extraction limitations and source coverage.

Canonical host: `/experiments/la-knowledge-graph/`; source of truth: versioned
research JSON generated from pinned source snapshots plus an explicitly authored
interpretive layer. KaTeX renders mathematical text; it supplies no proof
authority. The rollback unit is this isolated research corpus/import/viewer.

Existing dot-product animation remains available at its visual checkpoint.
This task does not authorize rectangular integration, global API migration,
deployment, or promotion of extracted facts to checked runtime capabilities.

## Delivered evidence

The pinned import contains 155 source/license files (9,605,458 bytes), with
revision and SHA-256 provenance in `research/la-graph/sources.lock.json`.

| Source | Extracted records | Structure |
| --- | ---: | --- |
| Beezer | 1,026 | XML statements, proofs, examples and section context |
| Interactive Linear Algebra | 667 | XML statements, proofs, examples and section context |
| Hefferon | 625 | Balanced LaTeX environments; source syntax retained |
| Axler | 404 | Physical PDF pages; no invented theorem/proof boundaries |

Across the first three sources there are 269 definition blocks, 311 theorem
blocks, 409 proof blocks, 808 examples and additional lemmas/corollaries/facts.
The source graph has 3,220 explicit-reference edges, 1,586 containment edges and
394 proof-association edges. There are 916 unresolved anchors (913 Beezer,
3 ILA), retained separately. None are silently resolved through fuzzy matching.
All selected XML files parsed; this does not prove complete book coverage.

The authored overlay contains **61 nodes and 275 edges**: 162 semantic links
and 113 reading-witness links. It includes five explicit informal proof outlines
and six counterexamples/contrasts. There is no automated equivalence inference.
Definitions across the sources retain their original identities and scopes.

The viewer supports search by text, book and record kind; one-hop neighborhoods
including connections between neighbors; an exhaustive relationship list;
assumptions, proof outlines, original proofs, source links and unresolved anchors;
and bookmarkable URLs. Unsupported source TeX remains visible, not silently
rewritten. Figures and interactive geometry are not reconstructed.

## API findings

1. **An operation needs a context, not just operands.** Matrix multiplication
   can connect row/covector evaluation, column combinations, basis images,
   composition and outer products. The same contribution index `(i,k,j)` can
   support all these readings. A graph edge alone cannot supply token lineage;
   an instantiated product still needs factor identities and shape constraints.
2. **Representations must carry their choices.** A coefficient vector belongs
   to an ordered basis. Matrix representations need input and output bases.
   Inner-product views require a metric and conjugation convention. A visual
   pivot from column to row cannot decide whether it means transpose, adjoint,
   or covector construction.
3. **Claims should expose prerequisites and conclusions.** Rank–nullity needs
   a finite-dimensional domain; least-squares coefficients are unique only with
   full column rank. These conditions make useful focus targets and typed repair
   messages. Source-block extraction cannot recover all such conditions because
   some are introduced in surrounding prose or inherited book-wide conventions.
4. **Contrasts are productive graph objects.** Vector/coordinates,
   row-equivalence/similarity, pairing/inner-product, transpose/inverse and
   fit/coefficients lead naturally to small paired examples. A general `relatedTo`
   edge would erase exactly the distinctions we want to explain.
5. **Proofs need more than citations.** The five authored outlines expose
   intermediate choices and consequences; the 409 extracted proofs are genuine
   source text, but their citation links are not a machine-checked proof DAG.
   A useful next experiment would instantiate one outline with addressable
   objects, hypotheses and transformation witnesses, rather than ingest more
   books immediately.

Recommended next API trial after inspection: take the product-entry proof and
author the same matrix product through row–column evaluation, column combination
and composition, preserving contribution identity. Pressure it with polynomial
coordinates or least squares. This is a recommendation, not newly approved
runtime scope.

## Validation and measured cost

- `npm run test:la-graph`: five extractor tests and five graph/math/cost tests.
- `npm run visual:la-graph`: three Chromium checks covering source proof
  navigation, search/deep-link restoration, and 1280/390px layouts.
- `npx tsc -p tsconfig.app.json --noEmit`: passed.
- `npm run build:la-graph`: standalone production build passed.

The final JSON data is approximately 6.22 MB raw; Vite reports approximately
963 KB gzip for the two assets. The viewer JS including KaTeX is approximately
267 KB raw / 81 KB gzip, plus CSS and requested fonts. These are standalone
research-page costs, not an animation payload or a measured browser transfer on
every deployment. JSON URLs avoid importing the corpus as an enormous inferred
TypeScript type. No ordinary lesson imports this page or its data.

Retaining source section context increased data size from 5.75 MB to 6.22 MB.
The extractor initially included exercise material inside section containers;
restricting those containers to their own prose/introduction/objectives removed
that unnecessary expansion while preserving the intended context. Existing
6.5 MB raw / 1 MB gzip test ceilings still pass; no budget ceiling was raised.
PDF reproduction records `pdftotext version 26.09.0`; different extractor versions
can change PDF text despite identical source bytes.

This isolated research exemplar is ready for the user's inspection. It has not
received aesthetic approval or been promoted into shared authoring infrastructure.
The prior dot-product visual checkpoint remains separate and unchanged.
