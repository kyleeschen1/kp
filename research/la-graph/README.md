# Linear algebra research corpus

This is a collection of attributed textbook excerpts plus a separate KP-authored
interpretation. It is not a formally checked mathematics library. Open the local
inspection host at `/experiments/la-knowledge-graph/`.

## Reproduce

1. `npm run fetch:la-graph` downloads inert source files into ignored
   `tmp/codex/la-corpus/`, using the committed revisions and SHA-256 hashes in
   `sources.lock.json`. It fails if a pinned resource changes.
2. `npm run generate:la-graph` requires Python 3 and Poppler's `pdftotext`.
   It performs offline extraction and builds the explicitly authored overlay.
3. `npm run test:la-graph`; `npm run build:la-graph`.
4. With the shared dev server running, `npm run visual:la-graph`.

The normal viewer uses the committed JSON and needs neither Python nor downloads.
PDF extraction records its Poppler version in `corpus.json`; the initial corpus
uses `pdftotext version 26.09.0`. Other versions can produce different text from
identical PDF bytes.
Source files are never executed. The imported inventory covers root XML source
files in Beezer and ILA and chapter LaTeX directories gr/vs/map/det/jc in Hefferon.
It is a repository snapshot, not an assertion that every imported block appears
in a particular published edition. Axler is a physical-page PDF extraction.
Nested external includes, figures, interactive assets and exercise solutions are
not a complete part of this extraction. Consult the original source for context.

`corpus.json` contains source records, structural containment, proof association
where explicit, and source references. Non-record anchors resolve to containing
records while retaining their original anchor. Ambiguous or absent anchors are
retained in `unresolved`; they are not silently converted to links. A citation
does not mean a logical dependency. Proofs remain informal source text. Definition
and theorem blocks may rely on hypotheses introduced elsewhere in the book.

`interpretation.json` is generated from `scripts/la-knowledge-graph/interpret.py`:
61 explicitly authored concepts, representations, claims and counterexamples.
Reading witnesses identify relevant passages, not equivalence of definitions
across books. Only the five authored claims currently have stepwise proof
outlines; this is not comprehensive proof-step extraction. All their mathematics
is informal and reviewable, not promoted into runtime authority.

## Attribution and licenses

The source-derived portions retain their respective licenses. The collection
does not relicense these works or apply their licenses to unrelated application
code. Modifications by Kinetic Press (2026-10-01): selection, XML-to-text
normalization, LaTeX environment extraction, PDF-to-text extraction, added IDs,
metadata and links. Source phrasing is retained in the corpus; the interpreted
layer is separately labeled authored synthesis. Original source locations,
revisions and hashes are recorded for each imported file.

- **A First Course in Linear Algebra**, Robert A. Beezer, copyright 2004–2015
  in the pinned book metadata. [Original](https://linear.pugetsound.edu/).
  GNU Free Documentation License 1.2 or later; no Invariant Sections,
  Front-Cover Texts or Back-Cover Texts. Extracted portions distributed under
  GFDL 1.3; full license in `licenses/GFDL-1.3.txt`.
- **Interactive Linear Algebra**, Dan Margalit and Joseph Rabinoff, copyright
  2019 in the source file headers; exercises contributed by Larry Rolen.
  [Original](https://textbooks.math.gatech.edu/ila/). GFDL 1.3 or later, as
  stated in the source headers; full license in `licenses/GFDL-1.3.txt`.
- **Linear Algebra**, Jim Hefferon. [Original](https://hefferon.net/linearalgebra/).
  The pinned repository's LICENSE offers GFDL or CC BY-SA **2.5**; this extraction
  chooses [CC BY-SA 2.5](https://creativecommons.org/licenses/by-sa/2.5/).
  The original notice is preserved in `licenses/HEFFERON-NOTICE.txt`.
  This deliberately follows the downloaded revision's notice rather than
  assuming the current website's license statement applies to that revision.
- **Linear Algebra Done Right**, fourth edition, Sheldon Axler, copyright 2024.
  [Original](https://linear.axler.net/).
  [CC BY-NC 4.0](https://creativecommons.org/licenses/by-nc/4.0/).
  Pages contain PDF text extraction errors; links open the original physical PDF
  page. The mutable official PDF URL is content-pinned by SHA-256; a future
  official update requires an explicit source-lock update, not silent refresh.

Existing notices and identified proof contributors remain attributable to their
original sources. The graph links to the pinned source, not a claim of author
endorsement. The full GFDL and the links above travel with the research data.
