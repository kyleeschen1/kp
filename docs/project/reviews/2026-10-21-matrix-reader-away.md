# Matrix reader away engineering evidence

Scope: [approved away continuation](../2026-10-21-matrix-reader-away.md).
Canonical host: `/experiments/matrix-column-combinations/?input=dependent-columns`.
Mathematics, authoring input, seven beats, optical profiles and prose are preserved.

## Reported final jerk

KP-MATRIX-END-JERK remains open for confirmation of the user's reported sensation.
Two objective discontinuities were reproduced and repaired:

- Native inline spans and material inline-block wrappers have different leading.
  At a 1200×950 viewport the moving result contents were 0.687 px above the native
  contents immediately before settlement. The material owner now anchors to the
  measured contents at both native endpoints and to its own cloned contents.
  Measured displacement in the same probe fell to 0.000275 px near the endpoint,
  and zero at the endpoint. This is DOM content geometry, not pixel-ink certification.
- `document.fonts.ready` was awaited before connecting any mathematical content;
  it could resolve before KaTeX faces were requested. Cold-load probes found
  stale horizontal coordinates displaced by 18.406–18.969 px. The finite numeric
  2×2 renderer now explicitly requests its Main and Size3 faces before preparation.
  Preloading Main alone was insufficient (8.781 px residual displacement); the
  emitted `bmatrix` markup confirms Size3 delimiter ownership. No unused Size1
  preload remains.

The new committed `matrix-player-lifecycle.browser.spec.ts` runs through the
existing `npm run visual:matrix-interpretations` entrypoint. It checks cold-font
blocking and final departure/arrival geometry for dependent, signed and
multi-digit sources, both result columns, desktop/phone sizes and backwards
sampling. Twelve checks passed across Chromium, Firefox and WebKit. Geometry
tolerance is 0.5 CSS px, with matching width/height and exclusive destination
ownership. This is a local numeric-reader repair, not general native compositor
certification or a claim about all possible causes of perceived jerk.

Existing transit focus color still yields to normal native color at settlement.
No new color envelope, duration, path or aesthetic treatment was chosen while the
user was away. If the remaining impression is that color change, it needs a
separate visual judgment.

## Preparation ownership

The reader observed the whole host. Opening “Check your reasoning” during playback
reproduced an unwanted pause; changes in cue height could do the same. The player
now follows the existing dot-player boundary: observe only stage dimensions,
ignore initial/unchanged observations, and rebuild only for actual geometry or
theme changes. Identical configuration events do nothing; motion-only changes
pause/render without rebuilding clones. Real resizing still rebuilds at the held
progress. Disposed callbacks cannot prepare again.

The regression keeps a handle to a prepared material occurrence: opening reading,
reapplying settings and changing only motion retain that exact connected node;
resizing replaces it. Full phone playback exercises all changing cues and must
reach `#placed` with the same material node. Thus these interactions now cause
zero clone-set rebuilds, rather than one full rebuild per host resize/config event.
No wall-time performance claim is inferred from that count.

## Verification notes

- `npm run test:matrix-interpretations`: 23 passed.
- Initial geometry probes failed as described above; repaired probes passed.
- An initial probe used a value finer than the slider's step; corrected to 0.9999.
- Initial test types incorrectly supplied a type parameter to Playwright's
  locator; repaired with a runtime input-element guard. Full typecheck rerun is
  required before the checkpoint is called verified.
- `npm run visual:matrix-interpretations -- --grep 'reading updates|phone playback' --project=firefox --project=webkit`:
  all six checks passed across the three engines, including uninterrupted full playback.
- Full `npm run typecheck` rerun passed (application, scripts, browser tests,
  Svelte with zero warnings/errors, and domains).
- Broad integration and complete-consumer costs remain for the final package.

No new framework, lesson, public API, service or retained prepared-scene cache.
Additional measurement happens at preparation, never inside the animation loop.

## Failed setup and restoration

Three reproducible failure paths violated reader ownership:

1. A failure while registering the observer left the already-registered config
   listener and observer alive. After rollback, instrumentation counted two of
   each instead of one. Player setup now registers within the existing cleanup
   transaction; partial presentation preparation also clears its material layer.
2. A browser history write rejected after installing a new source leaked that
   installed player when the old source was restored. A single `releasePlayer`
   boundary clears active ownership before disposing, and rollback releases the
   newly installed player as well. Both injected failure points now return to one
   listener/observer, preserve progress 0.64, and allow another column selection;
   final disposal returns both counts to zero.
3. Persisted-page `pageshow` prepared the old frame before reading the restored
   URL. Its settlement callback replaced an incoming `#p=0.42` with old `#p=0.64`.
   Restoration now holds the navigation guard during preparation, so the incoming
   location remains authoritative. The regression dispatches persisted lifecycle
   events and the browser's location-before-pageshow ordering; it is not a claim
   that every engine admitted a real page into its back-forward cache.

The original assertions failed before these repairs. Twelve focused checks across
three engines passed, including existing delayed-selection and preparation-error
rollback cases. A subsequent typecheck exposed TypeScript's stale narrowing of
the global active state across `install`; the explicit release boundary repairs
that without casts. The clean full typecheck rerun passed; integration follows below.

## Integration and cost

Full types passed after the release-boundary repair. Production bundle and matrix
builds passed. The application build retains its pre-existing large-chunk warning;
the complete matrix consumer gates below pass without budget amendments.

The first full matrix browser run passed 28/29 checks. The remaining assertion
compared a growing scalar's *holder* center with its native wrapper; after the
anchor repair, their different line/advance boxes need not match. The assertion
now compares the actual numeral contents on both sides, retaining its original
one-pixel center tolerance. Its focused rerun passed. A full clean rerun is
required; the initial full run is not represented as passing.

`npm run measure:semantic-cost` passed every existing consumer and forbidden-import
gate. Gzip JavaScript closure bytes, compared with the preceding committed review:

| Complete consumer | Before | After |
| --- | ---: | ---: |
| Original matrix reader | 108,184 | 108,480 |
| Projection source selected | 109,603 | 109,899 |
| Dependent source selected | 109,864 | 110,160 |
| Numeric source selected | 108,708 | 109,004 |
| Basis composition selected | 112,387 | 112,682 |
| All matrix dynamic chunks | 115,540 | 115,835 |

Matrix CSS remains 14,533 gzip bytes. No limits were increased. These are JS/CSS
closure measurements, not total network bytes including fonts or response headers.
The explicit font wait requests faces already used by this local renderer.

`npm run visual:semantic-cost -- --grep 'matrix source navigation'` passed against
the built production fixture. After warming both sources, twelve selections
issued zero new requests and retained one document, 2,772 DOM nodes and 30 event
listeners after GC. Sampled JS heap was 4.14 MB before and 4.42 MB after; this
bounded retention check does not prove constant memory or deployment performance.

Final browser verification: the full Chromium command passed all 29 checks.
The supported-browser cohort passed 33/33 using:

```sh
npm run visual:matrix-interpretations -- --project=firefox --project=webkit --grep 'cold matrix|reading updates|phone playback|partial player|persisted page|result placement|columns and coefficients|shared configuration|accepted continuity'
```

`npm run typecheck:tests` also passed after the legacy assertion correction.
The first `npm test` integration run passed 7,388/7,389 tests; its sole failure was
the generated reachability graph's scanned-file count, 5,070 instead of 5,071
after adding the browser regression module. `npm run generate:equation-reachability`
updated that count only, preserving all 68 declared roots. The clean full
`npm test` rerun passed all 7,389 tests, with zero failures, skips or cancellations.

## Outcome and return point

**COMPLETE — bounded engineering portfolio.** All four packages are satisfied;
no new aesthetic treatment or dependent visual rollout was introduced. The
objective invariants have executable safeguards, but the original subjective bug
report remains open until the user can confirm the final transfer feels right.

Return to `http://localhost:8000/experiments/matrix-column-combinations/?input=dependent-columns#sum`
and use Next to inspect settlement, then compare the other result column. The
existing shared server remains running. No further package is implied by unused
time in the four-hour ceiling. Existing unrelated editor-test and inbox changes
are preserved. The next engineering run should start from this evidence and the
user's remaining observation, not repeat the completed loading/lifecycle audit.
