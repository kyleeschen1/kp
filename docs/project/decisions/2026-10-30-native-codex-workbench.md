# Native Codex sessions in the workbench

Date: 2026-10-30
Status: accepted product constraint; integration and timing remain unproved

The user wants chat inside the workbench and explicitly wants Codex's existing
session affordances, including context management, without additional model
cost. Plain text or locally rendered HTML is acceptable. Preserve Codex as the
agent/session owner and build a local UI around its supported interface; do not
replace it with a separately billed model integration or a second compaction
engine. Existing subscription usage limits still apply. No API-key fallback,
paid service or additional model calls for formatting are authorized by this
direction.

Read-only checks found `codex-cli 0.165.0`, an available experimental app-server
command, and ChatGPT sign-in. These are prerequisites, not proof of a working
custom client, exact feature parity, or this conversation's portability. Verify
the actual bridge's authentication, effective configuration and accessible
sessions before claiming equivalence. Relevant references are the official
[app-server interface](https://learn.chatgpt.com/docs/app-server) and
[authentication documentation](https://learn.chatgpt.com/docs/auth).

The first proof is send/stream/interrupt, handled approvals, reload/reconnect and
resume of the same supported session. Browser reload or UI development must not
silently create duplicate turns. Preserve a terminal fallback. Keep this adapter
small and version-matched; host-specific features need explicit parity checks.
Codex retains session history/context management. The workbench owns anchored
comments, source revisions, accepted decisions and practice records, referring
to session/message identities rather than becoming a competing agent runtime.

This moves live conversation ahead of the earlier export-only first interaction.
Context export remains a fallback. The bounded
[workbench proposal](../2026-10-30-independent-workbench-v1.md) owns the revised
delivery and approximate horizon. Shared algebra mounting retains its own finite
engine-lane outcome. The medium-term forecast is planning, not a many-week
autonomous-run authorization or a scheduled commitment.

Verification of the planning update: `npm run test:project-vision` passed all
67 tests, and `git diff --check` passed. The proposal, roadmap, active thread and
source-linked vision are aligned; no app-server integration or model invocation
was implemented by recording this direction.
