# Economics

## Choice, scarcity and market comparison

### Semantic moves

- [ ] `econ.opportunity` Identify opportunity cost relative to a feasible alternative.
  Example: Choosing one hour of study forgoes the best alternative use of that hour
  Audit: unaudited
- [ ] `econ.ppf` Distinguish feasible, efficient and unattainable production combinations.
  Example: A point inside a production frontier can be feasible but inefficient
  Audit: unaudited
- [ ] `econ.comparative-advantage` Compare opportunity costs rather than absolute productivity.
  Example: A less productive producer can still have a comparative advantage
  Audit: unaudited
- [ ] `econ.marginal` Separate marginal from average and total quantities.
  Example: MC=dC/dq differs from AC=C/q
  Audit: unaudited
- [ ] `econ.sunk` Exclude sunk costs from a forward-looking choice while retaining avoidable costs.
  Example: A nonrefundable past payment does not change the cost of the next unit
  Audit: unaudited
- [x] `econ.equilibrium` Solve a bounded linear market-clearing condition — demand-shift caller. [Evidence](../../repertoire-notes/economics-audit.md)
  Example: Demand price equals supply price at the same quantity
  Audit: implemented
- [x] `econ.demand-shift` Change a demand intercept while holding supply fixed — canonical caller. [Evidence](../../repertoire-notes/economics-audit.md)
  Example: A higher demand curve changes the equilibrium price and quantity
  Audit: implemented
- [ ] `econ.along-versus-shift` Distinguish movement along supply from a shift in supply. [Evidence](../../repertoire-notes/economics-audit.md)
  Example: A demand shift can change quantity supplied without changing the supply function
  Audit: partial — canonical demand-shift publication exists; separate transferable comparison not established
- [ ] `econ.ceteris` State which assumptions are held fixed in comparative statics.
  Example: Changing income while holding tastes and other prices fixed
  Audit: unaudited
- [ ] `econ.adjustment` Separate equilibrium comparison from a dynamic adjustment mechanism.
  Example: An arrow between equilibria does not prove the market follows that time path
  Audit: unaudited
- [ ] `econ.elasticity` Compute point elasticity and distinguish it from slope.
  Example: ε=(dQ/dP)(P/Q), with nonzero P,Q
  Audit: unaudited
- [ ] `econ.elasticity-arc` Use a midpoint convention for a finite elasticity comparison.
  Example: Percent changes use midpoint price and quantity
  Audit: unaudited
- [ ] `econ.revenue-elasticity` Relate a price change to total revenue through demand elasticity.
  Example: Locally, elastic demand can make a price increase reduce revenue
  Audit: unaudited
- [ ] `econ.controls` Compare binding and nonbinding price controls.
  Example: A ceiling below competitive equilibrium can create excess demand under the model
  Audit: unaudited

### Visual motifs

- [x] `motif.econ.parameter` Coordinate a parameter, its curve and the new intersection — bounded caller. [Evidence](../../repertoire-notes/economics-audit.md)
  Example: Demand changes while supply retains its identity
  Audit: implemented
- [ ] `motif.econ.baseline` Retain a baseline when comparing an altered assumption.
  Example: Before and after refer to the same goods and axes
  Audit: unaudited
- [ ] `motif.econ.causal` Distinguish a comparative-static arrow from a time-evolution path.
  Example: A transition need not assert a market-adjustment law
  Audit: unaudited
