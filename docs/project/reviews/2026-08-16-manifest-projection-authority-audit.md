# Manifest and projection authority audit

> Superseded in part on 2026-08-16: the private legacy SDK and its six-item
> projection retired after exact reachability found no supported consumer.
> Current manifest authority now contains six derived facts and no independent
> compatibility projection.

The project has seven distinct facts that resemble registries. Each now has
one declared owner in
`src/architecture/manifest-projection-authority.ts`; everything else is a
projection, an evidence ledger, or an explicitly separate compatibility
surface.

The important boundary is between the current 30-surface equation inventory
and the renderer-neutral public SDK's six legacy `EquationAnimationId`
selections. Their identifiers and purposes differ. Merging them would couple
the public compatibility API to the editor catalogue rather than remove a
duplicate authority.

Counts are never owners. Catalogue totals, equation totals, disposition totals,
capability totals, and compatibility totals must be computed from their exact
membership sets. Focused checks now prove that the equation asset manifest and
disposition ledger equal the equation inventory, that equation membership is a
catalogue subset, and that the public SDK projection exactly matches its own
catalogue.

The selected-capability selector remains a temporary declaration owner. It is
called out explicitly because slices 21-24 will replace its closed predicates
with narrow capability declarations and retire the old loader path only after
exact caller evidence permits it.
