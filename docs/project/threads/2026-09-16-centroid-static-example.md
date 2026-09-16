# Centroid: an annotated extraction example

User approved building the centroid/mean example first, then working on motion.
This replaces the shipping example as the current code-reader candidate, not
its language semantics or renderer. The old shipping integration checkpoint is
parked; do not count the rejected interface as accepted.

## Outcome and boundary

For a reader who knows loops and functions: recognize that computing a centroid
repeats the same accumulate/divide procedure on two coordinate arrays. Explain
how that procedure becomes `mean`, how inputs and outputs connect, and why
separate calls do not share an accumulator. Assume nonempty equal-length finite
coordinate arrays; floating-point arithmetic is not an exact-real proof.

Canonical content: `examples/programming/centroid.article.md` and executable
`centroid-before.ts` / `centroid-after.ts` beside it. Host:
`http://localhost:8000/experiments/centroid-reasoning/`. Build-time Article HTML
and TypeScript AST-derived source excerpts render a static annotated record.
Source spans establish excerpt fidelity, not animation correspondence.

One package, `centroid.static`: local numbered explanation, source-backed
excerpts, native full-source disclosures, numerical fixture checks and a small
Chromium/no-JS/print/narrow smoke. Review whether the example and reading layout
work before adding motion. One reversible implementation/evidence commit on the
documented long-running feature branch. Ceiling: 60 active minutes, including
15 minutes verification/closeout reserve; stop at the exemplar checkpoint.

Preserve shipping and mechanics hosts, all shared semantic/motion owners, and
the saved force/energy → graph queue. No animation, new runtime/compiler in the
browser, broad UI promotion, arbitrary-source equivalence claim, merge or push.
Next motion work must establish language-owned extraction correspondence and
roles; do not relabel the shipping motion plan. In particular, `sx` and `sy`
must never be shown merging into a shared runtime variable.

The teaching check is whether a reader can predict how a third coordinate
would reuse `mean`, and explain why every call initializes its own `s`.
Tests establish source fidelity and declared numerical cases, not comprehension.

## Review packet

Open <http://localhost:8000/experiments/centroid-reasoning/>. Read the two local
coordinate excerpts, their shared helper, and the shorter centroid body. Full
source is a native keyboard-operable disclosure. Judge whether the example
makes extraction worth understanding and whether the input/local/output
annotations identify what the next motion pass should explain.

The code snippets are clipped from repo-owned executable fixtures by a bounded
build-time TypeScript AST reader, not independently maintained strings. Article
prose remains in its canonical source. This required a new static publication
adapter; it is not evidence of source-only arbitrary code-animation authoring.
No runtime, dependency, motion authority, or semantic correspondence was added.
The new production route contains no JavaScript; HTML is 6.30 kB uncompressed
(2.44 kB gzip), excluding separately cached shared styles. New scoped CSS is
small and provisional; code typography reuses the existing TypeScript renderer.

Verification: six centroid/shipping publication and numeric tests; five Chromium
browser checks; full types, architecture gates and production build pass.
Screenshots inspected. No-JS, print and narrow overflow pass; phone usability is
still provisional. The build retains unrelated existing large-chunk warnings.
The impact selector had no focused rules for these new paths and proposed the
full suite. The approved discovery cadence instead used focused tests plus full
types/architecture/build; no broad cross-browser certification is claimed.

Resume after this checkpoint with the bounded semantic/motion design for one
loop becoming `mean(xs)`, retaining full local context and separate call locals.
Do not reactivate the rejected shipping promotion or skip directly to the later
force/energy and graph packages.
