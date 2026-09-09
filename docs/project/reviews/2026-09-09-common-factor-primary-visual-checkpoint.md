# M1a common-factor primary: combined review

Date: 2026-09-09
Outcome: HUMAN_CHECKPOINT — acceptance pending; do not begin s16.

Authority: [approved proposal](2026-09-09-m1-common-factor-authoring-long-loop-proposal.md),
`run-contract.kp.common-factor-authoring-v1`. Theseus owns live slice status.
Implementation through s14: `c2e8e0cd9`.

## Open these views

- [Live authoring, card, readings and practice](http://localhost:8000/experiments/reusable-reasoning/?example=common-factor)
- [Static edition, also usable without JavaScript](http://localhost:8000/tmp/codex/common-factor-editions/5962f558500d1576f6b753c0f7c9fbbdab490308ce06431044ce82414d6f9933/index.html)
- [Exact editable source](../../../src/authoring/examples/common-factor-primary.json)

Both URLs use the existing shared port-8000 server, verified by the scoped browser
check. The edition lives in ignored local output. If it is cleaned, regenerate it:

```sh
npm run author:common-factor-publication -- --source src/authoring/examples/common-factor-primary.json
```

The command reports the exact directory. Styles are part of the edition hash;
later styling changes deliberately produce a new directory, not an overwrite.
Add `--check` to verify an existing edition's exact bytes.

## What to approve

This is one combined visual/editorial decision, not approval of another plan.

1. Inspect `ab+ac` → `a(b+c)`: the shared factors converge using the existing
   native factoring mechanism. Is the movement clear and visually convincing?
2. Try arrows, arrow keys, continuous swiping and the slider in both directions.
   Expect exactly **two stops and one transformation**, with `1 / 2` and `2 / 2`.
   Intermediate positions remain directly controllable.
3. Read both passages, then switch full/compact reading. Both retain the real
   scalar assumptions, ordered factors/addends and the explanation that no
   division is required, including when the shared factor is zero.
4. Enter Predict or Reconstruct from partway through the animation. Compare with
   the verified answer, then return. The reveal animates; return restores the
   interrupted fractional position, reading density and keyboard focus.
5. In the source editor, change a title or narration and explicitly Apply. The
   displayed revision updates coherently. An invalid factorization should show
   a located repair and retain the previous valid lesson. Download exports the
   applied source; changing the textarea alone does not change the card.
6. Check desktop and phone-width layout, then the static reading/self-check
   edition. The static edition intentionally has no animation controls. It is
   not a published interactive card or an automatic explanation grader.

## Ownership and preservation

Canonical source is `src/authoring/examples/common-factor-primary.json`, shared
by the example checker and opt-in host. The asset ID is
`animation.authored.common-factor.<proof revision hash>`. Rendering uses the
existing chrome-free native KaTeX session and semantic-envelope layout adapter.
Semantic authority comes from the authenticated inverse-distributive proof and
prepared authoring revision, not from an operation label, candidate or JSON
copy. Editorial prose is not mathematical proof.

Primary lesson revision:
`sha256:8a7dbe2e6a017fe369c9fa8c2b9a42badc9642774793feba29db1d982adffa92`.

Preserve the ordinary distribution route, accepted motion, shared focus-card
controls, other authoring frontends and proof boundaries. The smallest visual
rollback is the opt-in common-factor host adapter; a presentation repair must
not remove verified semantics or weaken the checker. This review neither
approves global renderer changes nor a new motif grammar.

## Executed evidence

- `npm run test:common-factor-authoring`: 24 tests passed, including forged/stale
  authority, typed unsupported presentation, exact return, publication
  reproduction and immutable-file preservation.
- `npm run visual:common-factor-authoring`: two Chromium checks passed. Live
  checks exercise forward/reverse direct sampling, animated controls, keyboard,
  wheel gestures, invalid/valid Apply, both practice modes, fractional return
  and phone width. Static checks disable JavaScript, inspect six math fragments,
  open native self-check disclosures and reject phone-width overflow.
- `npm run typecheck`: passed, including Svelte with zero warnings/errors.
- `npm run check:architecture`: passed without new exceptions.
- `npm run check:inference`: core 112541 types / 192604 instantiations; complete
  combined consumer 169493 / 281422, within the amended fixed ceilings.
- `node --disable-warning=ExperimentalWarning --test tests/bayesian-reasoning-publication.test.ts`:
  two preservation checks passed after extracting the existing immutable writer.
- `npm run author:common-factor-publication -- --source src/authoring/examples/common-factor-primary.json --check`:
  passed for the edition linked above.

Screenshots are disposable outputs of the scoped browser command, not accepted
goldens or a claim of human approval. Mechanism-specific certification, the
supported-browser cohort, full suite/build and release checks remain later
approved slices; Chromium alone is not cross-browser certification.

## Resume boundary

On explicit acceptance, record the human decision and finish s15, then continue
with the approved mechanism regression, numeric source-only second caller,
boundary pressure, authoring replay and release verification. Unsupported
numeric addends still return a typed presentation gap; this is not general
polynomial factoring. No automatic successor or broader subject rollout.

Fresh-session retrieval: `theseus work resume`. The checkpoint must not be
interpreted as already accepted merely because the implementation checks pass.
