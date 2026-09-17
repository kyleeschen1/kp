# Economics trace pressure

Use the canonical competitive linear tax model: inverse demand P_d=12-Q,
inverse supply P_s=2+Q, and a per-unit tax of 4. Quantities are nonnegative;
the model has no additional externality or market power.

| Step | Reason | Inventory rows |
| --- | --- | --- |
| 12-Q=2+Q → Q=5, P=7 | Untaxed market clearing | `econ.equilibrium` |
| 12-Q=(2+Q)+4 → Q=3 | Buyer-facing price includes the tax wedge | `econ.tax.wedge` |
| Buyer price 9, seller price 5 | Both prices refer to the same traded quantity | `econ.tax.wedge` |
| Revenue=4·3=12 | Tax per unit times traded units | `econ.tax.revenue` |
| CS and PS each change from 25/2 to 9/2 | Compute the corresponding triangular regions | `econ.tax.surplus` |
| Total surplus changes from 25 to 9+12=21 | Revenue is a transfer; lost surplus is 4 | `econ.tax.loss` |

Finding: this bounded chain is backed by the canonical tax model and reader
facts; see [audit](../economics-audit.md). It does not earn the general
elasticity-incidence row `econ.tax.incidence`. The separate demand-shift caller
supports market-clearing reasoning, but is not an authority to invent this tax
path; the tax model supplies its own source.

Pressure variation: make supply flatter and compare who bears the wedge.
That requires new parameter scope and a preserved baseline, not merely changing
the displayed tax number. The economic interpretation and its cross-case
presentation remain unestablished. Also, neither endpoint comparison supplies a
causal adjustment story (`econ.adjustment`).
