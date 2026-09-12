type Phase = "initial" | "activated";
export interface RequestedLoadingAsset { readonly path: string; readonly gzip: number; readonly kind: string }
// Fixed 390x844 production request cohort, not a device certification or an
// automatically refreshed baseline. Headroom retains meaningful audit savings.
const limits = {
  "canonical-tax": {
    initial: { js: 550_000, css: 25_000, fonts: 45_000, total: 625_000 },
    activated: { js: 660_000, css: 25_000, fonts: 45_000, total: 740_000 }
  },
  gradient: {
    initial: { js: 305_000, css: 20_000, fonts: 72_000, total: 400_000 },
    activated: { js: 305_000, css: 20_000, fonts: 72_000, total: 400_000 }
  }
} as const;

export function assertArchitectureLoadingAcceptance(input: {
  readonly scenario: keyof typeof limits; readonly phase: Phase;
  readonly assets: readonly RequestedLoadingAsset[]; readonly errors: readonly string[];
}): void {
  if (input.errors.length) throw new Error(input.errors.join("\n"));
  if (new Set(input.assets.map(asset => asset.path)).size !== input.assets.length) throw new Error("Request accounting must deduplicate by asset identity.");
  if (input.assets.some(asset => !Number.isFinite(asset.gzip) || asset.gzip < 0)) throw new Error("Invalid request byte measurement.");
  const sum = (accept: (kind: string) => boolean) => input.assets.filter(asset => accept(asset.kind)).reduce((n, asset) => n + asset.gzip, 0);
  const measured = { js: sum(kind => kind === ".js"), css: sum(kind => kind === ".css"),
    fonts: sum(kind => [".woff2", ".woff", ".ttf"].includes(kind)), total: sum(() => true) };
  if (!input.assets.some(asset => asset.kind === ".html") || !measured.js || !measured.css || !measured.fonts) throw new Error("Incomplete HTML, JavaScript, CSS or font request cohort.");
  for (const metric of ["js", "css", "fonts", "total"] as const) {
    if (measured[metric] > limits[input.scenario][input.phase][metric]) throw new Error(`${input.scenario} ${input.phase} ${metric}: ${measured[metric]} exceeds ${limits[input.scenario][input.phase][metric]} gzip bytes.`);
  }
}
