# Probability and statistics

## Statistics, inference and regression

### Semantic moves

- [ ] `stats.describe` Compare center, spread and outliers before modeling.
  Example: Median and mean differ under a strongly skewed sample
  Audit: unaudited
- [ ] `stats.design` Distinguish sampling variation, selection bias and confounding.
  Example: A large convenience sample can remain biased
  Audit: unaudited
- [ ] `stats.estimate` Distinguish an estimator from its realized estimate.
  Example: Sample mean is a random variable before sampling
  Audit: unaudited
- [ ] `stats.interval` Interpret a confidence interval through repeated sampling.
  Example: A 95% procedure covers the fixed parameter in 95% of repeated samples under its assumptions
  Audit: unaudited
- [ ] `stats.test` Compute a test statistic under an explicit null model.
  Example: Compare an observed standardized mean with its null distribution
  Audit: unaudited
- [ ] `stats.pvalue` Separate a p-value from the probability that the null is true.
  Example: p is a tail probability conditional on H₀
  Audit: unaudited
- [ ] `stats.power` Relate effect size, sample size and error rates.
  Example: Increasing n can increase power for a fixed alternative
  Audit: unaudited
- [ ] `stats.two-sample` Compare independent groups or paired changes appropriately.
  Example: Before/after differences use the pairing information
  Audit: unaudited
- [ ] `stats.chisquare` Compare observed counts with model-expected counts.
  Example: Σ(O-E)²/E requires adequate expected counts for its approximation
  Audit: unaudited
- [ ] `stats.anova` Compare between-group and within-group variation.
  Example: An F statistic tests equality of group means under model assumptions
  Audit: unaudited
- [ ] `stats.regression` Fit a linear relationship and interpret its residuals.
  Example: y_i=β₀+β₁x_i+ε_i
  Audit: unaudited
- [ ] `stats.regression-uncertainty` Distinguish uncertainty in a mean response from a new observation.
  Example: A prediction interval includes observation noise
  Audit: unaudited
- [ ] `stats.bootstrap` Resample to approximate an estimator's sampling variability.
  Example: Resample observations, recompute the median, inspect its distribution
  Audit: unaudited
- [ ] `stats.likelihood` Treat likelihood as a function of parameters for fixed data.
  Example: L(θ)=P(data|θ) is not a parameter probability distribution
  Audit: unaudited
- [ ] `stats.bayesian` Combine likelihood with an explicit prior and normalize.
  Example: p(θ|data) is proportional to p(data|θ)p(θ)
  Audit: unaudited
- [ ] `stats.multiple` Account for multiple comparisons and model selection.
  Example: Trying many tests changes the chance of false discoveries
  Audit: unaudited
- [ ] `stats.validation` Separate fitting from out-of-sample evaluation.
  Example: Choose a model without using the final test outcomes
  Audit: unaudited

### Visual motifs

- [ ] `motif.stats.uncertainty` Keep an estimate and its uncertainty attached to the same target.
  Example: Changing confidence level changes the interval, not the observed estimate
  Audit: unaudited
- [ ] `motif.stats.residuals` Connect points, fitted values and signed residuals.
  Example: Each vertical difference contributes to the fit criterion
  Audit: unaudited
- [ ] `motif.stats.assumptions` Expose which inference depends on which sampling/model assumption.
  Example: A failed assumption withdraws a conclusion, not the raw data
  Audit: unaudited
