export const kpDevToolbarProtocolSchema = "kp.dev-toolbar.v1" as const;
export const kpDevToolbarReviewControlId = "kp.dev-toolbar.review" as const;
export const kpDevToolbarPagesControlId = "kp.dev-toolbar.pages" as const;
export const kpDevToolbarThemeControlId = "kp.dev-toolbar.theme" as const;
export const kpDevToolbarCopyLinkControlId = "kp.dev-toolbar.copy-link" as const;

export type KpDevToolbarControl =
  | KpDevToolbarAction
  | KpDevToolbarToggle
  | KpDevToolbarChoice
  | KpDevToolbarLinks;

interface KpDevToolbarControlBase {
  readonly id: string;
  readonly label: string;
  readonly group: "primary" | "context" | "preferences";
  readonly order: number;
  readonly disabled?: boolean;
}

export interface KpDevToolbarAction extends KpDevToolbarControlBase {
  readonly kind: "action";
}

export interface KpDevToolbarToggle extends KpDevToolbarControlBase {
  readonly kind: "toggle";
  readonly pressed: boolean;
}

export interface KpDevToolbarChoice extends KpDevToolbarControlBase {
  readonly kind: "choice";
  readonly value: string;
  readonly options: readonly Readonly<{ value: string; label: string }>[];
}

export interface KpDevToolbarLink {
  readonly id: string;
  readonly label: string;
  readonly href: string;
  readonly current: boolean;
}

export interface KpDevToolbarLinkGroup {
  readonly id: string;
  readonly label: string;
  readonly links: readonly KpDevToolbarLink[];
}

export interface KpDevToolbarLinks extends KpDevToolbarControlBase {
  readonly kind: "links";
  readonly groups: readonly KpDevToolbarLinkGroup[];
}

export interface KpDevToolbarRouteContribution {
  readonly schemaVersion: typeof kpDevToolbarProtocolSchema;
  readonly routeId: string;
  readonly controls: readonly KpDevToolbarControl[];
}

export interface KpDevToolbarSnapshot {
  readonly kind: "kp-dev-toolbar-snapshot";
  readonly availability: "development-only";
  readonly routeId?: string;
  readonly controls: readonly KpDevToolbarControl[];
}

export interface KpDevToolbarCommand {
  readonly routeId?: string;
  readonly controlId: string;
  readonly value?: string | boolean;
}

export interface KpDevToolbarHost {
  readonly setGlobals: (controls: readonly KpDevToolbarControl[]) => void;
  readonly setPages: (pages: KpDevToolbarLinks | undefined) => void;
  readonly setRoute: (contribution: KpDevToolbarRouteContribution) => void;
  readonly clearRoute: (routeId: string) => void;
  readonly snapshot: () => KpDevToolbarSnapshot;
  readonly dispatch: (command: KpDevToolbarCommand) => void;
  readonly subscribe: (listener: (snapshot: KpDevToolbarSnapshot) => void) => () => void;
}

/**
 * The host owns Review so individual routes cannot omit or fork it. Routes
 * contribute only contextual capabilities; a dev-only entry point owns DOM.
 */
export function createKpDevToolbarHost(input: {
  readonly execute: (command: KpDevToolbarCommand) => void;
  readonly pages?: KpDevToolbarLinks;
  readonly globals?: readonly KpDevToolbarControl[];
}): KpDevToolbarHost {
  let contribution: KpDevToolbarRouteContribution | undefined;
  let globals = validateGlobalControls(input.globals ?? []);
  let pages = input.pages === undefined ? undefined : freezeLinks(input.pages);
  const listeners = new Set<(snapshot: KpDevToolbarSnapshot) => void>();

  const snapshot = (): KpDevToolbarSnapshot => Object.freeze({
    kind: "kp-dev-toolbar-snapshot" as const,
    availability: "development-only" as const,
    ...(contribution === undefined ? {} : { routeId: contribution.routeId }),
    controls: Object.freeze([
      reviewControl,
      ...(pages === undefined ? [] : [pages]),
      ...globals,
      ...(contribution?.controls ?? [])
    ])
  });
  const publish = (): void => {
    const current = snapshot();
    for (const listener of listeners) listener(current);
  };

  return Object.freeze({
    setGlobals: (next: readonly KpDevToolbarControl[]) => {
      globals = validateGlobalControls(next);
      publish();
    },
    setPages: (next: KpDevToolbarLinks | undefined) => {
      pages = next === undefined ? undefined : freezeLinks(next);
      publish();
    },
    setRoute: (next: KpDevToolbarRouteContribution) => {
      contribution = validateContribution(next);
      publish();
    },
    clearRoute: (routeId: string) => {
      if (contribution?.routeId !== routeId) return;
      contribution = undefined;
      publish();
    },
    snapshot,
    dispatch: (command: KpDevToolbarCommand) => {
      const current = snapshot();
      if (command.routeId !== undefined && command.routeId !== current.routeId) {
        throw new Error(`Toolbar command belongs to inactive route ${command.routeId}.`);
      }
      const control = current.controls.find(({ id }) => id === command.controlId);
      if (control === undefined) throw new Error(`Unknown toolbar control ${command.controlId}.`);
      if (control.disabled === true) throw new Error(`Toolbar control ${command.controlId} is disabled.`);
      validateCommandValue(control, command.value);
      input.execute(Object.freeze({
        ...(current.routeId === undefined ? {} : { routeId: current.routeId }),
        controlId: command.controlId,
        ...(command.value === undefined ? {} : { value: command.value })
      }));
    },
    subscribe: (listener: (snapshot: KpDevToolbarSnapshot) => void) => {
      listeners.add(listener);
      listener(snapshot());
      return () => listeners.delete(listener);
    }
  });
}

const reviewControl: KpDevToolbarAction = Object.freeze({
  kind: "action",
  id: kpDevToolbarReviewControlId,
  label: "Review",
  group: "primary",
  order: 0
});

function validateContribution(
  contribution: KpDevToolbarRouteContribution
): KpDevToolbarRouteContribution {
  if (contribution.schemaVersion !== kpDevToolbarProtocolSchema) {
    throw new Error("Unsupported development-toolbar contribution schema.");
  }
  if (contribution.routeId.trim() === "") throw new Error("Toolbar route ID must not be empty.");
  const ids = new Set<string>();
  const controls = contribution.controls.map((control) => {
    if (
      control.id.trim() === ""
      || control.label.trim() === ""
      || !Number.isFinite(control.order)
      || control.id === kpDevToolbarReviewControlId
      || control.id === kpDevToolbarPagesControlId
      || control.id === kpDevToolbarThemeControlId
      || control.id === kpDevToolbarCopyLinkControlId
      || control.kind === "links"
      || ids.has(control.id)
    ) throw new Error(`Invalid or duplicate toolbar control ${control.id}.`);
    ids.add(control.id);
    if (control.kind === "choice") {
      const values = new Set(control.options.map(({ value }) => value));
      if (values.size !== control.options.length || !values.has(control.value)) {
        throw new Error(`Toolbar choice ${control.id} has invalid options or value.`);
      }
      return Object.freeze({
        ...control,
        options: Object.freeze(control.options.map((option) => Object.freeze({ ...option })))
      });
    }
    return Object.freeze({ ...control });
  }).sort(compareControls);
  return Object.freeze({
    schemaVersion: contribution.schemaVersion,
    routeId: contribution.routeId,
    controls: Object.freeze(controls)
  });
}

function validateGlobalControls(
  controls: readonly KpDevToolbarControl[]
): readonly KpDevToolbarControl[] {
  const ids = new Set<string>();
  const reserved = new Set<string>([
    kpDevToolbarReviewControlId,
    kpDevToolbarPagesControlId
  ]);
  return Object.freeze(controls.map((control) => {
    if (
      control.kind === "links"
      || reserved.has(control.id)
      || ids.has(control.id)
      || control.id.trim() === ""
      || control.label.trim() === ""
    ) throw new Error(`Invalid or duplicate global toolbar control ${control.id}.`);
    ids.add(control.id);
    return Object.freeze({ ...control });
  }).sort(compareControls));
}

function compareControls(left: KpDevToolbarControl, right: KpDevToolbarControl): number {
  const groups = { primary: 0, context: 1, preferences: 2 } as const;
  return groups[left.group] - groups[right.group] || left.order - right.order || left.id.localeCompare(right.id);
}

function validateCommandValue(control: KpDevToolbarControl, value: string | boolean | undefined): void {
  if (control.kind === "links") {
    throw new Error(`Toolbar links ${control.id} use native anchor navigation.`);
  }
  if (control.kind === "action" && value !== undefined) {
    throw new Error(`Toolbar action ${control.id} does not accept a value.`);
  }
  if (control.kind === "toggle" && typeof value !== "boolean") {
    throw new Error(`Toolbar toggle ${control.id} requires a boolean value.`);
  }
  if (
    control.kind === "choice"
    && (typeof value !== "string" || !control.options.some((option) => option.value === value))
  ) throw new Error(`Toolbar choice ${control.id} requires a declared option.`);
}

function freezeLinks(control: KpDevToolbarLinks): KpDevToolbarLinks {
  return Object.freeze({
    ...control,
    groups: Object.freeze(control.groups.map((group) => Object.freeze({
      ...group,
      links: Object.freeze(group.links.map((link) => Object.freeze({
        ...link
      })))
    })))
  });
}
