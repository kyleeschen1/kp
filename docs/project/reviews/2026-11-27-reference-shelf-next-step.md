# Proposed next step: return to several saved explanations

Date: 2026-11-27
Status: proposed, not approved or started.

The user accepted the [independent reference card](2026-11-27-matrix-reference-card.md).
That finite outcome is complete. Its remaining practical limitation is that
opening another snapshot replaces the single saved card.

Recommend a small local reference shelf: retain several matrix snapshots, give
them readable names, filter by name, and open one in the accepted player. Each
card keeps its own playback position. This turns repeated return into a usable
workflow without requiring a new mathematical family or new animation.

| Candidate | Authoring benefit | Reliability/reuse | Complexity | Recommendation |
|---|---|---|---|---|
| Several named saved cards | Retain authored examples for comparison | Exercises independent identity and return | Bounded local storage and selection | Next |
| Another mathematical family | Broader expressive range | Needs its own semantic and visual proof | Larger | Later proposal |
| General embedding SDK | Indirect today | Existing second host already works | Speculative migration | Defer |

Proposed finish: import three distinct snapshots, name/filter/select them, seek
each independently, reload, and resume the same selection and positions. Importing
an existing resource ID must offer an explicit update of that saved snapshot,
never silently change the source's identity or overwrite a differently named
copy. Keep source identity separate from host card identity. Preserve the existing
single saved card during storage migration. Export remains the portable backup.

Canonical host stays `/experiments/matrix-reference/`; source truth remains the
validated matrix document, with the existing mathematical runtime and column
player. Mount only the selected card. Reuse existing picker/row APIs if they fit
the reader's guarded dependency boundary; do not import the notebook shell.

Review one three-card shelf before broader library promotion. Keep the accepted
card appearance, source export, notebook history and fraction scrolling intact.
Rollback unit: shelf selection/storage, preserving the accepted single-card host
and original stored record. Exclude live subscriptions, cross-device sync,
publication, flashcard scheduling, new mathematics and LLM mutation.

Approval would start a separate outcome contract. No implementation is authorized
by the acceptance of the preceding card.
