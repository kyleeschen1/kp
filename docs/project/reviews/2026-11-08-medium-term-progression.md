# After reader acceptance: explanation quality and repeatable authoring

Status: strategic recommendation for discussion, not a new implementation run.
The user approves the two-reader candidate at `28efc1894` and asks about the
medium term and the sufficiency of architecture/CSS work. This closes the local
reader visual checkpoint; it does not authorize catalogue promotion or editor
changes. See [accepted reader evidence](2026-11-08-reader-attention.md).

## Assessment

The immediate ownership repairs are sufficient to make the next product proof
worth pursuing. They do not establish a general rapid-authoring system. The
remaining architecture should be tested by useful explanations and revisions,
with measured friction selecting the next repair.

Established in the KP product branch:

- Specialized configuration ownership reduces tracked root entries from 120 to
  34. Full tooling discovery/resolution checks preserve callers.
- Four algebra-private stylesheets are retired in favor of shared owners;
  browser entries, generated previews and static/interactive editions participate.
- Both named readers share the document theater. Attention presence and focus
  lifetime have responsible owners; their presentation policy can change without
  editing mathematical sources. The user has accepted this treatment.
- Native lifecycle, reversal/restoration, accessibility fallbacks and source
  authority have executable preservation checks. Production closure and existing
  budgets pass. These checks do not prove learning efficacy or universal coverage.

Remaining evidence-backed limitations:

- `scripts/what-counts-reader-page.ts` still constructs an example-specific
  sequence from algebra states. `what-counts-commentary.ts` embeds editorial copy
  and endpoint mappings, with a protective source-revision pin. This is useful
  exemplar code, but not yet a repeatable general explanation-authoring contract.
- The 1,792-line `exemplar-entry.ts` still coordinates many responsibilities and
  includes lesson-specific selection. Its size alone does not justify a rewrite;
  a second explanation should identify the seam worth extracting.
- The CSS inventory covers the repository; consolidation covered selected
  owners. The current file count is 125 after adding the shared focus policy.
  The historical 142 repeated declaration groups were candidates, not 142 proven
  defects. Editor, tutorial and global-style candidates retain separate scopes.
- The roadmap and command surface remain difficult to navigate. The detached
  development server has no automatic restart. These are bounded support tasks,
  not reasons to postpone every learning experiment.
- No current measurement shows general end-to-end generation in minutes, or
  attributes most elapsed time to CSS, JavaScript or renderer performance.

Sources: [maintenance evidence](2026-11-08-maintenance.md),
[CSS inventory](2026-11-08-css-ownership.md),
[prior progression review](2026-11-04-next-step-review.md),
[reader attention evidence](2026-11-08-reader-attention.md), and the local source
files named above. This is a targeted assessment, not a new repository-wide audit
or an assessment of the independently owned editor's current implementation.

## Medium-term progression

1. **Preserve a strong explanation through KP.** Choose a real learner question
   within supported mathematics. Write the rich explanation first: motivation,
   reasons, worked example, useful contrast and a changed-case prediction. Use
   the existing explanation-first worksheet briefly, then assign a few precise
   visual jobs. Keep ordinary prose wherever motion adds no explanatory value.
   The accepted reader is the host; no new visual format is needed. Finish by
   comparing the rendered explanation with its baseline for lost reasoning and
   recording what the learner can do in the changed case.
2. **Make the next meaningful explanation a content change.** Use a second
   example to extract the necessary authoring/composition seam. Humans and LLMs
   should use the same supported source contract and get located repair gaps.
   Preserve source-revision validation. The proof is a second explanation and a
   meaningful revision without editing shared runtime code, inventing a page
   shell or adding lesson-specific CSS. Do not build a universal schema first.
3. **Complete one precise follow-up and revision.** Retain the selected entity
   or group, explanation/source revision and reading position. Answer a learner's
   question in that context, revise the relevant explanation and preserve return
   to the original. Coordinate the small integration contract with the editor
   owner. The current assistant can supply the first exchange; an embedded model
   service is not a prerequisite. Several-target commentary should be pressured
   by a concrete comparison need, with its own layout/lifecycle evidence.
4. **Test transfer beyond the first family.** Try a structurally different
   explanation, plausibly physics using existing equation/graph capabilities,
   before scaling a catalogue. Keep domain meaning and validity domain-owned;
   share instructional intent and reader behavior only where demonstrated.
   Include a task with less scaffolding to test the intended perceptual learning.

These are capability proofs, not a calendar, asset-production quota or approved
slice queue. New renderers and genuinely new motion remain deliberate engineering
work; routine edits within supported capabilities should stop paying that cost.

## Priorities and architectural discipline

| Candidate | Authoring / learner benefit | Reliability / reuse | Main risk | Recommendation |
| --- | --- | --- | --- | --- |
| Explanation-first comparison | Directly tests the reported quality loss | Uses accepted reader | Attractive presentation mistaken for understanding | Next bounded product experiment |
| Second-explanation authoring path | Removes demonstrated assembly work | Tests abstraction against another caller | Freezing a schema before its needs are known | Follow the first explanation; promote only proven seams |
| Precise follow-up and revision | Tests joint attention in use | Exercises identity and revision boundaries | Duplicating editor ownership or building a chat platform | Coordinate after a usable authored explanation |
| Navigation/server housekeeping | Reduces repeated setup and context cost | Small, concrete support improvements | Becoming another open-ended cleanup campaign | A bounded support track |
| Broad CSS/global architecture rewrite | Benefit is not yet measured | May help selected families | Cascade regressions and speculative interfaces | Defer; choose responsible-owner repairs from evidence |

Retain four separable responsibilities: explanatory reasoning, instructional
attention intent, checked domain meaning, and presentation/lifecycle policy.
Reuse existing semantic scene, salience, reader focus and compositor boundaries;
do not create parallel stores or use physical styles as semantic authority.
The practical refactor test is whether changing prose, focus treatment or a
renderer requires changes in unrelated layers.

Measure total authoring time and its components: explanation drafting, semantic
binding, engine intervention and verification. Also count runtime/CSS edits,
lost explanatory steps, exact-reference failures and changed-case performance.
Fast validated preview within existing capability is a goal; no latency promise
or learning-effect claim is established by the recent cleanup.

Current focus: the accepted two-reader experience is a reusable reference.
Recommended next action: one explanation-first comparison in that same host.
Earlier maintenance and reader contracts retain finite closure; older pending
reader-review statements are historical after this approval. No new run starts.

Verification of this memory update: all 67 project-vision/dashboard checks pass,
Theseus workspace validation passes, and `git diff --check` is clean. These
validate acceptance bookkeeping and strategic-source consistency, not new
authoring capability or the proposed experiments' pedagogical value.
