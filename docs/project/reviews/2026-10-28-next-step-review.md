# Steering toward co-creative spaced practice

Date: 2026-10-28
Status: recommendation; no new implementation run authorized
Authority: [accepted priority](../decisions/2026-10-28-co-creative-practice-priority.md)

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

## Recording checks

This review changes project memory and records the user's direction through
`theseus record conversation`; it does not change runtime code or visuals.
`npm run check:promotion-memory` passes and preserves the tabled matrix frontier.
`theseus workspace validate` passes (1,253 nodes, 33,806 events), and
`git diff --check` passes. No browser or learning-outcome test is claimed.
