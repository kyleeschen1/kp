# Canonical Radical Reader Checkpoint

Date: 2026-07-26  
Status: HUMAN_CHECKPOINT after slice 15 of 20  
Run contract: `run-contract.kp.radical-reader-promotion-kit-v0`

## Review surface

The reader-owned `x^(1/2) -> sqrt(x)` transition now runs through the released
canonical construction and compositor path at:

```text
/reader/radical-succession/
```

The stable capture command is:

```text
npm run visual:radical-canonical-checkpoint
```

It produces a self-contained browser review page at
`tmp/codex/radical-canonical-checkpoint/index.html`. The page embeds all 38
captures so it does not depend on separately opening PNG files. Its matrix
covers:

- wide and phone viewports;
- device-pixel ratios 1 and 2;
- full-motion samples at 0%, 25%, 50%, 75%, 96%, 99.9%, and 100%;
- reduced-motion endpoints; and
- the promoted fraction split/merge exemplar at 25% and 75% as a control.

## What passes

- The radical route has one exclusive canonical paint owner during material
  motion. Compatibility paint is empty.
- The source and target remain native KaTeX endpoints and page-owned MathML
  remains the semantic and accessibility authority.
- Direct seek, rewind, repeated scrub, reduced motion, static no-JavaScript
  reading, URL restoration, focus/hover, phone containment, transcript, and
  export seams pass.
- The reader adapter now applies the already-generic typography handoff plan
  to target-bound glyphs. The observed pre-handoff `x` baseline residual fell
  from 7px to 1px, within the existing 2.5px canonical bound.
- At 99.9%, the material `x` has the target font/style fingerprint and a
  subpixel rectangle match. The native radical SVG retains exact path data and
  a subpixel rectangle match.
- The 99.9% and 100% frames show stable radical and radicand geometry at all
  reviewed viewport/DPR combinations. No clipping, overflow, double paint, or
  blank frame is visible.
- Fraction controls preserve the previously approved split/merge composition.
  The existing fraction midpoint golden was not rewritten for the 61-pixel
  generic `x`-alignment delta; both control frames are present for human
  comparison.

## Human-review finding

One settlement discontinuity remains visible in the deterministic frames:
the persistent `x` is black in compositor-owned material paint at 99.9% and
orange in page-owned native focus paint at 100%. The same focus color is
present at the source endpoint. Its geometry and size do not jump, but its
focus styling changes atomically at both ownership boundaries.

This is not a radical-geometry defect and should not receive a radical
exception. It is a generic computed-style ownership mismatch: material paint
clones typography but does not continuously realize the native semantic-focus
color. The recommended slice-16 repair is to preserve the persistent entity's
native focus-paint fingerprint through material ownership, then repeat the
full radical matrix and fraction controls. Stop if that requires
notation-specific styling, a second owner, or mutation of native semantic DOM.

The fading structural marks around the midpoint have a different meaning.
The source fractional exponent and rule have `eliminate` lifecycle, while the
native radical SVG has `introduce` lifecycle. They are not asserted to be the
same paint entity. The persistent radicand `x` retains identity and does not
crossfade. Human review should still decide whether that representational
succession reads clearly enough pedagogically at the current timing.

## Verification

- `npm run visual:radical-canonical-checkpoint` — pass; 38 captures and
  self-contained review page
- `npm run test:browser:radical-reader-promotion` — pass; 10 Chromium tests
- `npm run test:radical-reader-promotion` — pass; 35 tests
- `npm run typecheck` — pass
- `npm run build` — pass
- `git diff --check` — pass

## Checkpoint decision

The run stops here as required. Approval to continue authorizes only:

1. a generic persistent-focus-paint repair in slice 16;
2. extraction of duplication proved by the reviewed fraction and radical
   adoptions in slice 17;
3. a route-free unit-exponent cost proof in slice 18;
4. production gates in slice 19; and
5. closeout and foldable-distribution handoff in slice 20.

Review should focus on the midpoint readability, the 99.9% to 100% focus-color
handoff, wide/phone sizing, and the two fraction control frames.
