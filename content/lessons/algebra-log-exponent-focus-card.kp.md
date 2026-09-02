---
kp:
  schema: kp.article.v1
  id: lesson.algebra.log-exponent-focus-card
  imports:
    logSolve: vignette.algebra.log-exponent-solve@1
---

# How do logarithms release an exponent?

:::kp-stage{#log-solve use=logSolve}
:::

:::kp-passage{#solve-exponential intent=causal-rewrite}
[The unknown is not a term we can collect: in $2^x=7$, $x$ is held in the exponent](kp-ref:log-solve/source-equation).
[Because the natural logarithm is one-to-one on positive numbers, applying it to both sides preserves the equality while giving us access to that exponent](kp-ref:log-solve/source-exponent).
[The whole equation becomes $\ln(2^x)=\ln 7$](kp-ref:log-solve/logged-equation).
[Now the left side has the structure $\ln(a^x)$, so the power law $\ln(a^x)=x\ln a$ applies with $a=2$](kp-ref:log-solve/logged-power).
[That rewrite gives $x\ln 2=\ln 7$; the exponent has become an ordinary coefficient](kp-ref:log-solve/extracted-equation).
[Since $\ln 2\ne0$, divide both sides by $\ln 2$ to isolate $x=\frac{\ln 7}{\ln 2}$](kp-ref:log-solve/solved-equation).
:::
