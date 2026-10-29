# Steering toward co-creative spaced practice

Date: 2026-10-28
Status: recommendation; no new implementation run authorized
Authority: [accepted priority](../decisions/2026-10-28-co-creative-practice-priority.md)

Latest refinement: [shared-workbench direction](../decisions/2026-10-28-shared-workbench-direction.md),
supported by the [integration and exposition evidence](2026-10-28-workbench-evidence.md).
The workbench extension below serves the same personal-practice milestone; it is
not a competing platform prerequisite or a newly approved autonomous run.

## Recommendation

Make one complete, local co-creative practice loop the next milestone. Use the
existing mathematical representations and current assistant conversation to
negotiate a question, preview it, attempt it, retain mistake/uncertainty context,
revise it and return later. Discover ergonomic API changes through small,
structurally varied examples of that workflow. Do not first redesign all of KP.

| Candidate | Authoring | Reliability/demo | Reuse | Risk | Recommendation |
| --- | --- | --- | --- | --- | --- |
| Complete local practice loop on an existing LA context | High | Direct product test | Existing semantic/rendering owners | Bounded persistence and interaction work | First |
| Small varied exemplar set with targeted API repairs | High | Exposes repeated friction | Evidence for shared conveniences | Can proliferate exceptions | Follow the first reviewed loop |
| Broad API redesign before practice callers | Uncertain | Delays product feedback | Speculative | High migration cost | Defer |
| Large card generation, knowledge graph, learner model | Uncertain | Weak evidence of usefulness | Unproven | High content and diagnosis debt | Defer |
| More general reader/motion polish | Indirect | Existing product is usable | Useful only at a blocker | Can consume the whole iteration | Preserve; repair concrete blockers |

## Direct source findings

Inspected, not newly browser-tested in this review:

- `src/semantic/asset-flashcard.ts` supports cloze, explain-transform,
  focus-relationship and predict-next with semantic object/selector references.
  Its validator checks references; it does not validate pedagogical quality or
  establish a general answer-assessment model.
- `src/tutorial/normal-matrix-proof/normal-matrix-proof-return-rehearsal.ts`
  provides eleven prompts across manual day-zero/day-one/day-seven sessions and
  a text capture template. This is not an automated scheduler or durable learner
  event log. The old thread records an unaccepted attentional presentation.
- `src/experiments/composed-algebra-intuition/practice.ts` already supports
  predict/reconstruct, written self-check, verified answer reveal, saved playback
  position and return. The inspected handler resets working on entry and does
  not persist attempts or model hypotheses.
- `src/authoring/algebra/compile.ts` and
  `src/authoring/matrix-columns/compile.ts` separate source checking from issued
  presentations; matrix source derives results, provenance and revision hashes.
- `../authoring/concise-domain-api.md` documents existing concise domain calls.
  `../authoring/matrix-column-authoring-packet.md` documents saved source and
  immutable editions. These are bounded capabilities, not arbitrary composition.

Thus, the next frontier is connecting an actual personal practice lifecycle and
LLM negotiation to these pieces. Existing prompts alone do not fulfill it.

## Proposed first milestone and preservation boundary

Use the existing matrix input-difference comparison as the first context: two
different inputs can produce the same output. The existing comparison source,
host and matrix/difference semantic owner remain authoritative; confirm exact
source-to-host routing from `matrix-comparison-packet.md` before implementation.
Do not substitute the normal-matrix renderer merely because both use matrices.

One question could ask the learner to predict the output difference, then explain
the result. A learner-supplied mistake or unresolved question can motivate a
revised prompt or the existing contrasting matrix case. Do not presume that the
learner has a particular misconception.

The proposed loop must support:

1. A bounded brief: present purpose, relevant context, requested response and
   what should count as success. Keep this conversational, not a long form.
2. An actual assistant-generated/revised candidate, passed through supported
   mathematical checks and a preview; retain the last valid version on failure.
3. Attempt, optional assistance and answer reveal, with the actual visible
   question/source revision recorded. Mark self-assessment separately from
   deterministic checks and model commentary.
4. A local durable attempt record: response, assistance/reveal state, learner
   note, and optional explicitly provisional model interpretation. Permit
   correction, dispute, parking and removal/export of personal records.
5. Saved review items with explicit return dates and restoration after reload,
   plus a return to the exact mathematical context. Real delayed return belongs
   in this milestone; scheduler optimization does not.
6. Revision without overwriting previous attempts or silently transferring their
   outcomes to a different question. Export a small context packet for the next
   assistant conversation rather than the full repository/history.

Observable acceptance: the owner completes this loop with a question they helped
shape, sees a useful revision based on their feedback, and can later recover both
the question and its context. This is workflow acceptance, not evidence of better
learning or trustworthy automatic diagnosis.

Rollback unit: the local practice adapter and its versioned local records. Keep
the accepted comparison player, mathematical models, reader and article source
unchanged. No new global renderer, clock, salience store or semantic authority.
Review the first integrated interaction before promoting its visual treatment.

## Rapid iteration after the first accepted loop

Proposed small pressure set: roughly 8–12 useful questions, expanded or discarded
as needed, across three families:

- prediction, transformation and contextual mistakes using existing LA/algebra;
- an inner-product definition cluster with property roles, examples/nonexamples,
  contrasts and the complete bundle, using explicit real/complex scope;
- a short proof/ordered argument with local justification and whole-argument
  reconstruction. Audit reuse of the old proof-memory sources before selecting
  a proof; do not automatically revive its presentation.

This is a discovery set, not a content-production quota. Inner-product validation,
new modalities and proof coverage must be bounded and established before claiming
support. Static text/KaTeX can serve a deliberate prompt; an unsupported requested
animation must return a typed gap rather than silently becoming a fade.

For each small batch, record what the learner wanted, what changed, authoring
friction, new capabilities required and whether an existing mechanism sufficed.
Fix repeated or clearly dangerous friction at its owner, then retry the real
examples. A second structurally different caller should pressure a convenience
before general promotion. Do not build a certification matrix for an unaccepted
visual treatment.

Use the current assistant as the first conversational author. Later expose the
same inspect/check/preview/revise boundaries to an embedded LLM if useful. No
paid calls or autonomous generation are authorized by this recommendation.

## Changing APIs and a growing exemplar library

Separate four evolving things; none is assumed permanently frozen:

| Layer | Proposed policy |
| --- | --- |
| Authoring syntax | Experiment with concise domain-specific names and defaults; preserve required identity, assumptions and explicit authority. |
| Saved source format | Version, validate and migrate explicitly. Do not serialize live runtime/proof authority or silently reinterpret old data. |
| Exemplar content | Stable identity plus content revision, purpose, intended response, context, limits and review status. |
| Attempt/evidence record | Retain exact content/source revision, assistance and assessment mode; corrections are explicit. |

Maintain a small current reference set as executable examples for the LLM. Each
API change migrates affected maintained callers, examples, task packets and
source fixtures in the same slice. Do not build an ever-growing compatibility
layer for every experimental spelling. Keep a bounded adapter only for actual
saved/external consumers, with a named retirement condition. Unsupported old
versions should produce actionable migration/repair diagnostics.

Keep experimental drafts searchable as experiments, but do not supply stale or
unreviewed snippets as current authoring exemplars. Preserve rejected approaches
as concise provenance or in Git; active copies earn their maintenance cost.

Save original source before migration. Approved editions may pin renderer/assets
when exact historical playback matters. A content hash alone does not preserve
appearance under a changed runtime. Recompilation must freshly validate domain
claims; it cannot recreate proof authority by trusting serialized objects.

Distinguish syntax-only migration from changing the learning task. Wording, cues,
answer criteria and mathematical changes may affect what an attempt demonstrates.
Never silently combine old/new outcomes into one mastery or scheduling estimate;
even retained scheduling state needs an explicit transfer rule.

Useful gates: source validation and semantic endpoints; context restoration;
answer reveal/assistance recording; load/save/migration and replay; representative
visual preservation only where presentation changes. Avoid testing incidental
function spelling or freezing every experimental screenshot.

## Progress and deferred work

Track time to first valid preview and subsequent revision, framework files
changed per example, context-return failures, completeness of attempt records,
and the user's judgment that a question/revision addresses their concern. Delayed
reconstruction or transfer is separate learning evidence, not implied by these
engineering measures. Browser payload and cold preparation remain budgets for
actual mounted capabilities; large library metadata need not load every renderer.

Defer broad ontology/embeddings, comprehensive learner models, accounts/sync,
automatic diagnosis, broad curriculum generation and a bespoke scheduling
algorithm. Definition/proof/philosophy ambitions do not require one universal
grading authority. Keep return scheduling minimal without deferring actual return.

## Control-plane note

Read-only `theseus work resume` (including `--limit 1`) fails its existing output
budget: 1648 tokens versus 1200. `theseus work next` similarly reports 306 versus
300. No ceiling was changed and no old run was resumed. This did not prevent
source inspection or recording the priority. Diagnose the responsible command
budget/output before starting a future implementation run; this review is not
permission for unrelated Theseus package changes.

`theseus workspace handoff --limit 3` succeeds and confirms no active run contract
or ready action for new implementation. It also reports two audited nodes without
source references; identify and repair those before creating a long run. The old
waiting Lisp tranche remains unrelated. This is control-plane readiness debt,
not a reason to resume older work or a failure of the practice proposal.

## Workbench extension: one experiment from discussion to delayed return

The first beneficiary is the project owner collaborating with an LLM to create
and use a mathematical question. The outcome is one inspectable experiment,
not a dashboard for every subsystem. Proposed delivery packages:

1. **Identify and observe one experiment.** Bind a brief, exact source revision,
   preview, candidate and decision to existing owners. Record actual authoring
   intervals and gaps. Unknown historical time remains unknown.
2. **Expose that experiment in the existing workbench.** Show preview, API source,
   anchored discussion, revision comparison and a compact evidence/time record.
   Review this representative interaction before generalizing its UI.
3. **Complete personal practice and capture.** Retain the question, attempt,
   assistance, uncertainty/correction and explicit return date across reloads.
   Send unrelated ideas to the existing GTD capture owner. This is part of the
   first delivery, not a later scheduler project.
4. **Measure reuse.** Try a small speed trial and one structurally different
   caller. Fix repeated authoring friction at its owner and migrate maintained
   examples with API changes. Separate source-only variants from engine work.

The candidate integration host is `/?view=animation-workbench`. The matrix
comparison retains its canonical source, semantic authority and renderer from
`../authoring/matrix-comparison-packet.md`; prove the adapter's exact route before
changing a visible exemplar. A matching asset ID is insufficient. The source
inspection did not establish that this comparison already mounts in that host.

Done means the user can reference an exact mathematical object or code passage,
see the change under discussion, inspect why an attempt took time, capture an
unrelated thought, and recover a saved practice question after reload. Three
useful supported variants in roughly fifteen minutes is an initial measurement
target, not a promise or an existing benchmark. Report setup separately.

Rollback unit: local experiment adapter, versioned records and workbench panel.
Preserve the accepted comparison player, current routes, domain truth, native
renderers, clocks and existing feedback ownership. Check identity/revision and
persistence invariants, failed-draft/last-valid-preview behavior, focused adapter
integration and one browser smoke. Human review selects the interaction before
broader UI promotion. An executable run still needs its scoped resource ceiling
and verification reserve; this proposal does not invent an elapsed-time budget.

### Evidence that helps decisions

Automate source/model/API revisions where observable, requests, tool/check spans,
failures, edits, preview readiness and decisions. Separate active work, waiting
and idle intervals; parallel worker totals are not critical-path elapsed time.
Do not infer human effort, hidden model reasoning or cost from Git timestamps or
wall-clock duration. Retain failed attempts and support lightweight corrections
to inferred classifications. Capture should cost less than the work it explains.

Qualitative records should include purpose, prerequisites, intended change in
understanding, technique, observation, interpretation, proposed intervention and
what would count as evidence. These stages must not collapse into one diagnosis.
Use overlapping facets rather than forcing one label or a universal quality score:

| Facet | Question |
| --- | --- |
| Semantic validity | Is the claim/transformation valid under stated assumptions? |
| Representational fidelity | Does the view preserve the intended identities and relations? |
| Perception and aesthetics | Can the relevant structure be seen; is the treatment satisfactory? |
| Attention and motion | Is the important change findable and its continuity understandable? |
| Interaction | Can the person inspect, compare, rewind, select and respond? |
| Narrative | Is the question, progression and resolution intelligible? |
| Pedagogy | For which prior knowledge and purpose might this help, and what evidence exists? |
| Domain/representation fluency | Can the person reason about the system, decode the view and translate between views? |
| Engineering/authorship | What blocks a valid preview, revision, reuse or reliable execution? |

Reuse `../principles/animation-design-diagnostic-language.md` for motion facets.
Historical review-note frequency is not severity or evidence of a current defect.
Visual preference and immediate self-report do not demonstrate delayed transfer.
The exposition study in the evidence review is a source analysis, not an executed
learning experiment; original reconstruction and comparison are the next study.

### Exact references and joint attention

Use a small reference envelope: owning kind, stable ID, revision and optional
selector. Domain-owned payloads retain their own types. Display readable labels
and aliases; users should not need to type long identifiers. Give meaningful
artifacts identities while selecting transient paint within its owning object.

Math references select semantic objects/checkpoints; code references retain
revision, symbol/range and quote context; conversation references retain message
revision and span. Anchors that no longer match become explicitly stale rather
than silently attaching to other content. A shared selection is joint attention
only when both parties can recover the same revision and context.

Implement selection/reply inside the KP-owned interface first. External ChatGPT
or Codex host integration requires separately verified capabilities. A small
copy/export packet is an honest initial bridge, not live bidirectional sync.

### Search, ontology and conditional practice

Federate existing capability, motif, exemplar, review and execution inventories.
Preserve owner, scope, maturity, freshness and evidence: planned, implemented,
executed, visually accepted and useful-to-a-learner are different claims. Begin
with exact/fuzzy retrieval and explicit relations; evaluate embeddings against
real missed queries before adding them.

Keep concept, representation, occurrence, affordance, explanatory technique and
observation distinct. A best practice is a conditional claim with supporting and
contrary cases, not a mathematical law. Make this path inspectable:

`object → representations → instructional intent → technique → experiment → evidence → qualified practice`

Prioritize generative investments by named near-term consumers, distinct uses,
prerequisites, uncertainty and maintenance burden. Graph centrality alone rewards
what happened to be documented. Exact references are a plausible immediate
cross-cutting investment; projection/linear measurement is a promising study
family, not automatic approval of a new geometric renderer.

### GTD, blockers and reviews

Project Markdown remains the capture/prioritization owner; Theseus remains the
execution owner. A workbench view must not introduce a competing task database.
Blocker records should identify affected outcome, evidence, kind, responsible
owner, next action, observable unblocking condition and review date. Distinguish
hard dependency, uncertainty, subjective review gate, rejected design and work
merely waiting its turn.

Known readiness issues include the Theseus output-budget/source-reference debt
above, missing end-to-end timing, unproved comparison/workbench integration and
external chat-interface access. Their severity and affected work differ; none
justifies declaring the entire project blocked.

Proposed cadence: process capture at session close; inspect patterns after five
experiments or weekly; review the strategic direction monthly or after a major
finding. Each review should produce a decision, a bounded investigation or an
explicitly retained uncertainty. These are proposed human/agent workflows; no
timer, scheduled task or background process was created.

### Engineering ownership and LLM roles

Candidate separable owners are references/persistence, experiment telemetry,
practice records, discovery/evidence, workbench UI and execution/GTD adapters.
First integrate one end-to-end workflow; then parallelize independently testable
work with disjoint ownership and an integration owner. Do not split everything
into packages or services merely to enable parallel agents.

A running-work monitor needs actual run owner, source revision, last activity,
elapsed/wait state, blocker and next checkpoint. Label snapshots and stale data;
manually maintained status cannot be presented as live telemetry.

Author, critic, project steward and evidence librarian are useful roles, initially
performed by the same assistant when appropriate. They should cite evidence,
retain disagreement and propose reversible changes. The organizer proposes
merges/splits/aliases with a diff; it does not rewrite raw observations or silently
change mathematical authority, task priority or learner self-description. Inspect
whether proposed normalization preserves the distinctions useful to each owner.

Promote workbench affordances into shared KP infrastructure only after another
real caller, such as personal practice, demonstrates the common boundary.

## Recording checks

This review changes project memory and records the user's direction through
`theseus record conversation`; it does not change runtime code or visuals.
`npm run check:promotion-memory` passes and preserves the tabled matrix frontier.
After the workbench refinement, `theseus workspace validate` passes (1,254 nodes,
33,807 events), and
`git diff --check` passes. No browser or learning-outcome test is claimed.
