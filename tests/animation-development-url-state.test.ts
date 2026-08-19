import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpAnimationDevelopmentExactHref,
  readKpAnimationDevelopmentUrlState,
  resolveKpAnimationDevelopmentTheme,
  writeKpAnimationDevelopmentUrlState
} from "../src/editor/animation-development-url-state.ts";
import {
  KP_ANIMATION_DEVELOPMENT_LOCATION_EVENT,
  navigateKpAnimationDevelopmentView
} from "../src/editor/animation-development-view-navigation.ts";

test("theme precedence keeps exact links above preferences and dark fallback", () => {
  assert.equal(resolveKpAnimationDevelopmentTheme({
    explicitTheme: "light",
    preferredTheme: "dark"
  }), "light");
  assert.equal(resolveKpAnimationDevelopmentTheme({
    explicitTheme: null,
    preferredTheme: "light"
  }), "light");
  assert.equal(resolveKpAnimationDevelopmentTheme({
    explicitTheme: "neon",
    preferredTheme: "sepia"
  }), "dark");
});

test("legacy catalogue links acquire typed defaults without losing exact state", () => {
  assert.deepEqual(readKpAnimationDevelopmentUrlState(
    "https://kp.invalid/?artifact=animation.example&playhead=0.553&utm_source=review"
  ), {
    view: "animation-catalogue",
    viewSource: "default",
    theme: "dark",
    display: {
      style: "organic-subtle",
      focus: "flat"
    },
    artifactId: "animation.example",
    playhead: 0.553
  });
});

test("coverage and catalogue state round trip with unrelated query data", () => {
  const encoded = writeKpAnimationDevelopmentUrlState({
    baseUrl: "https://kp.invalid/?utm_source=teacher&playhead=old",
    state: {
      view: "coverage",
      viewSource: "explicit",
      theme: "light",
      display: {
        style: "restrained-editorial",
        focus: "no-depth"
      },
      artifactId: "animation.example",
      checkpointId: "operation.divide",
      playhead: 0.625
    }
  });
  const url = new URL(encoded);

  assert.equal(url.searchParams.get("utm_source"), "teacher");
  assert.equal(url.searchParams.get("view"), "coverage");
  assert.equal(url.searchParams.get("theme"), "light");
  assert.equal(url.searchParams.get("style"), "restrained-editorial");
  assert.equal(url.searchParams.get("focus"), "no-depth");
  assert.equal(url.searchParams.get("artifact"), "animation.example");
  assert.equal(url.searchParams.get("checkpoint"), "operation.divide");
  assert.equal(url.searchParams.get("playhead"), "0.625");
  assert.deepEqual(readKpAnimationDevelopmentUrlState(encoded), {
    view: "coverage",
    viewSource: "explicit",
    theme: "light",
    display: {
      style: "restrained-editorial",
      focus: "no-depth"
    },
    artifactId: "animation.example",
    checkpointId: "operation.divide",
    playhead: 0.625
  });
});

test("invalid owned state falls back without erasing unrelated parameters", () => {
  const exact = createKpAnimationDevelopmentExactHref(
    "https://kp.invalid/?view=coverage&theme=neon&style=loud&focus=spin&playhead=2&utm_medium=handout"
  );
  const url = new URL(exact);

  assert.equal(url.searchParams.get("view"), "coverage");
  assert.equal(url.searchParams.get("theme"), "dark");
  assert.equal(url.searchParams.get("style"), "organic-subtle");
  assert.equal(url.searchParams.get("focus"), "flat");
  assert.equal(url.searchParams.has("playhead"), false);
  assert.equal(url.searchParams.get("utm_medium"), "handout");
});

test("exact links make default catalogue state explicit and stable", () => {
  const exact = createKpAnimationDevelopmentExactHref(
    "https://kp.invalid/?artifact=animation.example"
  );
  const url = new URL(exact);

  assert.equal(url.searchParams.get("view"), "animation-catalogue");
  assert.equal(url.searchParams.get("theme"), "dark");
  assert.equal(url.searchParams.get("style"), "organic-subtle");
  assert.equal(url.searchParams.get("focus"), "flat");
  assert.equal(url.searchParams.get("artifact"), "animation.example");
});

test("invalid application views remain outside the animation development codec", () => {
  assert.deepEqual(
    readKpAnimationDevelopmentUrlState(
      "https://kp.invalid/?view=editor&theme=dark"
    ),
    {
      view: undefined,
      viewSource: "other-view",
      theme: "dark",
      display: {
        style: "organic-subtle",
        focus: "flat"
      }
    }
  );
});

test("same-document view navigation preserves state and publishes one remount signal", () => {
  const events: string[] = [];
  const location = {
    href: "https://kp.invalid/?artifact=animation.example&playhead=0.42"
  };
  const ownerWindow = {
    location,
    history: {
      pushState: (_state: unknown, _unused: string, href: string | URL) => {
        location.href = String(href);
      },
      replaceState: () => assert.fail("Expected push history.")
    },
    dispatchEvent: (event: Event) => {
      events.push(event.type);
      return true;
    }
  } as unknown as Window;

  const href = navigateKpAnimationDevelopmentView({
    ownerWindow,
    view: "coverage"
  });
  const url = new URL(href);
  assert.equal(url.searchParams.get("view"), "coverage");
  assert.equal(url.searchParams.get("artifact"), "animation.example");
  assert.equal(url.searchParams.get("playhead"), "0.42");
  assert.equal(url.searchParams.get("theme"), "dark");
  assert.deepEqual(events, [KP_ANIMATION_DEVELOPMENT_LOCATION_EVENT]);
});
