# Bounded calculus change authoring

This source path compares finite changes with local linear predictions for
`u=f(x)` and `y=g(u)`. It uses the existing change-propagation model, native
KaTeX notation and five-step focus deck. It is not a symbolic proof animator.
The earlier dashboard presentation remains unaccepted; successful compilation
does not establish explanatory quality.

Start with:

```sh
npm run author:check -- --task calculus.change-propagation --example
npm run author:check -- --task calculus.change-propagation --request content/authoring/transfer/stationary-change.json
npm run author:check -- --task calculus.change-propagation --request content/authoring/transfer/two-reversals.json
```

The source binds `x` in `inner` and `u` in `outer`. It permits sums, explicit
products, integer constants up to 10, powers 0–4, sin and cos. Division,
undeclared variables and unsupported functions produce located repair gaps;
the compiler validates before simplification. Inputs x and h stay within
[-2,2] and [-0.5,0.5]; interval bounds reject excessive function ranges.
Keep the ordered `input`, `inner`, `outer`, `compose`, `limit` passages.
Titles and prose are editorial, never machine-checked proofs.

Open <http://localhost:8000/experiments/change-propagation/>, expand **Edit the
functions and explanation**, paste the selected JSON, and choose **Preview this
source**. Checking a file does not apply it. The report and mounted card expose
the same source revision; whitespace changes do not change that revision,
but mathematical or editorial changes do. Invalid drafts and failed candidate
mounts retain the previous live card. **Download current source** saves the
textarea, including unapplied or invalid edits; it is a draft download.

Playback URLs pin the source revision. A custom source is not stored in the URL
or persisted across reload: reload reports the mismatch and keeps the built-in
source at its starting point. Reapply the matching downloaded source to restore
the pinned position. Do not treat the URL alone as a shareable custom edition.
Legacy unpinned URLs retain built-in-example compatibility.

For the stationary case, inspect x=0: predicted dy is zero while the finite
change is 3h². In the last passage, h shrinks continuously and the error divided
by h approaches zero. Reverse and repeat with a negative h. For two reversals,
start at x=1: the inner and outer local rates are both −2, giving derivative 4.
The outer rate is evaluated at u=−1. Moving x changes those claims; the prose
qualifies them as starting-point observations.

`npm run test:change-propagation` checks both files against their exact
polynomial identities and invalid-source cases. `npm run visual:change-propagation`
checks selected-source application, reverse, revision recovery, injected mount
failure, mobile containment and no-script reading. These checks preserve the
existing presentation; they do not promote its aesthetics or certify learning.
No selected-source publication command or reusable subexplanation extraction
is currently provided.
