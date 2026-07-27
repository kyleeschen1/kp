import type {
  KpSemanticAssetObject
} from "../semantic/asset.ts";
import {
  createKpFoldableDistributionAnnotatedEndpoints
} from "./foldable-distribution-selector-annotated-latex.ts";

export function bindKpFoldableDistributionSemanticEnvelopes(input: {
  readonly root: HTMLElement;
  readonly state: KpSemanticAssetObject;
}): void {
  const endpoint = createKpFoldableDistributionAnnotatedEndpoints()
    .find(({ objectId }) => objectId === input.state.id);
  if (endpoint === undefined) return;
  const transition = input.root
    .closest<HTMLElement>("[data-kp-reader-transition]");
  const transitionId = transition?.dataset["kpReaderTransition"];
  if (transitionId === undefined || transition === null) {
    throw new Error(
      `Foldable distribution state ${input.state.id} has no transition owner.`
    );
  }
  const activeTransformationIds = new Set(
    transition.dataset["kpReaderCohortTransformations"]
      ?.split(",")
      .filter(Boolean) ??
      [transitionId]
  );

  // Largest-first wrapping preserves nested groups such as a coefficient row
  // containing two term envelopes without splitting KaTeX token wrappers.
  const envelopes = [...endpoint.groupEnvelopes].sort(
    (left, right) =>
      right.memberSelectorIds.length - left.memberSelectorIds.length
  );
  for (const envelope of envelopes) {
    wrapEnvelope(input.root, envelope.id, envelope.memberSelectorIds);
  }

  const activeSelectorIds = new Set(input.state.selectors
    .filter((selector) =>
      selectorIsActive(selector, activeTransformationIds)
    )
    .map(({ id }) => id));
  for (const anchor of input.root.querySelectorAll<HTMLElement>(
    "[data-kp-reader-selector-id]"
  )) {
    const selectorId = anchor.dataset["kpReaderSelectorId"];
    if (selectorId !== undefined && !activeSelectorIds.has(selectorId)) {
      delete anchor.dataset["kpReaderEquationAnchorId"];
      delete anchor.dataset["kpReaderSelectorId"];
    }
  }
  for (const envelope of input.root.querySelectorAll<HTMLElement>(
    "[data-kp-foldable-envelope-id]"
  )) {
    const groupId = envelope.dataset["kpFoldableEnvelopeId"];
    if (groupId === undefined || !activeSelectorIds.has(groupId)) continue;
    envelope.dataset["kpReaderEquationAnchorId"] = `anchor.${groupId}`;
    envelope.dataset["kpReaderSelectorId"] = groupId;
  }
}

function wrapEnvelope(
  root: HTMLElement,
  groupId: string,
  memberSelectorIds: readonly string[]
): void {
  const members = memberSelectorIds.map((selectorId) => {
    const member = root.querySelector<HTMLElement>(
      `[data-kp-reader-selector-id="${cssEscape(selectorId)}"]`
    );
    if (member === null) {
      throw new Error(
        `Foldable distribution group ${groupId} is missing ${selectorId}.`
      );
    }
    return member;
  });
  const first = members[0];
  const last = members.at(-1);
  if (first === undefined || last === undefined) {
    throw new Error(`Foldable distribution group ${groupId} is empty.`);
  }
  const range = root.ownerDocument.createRange();
  range.setStartBefore(first);
  range.setEndAfter(last);
  const fragment = range.extractContents();
  const wrapper = root.ownerDocument.createElement("span");
  wrapper.className = "kp-foldable-semantic-envelope";
  wrapper.dataset["kpFoldableEnvelopeId"] = groupId;
  wrapper.append(fragment);
  range.insertNode(wrapper);
}

function selectorIsActive(
  selector: KpSemanticAssetObject["selectors"][number],
  activeTransformationIds: ReadonlySet<string>
): boolean {
  const scope = selector.metadata?.["activeTransformationIds"];
  return typeof scope !== "string" ||
    scope.split(",").some((id) => activeTransformationIds.has(id));
}

function cssEscape(value: string): string {
  return CSS.escape(value);
}
