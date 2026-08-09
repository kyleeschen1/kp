---
kp:
  schema: kp.article.v1
  id: lesson.algebra.fraction-composition.article
  imports:
    fractionSolve: vignette.algebra.fraction-composition@1
---

# What does the fraction multiply?

Consider the equation

$$
\frac{2}{3}(x+6)=10.
$$

The goal is $x=9$, but the useful question is not how quickly we can reach it.
It is what each operation does while the equation keeps the same solution.

:::kp-stage{#solve use=fractionSolve}
:::

### Read the grouped expression first

:::kp-focus{#read-scope stage=solve target="solve/factor solve/grouped-sum" context="solve/equation"}
The [factor](kp-ref:solve/factor) is outside the
[grouped sum](kp-ref:solve/grouped-sum), so two thirds multiplies both $x$ and
$6$. The parentheses mark one complete quantity; they are not decoration.
:::

:::kp-motion{#distribute stage=solve run=solve/distribute-and-normalize}
Follow the factor as it distributes into both addends. Keep the denominator
$3$ attached to each resulting fraction.

::after

The [variable term](kp-ref:solve/distributed-variable-term) and
[constant term](kp-ref:solve/distributed-constant-term) now show the same
distributed factor. Nothing crossed the equals sign, and the solution set did
not change.
:::

Distribution changes the form of the left side, not its value. At every
checkpoint, the expression on the left still equals $10$ for exactly the same
value of $x$.

### Evaluate only what is ready

:::kp-motion{#evaluate-constant stage=solve run=solve/evaluate-constant}
Hold the variable fraction in place while $2\cdot6$ becomes $12$, then
$12/3$ becomes $4$.

::after

The equation is now $\frac{2x}{3}+4=10$. Simplifying the
[constant](kp-ref:solve/constant-term) did not require approximating or
changing the [variable fraction](kp-ref:solve/variable-fraction).
:::

The next aim is to isolate the fractional variable term. “Move the four” is a
misleading shortcut: the lawful action is to subtract $4$ from both sides.

:::kp-motion{#subtract-four stage=solve run=solve/subtract-and-simplify}
Apply the same subtraction to the [left side](kp-ref:solve/left-side) and the
[right side](kp-ref:solve/right-side). On the left, $4$ and $-4$ cancel; on the
right, $10-4$ becomes $6$.

::after

The isolated equation is $\frac{2x}{3}=6$. Equality was preserved because the
same operation was applied on both sides.
:::

### Clear factors in a deliberate order

:::kp-motion{#clear-denominator stage=solve run=solve/clear-denominator}
Multiply both sides by $3$. Watch the
[denominator](kp-ref:solve/denominator) cancel only after the variable fraction
has been isolated.

::after

The equation settles at $2x=18$. The denominator is gone because $3$ and
$1/3$ are multiplicative inverses, not because a fraction bar faded away.
:::

:::kp-motion{#divide-by-two stage=solve run=solve/divide-and-solve}
Divide both sides by the [coefficient](kp-ref:solve/coefficient), $2$, and keep
the equality balanced through the final cancellation.

::after

The exact [solution](kp-ref:solve/solution) is $x=9$.
:::

### Check the result in the original equation

:::kp-passage{#verify-solution intent=verification}
Substitute $9$ before trusting the final line:

$$
\frac{2}{3}(9+6)=\frac{2}{3}(15)=10.
$$

The check succeeds. More importantly, the complete animation is one chain of
equivalent equations: distribution, arithmetic, and inverse operations expose
the solution without ever changing it.
:::
