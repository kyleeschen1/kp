# Fraction preview scroll-distance repair

The user reported incorrect scroll distances after the compact-bracket change.
This repair keeps that presentation and fixes its scroll geometry; it adds no
gesture interception or snapping.

Canonical source remains the fractional-linear manuscript and semantic asset,
hosted in the notebook preview iframe through the native KaTeX compositor.

Two corrections:

- The notebook had retained the original 100px reading lead before each 280px
  mathematical operation. Its selected `animation-only` cadence now removes
  that idle lead while retaining the complete 280px motion interval. Ordinary
  readers retain their existing cadence. The compiler's inline layout and
  hydrated runtime select the same mode; zero-length holds do not create duplicate
  clock stops.
- Hiding trailing article prose in the embedded preview removed space required
  to scroll the final mathematical endpoint to the reading line. The compact
  frame's visual tail alone was insufficient. Reproduction requested scroll
  position 1992 but the browser clamped it to 1967, leaving progress at 968/1000.
  The layout now reserves at least the viewport distance below the reading line
  when the article's trailing prose is hidden. This is terminal scroll reach,
  independent of bracket height and operation duration.

The violated invariant was that every authored endpoint must be reachable by
ordinary scrolling. Its owning boundary is document layout, not the equation
renderer. Browser regression checks now include the actual 480px/440px inline
previews, the final endpoint, reverse travel and unclamped requested positions.
Earlier compact-frame checks covered reading mode and intermediate operations,
so they did not detect this embedded endpoint failure.

Verification passed (eight flow browser cases, two motion preservation cases,
21 unit tests and the scoped typecheck):

- `npm run visual:fraction-flow -- --project=firefox`: inline editing and full
  reading previews at desktop/phone widths, including exact final completion.
- `npm run visual:fraction-ridge`: mathematical motion/pacing preservation.
- `npm run typecheck:fraction-notebook`.
- `node --disable-warning=ExperimentalWarning --test tests/fractional-rising-scroll.test.ts tests/semantic-reader-page-shell.test.ts tests/fraction-notebook.test.ts`: 21 tests.

Open http://127.0.0.1:8000/experiments/fraction-notebook/ and scroll inside the
embedded preview. An operation starts when its cue reaches the reading line;
the last operation must finish at x = 8 before the scrollbar runs out. Reverse
to inspect the preceding state. Existing saved wording is untouched. These
checks establish reachability and mapping, not the user's preferred physical
wheel/trackpad pace.
