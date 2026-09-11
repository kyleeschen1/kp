export interface KpSemanticReaderRouteAsset {
  readonly name: string;
  readonly kind: "javascript" | "css" | "font" | "other";
  readonly gzipBytes: number;
}

export interface KpSemanticReaderRouteBudgetIssue {
  readonly code:
    | "semantic-reader-route.forbidden-asset"
    | "semantic-reader-route.full-equation-budget"
    | "semantic-reader-route.entry-budget";
  readonly message: string;
  readonly assetName?: string | undefined;
}

export const kpSemanticReaderAcceptedClosureGzipBytes = 152_463;

export const kpSemanticReaderRouteBudget = {
  // The route-manifest baselines retain their exact measurements; this
  // architecture ceiling preserves the same 5% release-growth allowance.
  fullEquationGzipBytes: Math.ceil(
    kpSemanticReaderAcceptedClosureGzipBytes * 1.05
  ),
  readerEntryGzipBytes: 20 * 1_024
} as const;

export function checkKpSemanticReaderRouteBudget(
  assets: readonly KpSemanticReaderRouteAsset[]
): readonly KpSemanticReaderRouteBudgetIssue[] {
  const issues: KpSemanticReaderRouteBudgetIssue[] = [];
  const code = assets.filter((asset) =>
    asset.kind === "javascript" || asset.kind === "css"
  );
  // CSS remains in the full closure budget; this tighter budget isolates the
  // executable entry shell from the shared equation renderer.
  const entry = code.filter((asset) =>
    asset.kind === "javascript" &&
    /exemplar-entry|reader-solve-x|modulepreload-polyfill/.test(asset.name)
  );
  for (const asset of assets) {
    if (!isKpSemanticReaderForbiddenAsset(asset.name)) continue;
    issues.push({
      code: "semantic-reader-route.forbidden-asset",
      message: `Semantic reader loaded unrelated learner asset ${asset.name}.`,
      assetName: asset.name
    });
  }
  const fullBytes = sum(code.map((asset) => asset.gzipBytes));
  if (fullBytes > kpSemanticReaderRouteBudget.fullEquationGzipBytes) {
    issues.push({
      code: "semantic-reader-route.full-equation-budget",
      message:
        `Semantic reader loaded ${fullBytes} gzip bytes of JavaScript and CSS; ` +
        `budget is ${kpSemanticReaderRouteBudget.fullEquationGzipBytes}.`
    });
  }
  const entryBytes = sum(entry.map((asset) => asset.gzipBytes));
  if (entryBytes > kpSemanticReaderRouteBudget.readerEntryGzipBytes) {
    issues.push({
      code: "semantic-reader-route.entry-budget",
      message:
        `Semantic reader entry loaded ${entryBytes} gzip bytes; ` +
        `budget is ${kpSemanticReaderRouteBudget.readerEntryGzipBytes}.`
    });
  }
  return issues;
}

export function isKpSemanticReaderForbiddenAsset(name: string): boolean {
  return /(?:^|[/.-])editor(?:[/.-]|$)/i.test(name)
    || /(?:^|[/.-])three(?:[/.-]|$)/i.test(name)
    || /(?:^|[/.-])webgl(?:[/.-]|$)/i.test(name)
    || /equation-surface-adapter|animation-player/i.test(name)
    || /(?:^|\/)katex(?:[.-].*)?\.js$/i.test(name)
    || /mdast|micromark/i.test(name)
    || /choreography-compiler|linear-rearrangement-choreography/i.test(name)
    || /(?:^|[/.-])ftc(?:[/.-]|$)/i.test(name)
    || /programming|graph-adapter|concept-room|balance-exemplar|generated-drafts/i
      .test(name);
}

function sum(values: readonly number[]): number {
  return values.reduce((total, value) => total + value, 0);
}
