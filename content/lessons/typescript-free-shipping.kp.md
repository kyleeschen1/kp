---
kp:
  schema: kp.article.v1
  id: lesson.programming.typescript-free-shipping
  imports:
    shippingRule: vignette.programming.typescript-free-shipping@1
---

# One rule, one answer

A duplicated rule can quietly become two different rules. Here, checkout cost
and customer messaging both decide whether an order qualifies for free
shipping, but each keeps its own copy of the decision.

The refactor is small: give that decision one name, then make both callers use
it. The important motion is not the amount of code removed. It is the path from
two sources of truth to one.

:::kp-stage{#refactor use=shippingRule label="Extract one free-shipping rule"}
:::

### Notice the risk before changing anything

:::kp-focus{#find-duplication stage=refactor target="refactor/shipping-cost-rule refactor/shipping-message-rule" context="refactor/duplicated-program" intent=compare}
The two conditions currently agree. That visual repetition is the warning:
changing only one threshold could make the price and message contradict each
other.
:::

:::kp-motion{#extract-rule stage=refactor run=refactor/extract-shared-rule intent=transmit}
Name the shared decision before editing either caller. The duplicated
conditions now have an explicit destination.

::after

The helper owns the threshold. The callers can now ask a question whose name
explains the business rule.
:::

:::kp-motion{#update-price stage=refactor run=refactor/replace-cost-call intent=reveal}
Replace the price condition with a call to the new helper.

::after

Checkout cost now uses the named rule, while the message still shows the last
remaining duplicate.
:::

:::kp-motion{#update-message stage=refactor run=refactor/replace-message-call intent=reveal}
Replace the message condition with the same call.

::after

Both outcomes now depend on one decision. A future threshold change has one
place to happen.
:::

:::kp-passage{#verify-behavior intent=verification}
The structure is clearer, but a refactor must also preserve behavior. Orders
below, at, and above the threshold still produce the same shipping cost and
message as before. The program changed shape without changing its answer.
:::
