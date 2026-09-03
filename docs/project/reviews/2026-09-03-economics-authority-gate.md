# Economics Exact-Authority Gate

Status: accepted internal boundary after foundation slice 16.

## Authority Direction

`domains/economics/per-unit-tax-welfare-model.ts` and
`per-unit-tax-welfare-accounting.ts` remain the sole computational authority
for the approved supply-tax exemplar. They consume the shared exact-rational
implementation through the existing domain facade and produce normalized
rational equilibrium and welfare truth.

`src/experiments/typed-linear-supply-demand/` remains an internal authoring
pressure area. Its exact-rational adapter is one-way: it reads a completed
canonical model, creates a typed `number`-backed view, and verifies every
projected equilibrium and welfare result against the canonical result before
returning. The canonical domain never imports the experiment, and the adapter
is not exported through a public facade.

The existing reviewed supply-tax asset continues to consume canonical domain
assets and frames directly. It does not consume the typed experiment or its
adapter, so this parity work changes no reviewed publication or animation.

## Supported Parity

- Competitive linear demand and supply with positive slopes.
- Untaxed baseline and a feasible per-unit seller tax.
- Quantity, buyer and seller prices, tax incidence, consumer and producer
  surplus, government revenue, total surplus, and deadweight loss.
- Explicit author-supplied quantity, price, and welfare unit descriptors.
- Normalized canonical source IDs and explicit canonical-state to typed-view
  links.
- Exact-rational inputs and outputs that are exactly representable by the
  bounded JavaScript-number pressure view.

## Explicit Gaps

- Non-binary-exact rationals do not enter the `number` view; the adapter
  returns a local diagnostic rather than approximate parity.
- Taxes eliminating interior trade are rejected by the typed pressure
  contract even though the canonical axis-bounded model may describe the
  zero-quantity endpoint.
- Price floors are outside parity because the typed caller's
  `efficient-lowest-cost` rationing assumption has no canonical counterpart.
- No subsidies, tax-side relabeling, nonlinear curves, derived units,
  renderer projection, public API, or generalized economics framework is
  authorized here.

The typed object is useful evidence that the authoring abstractions can carry
the model's units, identities, functions, derivatives, and snapshots. It is
not a competing source of economic truth.
