# Next step after matrix notebook acceptance

Date: 2026-11-27
Status: approved by the subsequent “go”; bounded interactive delivery.
Contract: `run-contract.kp.matrix-notebook-explanation-20261127.v1`.

The user's “great! what next” accepts the bounded
[G2 matrix notebook](2026-11-27-matrix-notebook-adapter.md). The three independent
library lanes and this product consumer are complete at their stated scope.
The larger mathematical programme remains a horizon, not a newly approved run.

## Recommendation

Make the matrix object explain its result: an **Explain column combination**
command opens a replayable explanation of Av = v1 a1 + v2 a2 using the notebook's
actual matrix, vector and identities. Editing a source updates the checked
explanation; seeking, reversing and returning preserve context. This connects
authoring to reusable explanatory material, the next product-relevant gap.

| Candidate | Authoring value | Reliability/demo value | Reuse | Risk | Decision |
|---|---|---|---|---|---|
| Connect matrix source to accepted explanation | High | High | High | Bounded adapter work | Recommend |
| Add several more mathematical families | Medium | Medium | Unproved | Repeats untested integration | Later |
| Generalize all notebook/player APIs now | Indirect | Low | Speculative | Broad migration | Defer |
| Let LLMs revise arbitrary objects now | High potential | Unproved | Potentially high | Authority and repair gaps | After a narrow discoverable operation |

The recommendation has a small observable finish line, preserves cross-session
continuity through existing IDs/history, and reduces the gap between disconnected
examples rather than replacing existing systems. It earns abstraction work only
where this concrete consumer exposes it.

## Source and implementation boundary

Canonical authored object: `content/notebooks/matrix-object-exemplar.json` and
its saved notebook revision. Product host:
`/experiments/fraction-notebook/?notebook=matrix`. Mathematical authority remains
the registered matrix/vector resource and existing typed matrix owners.

Presentation reference: `/experiments/matrix-column-combinations/`, using the
existing `columnExampleFromProduct` and `mountColumnPlayer` path described in
the [column authoring packet](../authoring/matrix-column-authoring-packet.md).
The current checked JSON task expects two 2×2 factors and two result columns;
the notebook owns one 2-vector. A bounded adapter is required. Do not silently
fabricate a second authored vector or maintain a separately editable example.
Inspect the existing typed product adapter before selecting the representation;
unsupported shapes/values must retain explicit repair gaps.

The independent animation-player lane currently exposes a saddle player, not a
universal matrix player. Reuse accepted matrix rendering/lifecycle owners before
considering any common player interface. Existing generated column prose is
available; arbitrary authored prose is not automatically verified after edits.

## Proposed division of work and finish

- Mathematics owns the source-to-column explanation adapter, semantic references
  and checked invalid/changed-source behavior.
- Playback owns mounting the existing matrix presentation, seeking and disposal,
  preserving the accepted standalone host and saddle consumers.
- Interaction owns the contextual command row and availability/repair feedback.
- Integration owns the cross-lane contract and one notebook exemplar. Agree that
  contract before concurrent edits; retain separate worktrees and owned paths.

Finish when one notebook object opens its own correct explanation, survives a
source edit and reload, and replays/reverses without losing identities or editor
history. Review that exemplar before promotion. Its command and adapter are the
independently reversible unit; preserve quadratic/fraction behavior, ordinary
scrolling, layout, stored data and existing animation choreography.

Do not include new animation families, catalog-wide SDK promotion, publication,
paid models, flashcards or a generic MCP surface in this round. A later second
host can establish saved-vignette reuse; a later narrow LLM operation can use the
same checked command. Retired scrolling/window experiments and unrelated visual
reviews remain parked.

## Approved execution packet

The subsequent “go” authorizes the proposed parallel implementation and one
canonical notebook review, not promotion beyond this exemplar. Four-hour ceiling,
final 45 minutes reserved for verification and closeout; no minimum duration.
Packages: source/explanation contract, integrated notebook workflow, human review.
Commit checked rollback units and back up before handoff. Stop for the exemplar
judgment, completed scope, ceiling, or an unresolved authority/external blocker.

Integrator: `/Users/kyleeschen/Code/kp/.worktrees/kp-product`, branch
`feature/20261031-annotation-reader`; base `c0fe906a49bbe81dc0c19043de9583b591edc361`.
Workers use fresh worktrees under `/Users/kyleeschen/Code/kp/.worktrees/`:

| Owner | Worktree / branch suffix | Owned paths |
|---|---|---|
| Mathematics | `matrix-explain-math` / `20261127-matrix-explain-math` | `src/math-resources/`, `tests/math-resource-explanation.test.ts` |
| Playback | `matrix-explain-playback` / `20261127-matrix-explain-playback` | matrix-column-combinations model and embed, `tests/matrix-column-vector.test.ts`; coordinate existing renderer changes |
| Interaction | `matrix-explain-commands` / `20261127-matrix-explain-commands` | notebook `matrix-controller.ts`, command-focused test |

Each branch has prefix `feature/`; all use the exact integration base above.
Integrator owns shared notebook mounting, package commands, architecture policy,
Theseus, strategic records and integration. Workers deliver checked commits;
integrator applies their exact owned diffs once, without merging protected branches.
No worker server needed; canonical preview remains port 8000. Tests use isolated
browser storage, and disposable outputs stay under `tmp/codex/`.

Agreed contract: an additive `columns` occurrence points to the existing product.
The runtime exposes a cached mathematical explanation from actual typed operands,
with source revision and explicit result correspondence. A bounded 2×1 presentation
adapter uses existing column choreography; it never fabricates a second vector.
The notebook loads that player only for an explanation occurrence, preserves the
last valid display with diagnostic on invalid drafts, and disposes on fold/remove.
Playback position is local occurrence state, separate from document undo history.
Explain and return-to-inputs are ordinary contextual registry commands.

Verification: focused mathematical/reference and command tests, affected types,
library/architecture boundaries, one Chromium notebook workflow plus Firefox
regressions for lifecycle and saved source, existing matrix-player preservation,
and complete notebook production-loading measurement. Human review judges the
connected presentation; no catalog-wide browser certification is implied.
