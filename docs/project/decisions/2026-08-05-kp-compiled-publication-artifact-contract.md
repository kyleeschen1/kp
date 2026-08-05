# Compiled publication artifact contract

Status: accepted for the economics publication exemplar.

Authored Markdown remains the human source of truth. A deterministic build
step may compile it into a versioned `kp.compiled-publication-artifact.v1`
record containing the complete serializable publication payload, exact source
and payload SHA-256 identities, compiler identity, and a math manifest.

The math manifest is deliberately strict: KaTeX runs at build time with
`trust: false` and `htmlAndMathml` output. The artifact records the KaTeX
version, total fragment count, and a sorted unique source-LaTeX inventory.
Publication routes may consume that HTML but must not reinterpret authored
LaTeX at runtime. Dynamic numeric labels remain a separate retained-fragment
problem and do not weaken the static artifact contract.

Generated timestamps are excluded because they make identical sources produce
different artifacts. Staleness is detected from the Markdown digest; output
drift is detected from the payload digest. The runtime validates the cheap
schema boundary, while the build step owns cryptographic recomputation.
