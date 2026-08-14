import {
  escapeKpTutorialHtmlAttribute,
  escapeKpTutorialHtmlText
} from "../generated-html-escaping.ts";
import {
  kpEigenvectorBeatIds,
  projectKpEigenvectorEndpoint,
  type KpEigenvectorBeatId
} from "./eigenvector-endpoints.ts";
import { findKpEigenvectorPassage } from "./eigenvector-transcript.ts";

export interface KpEigenvectorTransportState {
  readonly currentBeatId: KpEigenvectorBeatId;
  readonly current: number;
  readonly total: 9;
  readonly previousBeatId: KpEigenvectorBeatId | undefined;
  readonly nextBeatId: KpEigenvectorBeatId | undefined;
  readonly status: string;
}

export function projectKpEigenvectorTransport(
  currentBeatId: KpEigenvectorBeatId
): KpEigenvectorTransportState {
  const endpoint = projectKpEigenvectorEndpoint(currentBeatId);
  return {
    currentBeatId,
    current: endpoint.index + 1,
    total: 9,
    previousBeatId: kpEigenvectorBeatIds[endpoint.index - 1],
    nextBeatId: kpEigenvectorBeatIds[endpoint.index + 1],
    status: `Moment ${endpoint.index + 1} of 9: ${findKpEigenvectorPassage(currentBeatId).heading}`
  };
}

export function renderKpEigenvectorTransportHtml(
  currentBeatId: KpEigenvectorBeatId
): string {
  const state = projectKpEigenvectorTransport(currentBeatId);
  return `<nav class="kp-eigenvector-transport" data-kp-eigenvector-transport aria-label="Eigenvector explanation controls">
    ${renderLink("Back", state.previousBeatId, "previous")}
    <div class="kp-eigenvector-transport__progress">
      <progress data-kp-eigenvector-progress max="${state.total}" value="${state.current}" aria-label="${escapeKpTutorialHtmlAttribute(state.status)}"></progress>
      <output data-kp-eigenvector-status aria-live="polite">${escapeKpTutorialHtmlText(state.status)}</output>
    </div>
    ${renderLink("Next", state.nextBeatId, "next")}
  </nav>`;
}

function renderLink(
  label: string,
  beatId: KpEigenvectorBeatId | undefined,
  direction: "previous" | "next"
): string {
  if (beatId === undefined) {
    return `<span class="kp-eigenvector-transport__button" data-kp-eigenvector-${direction} aria-disabled="true">${label}</span>`;
  }
  return `<a class="kp-eigenvector-transport__button" data-kp-eigenvector-${direction} href="#${beatId}">${label}</a>`;
}
