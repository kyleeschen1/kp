# Probability and statistics

## Probability and conditional reasoning

### Semantic moves

- [ ] `prob.events` Construct a sample space with mutually exclusive outcomes.
  Example: A two-event binary space has TT, TF, FT and FF
  Audit: unaudited
- [ ] `prob.complement` Use complement and inclusion-exclusion without double counting.
  Example: P(A∪B)=P(A)+P(B)-P(A∩B)
  Audit: unaudited
- [ ] `prob.count` Distinguish ordered selections from unordered combinations.
  Example: Choose two from n: n(n-1)/2
  Audit: unaudited
- [x] `prob.joint` Build a binary joint distribution from prior and likelihoods — ticket caller. [Evidence](../../repertoire-notes/applied-math-audit.md)
  Example: P(U)=1/5, P(F|U)=4/5 → P(U∩F)=4/25
  Audit: implemented
- [x] `prob.marginal` Marginalize a binary joint distribution — ticket caller. [Evidence](../../repertoire-notes/applied-math-audit.md)
  Example: P(F)=P(U∩F)+P(not U∩F)=6/25
  Audit: implemented
- [x] `prob.condition` Change the reference population and normalize — ticket caller. [Evidence](../../repertoire-notes/applied-math-audit.md)
  Example: P(U|F)=(4/25)/(6/25)=2/3
  Audit: implemented
- [x] `prob.bayes` Reverse binary conditioning using the joint model — ticket caller. [Evidence](../../repertoire-notes/applied-math-audit.md)
  Example: Prior and likelihoods determine the posterior through shared joint mass
  Audit: implemented
- [x] `prob.tree-reorder` Reorder two binary events without changing joint masses — ticket caller. [Evidence](../../repertoire-notes/applied-math-audit.md)
  Example: Split by U then F, or F then U; each leaf keeps its mass
  Audit: implemented
- [ ] `prob.independence` Test independence rather than assuming it from disjointness.
  Example: P(A∩B)=P(A)P(B); disjoint positive-probability events are dependent
  Audit: unaudited
- [ ] `prob.total` Partition an event by an exhaustive set of hypotheses.
  Example: P(E)=ΣP(E|H_i)P(H_i)
  Audit: unaudited
- [ ] `prob.zero-condition` Reject conditioning on a zero-probability discrete event. [Evidence](../../repertoire-notes/applied-math-audit.md)
  Example: P(A|B) is undefined if P(B)=0
  Audit: partial — binary model handles zero masses; general instructional comparison not established
- [ ] `prob.causal` Distinguish observing an event from intervening on it.
  Example: P(Y|X=x) need not equal P(Y|do(X=x))
  Audit: unaudited

### Visual motifs

- [x] `motif.prob.population` Gather and normalize a reference population — binary caller. [Evidence](../../repertoire-notes/applied-math-audit.md)
  Example: Four joint outcomes persist while the denominator population changes
  Audit: implemented
- [x] `motif.prob.tree` Reorder branches without implying a change in underlying outcomes. [Evidence](../../repertoire-notes/applied-math-audit.md)
  Example: The same four leaves retain exact masses
  Audit: implemented
- [ ] `motif.prob.causal` Compare observational and intervention assumptions explicitly.
  Example: A removed causal arrow is not a low-probability event
  Audit: unaudited
