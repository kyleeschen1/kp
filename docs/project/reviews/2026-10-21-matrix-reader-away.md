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
