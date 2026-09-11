# Away mode: approved, unblocked value

Use with the main skill for unattended/overnight work. Away mode broadens the
set of approved alternatives, not authority. It does not itself schedule a job,
keep a machine awake, grant tool permissions, or promise uninterrupted execution.

## Prepare one approval packet

Before the user leaves, propose a primary outcome and a ranked reserve portfolio.
Each package must have a stable ID, benefit, allowed actions, dependencies,
objective acceptance, verification cost, rollback boundary and review condition.
Distinguish required outcomes from optional reserve opportunities. Reserves are
fallback-only unless the approved done rule explicitly includes additional
delivery after the primary completes; do not turn leftover capacity into a duty
to execute them. Investigations
must say whether implementation is authorized or only a report is expected.

Approve selection among independent ready packages and parking within this
portfolio explicitly. "Work overnight" alone is not unlimited permission to
choose new projects. Capture the resource ceiling/deadline and a realistic
verification/closeout reserve. If no ceiling is supplied, propose a bounded one
before starting; never interpret unattended work as unlimited spending.

Preflight exact needed permissions, shared server/browser availability, fixture
availability and safe worktree ownership using scoped checks. Do not request
blanket interpreter or destructive Git approvals. Missing permissions can block
one package while leaving others eligible; make this visible before departure.
Use existing stable npm verification commands. No deployment, external messaging,
paid model calls, new services, agents or concurrent worktrees unless separately
authorized. Approval to prepare an experiment is not permission to publish it.

## Selection and parking

At each verified boundary:

1. Read actual Theseus status and the proposal's dependency/review conditions.
2. Exclude completed, unapproved, dependent-on-unreviewed, unsafe and over-budget
   work. Check whether a package plus its verification fits remaining capacity.
3. Choose the highest-value eligible package; prefer finishing a useful outcome
   over opening many partial ones. Implement and record through the main protocol.
4. When blocked, preserve a coherent checkpoint, close its receipt and record the
   exact pending decision, dependent IDs, evidence and resumption condition. Then
   consider the next independently eligible approved package.
5. Stop when nothing worthwhile remains eligible. Do not manufacture audits,
   cleanup, documentation or replacement tasks to occupy the rest of the night.

Semantic, safety or product decisions cannot be auto-approved by the agent. An
explicitly authorized visual spike may reach a reviewable isolated state; do not
roll out its treatment, encode its aesthetics as shared policy, or build dependent
production integration before review. Keep it off canonical/default paths. Shared
files and resources can make apparently separate tasks dependent: preserve/test
the parked exemplar after touching those owners, or choose another package.

## Existing Theseus representation, not an invented scheduler

The installed slice states inspected when this skill was created are `planned`,
`ready`, `in-progress`, `complete`, `skipped`; there is no `parked` state or promised
dependency-aware scheduling. Check current help/schema if behavior differs.

Represent a paused unfinished slice with a supported nonterminal state (for the
current CLI, return it to `planned` with a summary naming its pending decision and
dependencies). Use target progress and evidence for the durable resumption note.
Do not use `complete` or `skipped` to hide a pending human gate. Select another
slice by explicit ID only where the approved portfolio permits that order and the
installed machinery supports it. The agent must check dependencies; list order
and `loop:status`'s suggested next slice do not establish eligibility.

Keep the required review gate local to its dependent packages in the new contract;
retain global safety/authority stop conditions. An older contract whose visual
gate stops the whole run must be amended with approval before this mode can route
around it. If the installed machinery cannot express the approved scheduling or
nonterminal state safely, stop and report the limitation rather than editing JSON,
inventing CLI fields or changing the Theseus package during delivery.

Required/optional status and fallback ordering belong to the single reviewed
proposal and supported contract scope fields. Theseus owns current slice status,
evidence and stop reason. If an unused reserve becomes unnecessary, explain that
and use a supported skip only when the approval explicitly made it optional; do
not count skipped work as delivered. Do not select new refill candidates after
the approved portfolio is exhausted.

## Morning handoff

Give one short outcome summary and a batched decision packet: exact URL/artifact,
what to inspect, recommended choice and what it unblocks. Separate delivered,
review-ready, deferred and untouched work. Include measured cost and checks, not
just commit counts. Name remaining capacity limits and exact resumption commands.
If a required visual decision remains, report `HUMAN_CHECKPOINT` even when useful
independent work also shipped. If the resource ceiling stops eligible work first,
report `STOP_CONDITION` with resumable state. Never infer visual approval from the
user being away, a screenshot existing, or browser assertions passing.
