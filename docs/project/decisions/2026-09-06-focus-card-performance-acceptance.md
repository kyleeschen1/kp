# Focus Card performance is the product acceptance target

Date: 2026-09-06
Status: accepted user direction

Focus Cards are the canonical current product format. Standalone reader proofs
remain semantic/renderer evidence, not substitutes for Focus Card acceptance.
This does not make cards a new semantic source or a universal layout.

Hold the animation asset and source constant when comparing hosts. Separate
initialization, first traversal after readiness, warm playback, boundary setup,
and passage/stage coordination. Cover automatic playback, reverse, interruption,
direct restoration, narrow layout, resize, and multiple mounted cards. Static
frame parity does not certify smoothness.

The logarithmic Focus Card on `/experiments/kinetic-figure/supply-tax/` and the
Catalogue both use `animation.algebra.log-exponent.solve-two-power-x` through
`editor-animation-surface.log-exponent.canonical-native-katex`. The fractional
reader uses another mounting/session path. Its stalls cannot establish a defect
in the Focus Card host or the new authoring schema.

The speculative reader endpoint-cache patch was removed: no reliable Firefox
speedup was established. The earlier WebKit geometry failure remains unattributed,
not repaired or claimed to originate in the schema. The repeated reader observation
path predates recent authoring integration (July history). No exact historical
regression point has been established.

## Bounded implementation and evidence

`npm run perf:focus-card-hosts` runs a same-asset Firefox comparison and automatic
Focus Card passage/stage playback at desktop and phone widths, followed by resize.
It reports frame and synchronous dispatch times and verifies material traversal,
accessible ownership, and a deterministic endpoint-mutation budget. First traversal
starts after readiness: this is not cold page-load timing or all-operation profiling.

The shared log-exponent surface previously hid and re-exposed the accessible
endpoint every frame. Resolving ownership once and writing only changed attributes
reduces accessibility mutations from 600 to 8 per 60-frame pass in both hosts.
The redundant hide/re-expose path dates to commit `2ece85d51b` (2026-08-14),
before the recent authoring integration; this attributes the specific work waste,
not the user's entire perceived slowdown.
Source/target paint, semantic trace, clock, operation timing and card styling are
unchanged. This adapter change is independently reversible from the harness.

The final four-test Firefox run measured automatic Focus Card playback at about
16.7 ms median and 17.6 ms p95 at both widths, with 48 material samples among 99
frames and the passage remaining at its selected destination. The bounded card
scrub also had about 16.7 ms median frame intervals. Catalogue timing varied across
runs (including a later first-traversal p95 near 84 ms), so no universal FPS or
cross-host speed advantage is claimed. The proven optimization is work reduction,
not repair of the fraction reader's much larger stalls.

Existing card browser coverage additionally pressures operation boundaries,
readiness, forward/reverse, interruptions, native passage, delayed scroll delivery,
direct links, remount, multi-card isolation and compact paint bounds. Timing for
every rewrite and cold preparation remains follow-up measurement, not certified.

Verification: all 57 existing multi-card browser checks passed across Chromium,
Firefox and WebKit, plus 18 Focus Deck unit tests, 63 log-exponent tests,
typecheck and architecture checks. No full repository build/release claim is made.

No reader cache, new renderer, schema change, animation fork or canonical tax
migration is adopted. G1/G2/G3 remain pending where not already accepted. A future
authoring-backed structural Focus Card still requires explicit host binding and
review; this logarithmic comparison does not claim that binding exists.
