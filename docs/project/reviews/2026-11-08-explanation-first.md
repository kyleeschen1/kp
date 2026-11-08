# A complete explanation in the accepted reader

Status: the user accepts the explanation and asks to continue to the reuse
experiment. This closes the first reading checkpoint in
`run-contract.kp.explanation-first-20261108`; Theseus owns remaining execution.
Authority and exclusions: [delivery proposal](../2026-11-08-explanation-first-delivery.md).

## What the reader and author can now do

Read [What counts as one thing?](http://localhost:8011/reader/what-counts/) as a
connected explanation with reasons, a numerical check, a non-example, the zero
case and a changed-case prediction. Use Options → Read all to compare the
uninterrupted argument. Its roughly 800-word
[baseline](2026-11-08-explanation-first-baseline.md) has thirteen paragraphs;
every paragraph survives, in order, in the generated reader. Six prose passages
share four mathematical states and the existing four annotation moments.

The [Article](../../../content/authoring/algebra/what-counts.article.md) owns the
expanded prose. Authors can edit it and reload the existing development route.
The mathematical JSON, operation sequence, commentary source pin, native KaTeX
compositor, focus policy, typography and CSS are unchanged. This is local
development material, absent from the production publication manifest.

The lesson document advances to version 2; math retains revision
`sha256:7b2d98b4554f80a3456ee6891df12dfdf069f76c11af05471b727908e37f2c61`.
The page compiler now uses the existing URL decoder before hydration, rejecting
an incompatible lesson/version or invalid progress as a located repair instead
of starting a partly mounted reader. Hash-only semantic links remain valid.

## Editorial reasoning and limits

Audience: a learner familiar with addition and whole-number multiplication but
unsure what parentheses let them treat as a unit. Prior understanding is an
assumption, not measured evidence. The new ability is to explain why counts
combine only for the same whole, and why distributing preserves both parts.

The manuscript introduces copying a whole before naming factoring; repeated
addition supplies the bridge to combining counts. Regrouping real addition
supplies the bridge to distributing. The numerical example checks the result
without pretending to prove the identity. The non-example separates “same
letters appear” from “same whole is counted”; the zero case avoids an unstated
nonzero assumption. The transfer prompt asks for the reasoning in a changed case.

Visual jobs: identify the repeated whole; distinguish count from counted
quantity; inspect the contents of one copy; track both contributions on opening.
Existing reversible motion makes identity across those reorganizations visible.
The complete prose remains a useful static baseline. No novice response or
learning gain is measured; acceptance is the user's judgment of the explanation.

Screenshot review found two editorial issues before acceptance: “above” named
the wrong spatial relationship, and result-oriented wording preceded the actual
operation. The working baseline and Article now use spatially neutral and
prospective language. No reasoning was dropped to repair the timing.

## Evidence and authoring friction

- `author:check` validates the exact unchanged algebra bytes and four checkpoints.
- Four `anchored-algebra.test.ts` checks pass, including full baseline paragraph
  retention/order, exact commentary pin, static math/notes and stale-location
  rejection. These are preservation guards, not automated pedagogy assessment.
- `npm run visual:anchored-algebra -- --project=firefox`: sixteen checks pass
  across Chromium/Firefox and desktop/phone. The six longer prose units fit at
  390×844 without clipping or simultaneous annotations. Existing reversal,
  restoration, initial/reload paint, focus release, native-anchor repair,
  reduced-motion and static/Read all checks pass.
- After final wording and stale-location changes, the same command with
  `--grep "full reasoning|static reading"` passes all four relevant browser
  cases. Full typecheck and architecture checks pass; final source checks are
  recorded in Theseus alongside this candidate.
- The impact selector has no focused rule for this local build script and falls
  back to repository-wide tests. The proposal's focused preservation suite,
  complete types and architecture gate are used for this unpromoted content
  change. No compositor/runtime/style changed; production rebuilding is not
  evidence needed to judge its explanation.

One local page assembler changed; zero shared runtime or CSS files changed.
The Article adds 7,553 source bytes at initial measurement; no shipping payload
or speedup is claimed. The unchanged optional dev-review API on port 8001 is
unavailable; its proxy warnings are separate from the passing reader checks.

Observed UTC milestones: tracked work started 20:48; the baseline was written
by 20:49:33; the first complete browser cohort ran 20:51–20:53; the final focused
cohort finished 20:54. Context inspection and earlier reasoning are not isolated
in these timings. This is not a controlled generation-latency benchmark.

Remaining friction is concrete: the Article still declares its story IDs,
progress and asset pin; operation-to-passage bindings remain in the local
assembler; annotation fallback prose mirrors the runtime notes and is protected
by a parity check. A second question should demonstrate which of those
responsibilities to share. Do not infer a universal authoring schema from this
one manuscript or treat word retention as proof of an effective explanation.

## Reuse pressure: what if the whole is zero?

The second [reading](http://localhost:8011/reader/what-counts/?reading=zero)
asks a different conceptual question: why regrouping still works for a zero
whole, while division-based cancellation does not. Its approximately 600-word,
eleven-paragraph [baseline](2026-11-08-zero-whole-baseline.md) is fully retained.
The same four checked mathematical states support four prose passages and two
existing annotation moments. No new operation, numerical substitution animation,
renderer, style or clock is claimed. Numerical examples and the division
argument are editorial mathematics, not additional compiler-certified steps.

Both readings now use one bounded content registration in
`content/authoring/algebra/what-counts-readings.json`. Each has a distinct document
version; unknown reading keys, empty/duplicate versions and cross-reading
locations fail explicitly. The local assembler selects only registered files
and includes only annotation moments actually authored in the selected Article.
Future readings of these same states can change Article and registration files
without browser/runtime or CSS edits. This is a local proven seam, not promotion
of a general authoring schema or support for a new mathematical chain.

The [authoring packet](../authoring/what-counts-reader-packet.md) documents the
complete edit/check/reload path and its limits. One page-assembler repair was
needed to establish this reuse; zero shared reader runtime/CSS files changed.
The second Article adds 5,389 source bytes at measurement. Remaining manual
work includes checked operation passage IDs, asset pins, document version
updates and annotation fallback parity. These costs are visible rather than
being hidden behind a claim of general source-only generation.

Checks: six focused unit cases compile both registered readings, retain both
baselines and reject substitution/invalid registration. The stable browser
command's `different question|static reading` cohort passes both browsers,
desktop/phone fitting, native annotations, reverse traversal, share/reload,
static content and return to the original reading. Node/test type cohorts pass.
Final reruns and source state are recorded through Theseus. The original
explanation remains user-accepted; the zero reading is a checked second caller,
not a measured learner outcome or a separately accepted aesthetic treatment.

Observed milestones: reuse tracked context began 21:00 UTC; the second baseline
was written 21:02; the first selected-source browser run passed at 21:04; final
registry, preservation and packet work continued through 21:10. These are
session milestones, not isolated model-generation durations.

## Situated question and recovery

This is an authored trial exchange, not an observed learner conversation or an
on-demand model generation benchmark. The question is: “If this whole is zero,
why can we still combine its counts? Could I cancel that group from both sides
of an equality?” It points specifically to the first repeated whole, rather
than the equation in general.

- [Open the focused original question](http://localhost:8011/reader/what-counts/?kpLesson=lesson.algebra.what-counts&kpVersion=2&kpProgress=0&kpReading=0&kpFocus=state.what-counts.repeated.paint.left-factor#passage.state.what-counts.repeated).
- [Read the situated response](http://localhost:8011/reader/what-counts/?reading=zero&returnTo=%2Freader%2Fwhat-counts%2F%3FkpLesson%3Dlesson.algebra.what-counts%26kpVersion%3D2%26kpProgress%3D0%26kpReading%3D0%26kpFocus%3Dstate.what-counts.repeated.paint.left-factor%23passage.state.what-counts.repeated).
- In the response, use Options → Return to your question. The original Article,
  version, mathematical progress, reading coordinate and exact focus are retained.

The source is the same checked algebra and the response is the independent zero
reading above. The bounded `returnTo` input accepts the original reader's
relative shared address. It validates the document/version through the existing
URL codec, source revision when supplied, finite reading position, focus refs,
beat/checkpoint identity and direct-return scope before emitting a link. Stale,
missing, unknown, nested or unrelated addresses produce `location.returnTo`.
There is no new browser state store, conversation service or editor interface.

Seven focused cases include the invalid return classes. The `focused.follow-up`
browser cohort passes in Chromium and Firefox at desktop and phone widths:
capture an actual focused share address, traverse the response, return through
the normal link, and recover native focus color, annotation state and scroll
position within two pixels. The trial preserves each viewport's captured
context; arbitrary cross-device layout equivalence is not established.

This enables a human/LLM exchange using a copied focused URL and a separately
authored response. It does not yet supply an in-reader question composer,
automatic response generation, learner model or general conversation history.
Those are distinct product work, and editor ownership remains unchanged.

## Physics pressure case: accepted content, limited engineering gain

Canonical source: `examples/physics/momentum-scaling.article.md`, based on the
existing checked `physics.energy-from-momentum@1` derivation and three pinned
momentum concept includes. Canonical host: `/experiments/authored-rails/`; native
renderer: the existing mechanics equation rail and canonical KaTeX scene session.
The [baseline](2026-11-08-momentum-scaling-baseline.md) explains the factor of four,
the fixed-mass condition, direction loss and a changed momentum/mass comparison.
All twelve baseline paragraphs remain in source and static HTML. No new physics
operation, renderer, clock or CSS is introduced. The rollback unit is this source
and its focused checks; shared algebra readings remain unchanged.

The user accepts the content (“It's fine”) but questions spending an hour on
capability that already existed. That criticism is warranted: the physics
compiler, selected-source workflow, rail and native animation were pre-existing.
This package added explanatory content and preservation evidence, not new physics
authoring or animation capability. Its effort was disproportionate to that result.
The 36 semantic/publication tests and complete five-case Chromium rail cohort
pass. The two-case Chromium/Firefox candidate smoke passes after repairing two
test assumptions: full-motion keyboard targets
are animated, and navigating to the identical fragment can retain the old
document at its final dock. A diagnostic phone run measured the first equation
above the viewport and a negative pointer target, explaining the edge scroll.
The corrected probe checks a fresh zero dock, real drag, then reduced-motion
keyboard endpoints; no assertion or reader capability was removed.

The isolated browser server uses port 8014, leaving the independent checkout's
port 8000 untouched. The selected-source fixture snapshots/restores its prior
local selection. The candidate was subsequently applied with
`npm run author:rail -- --source examples/physics/momentum-scaling.article.md --apply`.
The [shared host](http://localhost:8011/experiments/authored-rails/) serves the
exact selected revision
`sha256:d9c1b83c645875dea3d84b3c3b5b21b6aa08d3f76b271409f9c05df159eb92ef`.
The local selection is ignored state under `.kp/authoring/`; the committed source
and Apply command reproduce it. The CLI prints its historical port-8000 default;
this run's verified product server is port 8011. Nothing was publicly published.

## What was new, and what remains

The new work in the accepted algebra reader is an independent longer manuscript,
a bounded registration for two readings, and a checked return link for one
scripted follow-up. Related authoring and exact-return capabilities already
existed elsewhere in KP; this is integration into this host, not invention of
those capabilities or delivery of a conversational generation system.

The physics case confirms an existing path. Additional planning, documentation
and repair of browser-probe assumptions consumed effort without comparable new
user capability. The useful boundary was visible earlier: physics still uses
its own rail host, with narrow side-column prose on phones, rather than the
accepted document theater. Broad CSS cleanup alone does not resolve that.

Historical recommendation, subsequently deferred by the
[authoring-first direction](../decisions/2026-11-08-authoring-expert-attention.md):
one physics explanation in the accepted reader presentation, preserving its
mechanics validation, native compositor, complete reasoning and refinement
authority. Keep the domain owners separate; prove the required host adapter with
one exemplar before sharing an interface or retiring an old path. No universal
semantic schema, new global salience store or editor work is implied.

The finite progression is complete after the user's content acceptance. It does
not establish general generation latency, live conversational authoring or
learner transfer. Future work admission should identify the missing user
capability before spending another package validating an already working path.
