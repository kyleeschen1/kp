# Distribute and collect like terms

Distribute each factor, gather like terms, and collect the result. The visible detail can fold, but every operation and signed term remains part of the same solution.

Track the [outside factors](kp:focus/factored.left-factor,factored.right-factor "Each outside factor branches to both terms in its group") as they fan into four products, then follow the [signed constants](kp:focus/distributed.constant-6,distributed.negative-2 "Six and negative two stay signed as they gather and combine").

```kp-animation-story
{
  "id": "story.foldable-distribution",
  "asset": { "id": "animation.foldable-distribution.collect-like-terms", "version": "1" },
  "presentation": "scroll-scrub",
  "beats": [
    {
      "id": "beat.factored",
      "title": "Read the two grouped products",
      "content": "Three multiplies the entire first group, and two multiplies the entire second group.",
      "progressPermille": 0,
      "checkpointId": "factored",
      "focusRefs": [
        "factored.left-factor",
        "factored.left-x",
        "factored.left-constant",
        "factored.right-factor",
        "factored.right-x",
        "factored.right-negative-one"
      ]
    },
    {
      "id": "beat.distributed",
      "title": "Fan each factor into its group",
      "content": "Each outside factor branches to both descendant products. Folding can compress this work, but it never removes either multiplication.",
      "progressPermille": 281,
      "checkpointId": "distributed",
      "focusRefs": [
        "distribution.left.factor-3-x",
        "distribution.left.factor-3-constant",
        "distribution.right.factor-2-x",
        "distribution.right.factor-2-constant"
      ]
    },
    {
      "id": "beat.products-evaluated",
      "title": "Evaluate the constant products",
      "content": "Three times two becomes six, and two times negative one becomes negative two. Each result retains both contributors.",
      "progressPermille": 563,
      "checkpointId": "products-evaluated",
      "focusRefs": [
        "distributed.constant-6",
        "distributed.negative-2"
      ]
    },
    {
      "id": "beat.grouped",
      "title": "Gather like terms",
      "content": "The x terms move together and the signed constants move together. Their identities and signs do not change during the reflow.",
      "progressPermille": 781,
      "checkpointId": "grouped",
      "focusRefs": [
        "grouped.term-3x",
        "grouped.term-2x",
        "grouped.constant-6",
        "grouped.negative-2"
      ]
    },
    {
      "id": "beat.collected",
      "title": "Collect each group",
      "content": "Three x and two x coalesce into five x, while six and negative two coalesce into four.",
      "progressPermille": 1000,
      "checkpointId": "collected",
      "focusRefs": [
        "collected.coefficient-5",
        "collected.x",
        "collected.constant-4"
      ]
    }
  ]
}
```
