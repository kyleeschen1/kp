# Solve for x

An equation is a promise that both sides have the same value. This detailed path makes the cancellation result explicit before simplifying it away.

Watch [the unknown](kp:focus/equation.linear-solve.initial.lhs.x "x stays the same object as the equation changes") as each algebraic identity gets its own step.

```kp-animation-story
{
  "id": "story.solve-x-teacher-zero",
  "asset": {
    "id": "animation.linear-solve.solve-x.teacher-zero",
    "version": "1"
  },
  "presentation": "scroll-scrub",
  "beats": [
    {
      "id": "beat.read",
      "title": "Read the equality",
      "content": "Start with the whole equation: x plus three equals seven.",
      "progressPermille": 0,
      "focusRefs": ["equation.linear-solve.initial"]
    },
    {
      "id": "beat.subtract",
      "title": "Make the same move twice",
      "content": "Subtract three from both sides. Equality survives because the two moves match.",
      "progressPermille": 250,
      "focusRefs": ["equation.linear-solve.after-subtract.lhs.minus3", "equation.linear-solve.after-subtract.rhs.3"]
    },
    {
      "id": "beat.make-zero",
      "title": "Make the zero visible",
      "content": "On the left, plus three and minus three make zero: x plus zero equals seven minus three.",
      "progressPermille": 500,
      "focusRefs": ["equation.linear-solve.teacher-zero.lhs.plus", "equation.linear-solve.teacher-zero.lhs.zero"]
    },
    {
      "id": "beat.remove-zero",
      "title": "Use the additive identity",
      "content": "Adding zero changes nothing, so x plus zero becomes x while the right side stays seven minus three.",
      "progressPermille": 750,
      "focusRefs": ["equation.linear-solve.left-simplified.lhs.x"]
    },
    {
      "id": "beat.solve",
      "title": "Read the solution",
      "content": "Seven minus three is four, so x equals four.",
      "progressPermille": 1000,
      "focusRefs": ["equation.linear-solve.solved"]
    }
  ]
}
```
