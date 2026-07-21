# Solve an equation with a fraction

The fraction is not a detour. It tells us which equal move will uncover the unknown.

Follow [x](kp:focus/equation.fractional-linear.initial.fraction.numerator.x "x remains the same quantity through every legal step") through the fraction, the cancellation, and the final product.

```kp-animation-story
{
  "id": "story.solve-fractional-linear",
  "asset": { "id": "animation.fractional-linear.solve-x-over-2", "version": "1" },
  "presentation": "scroll-scrub",
  "beats": [
    {
      "id": "beat.read",
      "title": "Read the fraction",
      "content": "Start with x divided by two, plus three, equals seven.",
      "progressPermille": 0,
      "focusRefs": ["equation.fractional-linear.initial"]
    },
    {
      "id": "beat.subtract",
      "title": "Remove three equally",
      "content": "Subtract three from both sides. The matching moves preserve equality.",
      "progressPermille": 167,
      "focusRefs": ["equation.fractional-linear.after-subtract.lhs.minus3", "equation.fractional-linear.after-subtract.rhs.3"]
    },
    {
      "id": "beat.cancel-additive",
      "title": "Let the opposites cancel",
      "content": "Plus three and minus three cancel on the left, leaving x divided by two.",
      "progressPermille": 333,
      "focusRefs": ["equation.fractional-linear.additive-cancelled.fraction.numerator.x"]
    },
    {
      "id": "beat.simplify-difference",
      "title": "Simplify seven minus three",
      "content": "Seven minus three becomes four. The fraction itself has not changed.",
      "progressPermille": 500,
      "focusRefs": ["equation.fractional-linear.right-simplified.rhs.4"]
    },
    {
      "id": "beat.multiply",
      "title": "Multiply both sides by two",
      "content": "A factor of two enters on each side. Equal multiplication keeps the equation balanced.",
      "progressPermille": 667,
      "focusRefs": ["equation.fractional-linear.multiplied.lhs.multiplier.2", "equation.fractional-linear.multiplied.rhs.multiplier.2"]
    },
    {
      "id": "beat.cancel-denominator",
      "title": "Watch the denominator cancel",
      "content": "The left factor of two cancels the denominator two. The same x remains.",
      "progressPermille": 833,
      "focusRefs": ["equation.fractional-linear.multiplied.lhs.multiplier.2", "equation.fractional-linear.multiplied.fraction.denominator.2"]
    },
    {
      "id": "beat.solve",
      "title": "Read the solution",
      "content": "Two times four is eight, so x equals eight.",
      "progressPermille": 1000,
      "focusRefs": ["equation.fractional-linear.solved"]
    }
  ]
}
```
