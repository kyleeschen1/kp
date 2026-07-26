# From a half power to a square root

A half power and a square root name the same value. The notation changes while the value represented by \(x\) stays fixed.

Track the [fraction bar](kp:focus/expression.generated.radical.square-root-as-power.power.exponent-fraction-line "The exponent fraction bar becomes the radical overbar") and [denominator](kp:focus/expression.generated.radical.square-root-as-power.power.exponent-denominator "The denominator two becomes the radical hook") through the rewrite.

```kp-animation-story
{
  "id": "story.radical-succession",
  "asset": { "id": "animation.generated.radical.square-root-as-power", "version": "1" },
  "presentation": "scroll-scrub",
  "beats": [
    {
      "id": "beat.power",
      "title": "Read the rational exponent",
      "content": "The one-half exponent asks for the square root of x.",
      "progressPermille": 0,
      "focusRefs": [
        "expression.generated.radical.square-root-as-power.power.base",
        "expression.generated.radical.square-root-as-power.power.exponent-numerator",
        "expression.generated.radical.square-root-as-power.power.exponent-fraction-line",
        "expression.generated.radical.square-root-as-power.power.exponent-denominator"
      ]
    },
    {
      "id": "beat.rewrite",
      "title": "Follow the notation change",
      "content": "The exponent structure succeeds into radical structure: the fraction bar becomes the overbar, and the denominator becomes the hook.",
      "progressPermille": 500,
      "focusRefs": [
        "expression.generated.radical.square-root-as-power.power.exponent-fraction-line",
        "expression.generated.radical.square-root-as-power.power.exponent-denominator",
        "expression.generated.radical.square-root-as-power.radical.radical-hook",
        "expression.generated.radical.square-root-as-power.radical.radical-overbar"
      ]
    },
    {
      "id": "beat.radical",
      "title": "Read the square root",
      "content": "The radical now expresses the same value, with x preserved as the radicand.",
      "progressPermille": 1000,
      "focusRefs": [
        "expression.generated.radical.square-root-as-power.radical.radical-hook",
        "expression.generated.radical.square-root-as-power.radical.radical-overbar",
        "expression.generated.radical.square-root-as-power.radical.radicand"
      ]
    }
  ]
}
```
