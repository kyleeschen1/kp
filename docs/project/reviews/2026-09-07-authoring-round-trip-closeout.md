# R1 closeout and R2 handoff

Outcome: COMPLETE — the bounded reliable authoring round trip.
Authority: `2026-09-07-authoring-round-trip-long-loop-proposal.md`.
Execution record: `run-contract.kp.authoring-round-trip-v1`; Theseus owns the
slice statuses, exact verification events and terminal state.
Release implementation commit: `f20b8139b` on
`feature/20260907-authoring-round-trip`. No merge or deployment performed.

## What is now true

The supported workflow can edit, break, repair, inspect, branch and build one
coherent source revision. Invalid or superseded drafts cannot replace the last
valid preview, and publication checks actual selected source and payload bytes.
Bounded native MathML, authored prose and exact market facts survive a real
filesystem build and no-JavaScript reading. Independent variants preserve their
predecessor rather than silently borrowing another revision's facts or equations.

The equation JSON now changes the actual animation. Its frontend binds positive
numeric change-of-base operands through the existing verifier and governed source
compiler, then prepares the existing native-KaTeX surface before replacement.
The tested 2/9 and 10/100 variants require changed source, not new renderer glue.
Invalid operands, inverted/mismatched targets and forged pins return repairs.
Rapid edits, restore, disposal, resize-before-observer ordering and responsive
font changes preserve the existing clock and native paint ownership rules.

Canonical artifact: `animation.equation.logarithm-change-of-base.v1`.
Default semantic instance: `kpCanonicalLogarithmChangeOfBase`; numeric variants
come from `verifyKpLogarithmChangeOfBase`, not from an asset-ID match.
The host uses `renderKpFocusDeckScaffold`, the existing editor player and native
change-of-base compositor. It is not the log/exponent sibling on the tax page.

## Use and inspect

The existing shared development server remains on port 8000; no second persistent
server was introduced. Browser-test servers are temporary test infrastructure.

- Authoring: <http://127.0.0.1:8000/experiments/authoring-market/#equation-authoring>.
  Edit both states' `latex`, leave `semanticArguments: {}`, and choose **Compile
  equation draft**. Narration is optional Markdown. Compilation preserves the
  semantic position; narration-only edits retain the existing compositor.
- Preserved four-card reader:
  <http://127.0.0.1:8000/experiments/kinetic-figure/supply-tax/>.
- Reproducible reading edition:
  <http://127.0.0.1:8000/tmp/codex/authoring-market-editions/round-trip-review/index.html>.

The editor draft is tab-local, not a source-file write. Explicit equation inclusion
in branch export requires a displayed compiled draft. The older CLI reference
example still uses strict specimen pins; do not forge them to vary its mathematics.
Use `../authoring/authoring-round-trip-packet.md` for the source and build workflow.

## Verification and measured limits

See `2026-09-07-authoring-round-trip-release.md` for exact commands and failure
provenance. The final release has 6,672 passing tests; full types and production
build; unchanged closure/budgets on 12 reader routes; 18 built-reader checks and
nine equation-authoring checks across Chromium/Firefox/WebKit; three canonical
compositor checks; and 13 final combined source/export/build/no-JS browser checks.
All source-writing tests restore their exact input files.

The actual live planner trial passed seven cases after repairing stale evaluation
expectations. Six positive cases chose exact registered operations; three still
correctly required governed-source evidence. A false logarithm identity was
explicitly declined. There were no authority violations or silent fallbacks.
The initial failure and fresh prompt/response fingerprints remain in
`2026-09-07-authoring-round-trip-live-trial.md`.

This is not a general equation studio or full lower-undergraduate math coverage.
The interactive JSON frontend is one two-state numeric change-of-base family;
symbolic assumptions and compound operands require another verified source.
It reuses the existing numeric representation, not arbitrary-precision algebra.
The live experiment measures planning plus compiler repair guidance, not an LLM
responding to a second repair round or writing a complete pedagogical lesson.
No learner-comprehension improvement or model success-rate estimate is claimed.
The selected edition is text-and-exact-facts, not all-family graphical publication.
Free prose remains editorial: numeric edits do not silently rewrite its claims.

## Assessment of the loop

The authoring-first order was productive: it exposed missing integration and
lifecycle defects that isolated semantic/compiler tests had not shown. The user's
JSON report was an actual missed acceptance condition: narration updated, while
the animation was still fixed. Future authoring exemplars should begin with a
changed-operand-to-real-ink check, not treat a successful compile or matching ID
as proof of end-to-end binding.

The repeatable improvement is source-to-preview-to-edition coherence through
existing owners. Remaining cost was largely integration and verification: native
preparation ordering, responsive typography, explicit publication selection and
stale evidence fixtures. The release kept architecture, paint and payload gates
intact. The live trial also showed why fixtures derived from their own expected
answers cannot independently establish that an evaluation oracle is current.

## Next: R2, without silently starting it

Preserve the accepted order in `2026-09-07-reconciled-authoring-loop-horizon.md`:
R2 reusable reasoning, R3 Bayes flagship, then evidence-earned frontend/promotion
consolidation and bounded mathematical expansion. R2's detailed implementation
contract is not approved by R1 closeout.

The next proposal should use one existing distribute-then-evaluate procedure and
one parent claim/reason path. A learner can expand a difficult step, inspect its
reason with assumptions/evidence intact, and return to the same semantic location.
Full, compact and two distinct retrieval views must derive from that same source
revision. Reuse existing reference, procedure, flashcard and navigation owners;
do not create a universal ontology, scheduler or parallel renderer.

Batch one coherent parent/reason/return/projection exemplar for visual approval.
After approval, pressure the shared boundary with the existing extract-helper
code caller while retaining language-owned semantics. Bayes remains the first
new flagship, with probability-tree construction, conditioning and reordering
preserving their distinct meanings. Do not reactivate the tabled matrix asset.

Resume planning from the repository root with `theseus plan run`; read the roadmap
and this active-thread handoff. There is no remaining R1 execution to resume.
Propose R2 once, obtain its scope approval, then retain the standing rule of
autonomous nonvisual work and minimal, primarily visual, check-ins.
