# Fractional reader: matched light/dark paint diagnosis

User direction: preserve the standard animations; compare the exact last two
steps in light and dark before attributing the doubled appearance to typography
or changing choreography. No application code or motion policy changed here.

## Executed comparison

Stable command:

```sh
npm run visual:fractional-linear-equation -- --compare-themes --base-url=http://127.0.0.1:8000
```

The command uses the same fractional reader, fonts, 1280×900 Chromium viewport,
motion preference and semantic playheads for both themes. It overrides the
linked CSS response before enhancement, using the spec's Paper colors for the
second pass. This avoids stale material clones after a live theme change. It
asserts the realized background so a missed stylesheet interception cannot
silently compare dark mode with itself. An initial diagnostic attempt did miss
Vite's inlined import; only the corrected, background-verified run is evidence.

Thirteen playheads per theme: 750, 780, 790, 800, 833, 950, 960, 965, 970, 975,
980, 990, 1000. The dense late samples cover the cancellation retirement and
product-input/result overlap missed by the older coarse smoke sampling.
Disposable reports and paired captures are under
`tmp/codex/fractional-linear-equation-visual/`; regenerate them with the command.

## Findings

- All observed mathematical text uses font weight 400, text stroke 0px, no text
  shadow, and no ancestor filter. Moving and native glyphs use the same expected
  KaTeX font families; there is no dark-only font thickening.
- Measured glyph rectangles, font sizes, weights, strokes, shadows, filters and
  effective opacities are identical across the two themes at matched playheads.
  There are 26 captures and zero non-color signature differences.
- The realized Nocturne page/surface are `#121826` / `#1B2535`; Paper uses
  `#F7F5EE` / `#FFFEFA`. Material glyphs use the correct foreground in each case.
- At overall progress 970, the old 2 and 4 each have effective opacity 0.259259;
  the incoming 8 has opacity 0.121230. The 2 and 8 overlap in both captures.
  The old 2 occupies x≈990.68–998.59, while the 8 occupies x≈992.32–1000.67.
  Their y ranges overlap as well. This is scheduled source/result overlap inside
  the moving material layer, not opaque historical equation copies.
- During denominator cancellation, the inverse factors meet before retirement;
  the narrow fade follows the motif's shared contact/retirement schedule. Flat
  focus changes neither that schedule nor product input/result visibility.

The theme can affect the perceived weight and salience of fading ink, but this
comparison does not establish a dark-specific rendering defect or quantify a
perceptual difference. The overlap exists in Paper too. Do not infer from this
that every retained symbol should disappear: x and equals intentionally persist.

## Motion authority and remaining uncertainty

The fractional reader selects the native compositor for its two cancellations.
Its constant evaluations still use the legacy `counter-convergence-v1` material
sampler. The linked simpler `/reader/solve-x/` reader also declares that successor
recipe; comparing different equations/operations cannot isolate the palette.
Modern operation-evaluation infrastructure also exists, but this investigation
does not establish which other accepted visual the user means by “standard.”
Do not silently substitute a different motif or migrate the reader on that basis.

No copies have been added for a derivation trail. That feature remains proposed.
The page's static transcript is hidden after hydration; transient source/target
copies serve the existing mathematical animation only.

Recommendation: keep the current motion unchanged for this diagnosis. If the
user's intended standard is a different accepted exemplar, compare its exact
operation/renderer binding before repairing integration. Do not compensate for
this overlap by thinning fonts, changing the palette or adding a new fade curve.

## Inspection

Open `/reader/solve-fractional-linear/?kpLesson=lesson.solve-x.fractional-linear&kpVersion=1&kpProgress=970`.
Inspect the faint 2/8 overlap and remaining 4, then move toward the solution.
The paired `nocturne-970.png` and `paper-970.png` produced by the command show the
same geometry and retirement/reveal moment in the two palettes.

Node tooling typecheck: passed. No browser comparison
across engines or broader perceptual certification is claimed by this run.
