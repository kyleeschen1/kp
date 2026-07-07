# Spatial Overlap Candidate Binning

Recorded: 2026-07-07

The depth scene now bins projected surface triangles before exact overlap checks. This keeps overlap classification semantic while avoiding all-pairs triangle scans for surfaces whose projected bounds are far apart.

Verification:
- `node --disable-warning=ExperimentalWarning --test tests/depth-scene.test.ts`
- `npm run typecheck`
- `git diff --check`
