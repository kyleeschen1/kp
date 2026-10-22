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

The optional `?author=1` host now loads a starter or local UTF-8 JSON, applies
explicitly, keeps both column controls and held progress, and downloads draft and
displayed source separately. Reload intentionally restores the starter. Imported
files are bounded at 100,000 bytes before reading; later typing or selection
invalidates a pending file read. Staging retains the mounted DOM root because the
existing player queries that root on every sample. Font preparation is shared with
the unchanged ordinary reader.

`npm run visual:matrix-authoring -- --project=chromium` passes five browser cases:
edit/apply/export/reload, file round trip and malformed UTF-8/oversize rejection,
file/preview supersession, failed mount/repeated replacement/disposal, and phone
layout plus the ordinary reader's absence of editor requests. Initial full
`npm run typecheck` also passed. Complete cost and supported-browser checks remain
integration work; the first cost run diagnosed small shared-chunk overruns and the
new editor's addition to the formerly read-only all-chunks union.
