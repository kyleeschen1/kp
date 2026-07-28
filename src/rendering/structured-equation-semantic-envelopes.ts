import type {
  KpStructuredEquationAnnotatedEndpoint
} from "./structured-equation-selector-annotated-latex.ts";

export function bindKpStructuredEquationSemanticEnvelopes(input: {
  readonly root: HTMLElement;
  readonly endpoint: KpStructuredEquationAnnotatedEndpoint;
  readonly envelopeIds: readonly string[];
  readonly realization: "wrapped" | "virtual";
}): void {
  const requested = new Set(input.envelopeIds);
  const envelopes = input.endpoint.groupEnvelopes
    .filter(({ id }) => requested.has(id))
    .sort(
      (left, right) =>
        right.memberSelectorIds.length - left.memberSelectorIds.length
    );
  if (envelopes.length !== requested.size) {
    throw new Error(
      `${input.endpoint.stateId} is missing a requested equation-stage envelope.`
    );
  }

  for (const anchor of input.root.querySelectorAll<HTMLElement>(
    "[data-kp-reader-selector-id]"
  )) {
    const selectorId = anchor.dataset["kpReaderSelectorId"];
    if (selectorId !== undefined) {
      anchor.dataset["kpEquationStageMemberId"] = selectorId;
    }
  }
  if (input.realization === "wrapped") {
    // Largest-first wrapping preserves contiguous groups without splitting the
    // KaTeX token wrappers that remain native endpoint authority.
    for (const envelope of envelopes) {
      wrapEnvelope(input.root, envelope.id, envelope.memberSelectorIds);
    }
  }
}

function wrapEnvelope(
  root: HTMLElement,
  envelopeId: string,
  memberSelectorIds: readonly string[]
): void {
  const members = memberSelectorIds.map((selectorId) => {
    const member = root.querySelector<HTMLElement>(
      `[data-kp-reader-selector-id="${CSS.escape(selectorId)}"]`
    );
    if (member === null) {
      throw new Error(
        `Equation-stage envelope ${envelopeId} is missing ${selectorId}.`
      );
    }
    return member;
  });
  const first = members[0];
  const last = members.at(-1);
  if (first === undefined || last === undefined) {
    throw new Error(`Equation-stage envelope ${envelopeId} is empty.`);
  }
  const range = root.ownerDocument.createRange();
  range.setStartBefore(first);
  range.setEndAfter(last);
  const wrapper = root.ownerDocument.createElement("span");
  wrapper.className = "kp-equation-stage-semantic-envelope";
  wrapper.dataset["kpEquationStageEnvelopeId"] = envelopeId;
  wrapper.append(range.extractContents());
  range.insertNode(wrapper);
}
