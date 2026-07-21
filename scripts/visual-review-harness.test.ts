import assert from "node:assert/strict";
import test from "node:test";

import type { Browser, BrowserContext, Page } from "playwright";

import {
  KpVisualReviewHarness,
  type KpVisualHarnessAdapters
} from "./visual-review-harness.ts";

test("one harness reuses its server, browser, and matching profile page", async () => {
  const state = fakeAdapters();
  const harness = new KpVisualReviewHarness(state.adapters);

  await Promise.all([harness.start(), harness.start()]);
  const first = await harness.page({ viewport: { width: 1280, height: 900 } });
  const reused = await harness.page({ viewport: { width: 1280, height: 900 } });
  const mobile = await harness.page({ viewport: { width: 390, height: 844 } });

  assert.equal(first, reused);
  assert.notEqual(first, mobile);
  assert.equal(state.serverStarts, 1);
  assert.equal(state.browserStarts, 1);
  assert.equal(state.contextStarts, 2);
  assert.equal(harness.url("/reader/solve-x"), "http://127.0.0.1:4173/reader/solve-x");

  await harness.close();
  await harness.close();
  assert.equal(state.contextCloses, 2);
  assert.equal(state.browserCloses, 1);
  assert.equal(state.serverCloses, 1);
});

test("a closed harness cannot restart", async () => {
  const state = fakeAdapters();
  const harness = new KpVisualReviewHarness(state.adapters);
  await harness.close();
  await assert.rejects(() => harness.start(), /closed/);
});

function fakeAdapters(): {
  readonly adapters: KpVisualHarnessAdapters;
  serverStarts: number;
  browserStarts: number;
  contextStarts: number;
  contextCloses: number;
  browserCloses: number;
  serverCloses: number;
} {
  const state = {
    serverStarts: 0,
    browserStarts: 0,
    contextStarts: 0,
    contextCloses: 0,
    browserCloses: 0,
    serverCloses: 0,
    adapters: undefined as unknown as KpVisualHarnessAdapters
  };
  const browser = {
    newContext: async () => {
      state.contextStarts += 1;
      const page = { id: state.contextStarts } as unknown as Page;
      return {
        newPage: async () => page,
        close: async () => { state.contextCloses += 1; }
      } as unknown as BrowserContext;
    },
    close: async () => { state.browserCloses += 1; }
  } as unknown as Browser;
  state.adapters = {
    startServer: async () => {
      state.serverStarts += 1;
      return {
        baseUrl: "http://127.0.0.1:4173",
        close: async () => { state.serverCloses += 1; }
      };
    },
    launchBrowser: async () => {
      state.browserStarts += 1;
      return browser;
    }
  };
  return state;
}
