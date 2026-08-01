import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpAnimationCatalogueProjection
} from "../src/editor/animation-catalogue-projection.ts";
import {
  decideKpAnimationCatalogueLinkNavigation,
  resolveKpAnimationCatalogueHistoryNavigation
} from "../src/editor/animation-catalogue-navigation.ts";

const projection = createKpAnimationCatalogueProjection();
const solveX = "animation.linear-solve.solve-x";
const radical = "animation.generated.radical.square-root-as-power";
const currentHref =
  `http://127.0.0.1:8000/?artifact=${solveX}&playhead=0.5`;

test("ordinary catalogue links select in place and push a clean asset route", () => {
  const decision = decideKpAnimationCatalogueLinkNavigation({
    projection,
    currentAnimationId: solveX,
    currentHref,
    href: `/?artifact=${radical}`,
    event: primaryClick
  });

  assert.equal(decision.action, "select");
  if (decision.action !== "select") assert.fail("Expected selection.");
  assert.equal(decision.entry.animationId, radical);
  assert.equal(decision.history, "push");
  assert.equal(decision.playhead, undefined);
  assert.equal(decision.href, `/?artifact=${radical}`);
});

test("selecting the current row stays in place without minting history", () => {
  assert.deepEqual(
    decideKpAnimationCatalogueLinkNavigation({
      projection,
      currentAnimationId: solveX,
      currentHref,
      href: `/?artifact=${solveX}`,
      event: primaryClick
    }),
    {
      action: "stay",
      animationId: solveX
    }
  );
});

test("browser-owned link gestures retain native navigation", () => {
  const gestures = [
    { label: "prevented", event: { ...primaryClick, defaultPrevented: true } },
    { label: "non-primary", event: { ...primaryClick, button: 1 } },
    { label: "modified", event: { ...primaryClick, metaKey: true } },
    { label: "target", event: primaryClick, target: "_blank" },
    { label: "download", event: primaryClick, download: true }
  ] as const;

  for (const gesture of gestures) {
    const decision = decideKpAnimationCatalogueLinkNavigation({
      projection,
      currentAnimationId: solveX,
      currentHref,
      href: `/?artifact=${radical}`,
      event: gesture.event,
      ...(gesture.target === undefined ? {} : { target: gesture.target }),
      ...(gesture.download === undefined
        ? {}
        : { download: gesture.download })
    });
    assert.equal(decision.action, "native", gesture.label);
    assert.equal(
      decision.action === "native" ? decision.reason : undefined,
      gesture.label
    );
  }
});

test("unsafe or non-catalogue destinations fail back to native navigation", () => {
  const destinations = [
    ["different-origin", `https://example.com/?artifact=${radical}`],
    ["different-path", `/other?artifact=${radical}`],
    ["other-view", "/?view=editor"],
    ["unknown-artifact", "/?artifact=animation.unknown"]
  ] as const;

  for (const [reason, href] of destinations) {
    const decision = decideKpAnimationCatalogueLinkNavigation({
      projection,
      currentAnimationId: solveX,
      currentHref,
      href,
      event: primaryClick
    });
    assert.deepEqual(decision, { action: "native", reason });
  }
});

test("history routes resolve known assets and preserve their bounded playhead", () => {
  const decision = resolveKpAnimationCatalogueHistoryNavigation({
    projection,
    href: `http://127.0.0.1:8000/?artifact=${radical}&playhead=0.375`
  });

  assert.equal(decision.action, "select");
  if (decision.action !== "select") assert.fail("Expected selection.");
  assert.equal(decision.entry.animationId, radical);
  assert.equal(decision.playhead, 0.375);
  assert.equal(decision.history, "none");
});

test("history routes distinguish leaving the catalogue from unknown assets", () => {
  assert.deepEqual(
    resolveKpAnimationCatalogueHistoryNavigation({
      projection,
      href: "http://127.0.0.1:8000/?view=editor"
    }),
    { action: "leave-catalogue" }
  );
  assert.deepEqual(
    resolveKpAnimationCatalogueHistoryNavigation({
      projection,
      href: "http://127.0.0.1:8000/?artifact=animation.unknown"
    }),
    {
      action: "not-found",
      requestedArtifactId: "animation.unknown"
    }
  );
});

const primaryClick = {
  defaultPrevented: false,
  button: 0,
  altKey: false,
  ctrlKey: false,
  metaKey: false,
  shiftKey: false
} as const;
