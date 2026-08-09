import "./dev-toolbar.css";

import {
  createKpDevToolbarHost,
  kpDevToolbarReviewControlId,
  type KpDevToolbarChoice,
  type KpDevToolbarCommand,
  type KpDevToolbarControl,
  type KpDevToolbarRouteContribution,
  type KpDevToolbarSnapshot
} from "./dev-toolbar-protocol.ts";

export interface KpMountedDevToolbar {
  readonly update: (contribution: KpDevToolbarRouteContribution) => void;
  readonly dispose: () => void;
}

export function mountKpDevToolbar(input: {
  readonly ownerDocument?: Document;
  readonly contribution: KpDevToolbarRouteContribution;
  readonly execute: (command: KpDevToolbarCommand) => void;
}): KpMountedDevToolbar {
  const ownerDocument = input.ownerDocument ?? document;
  if (ownerDocument.querySelector("[data-kp-dev-toolbar]") !== null) {
    throw new Error("The development toolbar is already mounted.");
  }
  const toolbar = ownerDocument.createElement("aside");
  toolbar.dataset["kpDevToolbar"] = "true";
  toolbar.setAttribute("aria-label", "Development tools");
  const host = createKpDevToolbarHost({ execute: input.execute });

  const render = (snapshot: KpDevToolbarSnapshot): void => {
    toolbar.replaceChildren(...snapshot.controls.map((control) => renderControl(
      ownerDocument,
      control,
      snapshot.routeId,
      host.dispatch
    )));
  };
  const unsubscribe = host.subscribe(render);
  host.setRoute(input.contribution);
  ownerDocument.documentElement.dataset["kpDevToolbarActive"] = "true";
  ownerDocument.body.append(toolbar);

  return Object.freeze({
    update: host.setRoute,
    dispose: () => {
      unsubscribe();
      toolbar.remove();
      delete ownerDocument.documentElement.dataset["kpDevToolbarActive"];
    }
  });
}

function renderControl(
  ownerDocument: Document,
  control: KpDevToolbarControl,
  routeId: string | undefined,
  dispatch: (command: KpDevToolbarCommand) => void
): HTMLElement {
  if (control.kind === "choice") {
    return renderChoice(ownerDocument, control, routeId, dispatch);
  }
  const button = ownerDocument.createElement("button");
  button.type = "button";
  button.dataset["kpDevToolbarControl"] = control.id;
  button.disabled = control.disabled === true;
  button.textContent = control.label;
  if (control.kind === "toggle") button.setAttribute("aria-pressed", String(control.pressed));
  if (control.id === kpDevToolbarReviewControlId) button.className = "kp-dev-toolbar__review";
  button.addEventListener("click", () => dispatch({
    ...(routeId === undefined ? {} : { routeId }),
    controlId: control.id,
    ...(control.kind === "toggle" ? { value: !control.pressed } : {})
  }));
  return button;
}

function renderChoice(
  ownerDocument: Document,
  control: KpDevToolbarChoice,
  routeId: string | undefined,
  dispatch: (command: KpDevToolbarCommand) => void
): HTMLElement {
  const label = ownerDocument.createElement("label");
  label.dataset["kpDevToolbarControl"] = control.id;
  const text = ownerDocument.createElement("span");
  text.textContent = control.label;
  const select = ownerDocument.createElement("select");
  select.setAttribute("aria-label", control.label);
  select.disabled = control.disabled === true;
  for (const option of control.options) {
    const element = ownerDocument.createElement("option");
    element.value = option.value;
    element.textContent = option.label;
    element.selected = option.value === control.value;
    select.append(element);
  }
  select.addEventListener("change", () => dispatch({
    ...(routeId === undefined ? {} : { routeId }),
    controlId: control.id,
    value: select.value
  }));
  label.append(text, select);
  return label;
}
