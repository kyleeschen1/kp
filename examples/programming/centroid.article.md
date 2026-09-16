---
kp:
  schema: kp.article.v1
  id: lesson.programming.centroid
  imports:
---

# Two loops, one idea

How do you find the center of a collection of points? Average their horizontal
coordinates, then their vertical coordinates. This gives their **centroid**:
the balance point if every point has equal weight.

For `(0, 0)`, `(6, 0)` and `(0, 3)`, the averages are `6 / 3 = 2` and
`3 / 3 = 1`. The center is `(2, 1)`.

Our coordinates live in two arrays: `xs` and `ys`. Each pair at the same index
belongs to one point. Assume both arrays are nonempty, equally long, and contain
finite numbers. You only need loops, variables and function calls for this example.

:::kp-passage{#pattern}
## 1. Notice the repeated procedure

Each block starts a sum at zero, adds every coordinate, then divides by the
number of coordinates. Different names, same work.
:::

:::kp-passage{#extract}
## 2. Give that procedure a name

Call it `mean`. We are extracting the **whole calculation**, not just the last
division. The helper takes an array and returns its average.

The important change is the boundary: an input now comes through a parameter,
and the answer leaves through `return`. Renaming variables alone would not
create a reusable calculation.
:::

:::kp-passage{#reuse}
## 3. Say what the calculation means

Replace each repeated block with a call. `mean(xs)` supplies the horizontal
coordinates; its returned value becomes `cx`. The second call does the same
for `ys` and `cy`.

Now the centroid calculation reads as its definition: **take the mean of each
coordinate**. The loop mechanics are still available in one place, but no
longer obscure the larger idea.

Each call starts a fresh `s` at zero. We shared code, **not a running sum**.
Calling `mean(ys)` cannot pick up the sum left by `mean(xs)`.
:::

:::kp-passage{#check}
## What stayed the same?

For each coordinate, we still visit values in the same order, perform the same
additions, and divide by the same length. We have changed how the program is
organized, not which calculation it requests. JavaScript still uses
floating-point numbers; extracting a helper does not make arithmetic exact or
prevent overflow for extreme inputs.

**Try transferring the idea:** if the points also had a `zs` coordinate array,
what line would compute the third coordinate of the center? Would it need a
new loop in `centroid`?
:::
