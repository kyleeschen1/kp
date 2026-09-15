---
kp:
  schema: kp.article.v1
  id: lesson.algebra.scalar-cancellation
  imports:
---

# Why does one denominator factor remain?

An expression can multiply by a quantity and divide by its square at the same
time. Does the quantity cancel out completely? Counting the factors makes the
answer visible—and makes the simplified expression easier to reason with.

:::kp-passage{#remaining-factor}
Let $x>0$ and let $y$ be real. Define $Q$ by the first expression below.
The numerator $y^2$ will stay unchanged throughout.

$$\begin{aligned}
Q&=\frac{1}{2}x\frac{y^2}{x^2}\\
 &=\frac{y^2}{2x}
\end{aligned}$$

There is **one** factor of $x$ outside the fraction but **two** in its
denominator. Cancellation removes a matching pair, not every occurrence of the
letter. The remaining denominator factor is why, with $y$ fixed, doubling $x$
halves $Q$.

The single written step contains several moves. Inspect it to expose the two
denominator factors, cancel one pair, then follow the $2$ from $1/2$ into the
remaining denominator. Open the smaller steps to examine each move separately.
:::

The condition $x>0$ guarantees that none of these divisions is by zero.
This is an algebraic relationship, not a claim about a particular physical
quantity.
