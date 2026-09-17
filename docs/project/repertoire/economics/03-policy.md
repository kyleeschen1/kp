# Economics

## Tax, welfare, externalities and institutions

### Semantic moves

- [x] `econ.tax.wedge` Separate buyer and seller prices under a per-unit tax — canonical tax caller. [Evidence](../../repertoire-notes/economics-audit.md)
  Example: Tax 4 gives buyer price 9, seller price 5, quantity 3
  Audit: implemented
- [x] `econ.tax.revenue` Compute tax revenue from the price wedge and traded quantity — canonical caller. [Evidence](../../repertoire-notes/economics-audit.md)
  Example: Revenue = 4·3 = 12
  Audit: implemented
- [x] `econ.tax.surplus` Compare consumer and producer surplus — linear canonical caller. [Evidence](../../repertoire-notes/economics-audit.md)
  Example: Untaxed consumer surplus is 25/2; prices and quantity determine the new areas
  Audit: implemented
- [x] `econ.tax.loss` Distinguish transferred revenue from deadweight loss — canonical caller. [Evidence](../../repertoire-notes/economics-audit.md)
  Example: Tax revenue 12 is a transfer; deadweight loss is 4
  Audit: implemented
- [ ] `econ.tax.incidence` Vary elasticities to compare economic incidence.
  Example: Statutory remittance does not alone determine who bears the burden
  Audit: unaudited
- [ ] `econ.subsidy` Interpret a subsidy as a wedge with a budget cost.
  Example: Buyer and seller prices differ while government finances the gap
  Audit: unaudited
- [ ] `econ.externality` Separate private from social marginal costs or benefits.
  Example: A polluting producer can ignore a cost borne by others
  Audit: unaudited
- [ ] `econ.pigouvian` Relate a corrective tax to marginal external damage at the efficient quantity.
  Example: The relevant marginal damage need not be constant
  Audit: unaudited
- [ ] `econ.public-good` Distinguish public goods from common resources.
  Example: Nonrivalry and excludability are separate properties
  Audit: unaudited
- [ ] `econ.collective` Compare individual incentives with a collective outcome.
  Example: Free riding can prevent a mutually beneficial contribution
  Audit: unaudited
- [ ] `econ.information` Distinguish adverse selection from moral hazard.
  Example: Hidden type before contracting differs from hidden action afterward
  Audit: unaudited
- [ ] `econ.risk` Compare expected utility with utility of expected wealth.
  Example: For concave u, E[u(W)]≤u(E[W])
  Audit: unaudited
- [ ] `econ.insurance` Relate pooling, selection and incentives in insurance.
  Example: Risk pooling changes exposure but does not remove all information problems
  Audit: unaudited
- [ ] `econ.distribution` Separate efficiency claims from distributional judgments.
  Example: A policy can increase total surplus while making some people worse off
  Audit: unaudited
- [ ] `econ.inequality` Interpret a Lorenz curve and an inequality measure.
  Example: Equal mean income does not imply equal distribution
  Audit: unaudited
- [ ] `econ.institutions` State how rules and bargaining power change feasible outcomes.
  Example: A changed outside option can alter bargaining without changing technology
  Audit: unaudited

### Visual motifs

- [x] `motif.econ.wedge` Coordinate the two prices and their common tax wedge — canonical caller. [Evidence](../../repertoire-notes/economics-audit.md)
  Example: Both prices refer to the same traded quantity
  Audit: implemented
- [x] `motif.econ.welfare` Separate surplus transfers from lost trades — canonical caller. [Evidence](../../repertoire-notes/economics-audit.md)
  Example: Revenue and deadweight-loss regions have different meanings
  Audit: implemented
- [ ] `motif.econ.stakeholders` Keep gains and losses attached to their recipients.
  Example: Aggregation does not erase who benefits
  Audit: unaudited
