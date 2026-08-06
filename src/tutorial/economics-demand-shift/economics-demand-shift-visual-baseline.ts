export const kpEconomicsPreSalienceVisualBaseline = Object.freeze({
  schemaVersion: "kp.economics.visual-baseline.v1",
  capturedAt: "2026-08-06",
  pageBackgrounds: Object.freeze({
    dark: "#0d0e1c",
    light: "#f4f1e9"
  }),
  graphSeries: Object.freeze({
    dark: Object.freeze({ stable: "#68a9df", changing: "#e77b74" }),
    light: Object.freeze({ stable: "#4682b4", changing: "#dc443c" })
  }),
  stateAttributes: Object.freeze([
    "data-kp-economics-context-opacity",
    "data-kp-economics-muted-blue",
    "data-kp-economics-muted-red",
    "data-kp-economics-tutorial-attention-passage",
    "data-kp-economics-tutorial-attention-state",
    "data-kp-economics-tutorial-demand-progress",
    "data-kp-economics-tutorial-supply-interpretation"
  ]),
  tuningQueryKeys: Object.freeze([
    "context",
    "gap",
    "leading",
    "measure",
    "mutedBlue",
    "mutedRed",
    "stroke",
    "weight"
  ]),
  stylesheetOwners: Object.freeze([
    "economics-demand-shift-theme.css",
    "economics-demand-shift-publication.css",
    "economics-demand-shift-controls.css",
    "economics-demand-shift-graph.css",
    "economics-demand-shift-publication-responsive.css",
    "economics-demand-shift-inline-sticky.css",
    "economics-demand-shift-two-column.css",
    "economics-demand-shift-layout-responsive.css"
  ]),
  knownBroadSuiteBaseline: Object.freeze({
    failures: 24,
    cohorts: Object.freeze([
      "catalogue-count-drift",
      "governance-snapshots",
      "html-helper",
      "place-value-byte",
      "roadmap-convergence"
    ])
  })
});

export type KpEconomicsPreSalienceVisualBaseline =
  typeof kpEconomicsPreSalienceVisualBaseline;
