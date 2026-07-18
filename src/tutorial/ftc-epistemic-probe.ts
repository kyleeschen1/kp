export interface KpTutorialEpistemicProbeOption {
  readonly id: string;
  readonly label: string;
  readonly interpretation: string;
  readonly validity: "intentional-invalid" | "valid";
}

export interface KpTutorialEpistemicProbe {
  readonly id: string;
  readonly checkpointId: string;
  readonly prompt: string;
  readonly optional: true;
  readonly gatesProgress: false;
  readonly scored: false;
  readonly options: readonly KpTutorialEpistemicProbeOption[];
}

export interface KpTutorialEpistemicProbeResponse {
  readonly probeId: string;
  readonly optionId: string | undefined;
  readonly skipped: boolean;
  readonly canonicalProgressChanged: false;
  readonly disclosure: string;
}

export function createKpFtcFiniteQuotientProbe(): KpTutorialEpistemicProbe {
  return {
    id: "probe.ftc.finite-versus-limit",
    checkpointId: "checkpoint.ftc.convergence",
    prompt: "At this finite Δx, what have we established?",
    optional: true,
    gatesProgress: false,
    scored: false,
    options: [
      {
        id: "option.ftc.finite-average",
        label: "A bounded finite average",
        interpretation:
          "Yes: the quotient is exact for this finite strip, while its identification with f(x) still awaits the limiting argument.",
        validity: "valid"
      },
      {
        id: "option.ftc.derivative-already",
        label: "The derivative identity already",
        interpretation:
          "This is an intentional tempting shortcut: finite Δx supplies evidence, not yet A′(x)=f(x).",
        validity: "intentional-invalid"
      }
    ]
  };
}

export function respondToKpTutorialEpistemicProbe(input: {
  readonly probe: KpTutorialEpistemicProbe;
  readonly optionId?: string | undefined;
}): KpTutorialEpistemicProbeResponse {
  if (input.optionId === undefined) {
    return {
      probeId: input.probe.id,
      optionId: undefined,
      skipped: true,
      canonicalProgressChanged: false,
      disclosure: "Probe skipped; the canonical explanation continues unchanged."
    };
  }
  const option = input.probe.options.find(({ id }) => id === input.optionId);
  if (option === undefined) {
    throw new Error(`Unknown epistemic probe option ${input.optionId}.`);
  }

  return {
    probeId: input.probe.id,
    optionId: option.id,
    skipped: false,
    canonicalProgressChanged: false,
    disclosure: option.interpretation
  };
}
