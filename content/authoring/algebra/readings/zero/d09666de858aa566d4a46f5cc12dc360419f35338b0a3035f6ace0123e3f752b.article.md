# What if the whole is zero?

If a parenthesized quantity adds up to zero, can we still treat it as one thing, combine its counts and distribute those counts to its parts? Yes. The important restriction appears when we try to divide by that quantity.

Keep the same expression and let x be 2 and y be negative 2. The two parts are nonzero, but their sum is zero. This distinction matters: a whole can vanish in value while its parts remain meaningful contributions. We will follow the ordinary regrouping steps before considering what cancellation would require.

```kp-animation-story
{
  "id": "story.what-counts",
  "asset": {
    "id": "animation.composed-algebra-v2.7b2d98b4554f80a3456ee6891df12dfdf069f76c11af05471b727908e37f2c61",
    "version": "1"
  },
  "presentation": "scroll-scrub",
  "beats": [
    {
      "id": "passage.state.what-counts.repeated",
      "title": "A zero-valued whole",
      "content": "Both terms contain the same whole. In our chosen case, that whole is zero: the positive contribution of 2 and the negative contribution of 2 cancel within each copy. The first term counts three copies of zero and the second counts two. Counting a zero-valued quantity is still well defined; each copy simply contributes zero to the total.",
      "progressPermille": 0,
      "focusRefs": [
        "state.what-counts.repeated"
      ]
    },
    {
      "id": "state.what-counts.repeated",
      "title": "Notice the same whole",
      "content": "Treat this whole as one quantity. You can count it before you know its value. The same whole appears again. That sameness lets the counts combine.",
      "progressPermille": 0,
      "focusRefs": [
        "state.what-counts.repeated"
      ]
    },
    {
      "id": "passage.state.what-counts.collected",
      "title": "Combine counts without division",
      "content": "Gathering the counts will still be valid. Three copies followed by two copies can be regrouped as five copies, whatever one copy is worth. This move only reorganizes addition. It does not divide by the common group, so it does not need an assumption that the group is nonzero. The same reasoning works for a positive, negative or zero-valued whole.",
      "progressPermille": 333,
      "focusRefs": [
        "state.what-counts.collected"
      ]
    },
    {
      "id": "passage.state.what-counts.counted",
      "title": "Predict what happens to the parts",
      "content": "Evaluating the count will give five copies of the zero-valued whole. Before opening it, predict what will happen to its parts. Will both resulting terms have to be zero individually, or could nonzero terms cancel? Remember that each copy contains a positive contribution and a negative contribution of equal size.",
      "progressPermille": 667,
      "focusRefs": [
        "state.what-counts.counted"
      ]
    },
    {
      "id": "passage.state.what-counts.opened",
      "title": "Nonzero parts can cancel",
      "content": "Opening the group will expose two terms: five contributions of x and five of y. With x equal to 2, the first will contribute 10. With y equal to negative 2, the second will contribute negative 10. Their sum will be zero, just as before. Distributing does not turn each part into zero; it makes the opposing contributions visible. Regrouping preserves the total even though the individual terms are nonzero.",
      "progressPermille": 1000,
      "focusRefs": [
        "state.what-counts.opened"
      ]
    },
    {
      "id": "state.what-counts.opened",
      "title": "Notice both contributions",
      "content": "Five contributions of the first part. Each of the five copies contained it. And five of the second part. Opening the group preserves every contribution.",
      "progressPermille": 1000,
      "focusRefs": [
        "state.what-counts.opened"
      ]
    }
  ]
}
```

Now separate that reasoning from cancellation by division. Dividing by a nonzero number reverses multiplication by that number. Multiplication by zero cannot be reversed in the same way: many different numbers all produce zero. There is no unique original number to recover.

For example, two copies of zero and seven copies of zero have the same value. That does not mean two equals seven. If we divided both sides of that equality by the common zero-valued group and kept only the counts, we would draw a false conclusion. This is why cancelling a common factor from both sides of an equation requires that factor to be nonzero.

Notice how different the two questions are. To combine counts in a sum, we ask whether they count the same whole. To recover or compare the counts by cancelling a factor from an equality, we also need to know that the factor is nonzero. Factoring itself does not secretly perform that division.

Try a changed case: let x be negative 3 and y be 3. What are the two terms after distributing five across the group? Can their sum be zero even though neither term is zero? And does an equality between two copies and seven copies of this whole tell you that the counts are equal?

The opened terms contribute negative 15 and positive 15, so their sum is zero. The equal totals of two copies and seven copies reveal nothing about equality of the counts in this case. The habit to keep is to name the operation you are using: reorganizing contributions and undoing multiplication require different justifications.
