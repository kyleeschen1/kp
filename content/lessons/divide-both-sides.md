# Divide both sides

One equal move can uncover the unknown without asking you to imagine a skipped step.

Follow [x](kp:focus/equation.divide-both-sides.initial.lhs.x "x remains the same quantity while both sides are divided") as the symbols reorganize around it.

```kp-animation-story
{
  "id": "story.divide-both-sides",
  "asset": { "id": "animation.divide-both-sides.solve-3x-equals-12", "version": "1" },
  "presentation": "scroll-scrub",
  "beats": [
    {
      "id": "beat.read",
      "title": "Read the coefficient",
      "content": "Three copies of x equal twelve.",
      "progressPermille": 0,
      "focusRefs": ["equation.divide-both-sides.initial"]
    },
    {
      "id": "beat.divide",
      "title": "Divide both sides by three",
      "content": "The same divisor enters on both sides. Each whole side becomes a fraction at the same moment.",
      "progressPermille": 333,
      "focusRefs": ["equation.divide-both-sides.divided.lhs.fraction.denominator.3", "equation.divide-both-sides.divided.rhs.fraction.denominator.3"]
    },
    {
      "id": "beat.cancel",
      "title": "Cancel the coefficient",
      "content": "Three divided by three is one, so the left side becomes x while twelve divided by three remains visible.",
      "progressPermille": 667,
      "focusRefs": ["equation.divide-both-sides.coefficient-cancelled.lhs.x", "equation.divide-both-sides.coefficient-cancelled.rhs.fraction.denominator.3"]
    },
    {
      "id": "beat.solve",
      "title": "Resolve the quotient",
      "content": "Twelve divided by three becomes four, so x equals four.",
      "progressPermille": 1000,
      "focusRefs": ["equation.divide-both-sides.solved"]
    }
  ]
}
```
