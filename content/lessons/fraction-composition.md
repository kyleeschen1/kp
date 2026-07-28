# Distribute and solve with a fraction

Distribute two thirds, normalize the numerators, and solve the equation. The
work stays exact while the explanation can reveal or fold each verified group
of operations.

Track the [same equation](kp:focus/fraction-solve.state.factored "Every visible step belongs to one exact solution trace") as the fraction distributes, the constants simplify, and the variable becomes isolated.

```kp-animation-story
{
  "id": "story.fraction-composition",
  "asset": { "id": "animation.fraction-composition.two-thirds-solve", "version": "1" },
  "presentation": "scroll-scrub",
  "beats": [
    {
      "id": "beat.fraction-composition.factored",
      "title": "Read the fraction as one factor",
      "content": "Two thirds multiplies the complete quantity x plus six.",
      "progressPermille": 0,
      "checkpointId": "factored",
      "focusRefs": ["fraction-solve.state.factored"]
    },
    {
      "id": "beat.fraction-composition.normalized",
      "title": "Distribute and normalize",
      "content": "The complete fraction fans into both terms, then each product settles over the shared denominator.",
      "progressPermille": 154,
      "checkpointId": "normalized",
      "focusRefs": ["fraction-solve.state.normalized"]
    },
    {
      "id": "beat.fraction-composition.constant-quotient",
      "title": "Evaluate the constant fraction",
      "content": "Two times six becomes twelve before twelve divided by three becomes four.",
      "progressPermille": 308,
      "checkpointId": "constant-quotient",
      "focusRefs": ["fraction-solve.state.constant-quotient"]
    },
    {
      "id": "beat.fraction-composition.difference-simplified",
      "title": "Subtract four from both sides",
      "content": "The same subtraction enters both sides, the additive inverses cancel, and ten minus four becomes six.",
      "progressPermille": 538,
      "checkpointId": "difference-simplified",
      "focusRefs": ["fraction-solve.state.difference-simplified"]
    },
    {
      "id": "beat.fraction-composition.right-product-simplified",
      "title": "Clear the denominator",
      "content": "Multiplying both sides by three cancels the denominator and turns six times three into eighteen.",
      "progressPermille": 769,
      "checkpointId": "right-product-simplified",
      "focusRefs": ["fraction-solve.state.right-product-simplified"]
    },
    {
      "id": "beat.fraction-composition.solved",
      "title": "Divide by two",
      "content": "The common factor of two cancels, and eighteen divided by two gives the exact solution x equals nine.",
      "progressPermille": 1000,
      "checkpointId": "solved",
      "focusRefs": ["fraction-solve.state.solved"]
    }
  ]
}
```
