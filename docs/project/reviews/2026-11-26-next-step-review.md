# Reorientation after the fraction scroll experiments

Date: 2026-11-26
Status: discussion and recommendation; no new implementation approved.

## Assessment

KP has a capable prototype, not yet a dependable finished authoring product.
The [accepted quadratic loop](2026-11-25-quadratic-authoring.md) demonstrates
persistent mathematical identity, linked symbolic/graphical views, derivative
and tangent recipes, local view settings and recoverable invalid drafts. The
notebook, persistent Codex chat and workspace frame provide a usable host.
The [direct graph work](2026-11-26-graph-section-clipping.md) adds bounded
grid, surface, cross-section and planar-return capabilities; it does not prove
general geometry or universal renderer suitability.

The recent fraction scroll experiments did not earn a replacement for the
original reading experience. [Default restoration](2026-11-26-fraction-default-restored.md)
preserves the mathematical/editor work and saved drafts. Its scoped checks pass;
they do not establish subjective comfort or whole-product release readiness.
Continuing to tune rejected treatments increased the user's review burden.

The unresolved product question is whether an author can make a useful explanation
through the product without recurring bespoke engineering. Cross-family reuse,
integrated LLM revision and learner effectiveness remain unproved. Partial Vim
support and workspace experiments are tools around that question, not separate
obligations the user must finish before making mathematics.

## Recommended immediate action

Use the existing quadratic notebook for one short authoring walkthrough:
**Why does changing c move the curve without changing its derivative?**
Keep the existing layout and renderer. Change c, compare the equation and curve
with the derivative, add a brief explanation using existing authoring controls,
then save, reload and return to the relationship. Do not rebuild the already
accepted mathematical controls. Record the first concrete workflow obstacle,
if any; propose only the smallest repair that the observation justifies.

Canonical host:
<http://127.0.0.1:8000/experiments/fraction-notebook/?notebook=quadratic>.
The finish line is a short saved explanation that can be reopened and explored,
plus an honest account of any engineering intervention it required.
This is a recommended use/review step, not permission to change the exemplar.

| Candidate | Authoring value | Reliability/demo value | Reuse | Risk | Recommendation |
| --- | --- | --- | --- | --- | --- |
| Use one existing quadratic explanation | High; exposes real friction | High | Tests existing primitives | Low | Immediate next action |
| Prepared animation in article/card contexts | High | Medium | High | Medium | Retain proposed next delivery |
| Matrix/vector authoring | High | Medium | High | Medium | Preserve mathematical successor |
| Another scrolling format or broader workspace | Indirect | Uncertain | Unproved | High | Park |

The walkthrough has the smallest slice, reduces stale assumptions, and restores
cross-session continuity without speculative infrastructure. The
[roadmap](../roadmap.md) still names reusable-animation-stage as the proposed
next product milestone; this review neither starts it nor changes the current
graph contract or its pending visual judgment. Matrix authoring, the mathematical
programme, semantic commands and multiplexer remain preserved horizons.

## Working agreement proposed

Keep one visible current outcome, its finish line and its return path. Treat
new ideas as parked possibilities unless explicitly selected. Before iteration,
name the actual user-facing obstacle; stop adding choreography when the user
prefers the baseline. Update orientation at meaningful decisions, rather than
turning every experiment into another live project.

Documentation checks: `npm run test:project-vision` passes all 75 checks after
shortening the active-thread index to its existing 450-word budget; no budget
was raised. The quadratic host responds with HTTP 200. No runtime code changed.
The general `theseus work resume` briefing exceeded its output budget; this
assessment used the roadmap-selected sources instead and does not claim a
fresh global execution audit.
