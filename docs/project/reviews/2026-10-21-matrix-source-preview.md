# Checked matrix source preview evidence

Scope and preservation: [approved continuation](../2026-10-21-matrix-source-preview.md).

The matrix compiler now issues immutable drafts and serializes source only from
those drafts. Copying an object cannot manufacture checked authority; checking its
source again can. The matrix session uses the existing prepared-revision owner.
Displayed resource ownership remains with the host after synchronous publication.

`node --disable-warning=ExperimentalWarning --test tests/matrix-column-source.test.ts tests/matrix-column-session.test.ts`
passes all ten cases: source semantics and paint range, forged drafts, serialization,
invalid edits, preparation/publication failure, newer valid and invalid edits,
invalidation and disposal. These are objective transaction guarantees, not browser
or visual certification. Browser integration and complete cost gates follow.
