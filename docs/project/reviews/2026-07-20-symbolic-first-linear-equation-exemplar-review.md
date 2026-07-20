# Symbolic-first Linear Equation Exemplar Review

Date: 2026-07-20

Run contract: `run-contract.kp.symbolic-first-scrollytelling-exemplar-v0`

Canonical route: `/concepts/mathematics/linear-equations/solve-with-balance`

Status: automated gates passed; stopped for mandatory human visual review

## Outcome

The linear-equation route now opens with the simplest KP value proposition:
searchable prose on the left and the canonical `x + 3 = 7` continuity animation
on a sticky stage to the right. Ordinary document scroll selects four discrete
semantic frames. It does not scrub the animation continuously or trap scrolling.

Each selected point is independently addressable as `p.story=<beat-id>`. That
story parameter leaves the existing `2x + 3 = 8` checkpoint and timeline state
unchanged, so teachers and LLMs can link directly to a point of confusion
without conflating the two examples.

The subtraction beat is the one polished salience exemplar. As the equation
grows, the stage makes room and recenters; the operation receives the same thin
orange underline in prose and KaTeX, while persistent material and equality
remain stable. The shared animation runtime, verified trace, balance renderer,
provider, and route schema were not rewritten.

The harder equation, balance view, playback, scrubber, projections, modes, and
verification remain available below the primary story. They are outside the
opening composition rather than deleted.

## Review States

Run `npm run visual:linear-equation` to regenerate the 39-state disposable
review package under `tmp/codex/linear-equation-visual-baseline/`. Five captures
are labeled `symbolic-story-exemplar` in `manifest.json`:

| Capture | Story parameter | Expected observation |
|---|---|---|
| `symbolic-story-read-equality-desktop.png` | `read-equality` | The first viewport establishes “See concepts move,” searchable prose, and the large native KaTeX equation with no control clutter. |
| `symbolic-story-subtract-both-sides-desktop.png` | `subtract-both-sides` | Both `−3` operations appear together, fit within the stage, and share restrained salience with the linked sentence. |
| `symbolic-story-cancel-opposites-desktop.png` | `cancel-opposites` | The left inverse pair has disappeared while `x`, equality, and the right difference remain legible. |
| `symbolic-story-read-solution-desktop.png` | `read-solution` | The story settles at native `x = 4`, and the older example begins only after the primary story. |
| `symbolic-story-document-flow-phone.png` | `read-equality` | All prose remains searchable in one normal document flow, followed by the equation stage; there is no internal scroll rail or alternate mobile content tree. |

The four linkable beat IDs are `read-equality`, `subtract-both-sides`,
`cancel-opposites`, and `read-solution`. Loading a canonical room URL with
`p.story` set to any of them restores both the active prose and exact kinetic
frame.

## Human Review Questions

1. Is “See concepts move” understood from the first viewport without instruction text?
2. Does the symbolic motion feel materially continuous and inevitable rather than decorative?
3. Does the subtraction underline clarify the operation without resembling quiz UI or a generated chip system?
4. Is left-to-right prose-to-equation ordering natural, with enough stage size and whitespace?
5. Does ordinary scrolling feel frictionless while still making each meaningful point linkable?
6. Is the phone compromise acceptable: all prose first and the stage afterward, favoring searchability over simultaneous sticky coordination?
7. Is the older, denser example sufficiently secondary, or should it become an explicit closed disclosure in a later approved slice?

## Verification Evidence

| Command | Result | Scope |
|---|---|---|
| `npm test` | Passed, 1,541 tests | Unit, architecture, inference, generated catalog, server, content, runtime, and project contracts. |
| `npm run build` | Passed | Production typecheck and Vite build, including lazy story/player chunks. |
| `npm run smoke:linear-equation` | Passed, 2 tests | Canonical/snapshot routes, view switching, Review fallbacks, and disposal. |
| `npm run test:browser:linear-equation-conformance` | Passed, 3 tests | Exact native endpoints, deterministic seek/rewind, resize, and reduced motion. |
| `npm run perf:linear-equation` | Passed, 3 tests | Bounded shell shape, stable direct seeks, frame budget, and zero WebGL contexts. |
| Focused symbolic-story browser cohort | Passed, 5 tests | DOM order, searchable text, sticky layout, discrete scroll targets, salience, fit, URL independence, and direct restoration. |
| `npm run visual:linear-equation` | Passed, 39 states | Five symbolic-story states plus the existing desktop, phone, accessibility, mode, focus, and timeline cohort. |
| `theseus workspace validate` | Passed | Durable project-memory integrity at the exemplar stop. |

## Preservation And Rollback

- Content owns the story beats and semantic references; route-local adapters own
  scroll activation, animation targeting, and presentation.
- Story state is isolated in `p.story`; the existing concept checkpoint and
  `t` clock retain their original meaning.
- The canonical `continuity-v1` player and its local KaTeX surface adapter are
  reused, not copied.
- The focused visual rollback is commit `ec05678`. The independent scroll and
  URL rollback is `09b15c9`. Removing the whole symbolic-first composition does
  not require reverting provider, artifact, route-kernel, or balance work.
- No presentation policy was generalized to another concept or promoted into a
  public authoring contract.

## Residual Risks And Deferrals

- Human aesthetic acceptance is still required; automated geometry and color
  checks cannot decide whether the motion feels calm or unmistakably KP.
- On narrow screens, the normal document stack places the stage after all four
  prose beats. This preserves search and review but does not keep prose and
  geometry simultaneously visible.
- Passive scrolling updates the address bar, but the opening story does not yet
  expose a dedicated nearby “copy this point” affordance.
- The older example remains present below the story rather than inside a closed
  disclosure. This preserves existing feature tests while awaiting a reviewed
  decision about discoverability.
- Cancellation salience and final simplification were deliberately not polished
  beyond the existing canonical motion. Only subtraction is the reviewed visual
  exemplar.
- Missing-middle, FTC, economics, programming, LLM correction, arbitrary
  generated equations, WebGL, and global design-system rollout remain outside
  this contract.

## Hard Stop

Stop after committing this review package and recording the completed slice.
Do not generalize the layout, promote the presentation policy, polish another
beat, or begin another concept without explicit human visual acceptance and a
new bounded contract.
