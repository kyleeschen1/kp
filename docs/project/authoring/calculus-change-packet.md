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
mounts retain the previous live card. **Download draft source** saves the
textarea, including unapplied or invalid edits. **Download displayed source**
saves the exact bytes of the successfully mounted explanation. Editing while a
preview is being prepared invalidates that pending preview; Apply again to use
the new draft.

Playback URLs pin the source revision. A custom source is not stored in the URL
or persisted across reload: reload reports the mismatch and keeps the built-in
source at its starting point. Reapply the matching downloaded source to restore
the pinned position. Do not treat the URL alone as a shareable custom edition.
Legacy unpinned URLs retain built-in-example compatibility.

To create a reopenable local edition, save the displayed source outside generated
edition directories, then run:

```sh
npm run author:calculus-publication -- --source content/authoring/transfer/stationary-change.json
npm run author:calculus-publication -- --source content/authoring/transfer/stationary-change.json --interactive
npm run author:calculus-publication -- --source content/authoring/transfer/stationary-change.json --interactive --check
npm run author:calculus-publication -- --source content/authoring/transfer/two-reversals.json --interactive
npm run check:reproducible-authoring
```

Static is the default; `--interactive` packages the existing reader without editor
controls. Both include all five passages, native math, CSS/fonts, `source.json`
and `publication.json`. Output lives under `tmp/codex/calculus-editions/<digest>`;
the JSON receipt gives the directory. `--check` recompiles with the current
trusted compiler and verifies every byte and the complete directory closure.
It rejects missing, changed or extra files; it does not repair or overwrite them.
Changed source, styles or reader code produces a new edition. Preserve the source
and tool revision to reproduce an older edition. Generated directories are ignored
by Git, not a backup of authored source. Keep source in a deliberate tracked file.

Serve the folder over HTTP, not `file://`. With this repo's dev server on port
8000, open `/tmp/codex/calculus-editions/<digest>/index.html`. Current examples:

- [Zero slope and finite change](http://localhost:8000/tmp/codex/calculus-editions/5c0848ffa95fc23863705135f5e8fb0d34a1bd533cdc0f35d54be1894fd5dff6/index.html)
- [Two local reversals](http://localhost:8000/tmp/codex/calculus-editions/7cd106266bd86fc61a77a05265444aca3001c5e4917451a801627c7b41b8feb9/index.html)

These local links require their generated folders and the running dev server;
that server adds development tooling. The production closure is separately tested
on a plain HTTP server. Rebuild and use the newly printed directory after a code
change. Nothing here deploys or publishes externally.

An edition embeds its selected source, so a revision-pinned playback URL now
survives reload and a fresh browser context. A URL for a different explanation
reports a mismatch and shows the embedded source at its starting point, preserving
the original link. Invalid, repeated, nonfinite or out-of-range fields reject the
whole playback location. Correct the link to recover. The receipt distinguishes
exact source-byte identity, normalized explanation identity (including prose),
and complete edition-byte identity; none certifies prose or teaching quality.

For the source-only algebra transfer through the existing static owner:

```sh
npm run author:check -- --task equation.algebra-intuition --request src/authoring/examples/composed-algebra-intuition-transfer.json
npm run author:composed-algebra-publication -- --source src/authoring/examples/composed-algebra-intuition-transfer.json
npm run author:composed-algebra-publication -- --source src/authoring/examples/composed-algebra-intuition-transfer.json --check
```

The replay command exercises both calculus sources and this second owner through
real CLI processes. Its bounded task rubrics reject valid-but-wrong sources and
malformed input. It measures neither LLM authoring success nor learner benefit.

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
`npm run visual:calculus-editions` compares packaged readers with the canonical
host in three browser engines. `npm run measure:calculus-editions` gates complete
editor/reader and portable-asset costs; `npm run visual:calculus-costs` measures
preview ownership and diagnostic local loading. See
[evidence and limits](../reviews/2026-10-21-reproducible-authoring.md).
Reusable subexplanation extraction, arbitrary calculus proof and visual redesign
are not provided by this delivery.
