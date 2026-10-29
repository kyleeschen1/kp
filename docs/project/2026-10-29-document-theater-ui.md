# Document theater UI candidate

Authority: user approved the discussion of `docs/ui_improvements.md` with “go”.
Scope: one reversible visual candidate, not a shared-host migration or rollout.

Canonical exemplar: `/reader/solve-fractional-linear/`, compiled from
`content/lessons/solve-fractional-linear.md` by the fractional lesson compiler.
The existing fractional animation asset owns mathematics and transformations;
the native KaTeX compositor owns equation paint. The passage controller owns
document flow and uses the current semantic scroll clock.

Reader outcome: an ordinary article with a visible title/byline, aligned prose,
quiet header, and a stable theater. Only real operations receive a scrubber,
which arrives and departs with its explanation. Prose approaches behind the
theater, becomes readable at its hold and withdraws into faint departing context.

Packages: (1) document shell, typography and options; (2) passage/control exchange;
(3) focused preservation checks, local desktop/phone captures and review handoff.
Use existing owners; keep exact font values, layer treatment and timing local.
Preserve native search/selection, Read all, no-JS/print, reduced motion, semantic
links, direct jumps, reversal, operation identities and equation endpoints.

Verification: focused compiler/passage tests, TypeScript checks and
`npm run visual:fractional-linear-equation -- --rising` with the existing native
paint smoke as needed. Use discovery checks before aesthetic approval; no broad
browser certification or catalogue rollout. Review smooth arrival/departure,
legibility, operation-owned controls and width alignment on desktop and phone.

Rollback: one checked commit of the local shell, passage presentation and checks.
Do not include unrelated browser-test or inbox edits. Preserve the user's UI note
as the source for this approved candidate. Commit and back up before handoff.
At most 90 minutes, reserving the last 20 for verification/closeout. Stop at the
canonical human visual checkpoint; any shared promotion needs acceptance and a
structurally different caller. Existing global Theseus backlog debt stays separate.

## Candidate and review

Implemented locally: visible title and Codex byline, Gill Sans font stack, modest
headings, ordinary prose spanning the rails and automatic paragraph indentation.
One Options menu contains navigation, reading/motion preferences, links and the
existing development toolbar. Review still owns its capture/dialog; closing it
returns focus to its menu launcher. Other readers retain their existing chrome.

The one reusable operation slider now belongs to its real paragraph, including
arrival and departure. Focus-only passages have none. The paragraph owns opacity
so the slider does not multiply the fade. Neighboring prose is faint behind the
opaque theater surface; the active passage rises to the front near its hold.
Outgoing text can briefly reappear above the frame as a faint trace. This samples
the existing scroll position with a bounded neighborhood, adds no per-frame
geometry reads or independent animation clock, and retains real searchable prose.
Reduced motion suppresses background traces. These are implementation facts,
not a new measured frame-rate improvement or approved visual language.

Preservation evidence:
- 23 focused compiler, passage, operation and animation tests passed; three
  shared shell/font-lifecycle checks passed.
- `npm run typecheck` passed, including tests, Svelte and domains.
- `npm run visual:fractional-linear-equation -- --rising --base-url=http://localhost:8000`
  passed on desktop and phone: width/centering, stable stage, reversal, control
  ownership/dragging/keyboard, native find/selection, Read all, reflow, review
  focus return, reduced-motion loading, print and no-JavaScript reading.
- `npm run visual:fractional-linear-equation -- --smoke --base-url=http://localhost:8000`
  passed 41 native paint samples, including scroll/direct-seek correspondence.
- Initial candidate checks exposed an ambiguous nested-menu selector and an
  exact-zero assertion invalidated by fractional scroll rounding. Scoped selectors
  and a visible-opacity tolerance now check the intended invariants. Neither
  correction relaxes equation paint or semantic endpoint checks.

Review at `http://localhost:8000/reader/solve-fractional-linear/`: inspect the
opening and Options, then select “Multiply both sides by two” and scroll through
and backward across its completion. Judge whether the control travels with its
passage and the faint outgoing/approaching text clarifies sequence. Exact trace
opacity and handoff timing remain provisional. Candidate delivery is complete;
human visual acceptance and any shared promotion are pending.

## Left-side control refinement

The user's follow-up authorizes a vertical slider on the left, a quicker dissolve
with the same arrival in reverse, and a slightly translucent theater surface.
Keep this on the canonical fractional reader above: one local presentation commit
is the rollback unit. The downward-filling native range follows document scroll;
its shorter presence window uses the existing scroll position, with no new clock
or geometry sampling. Only the surface becomes translucent, not mathematical paint.
Preserve operation ownership, keyboard/drag seeking, reversal, native find and
Read all. One package implements and checks this candidate on desktop and phone,
then stops for visual review; no shared promotion. Allow 45 minutes with the final
15 reserved for verification and backup. Use focused presence tests, typecheck and
the existing rising-passage browser command; no mathematical behavior changes.

Refinement delivered: the native range occupies a 24px-wide hit area inside the
left rail alongside the equation and fills downward. Arrow Down advances; Home
and End retain the operation's source/result. The control's 12px scroll-distance
presence curve combines with its paragraph's existing 24px curve, symmetrically
on arrival/departure. Layout no longer reserves space below for the old control.
The surface is 80% opaque; existing background traces therefore show through very
faintly. Active prose and equation paint retain their opacity. No new frame clock,
geometry reads, dependencies or renderer path were added.

Verification: 11 focused presence/operation/scroll tests, full `npm run typecheck`,
and the desktop/phone rising-passage browser command passed. Browser checks cover
left-side geometry, native vertical dragging/keyboard, intermediate arrival and
reversal, plus the existing search, reflow, Read all, reduced-motion, print and
no-JS checks. The unchanged native compositor's separate 41-sample smoke was not
rerun for this refinement. `git diff --check` passed.

Review the same URL via Options → “Multiply both sides by two”: drag the left
control downward, then scroll past completion and reverse to inspect the quick
dissolve/materialization. While the next paragraph approaches, judge whether the
very faint text through the surface is enough. This remains a local candidate;
human aesthetic acceptance and shared promotion are pending.

## Immediate exchange and endpoint retreat

The next user correction removes the operation slider and asks for the next
passage immediately after the previous retreats, including the last passage
forward and first passage in reverse. Canonical host, lesson, mathematical asset
and native compositor remain those above. The existing document-flow owner must
coordinate actual prose arrival/departure and theater entry/release at both ends;
mathematical progress alone cannot describe that complete document interval.
One local commit removes the rejected control, fixes the owning boundary and
adds focused forward/reverse/direct-seek regression coverage. Preserve real
searchable prose, Read all, print, reduced motion, URL state and math endpoints.
Use existing scroll sampling without per-frame measurements. Stop after this
candidate's focused checks and desktop/phone inspection; no shared promotion.
Allow 60 minutes with 15 reserved for verification, evidence and backup.

The reproduction found the same invariant violation at both ends: the theater
unpins exactly at the first arrival/last completion. A 24px retreat therefore
moved the frame and prose together, leaving their relative placement unchanged.
On desktop the first arrival was also too close to document top to rewind fully.
`npm run visual:fractional-linear-equation -- --passage-boundaries --base-url=http://localhost:8000`
failed its pinned-frame assertion before the fix; baseline sampling confirmed
both ends on desktop and phone. This was a document containment/spacing defect,
not a mathematical renderer or progress-clock defect.

The local layout now reserves withdrawal room at both ends. Every adjacent pair
gets one 24px withdrawal immediately followed by one 24px arrival, with spacing
compensated for the next paragraph's measured height. The margin may be negative:
background prose can overlap in document geometry, while their foreground windows
remain exclusive. It is measured on layout/reflow, not each frame. The theater
stays fixed through endpoint withdrawal, then releases naturally into the doc.
The slider mount, styling, presence curve and obsolete interaction harness are
removed; operation bindings still own math intervals, reflow and URL restoration.
The translucent surface and faint contextual text remain unchanged.

Final evidence: 14 focused compiler/passage tests and 12 reachability/caller tests
passed; full typecheck passed. The canonical `--rising` desktop/phone check passed
with no slider, compact exchanges, direct/reverse scroll, native search/selection,
URL restoration, font reflow, Read all, print, reduced-motion loading and no-JS.
The `--passage-boundaries` check now passes at both ends and widths: the frame
stays still through withdrawal, the paragraph moves, 0/1000 math endpoints remain
fixed and reversal reproduces intermediate state. The generated caller graph
records the removed source module; no engine path or per-frame measurement was
added. No frame-rate improvement or broad visual approval is claimed.

Review the same reader URL. Scroll through an ordinary exchange, then past the
final “solution” passage; rewind before the first passage. Text should retreat
relative to a stationary theater at both ends. Judge the shortened cadence;
the bug checks pass, while this local pacing candidate awaits visual acceptance.
