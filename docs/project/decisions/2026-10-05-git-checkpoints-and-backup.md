# Standing Git checkpoints and remote backup

Accepted: 2026-10-05. The user requested that the recommended commit/push
cadence become the persistent project process. `AGENTS.md` owns its operational
rules across ordinary tasks, Theseus contracts and visual-review stops.

Commit after every coherent, recoverable slice, with proportional verification.
Push work branches hourly during active work and at every handoff or task/branch
switch. A long unfinished slice gets an explicitly labeled checkpoint with its
verification status. Visual acceptance gates promotion and integration, not
backup. Keep implementation and its durable evidence in the same checkpoint.

The inspected remote is `origin`, with push URL
`git@github.com:kyleeschen1/kp.git`. Standing authorization covers non-force
pushes to the same-named `feature/...` or `spike/...` branch there; HTTPS for the
same repository is equivalent. Verify the destination, use an explicit refspec,
and set upstream. This includes the existing
`feature/20260929-symbolic-inspection` branch and its committed history.
It excludes protected-branch pushes, merging, force-pushing, deletion and
deployment. The project's existing integration branch is `dev`; the earlier
recommendation's reference to main does not change that branch strategy.

Routine checkpointing must not invoke `branch:finish`, which also merges and
deletes. This explicit user direction supersedes any skill interpretation that
would couple backup to merge, require a globally clean worktree to commit owned
changes, or ask again for an authorized backup push. Preserve unrelated changes
and review exact staged paths/hunks. Do not rewrite already-pushed history by
default.

Before final handoff, compare local HEAD with the remote branch tip. Report
backup success only when confirmed; report remaining local dirty work separately.
On network/authentication failure or divergence, preserve local commits and
record the blocker without automatic force, rebase or merge. Resume the overdue
backup when possible. No unattended timer is installed: hourly cadence is
enforced by the active agent at work boundaries, with immediate catch-up after
a long command or interruption. This does not promise backup while no agent is
running or protection for changes not committed.

This is a repository process decision, not new animation scope or a change to
existing human visual checkpoints. No extra approval phase or full test suite
is required for each backup; verification belongs to the change being committed.
