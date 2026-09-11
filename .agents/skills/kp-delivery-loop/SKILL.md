---
name: kp-delivery-loop
description: Plan and execute outcome-sized Kinetic Press delivery using Theseus contracts and evidence, with interactive visual checkpoints or an approved away/overnight portfolio. Use for KP delivery loops and autonomous work; a bare invocation proposes work, not permission to start new scope.
---

# KP delivery loop

Optimize for the next worthwhile explanation becoming easier to author while
preserving semantic correctness and visual quality. Theseus tracks the work;
this skill keeps the work worth doing. Time and task limits are ceilings, not
utilization targets. There is no minimum slice count.

## Route and authority

- Default to **interactive**. For away, overnight or unattended work, also read
  [references/away-mode.md](references/away-mode.md) completely before planning.
- This is KP's delivery policy, not a wrapper around `theseus-long-loop`.
  Do not import its 20–30-slice requirement or its supporting-skill cascade.
  Retain Theseus machinery using the protocol below. Generic skills remain
  unchanged; an explicitly selected generic workflow keeps its own policy.
- Honor repository instructions and existing approved contracts. Never silently
  resize, reorder or retire an older approved run under this new policy. Propose
  an amendment if its scope, cadence or checkpoint rules need changing.
- A bare invocation or planning request permits assessment, not implementation.
  Execute when the user approves the proposed scope or resumes that exact run.
  Creating a skill or approving a product direction does not approve a run.

## Start with bounded context

Read `docs/project/roadmap.md` and its active thread; read `strategy.md` only for
needed rationale. From the repository root run `theseus plan run`. Resume an
approved contract instead of creating competing work. If the queue is thin,
`theseus plan refill --limit 5` may inform a proposal; do not select/materialize
new candidates without approval. Retrieve only plausible targets with
`theseus work context <target> --mode brief`, escalating to working context only
for missing source authority. Do not dump the graph or historical corpus.

For generated teaching content, read the repo's authoring generation entrypoint.
For salience or visual motif work, use the repo-local `kp-visual-salience` skill.
Use other skills only when the actual task requires them, not as a startup ritual.

## Admit work for value

Every work package must name its beneficiary, observable change and why now.
Admit work that delivers capability, removes a demonstrated blocker, repairs an
observed failure, or resolves uncertainty material to the next decision.
"Improve architecture", "increase coverage" and "formalize" are not outcomes
without a concrete consequence. Investigations may finish with evidence that no
implementation is needed.

Rank eligible packages by benefit, evidence, effort and maintenance burden, with
a short qualitative rationale. Do not create tasks to fill available hours.
Prefer existing owners. A new abstraction must solve a current boundary problem;
reusable promotion needs demonstrated callers, not hypothetical future demand.
Infrastructure before a visible exemplar must identify the blocker it removes.

## Propose an outcome contract

Keep one human-readable proposal in `docs/project/` and one Theseus control record.
The proposal owns rationale, scope and dependencies; Theseus owns live execution
status and evidence. Do not create a second phase-plan or status table elsewhere.

Present:

- Primary author/reader outcome and observable acceptance, including uncertainty
  that automation cannot settle.
- Canonical artifact, host, renderer and semantic authority for visible work;
  preservation boundary and smallest independently reversible rollback unit.
- Named work packages, dependencies and review gates; expected checks, risk and
  verification tier for each. Detail near-term packages, keep later ones coarse.
- Allowed repairs, exclusions, commit boundaries, resource ceiling and reserve
  for verification/closeout. Estimate duration as uncertain; do not infer a token
  budget or create a goal unless explicitly requested.
- Done condition and permitted early exits. Optional reserves are fallback-only
  by default, not obligations. If the user wants additional delivery after the
  primary finishes, include those outcomes explicitly in the approved done rule.

Use as many packages as the outcome warrants. Consolidate related implementation,
tests and evidence into verified reversible commits; do not create ceremonial
commits per tiny action. A package can be subdivided within approved scope, but
new outcomes and changed mandatory gates require approval. Stop for approval of
new autonomous scope; do not treat absence as consent.

## Interactive delivery

For subjective work: question → smallest canonical exemplar → human review →
structurally different caller → integration and promotion. Preserve existing
motifs and semantic owners; no framework-local fallback to make an example pass.
Prepare one review packet with a working shared-server URL, observable changes,
specific judgments requested and programmatically established facts. Do not ask
for routine nonvisual approvals or repeat an unchanged visual checkpoint.
After acceptance, continue remaining approved work without redundant resumption.

Pure maintenance and deterministic bug fixes do not acquire a visual ceremony.
For every fix, identify the violated invariant and responsible boundary. Prefer
types/constrained APIs when they cleanly represent the invariant; use runtime
guards and regression tests for external data, geometry, events and timing. Do
not erect a general type framework solely to claim a narrow bug is impossible.

## Execute through Theseus

Use the installed CLI; consult scoped help when required fields or transitions
are unclear. Do not invent commands, mutate graph/event JSON directly, or change
the Theseus package merely to run this workflow.

After approval, use the matching contract or `theseus help add-run-contract` to
create an outcome-sized contract linked to the reviewed proposal. Bind stable
package IDs as slices, scope, verification and stop rules through supported CLI
or structured actor input. Use the installed schema, not a new portfolio format.

For each selected package:

1. Confirm approval and dependencies. Mark its slice `in-progress` using
   `theseus record run-slice <contract> in-progress --slice <slice>`.
2. Emit repository-derived progress (`npm run --silent loop:status` when available)
   and start tracked context: `theseus work start <target> --mode brief`.
3. Implement or investigate within scope, then run impact-appropriate verification.
   In KP, inspect `npm run verify:impact -- --path <path>` before running its plan.
4. Close the returned receipt with `theseus record context <receipt> useful|partial|missing
   --summary <outcome>`; use `failed` for failed execution and preserve its primary
   error. Do not leave a receipt open when parking or handing off.
5. Record actual checks through `theseus record verification`, plus progress or
   transitions as appropriate. Mark a slice complete only when its acceptance is
   satisfied. Run `theseus workspace validate` after durable mutations.
6. Commit at the contract's verified rollback boundary, implementation and evidence
   together. Emit progress at package starts/completions, commits and handoff.

After repeated failed repairs, reassess evidence and cost instead of blindly
retrying. If expected effort materially outgrows the package, bound a diagnosis,
then record a recommendation or park it; do not silently expand architecture.
Standing engineering-budget repair authority applies inside approved work:
diagnose, measure complete consumers, prefer useful repairs and explicitly account
for any bounded amendment. Never erase checks or auto-refresh a ceiling.

## Verification proportional to risk

- **Focused:** changed invariants and regressions; cheap exemplar smoke checks
  during visual discovery.
- **Standard:** focused checks, affected type checks and Theseus validation.
- **Broad:** affected integration, full types/build, production closure/budgets,
  and supported-browser checks where risk or promotion requires them.

Run broad suites at meaningful integration/release boundaries, not for unchanged
code after every bookkeeping step. Batch compatible checks, but revalidate final
integration when independently passing work is combined. Do not promote an
unreviewed aesthetic through a large certification matrix. An inventory or type
test does not certify realized paint; use the canonical executable compositor.

Respect required contract gates. Report nonzero exits, repairs and exact reruns;
never describe an initially failed full suite as passed because a focused rerun
passed. A focused rerun can support a narrow test-only repair when justified and
the contract permits it; a required clean full-suite gate must actually pass.

## Stop and hand off

Recheck durable progress before finalizing. Outcome completion takes precedence
over unused capacity: stop when the approved done rule is satisfied, even with
optional reserves left. Otherwise continue eligible approved work within capacity.
On reaching the verification reserve, stop taking new implementation work and use
the reserve to verify and close out. Stop for the resource ceiling, exhausted
eligible scope, required human judgment, user pause, or safety/authority blockers.
Unused capacity is not a reason to create work. Do not mark deferred packages done
or call a portfolio complete while required outcomes are still parked.

Use the existing outcome vocabulary: `COMPLETE`, `HUMAN_CHECKPOINT`,
`STOP_CONDITION`, `BLOCKED`, `USER_PAUSED`, `CONTRACT_EXHAUSTED`, or
`SESSION_INTERRUPTED`. State budget exhaustion as the reason for `STOP_CONDITION`.
Record resumable state and remaining work through supported Theseus transitions.

Lead the handoff with what authors/readers can now do, source-only reuse versus
engine intervention, verification and uncertainty, and added maintenance/runtime
cost. Include decisions/URLs, commits, contract/package counts, and the exact next
command. Distinguish completion from review readiness and tests from learner
outcomes. Use `theseus workspace handoff --limit 3` for a new-session handoff;
future sessions start with `theseus work resume` or the named bounded context
command if that report exceeds its output budget. Update roadmap/thread only
for changed direction or durable conclusions, not every slice.
