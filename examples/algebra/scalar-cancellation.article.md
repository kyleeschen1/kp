---
kp:
  schema: kp.article.v1
  id: lesson.algebra.scalar-cancellation
  imports:
---

# Why does one denominator factor remain?

Multiplying by $x$ does not undo division by $x^2$: the denominator contains
two copies of the factor. Follow the matching pair that disappears, then locate
the copy that remains. That remaining copy determines how the result changes.

:::kp-passage{#remaining-factor}
Let $x>0$ and let $b$ be real. Define $R$ by the first expression below.
The numerator $b^2$ will stay unchanged throughout.

$$\begin{aligned}
R&=\frac{1}{2}x\frac{b^2}{x^2}\\
 &=\frac{b^2}{2x}
\end{aligned}$$

There is **one** factor of $x$ outside the fraction but **two** in its
denominator. Cancellation removes a matching pair, not every occurrence of the
letter. The remaining denominator factor is why, with $b$ fixed, doubling $x$
halves $R$.

The single written step contains several moves. Inspect it to expose the two
denominator factors, cancel one pair, then follow the $2$ from $1/2$ into the
remaining denominator. Open the smaller steps to examine each move separately.
:::

The condition $x>0$ guarantees that none of these divisions is by zero.
This is an algebraic relationship, not a claim about a particular physical
quantity.
