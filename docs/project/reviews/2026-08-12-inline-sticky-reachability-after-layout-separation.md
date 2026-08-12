# Inline Sticky Reachability After Layout Separation

Status: retained active projection

Inline Sticky remains a first-class economics view after the shared
scroll-passage extraction. This review records reachability; it does not approve
retirement, redesign, or compatibility migration.

## Live path

1. `economics-demand-shift-view.ts` accepts `inline-sticky` as a canonical view.
2. `economics-demand-shift-presenter-capability.ts` dynamically imports the
   dedicated Inline Sticky capability.
3. `presenters/inline-sticky-presenter-capability.ts` directly imports the
   neutral scroll-passage geometry and responsive accessibility owner.
4. `KpEconomicsDemandShiftTutorial.svelte` retains Inline Sticky runtime state,
   geometry projection, semantic motion, URL handoff, and review attributes.
5. `economics-inline-sticky-layout.browser.spec.ts` remains the dedicated
   behavioral pressure suite.
6. The development toolbar and static view selector continue to expose the
   projection as `Inline sticky` / `Sticky`.

## Separation result

Two Columns no longer imports an Inline Sticky-named stylesheet. Both
projections independently consume `economics-demand-shift-scroll-passage.css`.
The shared source owns their one-column scroll-passage geometry; the Two
Columns stylesheet owns only its desktop composition. Inline Sticky therefore
remains reachable without being an implementation dependency of Two Columns.

## Verdict

Retain. There is no fresh evidence authorizing retirement, and this convergence
loop explicitly preserves both surviving scroll projections.
