# Solve for x

An equation is a promise that both sides have the same value. To keep that promise, make the same move on both sides.

Watch [the unknown](kp:focus/equation.linear-solve.initial.lhs.x "x stays the same object as the equation changes") as the other terms move around it.

```kp-animation-story
{
  "id": "story.solve-x",
  "asset": {
    "id": "animation.linear-solve.solve-x",
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
      "progressPermille": 333,
      "focusRefs": ["equation.linear-solve.after-subtract.lhs.minus3", "equation.linear-solve.after-subtract.rhs.3"]
    },
    {
      "id": "beat.cancel",
      "title": "Let opposites cancel",
      "content": "On the left, plus three and minus three cancel. The unknown remains.",
      "progressPermille": 667,
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
