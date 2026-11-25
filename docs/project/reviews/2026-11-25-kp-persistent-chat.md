# Persistent chat in the KP editor

Approved by “let's implement it in the kp editor. borrow heavily if you need to”.
This supersedes the proposed desktop-first object-revision successor as the
immediate delivery host. The user wants a durable general conversation in the
editor, not another manual-edit demonstration or an automatic object patch loop.

Canonical exemplar: `/experiments/fraction-notebook/`, its accepted rich editor,
existing document model and native fraction player. Add one themed Chat panel
from the existing masthead. Conversation state is separate from notebook JSON,
semantic source and the renderer. Closing the panel preserves both the document
and conversation; no new headers adorn the document or animation.

Borrow the independent workbench's Codex app-server protocol, explicit
start/resume, stable thread identity, saved unsent draft, generation-safe
lifecycle, interruption and uncertain-delivery rules. Adapt its CLJS/Rust host
to a development-only Node service behind KP's same-origin local server. No
desktop process or remote iframe gains browser-accessible arbitrary native IPC.
The server owns one connection; browser reloads do not own or kill it. After
server restart, resume the saved Codex thread explicitly. Model history remains
Codex-owned; bounded UI history is not resubmitted as a fabricated conversation.

Two packages: local session/transport/recovery boundary, then Chat UI and
integrated verification. Use fixed server-side project/executable configuration,
loopback and same-origin request checks, a per-process mutation token, bounded
messages, atomic private recovery storage and one writer. Reject unsupported
server requests explicitly. Start with discussion/read-only project access;
automatic notebook/file edits and arbitrary agent execution are outside scope.
No message is sent merely by opening, reloading or reconnecting the panel.

Acceptance: create/connect a conversation, stream a reply, follow up on the same
thread, interrupt, close/reopen or reload without losing acknowledged messages
or a saved draft, and resume after transport/server restart. Preserve local edits
and expose uncertain delivery instead of replaying a send. Show connection,
response and save status clearly. Use workbench-inspired deterministic protocol,
recovery and multi-client tests, focused types, one browser exemplar, and public
reader/notebook preservation checks. Check the installed CLI handshake separately
from mock inference; do not claim a real response from fixture evidence.

The reversible units are the server bridge and isolated editor Chat module plus
its masthead mounting. No external deployment, subscription purchase, archive
platform, rich-editor extraction, catalogue rollout or automatic object-editing
agent is included. A real model turn happens on the user's explicit Send; checks
can exercise installed transport without secretly consuming inference.

Timebox this candidate to three hours, reserving the final quarter for verification,
documentation and backup. Stop at one working exemplar's human interaction review.
The independent workbench and its existing profile remain untouched. The earlier
object adapter remains a reusable foundation; the broader authoring/practice
programme remains the return path.

## Implemented exemplar and review

Open <http://127.0.0.1:8000/experiments/fraction-notebook/> → **Chat** → **Connect**.
Send a question, follow up, close/reopen Chat, and reload. A saved draft should
return; after a server restart choose **Resume conversation**. **Interrupt** stops
the active acknowledged turn. Cmd/Ctrl+Enter sends from the composer and appears
in keyboard help. Normal document and JSON bindings remain in their own buffers.
Judge whether the conversation leaves enough room for the document and whether
connection, reply and draft status make returning to the work clear.

This creates a separate editor conversation using the installed Codex login;
it does not import the current ChatGPT transcript or automatically attach a
notebook selection. Replies are plain text in this first exemplar. Multiple
conversation selection, rich message rendering and object proposals are later
work. The independent desktop app/profile was not modified.

The implementation ports lifecycle rules from Workbench's
`src/spindle/codex_session.cljs`, `src/spindle/workbench/live.cljs`,
`src/spindle/workbench/recovery.cljs`, and `src-tauri/src/codex.rs`
(object-adapter checkout `500ad8b3170d8a0a54625ea3ce350d51e1c2f0ca`, based on
`a923112e23ed2be4094581e878d424e81c2b0f31`). It shares no desktop process handles
or Rust/CLJS bundle with the browser. New owners are `server/chat/`,
`src/editor-chat/`, and the serve-only `scripts/vite-chat.ts` adapter.

Recovery lives in ignored, static-server-denied `.kp/chat/`; Codex owns native
thread history in its existing profile. One local service owns the connection
and serializes tab mutations. Draft revision conflicts preserve the losing local
text. A send intent is saved before RPC, retries with that ID are deduplicated,
and an ambiguous send requires resume/history inspection before acknowledgement.
No queued send is replayed. Overlapping Vite shutdown hooks share one storage
release, and stale transport generations cannot alter the replacement session.

The installed CLI does not persist an empty thread before its first turn. KP may
replace that missing empty shell only when there are no messages, pending send,
or previously journaled send IDs; it preserves the unsent draft. Once any send
was attempted, a missing native thread is surfaced without replacing its identity.
This prevents a reconnect error from silently discarding a real conversation.

The local executable defaults to `/opt/homebrew/bin/codex`; a server administrator
can set `KP_CODEX_EXECUTABLE`. The browser cannot select an executable, project,
arbitrary RPC method, or approval policy. Project access uses the read-only Codex
sandbox with approval requests disabled. Unsupported native requests are rejected.

## Evidence and limits

- `npm run test:editor-chat`: 11 passing cases for session/restart, send journal,
  draft revisions, interrupted/uncertain delivery, stale events, empty-thread
  recovery, private atomic storage, HTTP origin/token checks and JSONL lifecycle.
- `npm run check:editor-chat:codex`: installed Codex 0.169.0 connection, thread
  creation, process restart and unsent-draft recovery pass. **No model turn was
  requested.** A populated native thread's reply/follow-up/resume remains for the
  author's explicit Send; fixture replies do not establish inference quality.
- `npm run visual:editor-chat`: six Chromium cases pass using the real service
  and HTTP boundary with a deterministic native peer. They cover streaming,
  restart, delayed acknowledgement, interruption, two-tab conflicts, recovery,
  keyboard Send, phone layout and theme inheritance. Desktop/light/phone captures
  were inspected. The final focused live-server case also passes against the
  real development endpoint and existing private owner file.
- `npm run visual:fraction-notebook`: all 21 existing browser cases pass.
  `npm run visual:anchored-algebra -- --grep 'fractional reasoning'`: the public
  reader case passes. Its existing closure remains 1,250,344 JS bytes / 308,778
  gzip / 414 modules; no notebook/chat module enters that reader.
- `npm run test:fraction-notebook`: 20 pass; `npm run typecheck:fraction-notebook`
  passes, including the bridge, tests and native check. Project vision: 75 pass.
  Tooling checks pass: five tests, 72 Playwright configs/173 projects, 14 Vite
  configurations in both modes and 15 TypeScript projects. Theseus validates.

Initial checks found and resolved: the HTTP test's fetch implementation ignored
a forged Host header (the test now uses raw HTTP); the private-path guard missed
uppercase encoded dots (the boundary now normalizes decoded paths); the native
empty-thread resume failed (guarded recovery above). Configuration inventories
intentionally add exactly one scoped browser suite and the serve-only chat plugin;
all previous Playwright hashes and other Vite declarations were preserved.
Roadmap/thread initially exceeded their word budgets by 15 each and were shortened
without changing limits. Subsequent affected checks passed.

The impact selector has no rule for this new boundary and recommends broad gates.
This is a focused exemplar candidate under the approved contract, not a production
release: full-repository build/test and a cross-browser promotion matrix were not
run. The complete existing notebook and canonical reader preservation checks were
used alongside new boundary tests. No shared renderer/semantic API was changed.

Maintenance cost is roughly 740 production lines across eight small modules,
without a new dependency. One app-server starts only on Connect. The open panel
polls at 700 ms with ETags; a closed panel stops polling. Recent display history
is bounded to 80 messages / 6 MiB, individual displayed messages to 64 KiB, drafts
to 32 KiB, and incoming native frames to 16 MiB. Full native history is neither
reconstructed nor resubmitted by KP. This is not yet a paged archive UI, and long
histories that exceed the transport bound produce an explicit connection error.

Candidate status: **HUMAN_CHECKPOINT** for this single conversation experience.
Implementation evidence does not accept its presentation or authorize general
promotion. The next action is the explicit model Send and return-to-chat trial
at the URL above, followed by the user's judgment.
