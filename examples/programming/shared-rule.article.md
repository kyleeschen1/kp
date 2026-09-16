---
kp:
  schema: kp.article.v1
  id: lesson.programming.shared-rule
  imports:
---

# One decision, two callers

The checkout price says shipping is free, but the message says it costs $5.
How could that happen? If the same threshold is maintained in two places,
someone can update one copy and forget the other.

We can give that decision one home without changing what either caller returns.

:::kp-passage{#before}
## Before: the decision is repeated

Both functions ask `total >= 50`. The conditional expression `condition ? a : b`
chooses `a` when the condition is true and `b` otherwise.
:::

:::kp-passage{#transition}
## Extract the decision, keep the answers

Put `total >= 50` in a function named `qualifiesForFreeShipping`, then replace
each old comparison with a call to it. Each call passes its own `total` and gets
the same true-or-false answer as before. The price choices and message choices
stay in their original functions: sharing a decision does not mean sharing
everything those functions do.

If that step feels too quick, inspect where the comparison goes and how each
caller reconnects to it. The moving code is a working view, not another program
you need to read in addition to the before and after.
:::

:::kp-passage{#after}
## After: one rule supplies both decisions
:::

:::kp-passage{#why}
The helper only compares its argument with 50. It does not modify the argument
or change other state. Replacing either comparison with this helper call keeps
that caller's condition and both possible answers intact.

The evidence below checks the declared totals 49, 50 and 75 using the existing
bounded threshold model. These cases are useful checks around the boundary;
they are **not** a proof for all inputs or arbitrary TypeScript programs.
The animation tracks the authored refactor, not execution of either function.
:::

:::kp-passage{#check}
## Try the idea

Suppose the threshold becomes $60. Where should you make the change now?
Change the comparison inside `qualifiesForFreeShipping`; neither caller needs
its own threshold edit. The price and message still make different outputs,
but they cannot disagree because only one copy of this rule was updated.
:::
