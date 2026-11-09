# Choosing a move that preserves the solutions

Status: next teaching draft, 2026-11-09; not a selected reader revision or evidence
of learner transfer. Follows the explanation-first worksheet and the approved
authoring-to-practice programme. What counts remains the technical reference.

## Learner question and finite outcome

“How do I know what to do next in an equation, and why is that move allowed?”
Assume the learner can evaluate a simple fraction and understands that an equals
sign says the two expressions have the same value. Do not assume that “move it
across and change its sign” explains solving. Afterward, they should choose and
justify a reversible move on both sides, distinguish a legal move from a useful
one, and check the answer in the original equation. This is one linear equation,
not arbitrary symbolic solving or a lesson on all equivalence-preserving rules.

## Explanation draft before choreography

We want a number whose half, plus three, is seven. Rather than guess the number,
work backward from what happened to it: first it was halved, then three was added.
Removing that last addition leaves its half on its own.

Why subtract three from both sides? Imagine any number that makes the original
equation true. The two sides then have equal values. Subtracting three from each
leaves equal values again. We can also reverse this move by adding three to both
sides, so the new equation has exactly the same solutions. We have changed how
the condition is written, without changing which number satisfies it.

On the left, adding three and then subtracting three leaves just half the unknown.
On the right, seven minus three is four. So half the unknown is four. Doubling
both sides tells us the whole unknown is eight. Doubling is reversible here too:
we could divide both sides by two. Substituting eight into the original equation
checks our result: half of eight is four, and four plus three is seven.

Subtracting first is a convenient choice, not the only legal one. We could
double both sides at the start, but then we must double the entire left side,
including the added three. That would give the unknown plus six equal to fourteen.
Subtracting six would still give eight. The first route exposes the half more
directly; both routes preserve the solutions.

The tempting wrong move is to double just the fraction while doubling the right
side, leaving the three untouched. That gives the unknown plus three equal to
fourteen, whose solution eleven fails the original condition: half of eleven
plus three is eight and a half. “Do the same to both sides” means act on each
whole side, not whichever term currently attracts attention.

Try a changed case: a number is divided by three, then two is added, giving six.
What would you undo first, and why must the other side change too? Subtracting
two from both sides leaves a third of the number equal to four; multiplying both
sides by three gives twelve. A correct answer should explain preserved solutions,
not merely recite the number. Doubling-first comparison above is a static
reasoning check, not a new animated operation request.

## Visual job and preservation boundary

Canonical current artifact: `content/lessons/solve-fractional-linear.md`.
Host: `/reader/solve-fractional-linear/` on the shared product server, port 8011.
Asset: `animation.fractional-linear.solve-x-over-2`, version 1. The existing
fractional-linear lesson model/compiler owns its checked equation and operations;
the shared document theater and native KaTeX compositor own presentation.

Use the existing seven beats and semantic focus references. Entry should orient
the learner to the unknown being halved and then increased by three. Subtraction
should make both changes inspectable, then show why the opposites disappear.
Multiplication should connect the two sides before the denominator cancellation.
The perceptual purpose is tracking the same unknown while whole-side operations
change its surrounding expression. Static prose owns the legal-versus-useful
comparison, the wrong move, and the transfer question. Existing text-linked
focus lets a learner return to a precise referent; no new control is required
merely to make this draft more elaborate.

This remains a candidate advantage over a short static worked solution. Seeing
the quantities move does not establish that a learner understands the invariant.
Review the explanation and a changed-case response separately from visual polish.

## Translation gaps to resolve narrowly

The current fractional host does not yet expose the authored opening-note path
used by What counts, and its version-1 prose is not in that reading registry.
Do not overwrite the old source under version 1, copy What counts commentary,
or introduce a universal annotation system to hide those gaps. After the current
opening review, pressure the existing attention seam with this second caller,
using domain-owned semantic targets and a bounded version-preserving revision.
Keep the accepted smooth mathematics and user-saved version-1 links intact.

The rollback unit is a new pinned explanation and its bounded reader binding,
not a replacement math model or compositor. The finish line is one reviewed,
useful passage with a clear opening and retained argument; it is not a new editor,
a problem library, or proof of ChatGPT-level response time.
