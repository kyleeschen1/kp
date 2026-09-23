# Focused mechanics argument: first review

Outcome: **HUMAN_CHECKPOINT**. The first exemplar is implemented; explanatory
usefulness is not yet accepted. The [approved bounded plan](../2026-09-23-mechanics-connected-argument.md)
replaces the proposed fraction argument. The existing full mechanics page stays
available as a reference, not another page to polish in this package.

Open <http://localhost:8000/experiments/mechanics-relations/force-without-work/>.
The Article asks: **can a force change motion without changing kinetic energy?**
It connects two existing rails, then returns to the sideways-force question and
offers an upward-and-backward force as a changed case.

## Review the argument

1. Read the question and model, then use the energy rail. Does its result make
   the loss of direction information intelligible, rather than merely display
   a correct formula?
2. Continue into the force–energy rail. Open smaller steps if useful, then return.
   Does the transition from squared magnitude to power feel like one argument?
3. Read the sideways-force conclusion and try the changed case before its answer.
   Is the main reasoning clear without needing every algebra inspection?

The main judgment is whether the rails earn their place in this explanation.
If they feel like two unrelated algebra demonstrations, revise the explanatory
connection before building another UI or extending a motif family. This is human
editorial review, not evidence of independent novice learning.

## Ownership and cost

Article: `examples/physics/force-without-work.article.md`. The host uses the same
mechanics publication/compiler, reader entry, CSS, native KaTeX sessions, checked
momentum-energy and force-energy sources and pinned momentum concept. No new
physics operation, renderer, clock, animation recipe or style was added.

This is content plus host integration, not completely source-only publication:
one explicit Vite route/build entry and an optional source-path argument preserve
the new Article's provenance. The existing default source path and hosts remain
unchanged. The scoped browser harness gained this caller and the existing closure
tool gained its entry. The initial draft's raw HTML answer disclosure was rejected
by Article v1; a plain Markdown answer uses the existing language without a new
directive or compiler exception.

Both current mechanics entries have the same measured JS/CSS closure: 60,499
initial gzip bytes (18 files), 178,153 activated (59 files). The focused Article's
HTML is 628,904 bytes / 36,675 gzip versus the reference's 781,406 / 52,717. Native
equation records and inspection templates still dominate the HTML; short prose
does not imply a tiny publication. These are build measurements, excluding fonts,
images, HTTP and execution/paint, not a speedup claim. Commands:
`npm run measure:mechanics-relations-closure -- physics-argument --summary` and
the same with `physics` after `npm run build:bundle`.

## Verification

- `node --disable-warning=ExperimentalWarning --test tests/momentum-energy.test.ts`:
  30 pass, including the existing reference and a new exact-source/provenance,
  closed-link and changed-equation rejection case.
- `npm run visual:mechanics-relations -- --grep 'connected mechanics argument'`:
  two Chromium cases pass. Both native rails reach endpoints and reverse; both
  smaller-step inspections restore their held parent positions. No-JS equations,
  complete prose and shared typography are retained. Captures inspected locally.
- Full `npm run typecheck`, architecture, production build and exact reachability
  pass. Final affected test/node types also pass after harness/tool additions.
- The first browser attempt incorrectly expected ordinary End to jump instead
  of playing the whole chain. Endpoint smoke now uses the existing reduced-motion
  policy. A later selector matched every power collapse button; it now selects
  the parent control explicitly. Both were test-authoring corrections; no runtime
  behavior or target tolerance changed.

The impact selector has no focused rule for this publication owner and recommends
its broad safe suite. This pre-review package uses the agreed discovery cadence:
focused real-owner tests, one Chromium exemplar, full types/architecture/build,
not another 12-minute repository suite or cross-browser certification matrix for
unreviewed prose. Existing semantic/motion behavior is unchanged. Broader promotion
is outside this experiment; mobile/cross-browser treatment and learner outcomes
are not newly certified by these checks.

Remaining package: record the human explanation judgment and bounded editorial
corrections if requested, then close. Resume with
`theseus work context run-contract.kp.mechanics-connected-argument-v1 --mode brief`.
No fraction follow-up, historical loop, new motif or generic authoring work is
implicitly authorized by this checkpoint.
