---
name: kp-parallel-development
description: Coordinate independent KP workbench and engine development in separate Git worktrees, with explicit ownership, integration, backup, and safe local cleanup. Use for parallel-agent setup, worker handoffs, or repository Git housekeeping.
---

# KP parallel development

Keep independent work independently runnable and recoverable. Read the current
repository's `AGENTS.md`, roadmap and named active thread first. The workbench
proposal at `docs/project/2026-10-30-independent-workbench-v1.md` supplies the
initial boundary; use current accepted direction if that proposal changes.
This skill specifies execution mechanics, not new product scope or merge authority.

## Start with the actual checkout

Run `npm run git:hygiene` at session start, task switches and handoff. Use
`-- --json` for machine-readable output. It reads local Git state; it neither
fetches nor certifies a live backup. Fetch origin when connectivity permits,
then inspect relevant diffs, upstreams and linked worktrees. Preserve unrelated
dirt; it need not block a separate worktree or an exact owned-file checkpoint.

The older global Git skill assumes `branch:start`, `branch:finish`, `branch:abort`
and `dev`. Those commands and branch were absent at this skill's introduction.
Check current scripts before using helpers. In KP, use this worktree process
rather than switching a shared dirty checkout or running a merge helper as backup.

## Assign boundaries before concurrent edits

Choose one integrator for each coordinated delivery. Workers own separate
branches/worktrees and bounded outcomes; the integrator owns the accepted
baseline and integration. Do not assume a second conversation shares memory.
Give each worker a short packet in its approved plan/contract, containing:

- Outcome and observable finish line, with scope and exclusions.
- Exact base commit, branch, absolute worktree, owner and owned paths.
- Shared contracts/fixtures and revision; dependency requests go to their owner.
- Preview command/port, persistence namespace and disposable output paths.
- Focused checks, evidence destination and required review checkpoint.
- Handoff destination and who may integrate; no merge authority is implied.

Keep this packet in the existing plan/control record rather than inventing a
parallel status ledger. Theseus owns execution state for Theseus runs; use its
CLI for authoritative mutations instead of merging independent edits to its data.

For the initial workbench/engine split, workbench owns `apps/workbench/` once
created, its local UI/styles and adapters. Engine work owns the named shared
mount/runtime repair and consumer checks. One designated owner changes shared
contracts, root dependencies/lockfiles, global styles and strategic documents.
Agree on the adapter contract and a working fixture before parallelizing its
consumers. Independent apps must not obtain isolation by duplicating math truth
or importing a neighboring lesson's private implementation.

## Isolate working state

Use one branch/worktree per active worker. Prefer the repo-ignored
`.worktrees/<task>` directory. Check for an existing checkout before creation.
Choose an explicit integration commit agreed by the participants: neither a
stale local `main` nor a guessed `dev` is a safe automatic base.

Example, after replacing the names and SHA with the agreed values:

```sh
git worktree add -b feature/YYYYMMDD-task .worktrees/task BASE_COMMIT
```

Start the other agent in that worktree and state its absolute path. Moving a
conversation does not move its existing server or tools. Do not spawn extra
agents merely because this skill is invoked; follow the user's delegation scope.

Worktrees isolate tracked files and indexes, not ports, browser local storage,
databases, processes or all Git metadata. Give each preview a distinct port and
test-data namespace. Record its PID and checkout revision. Never kill another
worker's server to free a port. Keep dependency installations worktree-local;
do not share writable `node_modules` via a symlink. Treat shared review/task
stores as services with one mutation owner, not uncoordinated writable files.

## Iterate and recover

Keep a working fixture preview independent of the KP adapter. Make changes in
small recoverable slices and use checks for the boundary changed; reserve
integrated/broad checks for integration and promotion. Respect the existing
exemplar review gate for new visual language. Do not wait for review to commit
and back up a checked candidate.

When a preview/adapter fails, preserve the last valid revision and distinguish
an unavailable service from bad data. Record exact source revision, attempted
operation and a reproducible failure. Turn a demonstrated failure into a guard
at its owning boundary; do not add a second recovery framework or weaken a gate.
The first workbench delivery should exercise interrupted save, stale-write
conflict and unavailable preview recovery as scoped in its proposal. Personal
notes and attempts must survive a UI experiment being retired.

## Integrate deliberately

Workers hand off commits, changed paths, checks and remaining uncertainty. The
integrator reviews the combined diff against the agreed base, then merges or
cherry-picks only within actual merge authority. Recheck the adapter and changed
consumers together, including persistence/lifecycle behavior when affected.
Use one integration method for a worker's delivery; avoid duplicate commits
through mixing cherry-picks and later merges of the same work.

A parked visual decision may leave its candidate recoverable while independent,
already-approved work continues. It does not authorize generalizing the visual
treatment or expanding the run. At handoff, identify the exact preview revision
and what the user should inspect, not merely a server URL.

## Checkpoint, back up, retire

Follow the standing Git policy in `AGENTS.md`: exact owned files, coherent
commits, hourly active-work backup and backup before handoff/task switches.
Normal same-name feature/spike pushes to the verified KP origin are already
authorized. Verify the actual push URL(s), push an explicit refspec, and compare
the live remote tip to local HEAD. A successful local commit or stale tracking
ref is not a verified remote backup. Retain local work and report exact blockers
when network/authentication/divergence prevents backup; never force or merge to
make a backup succeed.

When cleanup is requested or an approved worker retires:

1. Refresh remote refs and run the audit. Confirm each candidate's owner is done.
2. Require the tip to be incorporated into the chosen integration commit and
   preserved on the verified remote. Check any branch's own upstream as well.
3. For a worktree, inspect tracked, untracked **and ignored** contents, ownership
   and running resources before removal. Clean `git status` alone is insufficient.
   Preserve a worktree with unique work or useful local records. Remove only a
   finished, inspected worktree with ordinary `git worktree remove`.
4. Record retired names and full commit IDs in the cleanup evidence, then use
   `git branch -d` with exact names. If Git refuses, inspect why; never substitute
   `-D`. Prune stale worktree metadata only after inspecting a dry run.

Protected/current/occupied branches and unique commits are keep decisions.
No automatic remote deletion, reset, stash sweep, force, merge into main/dev,
or garbage-collection purge. Age and the absence of an upstream do not prove
that work is disposable.

Report the audit outcome, commit/remote backup, preserved dirt and any remaining
ownership question. This is agent-driven cadence plus a read-only command;
there is no unattended cleanup timer or guarantee that an idle session runs it.
