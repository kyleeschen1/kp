# How could someone reconstruct a trip they did not see?

## Accepted medium-choice revision

The original draft below is preserved as broader explanatory material, not the
current card's scope. User review accepted attention clarity but questioned the
medium choice and rejected an oversized card. The revised lesson uses ordinary
text for motivation, coordinate conventions, graph axes and interpolation limits.

- **Obstacle:** confusing a position–time graph with the physical path.
- **Static baseline:** a track, timestamp/position table and completed graph,
  with prose explaining that each graph point pairs time with position.
- **Perceptual gain:** during a modeled pause the physical point stays still
  while its graph point continues right. On return, leftward physical movement
  corresponds to downward graph movement without time reversing. Coordinated
  motion removes the need to mentally align successive static observations.
- **Control:** pause, replay or reverse that exact correspondence; arrows play
  only the next interval. No decorative motion or compulsory origin tour.
- **Transfer:** sketch a steady leftward trip followed by rest. Expect a
  descending-right segment followed by a horizontal-right segment; time never
  doubles back. This is a prediction, not a claim of measured learning gain.
- **Costs/limits:** teach axis meanings before displaying two views. The card
  does not prove a pause from sparse measurements or explain forces. Origin
  conversion and distance remain later reusable material, not extra opening
  beats. Maintain one-viewport fit at ordinary supported reading sizes and
  readable document overflow at enlarged text sizes.

Four stops: start, outward endpoint, pause endpoint, return endpoint. The final
endpoint is also the held inspection; no empty extra animation is required.
Policy: `../principles/focus-card-medium-choice.md`.

## Original broader explanation (superseded as card packaging)

P1 working explanation, not yet learner-reviewed. The marked point represents
one location on a real object; it does not tell us how the object rotates or bends.

“It ended two metres from the mark” leaves most of a trip unexplained. Did it
go there directly, stop, or travel farther and come back? To distinguish those
possibilities, record where the point is **and when**. First choose a reference
mark, a direction called positive, a metre scale and a clock.

At 0 seconds the point is at 1 metre; at 2 seconds it is at 5 metres; at 4 seconds
it is still at 5 metres; at 6 seconds it is at 2 metres. These are observations,
not yet an explanation of what caused the motion. For this demonstration we model
constant velocity between recorded times. Sparse observations alone cannot prove
the point was stationary throughout the middle interval or rule out hidden detours.

A position–time graph puts each record in a new place: time across, position up.
Its vertical direction does **not** mean the object rose off the table. During
our model's pause, time advances while position stays unchanged: the graph runs
horizontally. On the return, position decreases as time increases: the graph runs
downward, even though the real object moves horizontally back along the table.

Now move only our zero mark three metres to the right. The object has not moved.
Every recorded coordinate becomes three less: −2, 2, 2, −1. The graph's heights
change together, but the same observations still describe the same trip. The
difference between final and initial coordinates is 1 metre with either origin.
That signed change is **displacement**. With fixed unit and axis direction,
changing the origin cannot change it: the same subtraction is applied to both ends.

Our model travels 4 metres out and 3 metres back: **distance travelled** is 7
metres, although displacement is only +1 metre. Distance counts travel in both
directions positively; displacement compares the endpoints. A return to the start
can have zero displacement without zero travel.

Try a changed case: the point starts at 2 m, reaches 6 m and returns to 2 m.
What are displacement and distance in the piecewise-linear model? Expected
reasoning: 0 m net change, 8 m total travel. If zero moves, neither trip changes.
What would a horizontal section of its position–time graph mean? Position stays
fixed while time advances—not that the point is physically travelling horizontally.

The next question is already visible: what does the steepness of this graph tell
us? It measures how much position changes per unit time. That is the bridge to
velocity, not an assumed force law or a complete calculus lesson here.

## Visual jobs and likely confusions

- Orient: the table's ruler, marked point and clock make the measurement meanings
  explicit; no graph yet competing for attention.
- Record the trip: retain point identity and show observations derived from the
  same model, with the interpolation assumption visible before motion.
- Read the graph: highlight one observation-to-graph correspondence at a time;
  label time and position, not an unexplained abstract pair of axes.
- Inspect pause/return: stationary cue, actual movement, held inference. Do not
  animate required prose concurrently with the feature the reader must inspect.
- Change reference: preserve physical positions while changing coordinates; this
  is not physical translation symmetry or an accelerating reference frame.
- Compare totals: net signed change versus accumulated model distance; no claim
  to recover exact real-world travel from sparse observations alone.
