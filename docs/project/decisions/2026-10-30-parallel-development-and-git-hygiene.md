# Parallel development and Git hygiene

Date: 2026-10-30
Authority: user requested Git cleanup and a skill for the workbench/engine
parallel-development process. This does not start workbench implementation or
authorize integration into main/dev.

## Process and automation boundary

The versioned [KP parallel-development skill](../../../.agents/skills/kp-parallel-development/SKILL.md)
owns the operational workflow: an explicit integration baseline, separate
worker worktrees, bounded ownership, shared-contract coordination, isolated
preview resources, focused checks, recovery, integration and retirement.
`AGENTS.md` routes future agents to it. The existing workbench proposal still
owns product scope; Theseus owns execution when an approved run starts.

`npm run git:hygiene` is a read-only offline audit. It reports current dirt,
stashes, worktrees, upstream distance and local branch retirement candidates.
It distinguishes a cached remote ref from a verified live backup. It makes no
Git mutations or network requests. Start/handoff audits, commits and backup
remain agent execution obligations; there is no unattended timer or cleanup
daemon. A candidate requires fresh ancestry, live backup and ownership checks
before deletion. No remote branch deletion or automatic merges were added.

The global `git-feature-workflow` skill referred to missing `branch:start`,
`branch:finish` and `branch:abort` scripts and assumed a `dev` branch. None existed
at this audit. The repo routing now names the applicable worktree workflow;
the global skill was left intact because its helpers may exist in other repos.

Repository-local discovery is supported by the
[official Codex skill documentation](https://learn.chatgpt.com/docs/build-skills#where-codex-loads-local-skills).
There is one versioned skill under `.agents/skills`, without a second global
copy to drift. It can also be read directly through the AGENTS routing.

## Cleanup performed

Fetched/pruned remote-tracking references and verified the live remote tip of
`origin/feature/20260929-symbolic-inspection` was
`aa72036417aa164bbe1f8deb546615ad53dc6005`. All eight branches below were
ancestors of that commit, had no attached worktree, and were removed locally
with ordinary `git branch -d`. Their commits remain in the integration history
and its verified remote backup. These names and hashes allow reconstruction.

| Retired local branch | Full tip |
| --- | --- |
| `codex/operation-first-equation-motion` | `3070fad81daaccbbf463851b4bf88ce895e4fd36` |
| `feature/20260905-authoring-integration-market-preview` | `2144fa5dfc9230408d0da1eb67fbbcea22d1d8a8` |
| `feature/20260905-structural-authoring-canonical-tax` | `e652c2e1948190264ea0e0aecf496458b630eff1` |
| `feature/20260907-authoring-round-trip` | `8d9ffd7a4bc6d49957cee859cafe87fa2b493cd4` |
| `feature/20260907-reusable-reasoning` | `ac579dec5a274c11396b302caee6db25f1528e18` |
| `feature/20260912-mechanics-architecture-readiness` | `1d60d2aeadaa8c84831597c49c0b54de12c615a3` |
| `feature/20260912-mechanics-motion` | `eee241e0f88acfe0f8396664d8e4ca17092cb30d` |
| `feature/20260913-relational-reader` | `4c63499d4b0a133b675ec61a494e608243b6145c` |

Preserved:

- Current feature checkout and local `main`. Main was 698 commits ahead of
  origin/main, entirely contained in the current branch; it was not pushed,
  reset or used as a presumed fresh integration base.
- `/Users/kyleeschen/Code/.worktrees/kp-picker-protocol-20260719` and
  `feature/20260719-picker-protocol-consumer`. Its tip
  `e2e5c3db1cc85a9db19016db18d9c7a1f59ca2d8` contains four commits outside the
  current branch. Pushed normally to its same-named branch on the verified KP
  origin and confirmed the live remote tip. This is backup, not acceptance or
  integration. Its future use/retirement remains a separate disposition.
- Preexisting test edit in `tests/editor-animation-visuals.browser.spec.ts` and
  three untracked inbox handoffs (`KP_Codex_Strategy_and_Implementation_Handoff_2026-10-08.md`,
  `KP_codex_handoff.md`, `Kinetic_Press_Authoring_Format_Handoff.md`). They are
  unrelated to this checkpoint and were not staged.

There were no stashes and no stale worktree registrations to prune. No worktree
contents or remote branches were removed.

## Verification and practical use

- `npm run test:git-hygiene`: five tests using isolated temporary repositories.
  Covers incorporated versus unique history, occupied worktrees (including a
  path with spaces), absent backups, non-KP origins, missing/behind upstreams,
  dirty files, stashes, detached HEAD, and unchanged refs/index/file status.
- `npm run git:hygiene`: exercised on the real repository; the remaining three
  local branches are keep decisions. `-- --json` provides the same audit data.
- Focused TypeScript check passed with `tsc --ignoreConfig --noEmit --module
  nodenext --target es2022 --allowImportingTsExtensions --types node
  --skipLibCheck scripts/git-hygiene.ts tests/git-hygiene.test.ts`.
- Skill frontmatter/scaffolding validated with the skill-creator validator.
  Its missing PyYAML dependency was installed only in a disposable local
  virtual environment; no project dependency or global Python setup changed.
- `git diff --check` passed. No reader behavior or visual treatment changed.

To inspect this workflow, run `npm run git:hygiene`: the current and picker
worktrees should remain visible, and unrelated dirt should be reported rather
than hidden. Use `$kp-parallel-development` for a worker setup or handoff. The
first actual parallel delivery still needs an agreed baseline and bounded
worker assignments; creating the skill does not silently launch workers.
