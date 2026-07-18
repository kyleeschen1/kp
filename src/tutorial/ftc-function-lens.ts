export const kpFtcFunctionLensIds = [
  "quadratic",
  "affine",
  "sine-offset"
] as const;

export type KpFtcFunctionLensId = (typeof kpFtcFunctionLensIds)[number];

export interface KpFtcFunctionLens {
  readonly id: KpFtcFunctionLensId;
  readonly label: string;
  readonly integrandLatex: string;
  readonly accumulationLatex: string;
  readonly domain: readonly [number, number];
  readonly assumptions: readonly string[];
}

export interface KpFtcFunctionLensSample {
  readonly lensId: KpFtcFunctionLensId;
  readonly t: number;
  readonly integrand: number;
  readonly accumulatedArea: number;
}

const lenses: Readonly<Record<KpFtcFunctionLensId, KpFtcFunctionLens>> = {
  quadratic: {
    id: "quadratic",
    label: "Quadratic exact lens",
    integrandLatex: "f(t)=t^2",
    accumulationLatex: "A(x)=\\int_0^x t^2\\,dt=\\frac{x^3}{3}",
    domain: [0, 3],
    assumptions: ["f is continuous on [0, 3]"]
  },
  affine: {
    id: "affine",
    label: "Affine exact lens",
    integrandLatex: "f(t)=1+t",
    accumulationLatex: "A(x)=\\int_0^x(1+t)\\,dt=x+\\frac{x^2}{2}",
    domain: [0, 3],
    assumptions: ["f is continuous on [0, 3]"]
  },
  "sine-offset": {
    id: "sine-offset",
    label: "Oscillating exact lens",
    integrandLatex: "f(t)=1+\\sin t",
    accumulationLatex:
      "A(x)=\\int_0^x(1+\\sin t)\\,dt=x+1-\\cos x",
    domain: [0, 3],
    assumptions: ["f is continuous on [0, 3]"]
  }
};

export function getKpFtcFunctionLens(
  id: KpFtcFunctionLensId
): KpFtcFunctionLens {
  return lenses[id];
}

export function listKpFtcFunctionLenses(): readonly KpFtcFunctionLens[] {
  return kpFtcFunctionLensIds.map((id) => lenses[id]);
}

export function sampleKpFtcFunctionLens(
  id: KpFtcFunctionLensId,
  t: number
): KpFtcFunctionLensSample {
  const lens = getKpFtcFunctionLens(id);
  const clamped = Math.min(lens.domain[1], Math.max(lens.domain[0], t));
  const [integrand, accumulatedArea] = evaluate(id, clamped);
  return { lensId: id, t: clamped, integrand, accumulatedArea };
}

export function rangeKpFtcFunctionLens(
  id: KpFtcFunctionLensId,
  start: number,
  end: number
): readonly [minimum: number, maximum: number] {
  const lens = getKpFtcFunctionLens(id);
  const left = Math.min(lens.domain[1], Math.max(lens.domain[0], Math.min(start, end)));
  const right = Math.min(lens.domain[1], Math.max(lens.domain[0], Math.max(start, end)));
  const candidates = [
    sampleKpFtcFunctionLens(id, left).integrand,
    sampleKpFtcFunctionLens(id, right).integrand
  ];

  // The sine lens has one interior maximum on the curated domain; naming the
  // critical point keeps the displayed rectangle an actual bound, not a plot sample.
  if (id === "sine-offset" && left <= Math.PI / 2 && right >= Math.PI / 2) {
    candidates.push(2);
  }

  return [Math.min(...candidates), Math.max(...candidates)];
}

export const kpFtcGenericContinuousClaim = Object.freeze({
  id: "claim.ftc.generic-continuous",
  statement:
    "For a continuous function f, the accumulation A(x)=∫ₐˣ f(t)dt has local rate A′(x)=f(x).",
  proofStatus: "proof-sketch" as const,
  assumptions: ["f is continuous on the interval under discussion"]
});

function evaluate(
  id: KpFtcFunctionLensId,
  t: number
): readonly [integrand: number, accumulatedArea: number] {
  switch (id) {
    case "quadratic":
      return [t ** 2, t ** 3 / 3];
    case "affine":
      return [1 + t, t + t ** 2 / 2];
    case "sine-offset":
      return [1 + Math.sin(t), t + 1 - Math.cos(t)];
  }
}
