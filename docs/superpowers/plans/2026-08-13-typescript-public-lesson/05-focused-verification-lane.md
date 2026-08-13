# Phase 5: Focused Verification Lane

## Goal

Make routine work on the public TypeScript lesson cheap enough to run without
overwhelming an interactive development machine. Preserve the repository-wide
typecheck, complete test suite, and all-route build as explicit release
authority.

## Changes

- add a TypeScript project rooted at the public route, canonical TypeScript
  animation inputs, shared runtime seams, and focused tests;
- add a minimal Vite configuration that compiles only
  `/learn/code/free-shipping/` and its static-first publication;
- make the focused dev server and browser check use that configuration;
- teach `verify:impact` to select the focused lane for public TypeScript files;
- separate production bundling from repository-wide typechecking so callers do
  not unknowingly repeat the same expensive pass; and
- cap concurrency in the complete Node test suite.

## Verification

- focused TypeScript project passes;
- focused unit tests pass;
- route-only production build emits one HTML entry and a bounded closure;
- development review remains absent from the production route;
- Chromium visual smoke still covers direct seek, reduced motion, no-JavaScript
  truth, desktop, and phone; and
- selector tests prove known public files no longer fall through to the broad
  `typecheck + test + build` gate.

## Preservation boundary

Do not weaken or rename the repository release gate, alter canonical animation
semantics or trajectories, or modify the user's economics files. This phase
changes command composition and route selection, not product behavior.
