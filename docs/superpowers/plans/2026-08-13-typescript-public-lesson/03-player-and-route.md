# Phase 3: Lazy Player And Route

## Goal

Expose `/learn/code/free-shipping/` through the existing Vite multipage seam and
progressively enhance its reserved stage with the canonical sampled timeline.
Use one play/pause control, one continuous range input, semantic checkpoint
links, arrow-key stepping, direct URL restoration, and reduced-motion seeks.

## Expected files

- `learn/code/free-shipping/index.html`
- a small route entry and public player adapter under `src/public-web/`
- an entry in `src/dev-toolbar/development-page-build-entries.ts`
- a narrow build-time HTML replacement in `vite.config.ts`
- focused runtime and browser checks

## Verification

- direct seek equals playback at the same progress;
- linked checkpoints restore with one projection and paint;
- play/pause and range input stay operable by keyboard;
- enhancement does not change reserved geometry;
- the animation model and catalogue adapter remain unchanged.
