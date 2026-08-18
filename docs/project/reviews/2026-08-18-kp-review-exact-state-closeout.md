# KP Review exact-state closeout

Date: 2026-08-18

## Outcome

Animation Catalogue Review now records one canonical, reproducible development state. Even when the page was opened through the legacy root URL, capture writes an explicit `view=animation-catalogue` route while preserving artifact, theme, display style, focus mode, and playhead. The note retains that exact URL alongside the existing semantic asset/progress evidence, the canonical tuning IDs, and a bounded selected-stage screenshot.

The composer now displays the captured query as well as the pathname, making state drift visible before a note is saved. Catalogue captures also record the active theme as semantic evidence.

## Collision contract

The global development dock receives reserved viewport clearance on the Catalogue surface. At wide widths the Review panel remains inside the catalogue rail; at phone widths the captured-moment sheet opens from the top. The repository-owned browser proof asserts that neither the dock nor an open Review panel intersects the scrubber at 1280px or 390px viewport widths.

## Verification

- `npm run visual:development-dock` — 2 Chromium cases pass, including exact note payload, screenshot handoff, and wide/phone collision bounds.
- `npm run test:animation-library-display` — 19 tests pass.
- `npm run test:svelte-catalogue-shell` — 36 tests pass.
- `npm run test:dev-toolbar` — 31 tests pass.
- `npm run typecheck` — TypeScript and Svelte checks pass.
- `npm run check:architecture` — dependency and authority gates pass.
- `npm run visual:animation-catalogue` reached and completed the Catalogue/Review capture against the current 45-row source projection. Its later economics checkpoint remains blocked by unrelated dirty economics state and is not evidence against this slice.

## Preservation and deferred judgment

No Review protocol migration was required: existing notes remain valid and new exactness uses already optional semantic fields plus the canonical route. Animation semantics and choreography are untouched.

The reported full-motion exponent/log jerk remains unresolved and is carried into the combined human checkpoint. Collision-free geometry and deterministic state capture do not approve that motion.
