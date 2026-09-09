# R4B — author one coherent explanation

Date: 2026-09-09
Status: APPROVED — user: “got it. I approve this loop. go!”
Contract: `run-contract.kp.authored-explanation-coherence-v2`
The unstarted metadata-incomplete v1 setup record is superseded; scope is unchanged.
Target: `next-action.kp.authored-explanation-coherence`
Predecessor: `2026-09-09-authoring-entrypoint-convergence-closeout.md`.

## Recommendation and outcome

Author a useful Bayesian explanation through the completed R4A workflow, and
repair the specific content-authoring gap it exposes: authors currently control
the probability model but not the explanation's passages, readings, or prompts.
Make a bounded editorial source flow through the existing Focus Card, full/compact
readings, denominator inspection, practice and immutable local edition.

The product task is **Why a good spam filter can still produce many false alarms**.
Use an explicitly hypothetical population: P(spam)=1/100, P(flag|spam)=9/10,
P(flag|not spam)=1/20. Its exact joint masses are 18/2000, 2/2000, 99/2000,
1881/2000. Among flagged messages, the spam fraction is 18/117 = 2/13, not 9/10.
Explain the distinction between detection rate and posterior, why non-spam flags
belong in the denominator, and why reversing tree order does not reverse causation.
These are stipulated teaching inputs, not claims about any actual filter.

This is repository authoring by the implementing agent, not a human usability
study or independent live-model benchmark. Measure the actual drafting/repair
work without presenting a prepared source as a first-pass generation result.

## Why this next

Source inspection confirms:

- `src/experiments/bayesian-reasoning/draft.ts` accepts exactly model plus
  first-event/detail teaching choices; the authored revision pins those choices.
- `score.ts` supplies seven hard-coded passages; `readings.ts` supplies fixed
  full/compact explanation; `prompts.ts` supplies fixed prediction/reconstruction.
- `context.ts` already owns exact facts and references. Reuse it rather than
  introducing another probability calculation or a global knowledge store.
- `page.ts`, `authoring.ts`, and `scripts/build-bayesian-edition.ts` already connect
  explicit Apply, coherent prepared revisions and local output.
- R4A already proves discovery/checking and source-to-edition integration. Repeat
  those checks where affected; do not rebuild the six-task report framework.

| Candidate | Authoring value | Reuse value | Main risk | Decision |
| --- | --- | --- | --- | --- |
| Authored explanation over existing Bayes semantics | High | High | Editorial/fact boundary and revision coherence | Recommend |
| Another probability-only parameter variant | Low incremental | Already demonstrated | Mistaking fixture repetition for authoring progress | Insufficient alone |
| Immediate new algebra family | High eventual | High | Adds coverage before proving explanation authorship | Next measured family after this boundary |
| Broad public API consolidation | Indirect | Uncertain | Speculative interfaces and compatibility work | Defer |

R1–R4A remain completed. `theseus plan run` reports no active/ready run. Refill
inspection fails its existing 810/800 output-token gate; no budget was raised and
no candidate was materialized. The workflow capsule still describes executing
R4A; reconcile that stale summary on approval, without reopening its contract.
This proposal is grounded in the current roadmap and live source, not that capsule.

## Scope and ownership

Canonical reference: accepted `animation.probability.flagged-ticket-bayes` at
`/experiments/bayesian-reasoning/`, source/revision-selected through its existing
editor. Renderer: existing persistent SVG tree and canonical native KaTeX session.
Truth: probability-owned `BinaryJointModel`, verified trace and governed evidence.
The new lesson changes source and explanation, not the artifact's motion mechanism.

Reuse `kp.article.v1` and existing safe prose/fact-reference mechanisms wherever
they express the task. Only add the smallest Bayes-local authoring envelope needed
to bind editorial content to the existing semantic stops and facts. Do not create
a second Markdown interpreter, global template language, universal lesson schema,
or universal pedagogical score. Read the canonical generation guide before authoring.

Preserve the v1 probability source and its default output/revision behavior.
Prefer an explicit versioned extension for authored editorial content if the
existing contracts cannot express it; do not quietly relax v1's exact-key parser.
Bound editable material to a lesson title/setup, stop-linked explanation and the
existing reading/prompt slots demonstrated by this task. Existing required context,
exact answers, assumptions and return addresses remain compiler-owned. Authored
explanation is editorial, not proof. Facts must bind through validated references,
not model-supplied numerical claims or string replacement in generated HTML.

Keep semantic evidence identity separate from authored lesson identity. An editorial
edit must update every affected projection and publication revision without
minting new probability evidence. A model edit must update fact bindings everywhere.
Free prose cannot be certified numerically merely because its bindings resolve;
record that limit and retain editorial review.

Do not redesign the editor. Use existing source editing and explicit Apply. Preserve
seven semantic stops, animated arrows, continuous reversible gestures, exact return,
native paint ownership, reduced motion and shared Focus Card typography/layout.
No new renderer, timeline, motion motif, salience treatment or probability operation.

## Visual checkpoint and promotion

Build the one lesson and its existing projections first. Before second-lesson reuse,
stop at slice 14 with one working shared-server URL, exact applied revision, a
review script and static edition. Inspect passage fit, clarity of the changed
reference population, full/compact coherence, hidden/revealed practice and return.
The review selects editorial presentation, not a new animation treatment.

Acceptance: the source explains the 2/13 result coherently; changing the prior
updates bound facts, readings and answers; an invalid reference cannot replace
the valid lesson; navigation remains the accepted seven-stop experience. Required
facts/context remain legible and available even when authored prose is short.

Rollback unit is one scoped slice/commit. Until checkpoint approval, all new
editorial behavior stays opt-in with v1 defaults preserved. After approval, use
the existing urn problem as a second, structurally different explanation (sampling
rather than detection; opposite initial tree order), without adding renderer code.
Promote only the proven domain-local content seam. A second caller that requires
a general ontology, different motion or incompatible authoring model triggers a
scope stop, not an ad hoc exception. Materially new presentation needs review;
unchanged mechanics do not need ceremonial reapproval.

## Ordered slices

F = focused deterministic tests. S = F plus project typecheck and Theseus validation.
B = S plus affected architecture/inference/integration checks. V = scoped browser
preservation. Each row is one implementation-and-evidence commit; retain all global
stops below. Exact new test names are fixed in slice 1, not invented as passing checks.

| # | Target and intended change / commit unit | Risk | Verification and expected checks | Additional stop |
| --- | --- | --- | --- | --- |
| 01 | Pin spam-filter task, actual owner/host/output baselines and existing source compatibility; reconcile workflow summary | Low | F: exact four masses, 2/13 answer, baseline source/revision outputs | Conflicting authority |
| 02 | Register complete affected author/browser/edition consumers and measure costs before new exports | Medium | S: full core/frontend membership, negative types, import profile | Coverage cannot be honestly measured |
| 03 | Reproduce inability to author task-specific explanation; map required slots against existing Article and fact references | Medium | F: current-source rejection and existing prose-owner tests | Task requires a new general authoring framework |
| 04 | Define minimal versioned Bayes editorial input and validated construction; retain strict v1 path | High | S: exhaustive source versions, malformed/extra fields, forged references | Semantic authority moves into prose |
| 05 | Bind only demonstrated existing facts and semantic stop IDs through the owning context/Article mechanisms | High | B: dangling/wrong-kind refs, escaping, changed-parameter recomputation | New expression evaluator or template language required |
| 06 | Separate lesson revision from probability evidence; normalize editorial inputs deterministically | High | S: whitespace equivalence, prose-only and model edits, v1 identity preservation | Old editions/addresses require silent reinterpretation |
| 07 | Compile authored passages into the existing seven-stop score with compiler-required context retained | Medium | S: stop closure/order, no authored timing, no missing semantic operation | New timeline or choreography needed |
| 08 | Connect prepared authored source to existing atomic Apply and last-valid preview | High | B + V: supersession, invalid refs, one selected revision, disposal | New editor state machine or file-write API |
| 09 | Author the primary lesson as content, recording real repair attempts and specialist intervention | Medium | F + V: requested intent, exact facts, all seven stops; no renderer edits | Empirical claims or unproved pedagogy presented as truth |
| 10 | Project authored explanation into full/compact readings through existing Article ownership | Medium | S + V: bound facts/context and safe prose; no duplicated answer authority | Independent hand-maintained reading source |
| 11 | Preserve denominator extraction and exact return for the authored revision | High | B + V: assumptions, referents, fractional interruption and restoration | New global knowledge/extraction model |
| 12 | Connect bounded authored prompt wording to existing prediction/reconstruction projections | High | S + V: hidden answer, compiler-owned answer/context, exact return | Free-prose automatic grading or answer overrides |
| 13 | Build/export the exact authored lesson through the existing immutable edition owner | High | B + V: stale/dirty source, deterministic bytes, no-JS reading, local styles | Remote publication or changed immutable output |
| 14 | Present one combined canonical editorial/visual checkpoint; record acceptance or repair request | Medium | V: running port-8000 URL, applied revision and edition inspection | Stop for human review before reuse |
| 15 | After approval, author the urn explanation through the same bounded source seam | Medium | S + V: different story/order, exact posterior, source-only reuse | Caller-specific renderer or semantic exception |
| 16 | Extend shared discovery/check reporting and owner packets to the proven authored form | Medium | B: legacy delegation, two lessons, code/Graph3D capability limits unchanged | Blanket cross-domain schema/API migration |
| 17 | Add adversarial and held-out repair cases at responsible authoring boundaries | High | B: hostile prose, dangling refs, version spoofing, oversize input, wrong intent | Weakening validation to improve success counts |
| 18 | Retire adjacent duplicated editorial assembly; retain explicit v1 default policy | Medium | S: default parity and new caller parity, one binding/answer owner | Unrelated cleanup or compatibility retirement |
| 19 | Replay author/edit/repair/export workflows; report source bytes/files, repair turns and glue | Medium | F + V: actual outputs, parameter and prose edits, honest provenance | Human/model/comprehension claims without observations |
| 20 | Pressure lifecycle and cost boundaries across both lessons; repair measured TypeScript costs autonomously | High | B + V: repeat Apply/dispose, idle work, all consumers, reader budgets | Non-TypeScript budget waiver or unrelated redesign |
| 21 | Release: full tests/build and bounded Chromium/Firefox/WebKit preservation across R1–R4A and both lessons | High | B + V: unchanged motion/input, no-JS editions, production closure | Unsafe scope, unavailable required evidence or new visual judgment |
| 22 | Close receipts and record achieved author value, remaining R4 evidence, and one measured M1 gap for the next proposal | Low | F: validated Theseus, source-backed capability gap, clean scoped commit | Approved work or required proof remains incomplete |

## Execution and checks

One scope approval activates these 22 slices, potentially over multiple sessions.
No routine nonvisual approvals. Automatic TypeScript cost-repair policy remains
in force, including measured/documented budget corrections with all consumers,
negative tests and semantic guarantees retained. Other budgets cannot be raised
merely to continue. Fix bug classes at their owning boundaries, preferring static
types and constrained constructors, then runtime guards and regression tests where
static proof is insufficient.

Inspect `npm run verify:impact -- --path <changed-path>` at each affected boundary.
Reuse `test:bayesian-reasoning`, `test:authoring-entrypoints`, `check:authoring-task-packet`,
`typecheck`, `check:architecture`, `check:inference`, `check:reader-budgets`,
`check:reader-production`, `check:dev-review-production`, `npm test`, `npm run build`
and `theseus workspace validate`. Extend the stable `visual:authoring-entrypoints`
entrypoint with the canonical author scenario; use its supported-browser cohort
at release. No new server; keep port 8000. Cheap checks during discovery, broad
regression after visual acceptance. These are proposed checks, not executed results.

One reviewed document owns scope/rationale. After approval, Theseus owns the exact
slice order, receipts, evidence and stop state. No parallel phase-plan tree,
subagents, branch merge or automatic successor activation. Retain the existing
branch and audit unrelated work before committing exact paths.

## Deferrals and done condition

No external model invocation is included. The implementing assistant may author
the local lesson, but this is not the deferred independent trial. An external
trial requires a separate exact payload/destination authorization; no provider,
model, payment or credentials are assumed. Human comprehension and physical Safari
behavior remain evidence gaps. This loop prepares usable content, not a learning
efficacy claim.

Also defer new mathematical operations, general trees/probability models, new
motion motifs, a universal schema/CAS, code/Graph3D authoring parity, editor
redesign, accounts/SRS, public deployment, video export, Theseus package repairs,
blanket API promotion and the tabled matrix asset. M1 ends with a source-backed
next-gap recommendation, not implementation or a new loop.

Done: two coherent authored explanations reuse one bounded domain source path;
facts and editorial text remain distinguishable; existing views/editions agree
on the applied lesson revision; v1 callers and accepted mechanics are preserved;
the exemplar has human approval and release checks pass. This advances remaining
R4 work without claiming the full horizon complete.

Approval recorded above. Theseus owns execution and verification; do not request
routine nonvisual approval again. Slice 14 retains the prerequisite human checkpoint.
