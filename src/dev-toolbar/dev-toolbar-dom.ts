import "./dev-toolbar.css";

import {
  createKpDevToolbarHost,
  kpDevToolbarReviewControlId,
  type KpDevToolbarChoice,
  type KpDevToolbarCommand,
  type KpDevToolbarControl,
  type KpDevToolbarLinks,
  type KpDevToolbarRouteContribution,
  type KpDevToolbarSnapshot
} from "./dev-toolbar-protocol.ts";
import {
  createKpDevelopmentPagesControl
} from "./development-page-toolbar-control.ts";

export interface KpMountedDevToolbar {
  readonly update: (contribution: KpDevToolbarRouteContribution) => void;
  readonly clear: (routeId: string) => void;
  readonly dispose: () => void;
}

export function mountKpDevToolbar(input: {
  readonly ownerDocument?: Document;
  readonly contribution?: KpDevToolbarRouteContribution;
  readonly execute: (command: KpDevToolbarCommand) => void;
}): KpMountedDevToolbar {
  const ownerDocument = input.ownerDocument ?? document;
  if (ownerDocument.querySelector("[data-kp-dev-toolbar]") !== null) {
    throw new Error("The development toolbar is already mounted.");
  }
  const toolbar = ownerDocument.createElement("aside");
  toolbar.dataset["kpDevToolbar"] = "true";
  toolbar.setAttribute("aria-label", "Development tools");
  const location = ownerDocument.defaultView?.location;
  const host = createKpDevToolbarHost({
    execute: input.execute,
    ...(location === undefined
      ? {}
      : {
          pages: createKpDevelopmentPagesControl({
            pathname: location.pathname,
            search: location.search
          })
        })
  });

  const render = (snapshot: KpDevToolbarSnapshot): void => {
    toolbar.replaceChildren(...snapshot.controls.map((control) => renderControl(
      ownerDocument,
      control,
      snapshot.routeId,
      host.dispatch
    )));
  };
  const unsubscribe = host.subscribe(render);
  if (input.contribution !== undefined) host.setRoute(input.contribution);
  ownerDocument.documentElement.dataset["kpDevToolbarActive"] = "true";
  ownerDocument.body.append(toolbar);

  return Object.freeze({
    update: host.setRoute,
    clear: host.clearRoute,
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
  if (control.kind === "links") return renderLinks(ownerDocument, control);
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

function renderLinks(
  ownerDocument: Document,
  control: KpDevToolbarLinks
): HTMLElement {
  const disclosure = ownerDocument.createElement("details");
  disclosure.dataset["kpDevToolbarControl"] = control.id;
  disclosure.className = "kp-dev-toolbar__pages";
  const summary = ownerDocument.createElement("summary");
  summary.textContent = control.label;
  summary.setAttribute("aria-haspopup", "true");
  summary.setAttribute("aria-expanded", "false");
  const navigation = ownerDocument.createElement("nav");
  navigation.setAttribute("aria-label", "Development pages");

  for (const group of control.groups) {
    const section = ownerDocument.createElement("section");
    section.dataset["kpDevToolbarPageGroup"] = group.id;
    const heading = ownerDocument.createElement("h3");
    heading.textContent = group.label;
    const list = ownerDocument.createElement("ul");
    for (const link of group.links) {
      const item = ownerDocument.createElement("li");
      const anchor = ownerDocument.createElement("a");
      anchor.dataset["kpDevToolbarPage"] = link.id;
      anchor.href = link.href;
      anchor.textContent = link.label;
      if (link.current) anchor.setAttribute("aria-current", "page");
      item.append(anchor);
      list.append(item);
    }
    section.append(heading, list);
    navigation.append(section);
  }
  disclosure.addEventListener("toggle", () => {
    summary.setAttribute("aria-expanded", String(disclosure.open));
  });
  disclosure.addEventListener("keydown", (event) => {
    if (event.key !== "Escape" || !disclosure.open) return;
    event.preventDefault();
    disclosure.open = false;
    summary.focus();
  });
  disclosure.append(summary, navigation);
  return disclosure;
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
