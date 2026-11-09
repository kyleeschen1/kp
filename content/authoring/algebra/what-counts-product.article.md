# Why do these groups multiply?

When three copies of a quantity are added to two copies, why do we write a product of two groups? Follow the distinction between a count and the quantity it counts. Then use that distinction to look inside each copy.

We will use x and y for two real numbers whose values stay fixed throughout the explanation. You only need the idea that multiplying a quantity by a positive whole number means adding that many copies of it. The numbers inside a group may be positive, negative or zero; the count tells us how many copies we have.

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
      "title": "Choose what counts as one",
      "content": "Look at the expression. The first term counts three copies of the quantity inside the parentheses; the second counts two copies. A parenthesized expression can be treated as one quantity even before we calculate it. We are not claiming that x and y are the same number. We are noticing that the entire sum is repeated, with the same x and the same y in each occurrence.",
      "progressPermille": 0,
      "focusRefs": [
        "state.what-counts.repeated"
      ]
    },
    {
      "id": "passage.what-counts.same-unit",
      "title": "Why the counts can combine",
      "content": "Imagine writing out the additions that multiplication abbreviates: three copies of that whole, followed by another two copies. Regrouping those additions gives five copies of exactly the same whole. This is the reason the counts can combine. The parentheses tell us what counts as one copy; they do not require us to work out its value first.",
      "progressPermille": 0,
      "focusRefs": [
        "state.what-counts.repeated"
      ]
    },
    {
      "id": "state.what-counts.repeated",
      "title": "Notice the repeated whole",
      "content": "Treat this whole as one quantity. You can count it before you know its value. The same whole appears again. That sameness lets the counts combine.",
      "progressPermille": 0,
      "focusRefs": [
        "state.what-counts.repeated"
      ]
    },
    {
      "id": "passage.state.what-counts.collected",
      "title": "Combine the counts",
      "content": "Gather the two counts while keeping their common group intact. The first pair of parentheses now answers “how many copies?” Three plus two gives five. The second pair answers “copies of what?” Each copy still contains x plus y. Writing the groups next to each other means multiply: five copies of that quantity. Parentheses do not themselves tell us to add the two groups; the relationship between them matters.",
      "progressPermille": 333,
      "focusRefs": [
        "state.what-counts.collected"
      ]
    },
    {
      "id": "passage.what-counts.product-contrast",
      "title": "Why the groups multiply",
      "content": "Try numbers that distinguish the two readings. Let x be 2 and y be 4, so one group has value 6. Three groups contribute 18 and two groups contribute 12: 30 altogether. Five copies of 6 also give 30. Adding the count 5 to one group of value 6 would instead give 11. That would describe a different calculation: five units plus one copy, rather than five copies. The numerical contrast makes the mistake visible; the argument about repeated copies explains why multiplication is the right relationship for every fixed x and y.",
      "progressPermille": 333,
      "focusRefs": [
        "state.what-counts.collected"
      ]
    },
    {
      "id": "state.what-counts.collected",
      "title": "Notice count and quantity",
      "content": "Only the counts meet. Three copies plus two copies. The whole stays intact. Nothing inside it has been added to the count.",
      "progressPermille": 333,
      "focusRefs": [
        "state.what-counts.collected"
      ]
    },
    {
      "id": "passage.state.what-counts.counted",
      "title": "Predict what is inside five copies",
      "content": "Evaluating three plus two will give five copies of the original group. To look inside, ask a different question: how many contributions of x are there, and how many of y? Each copy contains both. Before moving on, predict whether five groups contain five x contributions and one y contribution, or five of each. Explain your choice by following what every copy contains.",
      "progressPermille": 667,
      "focusRefs": [
        "state.what-counts.counted"
      ]
    },
    {
      "id": "state.what-counts.counted",
      "title": "Look inside one copy",
      "content": "Five copies of the whole. The count changed; the quantity did not. Now look inside one copy. It contains both parts. What will five copies contain?",
      "progressPermille": 667,
      "focusRefs": [
        "state.what-counts.counted"
      ]
    },
    {
      "id": "passage.state.what-counts.opened",
      "title": "Preserve every contribution",
      "content": "Opening the group will expose five contributions of each part. We can collect all the x contributions together and all the y contributions together because regrouping and reordering real-number addition preserves the total. That is why the five multiplies both parts. Multiplying only x would lose four contributions of y. Opening a product across a sum is called distributing; it exposes the parts that factoring had packaged together.",
      "progressPermille": 1000,
      "focusRefs": [
        "state.what-counts.opened"
      ]
    },
    {
      "id": "state.what-counts.opened",
      "title": "Notice every contribution",
      "content": "Five contributions of the first part. Each of the five copies contained it. And five of the second part. Opening the group preserves every contribution.",
      "progressPermille": 1000,
      "focusRefs": [
        "state.what-counts.opened"
      ]
    },
    {
      "id": "passage.what-counts.check",
      "title": "Check the reasoning with numbers",
      "content": "For a numerical check, let x be 2 and y be 4. One group is then 6. Three such groups contribute 18 and two contribute 12, for a total of 30. In the opened expression, five copies of 2 contribute 10 and five copies of 4 contribute 20: again 30. Five copies of 2 plus only one copy of 4 would give 14. This check catches the missing contributions; the argument about copies explains why the equality holds beyond these particular numbers.",
      "progressPermille": 1000,
      "focusRefs": [
        "state.what-counts.opened"
      ]
    }
  ]
}
```

There is a condition hiding in the phrase “the same whole.” If one term counts a group containing x and y, while the other counts a group containing x and z, we cannot generally add the counts and keep just the first group. For example, let x be 1, y be 2 and z be 4. Three copies of the first group and two of the second total 19; five copies of the first group total 15. The groups could happen to be equal for particular values, but their written forms do not guarantee it.

Nothing in our argument divided by the group. If x is 2 and y is negative 2, each whole is zero: five copies total zero, and the opened contributions cancel as well. A quantity does not have to be nonzero to be counted or distributed.

Try a changed case before looking back: two copies of a group containing a and b are added to four copies of that same group. How many copies of each part will the opened expression contain? What would stop you from combining the counts if the second group contained a and c instead?

Your reasoning should identify the repeated whole first. Two copies and four copies give six copies, and every copy contains both a and b, so there are six contributions of each. With different groups, the shared-whole argument no longer applies without additional information. You can still look for shared parts, but that is a different regrouping.

The useful habit is to ask both questions: what am I treating as one thing, and what must remain when I look inside it? Factoring and distributing change the organization of an expression. They preserve its value by preserving every contribution.

One more check: if a group has value 4 and we have three copies plus two copies, should the combined expression give 20 or 9? Twenty preserves the five copies. Nine adds the number of copies to the value of a single copy. Naming both roles helps you choose the operation, instead of relying on the shape of the parentheses.
