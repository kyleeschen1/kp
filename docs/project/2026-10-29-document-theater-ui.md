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
