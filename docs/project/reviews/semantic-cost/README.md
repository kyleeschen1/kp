# Semantic cost evidence

`baseline.json` records the original four-entry production build and local Node
construction samples before the input-adapter repair. It is evidence, not a
budget file to refresh automatically. The final report documents browser samples,
the same complete entry closures, and measured regression ceilings.

`final-build.json`, `canonical-browser.json`, and `instances-browser.json` record
the completed experiment. See [findings](../2026-10-01-semantic-cost-results.md)
for interpretation, limits, repairs and budget rationale.

Reproduce through `npm run build:semantic-cost`,
`npm run measure:semantic-cost`, and `npm run visual:semantic-cost`.
