import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpDevToolbarHost,
  kpDevToolbarCopyLinkControlId,
  kpDevToolbarPagesControlId,
  kpDevToolbarProtocolSchema,
  kpDevToolbarReviewControlId,
  kpDevToolbarThemeControlId,
  type KpDevToolbarCommand,
  type KpDevToolbarRouteContribution
} from "../src/dev-toolbar/dev-toolbar-protocol.ts";
import {
  createKpDevelopmentPagesControl
} from "../src/dev-toolbar/development-page-toolbar-control.ts";

test("the universal host always exposes Review before route controls", () => {
  const host = createKpDevToolbarHost({ execute: () => undefined });

  assert.deepEqual(host.snapshot(), {
    kind: "kp-dev-toolbar-snapshot",
    availability: "development-only",
    controls: [{
      kind: "action",
      id: kpDevToolbarReviewControlId,
      label: "Review",
      group: "primary",
      order: 0
    }]
  });
  host.setRoute(economicsContribution());
  assert.deepEqual(host.snapshot().controls.map(({ id }) => id), [
    kpDevToolbarReviewControlId,
    "economics.view",
    "economics.theme"
  ]);
});

test("the host owns an immutable Pages directory before route controls", () => {
  const pages = createKpDevelopmentPagesControl({
    pathname: "/tutorials/economics/demand-shift/",
    search: "?view=reader"
  });
  const host = createKpDevToolbarHost({
    execute: () => undefined,
    pages
  });
  host.setRoute(economicsContribution());

  const snapshot = host.snapshot();
  assert.deepEqual(snapshot.controls.map(({ id }) => id), [
    kpDevToolbarReviewControlId,
    kpDevToolbarPagesControlId,
    "economics.view",
    "economics.theme"
  ]);
  const directory = snapshot.controls[1]!;
  assert.equal(directory.kind, "links");
  if (directory.kind !== "links") return;
  assert.ok(Object.isFrozen(directory));
  assert.ok(Object.isFrozen(directory.groups));
  assert.equal(
    directory.groups.flatMap(({ links }) => links)
      .find(({ id }) => id === "tutorial.economics-demand-shift")?.current,
    true
  );
  assert.throws(() => host.dispatch({
    controlId: kpDevToolbarPagesControlId
  }), /native anchor navigation/u);
});

test("the host owns replaceable global dock controls before route capabilities", () => {
  const commands: KpDevToolbarCommand[] = [];
  const host = createKpDevToolbarHost({
    execute: (command) => commands.push(command),
    globals: [{
      kind: "action",
      id: kpDevToolbarCopyLinkControlId,
      label: "Copy link",
      group: "primary",
      order: 10
    }, {
      kind: "toggle",
      id: kpDevToolbarThemeControlId,
      label: "Dark mode",
      group: "preferences",
      order: 20,
      pressed: false
    }]
  });
  host.setRoute(economicsContribution());

  assert.deepEqual(host.snapshot().controls.map(({ id }) => id), [
    kpDevToolbarReviewControlId,
    kpDevToolbarCopyLinkControlId,
    kpDevToolbarThemeControlId,
    "economics.view",
    "economics.theme"
  ]);
  host.dispatch({ controlId: kpDevToolbarThemeControlId, value: true });
  assert.deepEqual(commands, [{
    routeId: "tutorial.economics.demand-shift",
    controlId: kpDevToolbarThemeControlId,
    value: true
  }]);

  host.setGlobals([{
    kind: "toggle",
    id: kpDevToolbarThemeControlId,
    label: "Dark mode",
    group: "preferences",
    order: 20,
    pressed: true
  }]);
  const theme = host.snapshot().controls.find(
    ({ id }) => id === kpDevToolbarThemeControlId
  );
  assert.equal(theme?.kind === "toggle" && theme.pressed, true);
});

test("route contributions are immutable, sorted capabilities rather than DOM", () => {
  const contribution = economicsContribution();
  const host = createKpDevToolbarHost({ execute: () => undefined });
  host.setRoute(contribution);
  const snapshot = host.snapshot();

  assert.equal(snapshot.routeId, "tutorial.economics.demand-shift");
  assert.ok(Object.isFrozen(snapshot));
  assert.ok(Object.isFrozen(snapshot.controls));
  assert.doesNotMatch(JSON.stringify(snapshot), /HTMLElement|Svelte|onclick|position:|bottom:/u);
});

test("routes cannot replace the host-owned Pages directory", () => {
  const host = createKpDevToolbarHost({ execute: () => undefined });
  assert.throws(() => host.setRoute({
    schemaVersion: kpDevToolbarProtocolSchema,
    routeId: "tutorial.bad",
    controls: [{
      kind: "action",
      id: kpDevToolbarPagesControlId,
      label: "Not pages",
      group: "primary",
      order: 1
    }]
  }), /Invalid or duplicate toolbar control/u);
});

test("typed commands reach the active route and reject stale or invalid input", () => {
  const commands: KpDevToolbarCommand[] = [];
  const host = createKpDevToolbarHost({ execute: (command) => commands.push(command) });
  host.setRoute(economicsContribution());

  host.dispatch({ controlId: "economics.theme", value: true });
  host.dispatch({ controlId: "economics.view", value: "deck" });
  host.dispatch({ controlId: kpDevToolbarReviewControlId });
  assert.deepEqual(commands, [
    { routeId: "tutorial.economics.demand-shift", controlId: "economics.theme", value: true },
    { routeId: "tutorial.economics.demand-shift", controlId: "economics.view", value: "deck" },
    { routeId: "tutorial.economics.demand-shift", controlId: kpDevToolbarReviewControlId }
  ]);
  assert.throws(() => host.dispatch({ controlId: "economics.view", value: "unknown" }), /declared option/u);
  assert.throws(() => host.dispatch({
    routeId: "tutorial.other",
    controlId: "economics.theme",
    value: false
  }), /inactive route/u);
});

test("changing routes removes stale contextual controls but never Review", () => {
  const host = createKpDevToolbarHost({ execute: () => undefined });
  const snapshots: string[][] = [];
  const unsubscribe = host.subscribe((snapshot) => snapshots.push(snapshot.controls.map(({ id }) => id)));

  host.setRoute(economicsContribution());
  host.clearRoute("tutorial.other");
  host.clearRoute("tutorial.economics.demand-shift");
  unsubscribe();
  assert.deepEqual(snapshots, [
    [kpDevToolbarReviewControlId],
    [kpDevToolbarReviewControlId, "economics.view", "economics.theme"],
    [kpDevToolbarReviewControlId]
  ]);
});

function economicsContribution(): KpDevToolbarRouteContribution {
  return {
    schemaVersion: kpDevToolbarProtocolSchema,
    routeId: "tutorial.economics.demand-shift",
    controls: [{
      kind: "toggle",
      id: "economics.theme",
      label: "Dark mode",
      group: "preferences",
      order: 20,
      pressed: true
    }, {
      kind: "choice",
      id: "economics.view",
      label: "Layout",
      group: "context",
      order: 10,
      value: "stacked",
      options: [
        { value: "stacked", label: "Stacked" },
        { value: "split", label: "Split" },
        { value: "deck", label: "Deck" }
      ]
    }]
  };
}
