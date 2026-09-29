# Inspectable symbolic transformations: long-loop proposal

Status: APPROVED by the user on 2026-09-29; Theseus owns execution
Source: [imported semantic runtime handoff](inbox/kp_semantic_runtime_codex_handoff.md)
Context: [nonprofit toolmaking direction](reviews/2026-09-23-medium-and-toolmaking-direction.md)

## Outcome and authority

Deliver one auditable symbolic transformation through existing KP owners, then
demonstrate bounded reuse on one structurally different supported transformation.
A user can identify what changed, trace an occurrence to its semantic source,
inspect the operation and its actual validation evidence, and return to exactly
the same animation position. Authoring a supported variation should reuse these
capabilities without per-occurrence manual annotation or another renderer.

This is an approved 24-slice long run, not adoption of the imported document's
entire runtime, ten phases, or three-fixture deliverable. The user approved the
proposal with “approve”; the slice-13 visual checkpoint remains mandatory.
Estimated active work: 8–16 hours, low confidence, plus human review latency.
Discovery may show the approved boundary is insufficient; stop instead of
building a replacement architecture. Do not pad completed work to consume time.

Approved contract ID:
`run-contract.kp.symbolic-inspection-v1`, targeting one newly recorded bounded
next action under `workflow.kp.delivery`.
The existing mechanics checkpoint stays unaccepted and preserved; it is not a
dependency on this proposed toolmaking experiment.

## Inspected evidence and dependencies

The canonical vocabulary already defines semantic objects, transformations,
trace, score, motion plans, renderers, and a narrower meaning of vignette.
Source inspection found existing owners:

- `src/semantic/object-registry.ts` is exercised by
  `tests/semantic-object-registry.test.ts`; metadata is separate from behavior.
- `src/semantic/semantic-entity-provenance.ts` validates entity provenance and
  referenced entities; do not introduce another global entity registry.
- `src/semantic/distribution-canonical-operation.ts` supplies operation roles,
  lineage, examples and executable binding/cardinality checks. These are not
  a general theorem prover or proof that every possible algebra input is valid.
- `src/semantic/distribution-correspondence.ts` distinguishes factor fan-out,
  persistent terms, exiting grouping and introduced punctuation.
- `src/reader/app/authoring-distribution-preview.ts` restores an exact canonical
  specimen with version pins and explicitly rejects arbitrary deserialization.
  Do not turn that transport into a general importer by weakening its checks.
- `tests/authoring-distribution-focus-card.browser.spec.ts` exercises native
  motion, direct states, reversal, interruption and preparation behavior.
- Semantic-state and derived-graph modules already exist; their suitability
  for this feature needs focused inspection, not a new implementation by default.

These are bounded reads, not a complete implementation audit. Slices 1–3 resolve
the owner and transport gaps before dependent implementation.
The global Theseus capsule reports no ready successor. `plan refill --limit 5`
failed its output budget (833/800 tokens); no candidates were materialized.
Use named context for this proposal; generic planner maintenance is excluded.

## Canonical exemplar and preservation boundary

Reference host: `/experiments/authoring-distribution-focus-card/`.
Artifact: the existing prepared distribution specimen restored by
`restoreKpReaderAuthoringDistributionPreview`, based on
`createKpFractionCompositionEquationAnimationAsset`.
Semantic truth: its domain-owned source, operation bindings and correspondence,
not the generated inspector text or rendered glyphs.
Renderer: the host's existing canonical native-KaTeX equation session and
registered distribution presentation plan. Slice 2 records the exact host entry,
session creation path, asset and source revisions before changing any visible UI.

Build the inspection treatment as an opt-in extension of this host, with a
working shared-server URL. Reuse existing focus/attention and typography owners.
Keep the approved equation geometry, timing, native endpoints, source contracts,
clock, accessibility, source copying and existing ordinary reader routes intact.
No new universal renderer, salience store, solver, generic matcher or ontology.

Smallest visual rollback unit: the opt-in host integration and its local view.
Semantic additions must remain independently reversible, with no catalogue-wide
migration. Each slice is one focused commit with its Theseus evidence.

## Verification and stop conventions

Every slice first previews `npm run verify:impact -- --path <changed-path>`.
Use direct Node test invocations for the owning tests. The table names test
subjects where new tests are needed; those are planned checks, not existing or
already-passing commands. Establish stable `test:symbolic-inspection` and
`visual:symbolic-inspection` commands before repeated use. Browser driving lives
in committed tests/scripts; disposable outputs go under `tmp/codex/`.

- **F (focused):** named focused checks and Theseus workspace validation after
  durable mutations. Documentation-only slices use link/diff checks.
- **S (standard):** F plus `npm run typecheck`.
- **B (broad):** S plus affected subsystem integration, architecture and relevant
  build/closure checks. During discovery use one Chromium canary; reserve the
  full responsive/browser cohort and repository suite for release.
- **V (human):** executable evidence plus the concrete visual/runtime judgment
  described below. Automation cannot approve usefulness or aesthetics.

Common stop **X** applies to every row: user pause, genuine authority/safety
blocker, need for new semantic/visual scope, or irreparable verification failure
within approved scope. Diagnose and repair routine failures and engineering
budgets under standing policy; do not turn them into routine approval gates.
Each row's commit boundary is completion of that row and its recorded checks;
row 13 records judgment only when received. No empty commits or manufactured
production changes for already-satisfied requirements: record verified reuse.

## Ordered slices

| # | Target and intended change | Risk | Level and expected checks | Additional stop |
|---|---|---|---|---|
| 1 | Source handoff: map requirements to reuse, bounded gaps and deferred work; reconcile terminology | Medium: duplicate authority | F: exact owner links, source evidence, scope ledger | Owner mapping requires replacement runtime |
| 2 | Canonical distribution host: pin source/asset/session paths and preservation baseline | Medium: wrong animation path | B: existing distribution browser canary, native endpoint/lineage tests, baseline closure | Canonical host cannot be established |
| 3 | Inspection boundary: specify minimal read-only evidence projection using existing identities and revisions | Medium: second source of truth | S: boundary/type tests, static/semantic capability distinction | Needs universal entity migration |
| 4 | Transformation evidence: expose checked operation, inputs/outputs, justifications and provenance from owners | Medium: overstated validity | S: malformed references and checked-versus-authored evidence tests | Missing truth cannot be represented honestly |
| 5 | Validity diagnostics: distinguish conditional/unknown/invalid evidence without permitting unchecked execution | High: weakened guarantees | S: unknown and false preconditions, existing rejection tests | Requires changing domain acceptance policy |
| 6 | Occurrence projection: derive selectable source/target occurrences and roles from canonical bindings | Medium: identity conflation | S: repeated symbols, duplicate occurrences, structural artifacts | Glyph matching needed to invent identity |
| 7 | Correspondence query: expose forward and reverse fan-out/persistence links for this artifact | Medium: inverted causality | S: one-to-many, absent IDs, introduction/removal checks | Global semantic index required |
| 8 | Snapshot ownership: pin inspection evidence to source revision and reject stale selection/results | Medium: stale evidence | S: revision change, stale completion, disposal tests | New persistence system required |
| 9 | Host evidence bridge: mount local inspection data lazily without changing canonical preview validation | High: transport/closure regression | B: exact-preview rejection, dependency boundaries, build closure | General deserialization required |
| 10 | Selection integration: bind keyboard and deliberate pointer selection through current focus owner | High: input/paint conflict | B: focus precedence, semantic selection, one Chromium smoke | Shared focus redesign required |
| 11 | One local inspector: show selected identity, correspondence, reason and validation limits; retain exact return | High: usability | B: keyboard/escape, held position, no forced playback, shared typography smoke | New choreography required |
| 12 | Review packet: capture one complete source → transform → target inspection flow and static comparison | Medium: misleading evidence | B: focused tests, types, native preservation canary, working URL, measured costs | X |
| 13 | Human exemplar checkpoint: record usefulness and visual judgment; apply bounded requested corrections | Human: treatment may fail | V: review questions below; rerun affected smoke after corrections | Mandatory HUMAN_CHECKPOINT until accepted |
| 14 | Accepted behavior: add deterministic inspection/selection regression laws | Medium: overfitting | S: direct seek, reverse, interruption, URL restore, disposal | Revisions change accepted treatment |
| 15 | Supported authoring variation: instantiate a changed distribution source through its responsible authoring path | High: hidden fixture-only behavior | B: owner semantic checks, preview/native parity, unsupported-input rejection | Needs general CAS or weakened exact-preview guard |
| 16 | Authoring-cost evidence: document source changes versus engine changes and manual bindings | Low: inflated reuse claim | F: reproducible fixture comparison and source/binding counts | No benefit; report honestly without expanding scope |
| 17 | Second-caller mapping: choose existing common-factor factoring as bounded many-to-one pressure | Medium: reverse is not same provenance | S: inspect actual factoring owner, role and validation evidence | New factor solver/motif needed |
| 18 | Second-caller implementation: reuse accepted inspection treatment with factoring-owned evidence | High: caller-specific branches | B: many-to-one, domain authority, native endpoints, browser smoke | Different visual treatment needed; review first |
| 19 | Proven shared seam: remove only duplication demonstrated by both callers; keep public surface small | Medium: premature abstraction | B: both callers, negative types, dependency/inference checks | Third architecture or migration required |
| 20 | Headless reuse: expose the same bounded audit evidence outside the interactive host | Medium: accidental schema expansion | S: deterministic output, no DOM imports, exact source revisions | Universal serialization/SDK required |
| 21 | Lifecycle/resource pressure: exercise mounting, selection changes, cancellation and stale work on both callers | High: leaks/stale paint | B: repeated mount/dispose, revision races, resource measurements | X |
| 22 | Promotion checks: validate accepted treatment across supported browsers, responsive sizes and accessibility modes | High: portability | B: Chromium/Firefox/WebKit cohort, keyboard, reduced motion, static truth | New visual decision requires human review |
| 23 | Integrated release: run complete checks and compare complete consumer costs with baseline | High: wider regression | B: npm test, typecheck, check:architecture, build:bundle, inference and closure gates | X |
| 24 | Closeout: document delivered guarantees, authoring cost, limitations, deferred spec items and next recommendation | Low: overclaiming | F: Theseus validate, exact progress/commits, reproducible evidence links | Complete only with all applicable gates satisfied |

## Mandatory review and conditional continuation

At slice 13, stop with one packet and a working shared-server URL. Ask whether:

1. Selecting an occurrence explains its identity and transformation lineage.
2. The reason and validation status are understandable without suggesting a
   formal proof that the domain owner did not provide.
3. Inspection and exact return help follow the transformation without competing
   with or altering its accepted motion.
4. The extra interaction earns its cost compared with the static source/target.

Initial approval includes slices 14–24 conditionally, after this exemplar is
accepted. Acceptance resumes them without another routine phase approval.
Pressure-test factoring with the same treatment; do not silently generalize a
new aesthetic. If it needs a different treatment, batch concrete visual choices
in a new packet and stop. Rejection allows bounded corrections to this exemplar,
not a new medium, universal inspector or motion redesign.

## Deferrals and done contract

Defer Jacobian/matrix inspection, induction/proof contexts, broad matcher or
constraint-solving engines, thousands of vignettes, flashcards, embedding/LLM
retrieval, graph/code expansion, new lesson pages, a universal registry/API,
catalogue rollout, paid calls, deployment and repository merging. Do not rename
KP's existing vignette type to match the imported vocabulary.

Done means two supported transformations with domain-backed, inspectable evidence,
one approved treatment, a demonstrated bounded authoring variation, headless
evidence reuse, preserved native animations, honest cost measurements, and passing
release gates. No claim of general proof checking, arbitrary equation support,
independent learning gains or effortless authoring follows from these results.

After approval, issue the exact contract through Theseus, attach this proposal as
its source, and track slice status only there. Preserve current uncommitted
project-memory work and the raw imported file; audit/stage exact paths. Use the
repository feature-branch workflow before implementation. Context stays bounded:
brief packets per slice; working packets only when needed; no historical corpus
or global graph dumps. No delegated agent work is proposed.
