# Next: one real LLM-assisted revision

Status: recommendation, not implementation approval. The user acknowledges the
object-boundary candidate and asks what comes next and when LLMs enter the flow.
The recommendation is to bring them into the next outcome; further editor
extraction, themes, archive infrastructure and general protocols are not prerequisites.

## Evidence and remaining connection

The independent workbench already contains a native Codex conversation owner:
`src/spindle/workbench/live.cljs` delegates to the shared session machinery and
offers explicit connect/send/interrupt/resume, approval handling and draft recovery.
Its October 30 review distinguishes mocked interaction tests and a real transport
handshake from an actual response/capture/reopen trial, which remains unverified.
Current installed CLI compatibility must be checked again before relying on it.

The November 25 KP object adapter proves manual revision → validation → native
preview, including stale basis and recovery. It does not attach object context to
the conversation or turn a response into a proposed source edit. Its browser
parent allowlist deliberately excludes native origins. The browser on port 1426
cannot open the native Codex session; bring this object flow into the existing
desktop host with a reviewed frame boundary, without granting the remote frame
native capabilities. No new provider backend is needed for this first proof.

Sources: KP's [object-boundary review](2026-11-25-workbench-kp-object-boundary.md),
and `kyleeschen1/spindle-editor` checkpoint `500ad8b`, specifically
`docs/project/reviews/2026-10-30-workbench-live-conversation.md`,
`src/spindle/workbench/live.cljs` and `scripts/check-workbench-protocol.mjs`.

## Candidate comparison

| Candidate | Authoring benefit | Continuity/reuse | Risk and size | Judgment |
| --- | --- | --- | --- | --- |
| One real contextual revision | Directly tests the product loop | Reuses session and object owners; removes their disconnect | Bounded native integration plus response proposal handling | Next |
| Extract the rich editor first | Better editing consistency, indirect LLM benefit | Useful later, but prolongs manual-only work | Broader UI migration | Defer |
| Build a general agent/chat platform | Potentially broad | Duplicates existing session work before proving use | High speculative scope | Defer |

## Proposed outcome

An author opens the fraction example, selects one moment and asks for a better
explanation. A real model response proposes a bounded revision; the author sees
what changed and can preview, accept into the draft, reject, or ask for a revision.
KP retains validation and rendering. This first scope edits supported annotation
wording/targets; fresh mathematical choreography is a later, separately scoped
proof using existing domain authoring capabilities.

First establish one real native conversation and recovery, then attach a compact
context packet: object ID, canonical revision, exact draft snapshot, selected
moment, surrounding explanation, permitted fields/targets and one relevant
exemplar. Check both the canonical basis and the current draft before applying
a returned proposal, since the user may edit while inference is running.
Offer a diff and use the existing checked preview; rejected material stays a
recoverable proposal. Persist request/proposal provenance and return context.
Do not replay an uncertain send after reconnect.

Progress cues should distinguish model work, response arrival, KP validation and
a proposal ready to review. Retain a compact orientation cue: the broader goal,
current object/moment, requested change and the path back to the previous work.
These are product feedback requirements, not a new dashboard project.

Finish with a real request, a visible useful revision, a follow-up grounded in
the same object, and reconnect without losing or silently resending work. Measure
time to first useful response and checked preview, manual intervention and context
restoration. A transport handshake or a canned response does not satisfy this
finish line. Model usefulness and the native interaction require a real trial;
compatibility, deterministic validation and recovery checks support that trial.

The broader authoring-to-practice programme remains the return path. Custom Vim
motions, whole-book search/transclusion and broad rich-editor extraction remain
parked; this recommendation does not silently restart their historical plans.
