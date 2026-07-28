import assert from "node:assert/strict";
import test from "node:test";

import { createKpReaderLocationSettlement } from "../src/reader/runtime/location-settlement.ts";

test("location settlement atomically gates history and share state", () => {
  const replacements: string[] = [];
  const timers = new Map<number, () => void>();
  let nextTimer = 1;
  let authority = false;
  let href = "https://kinetic.press/reader/example/?kpProgress=100";
  const history = {
    scrollRestoration: "auto",
    replaceState(_state: unknown, _unused: string, url: string | URL | null) {
      replacements.push(String(url));
    }
  } as unknown as History;
  const ownerWindow = {
    history,
    setTimeout(callback: () => void) {
      const id = nextTimer++;
      timers.set(id, callback);
      return id;
    },
    clearTimeout(id: number) { timers.delete(id); }
  } as unknown as Window;
  const shareLink = { href: "" } as HTMLAnchorElement;
  const settlement = createKpReaderLocationSettlement({
    ownerWindow,
    shareLink,
    href: () => href,
    canSettle: () => authority,
    scrollRestoration: "manual"
  });

  assert.equal(history.scrollRestoration, "manual");
  assert.equal(settlement.settle(), false);
  assert.deepEqual(replacements, []);
  assert.equal(settlement.updateShare(), href);
  assert.equal(shareLink.href, href);

  authority = true;
  settlement.schedule(180);
  href = "https://kinetic.press/reader/example/?kpProgress=720";
  const scheduled = timers.entries().next().value;
  assert.ok(scheduled !== undefined);
  timers.delete(scheduled[0]);
  scheduled[1]();
  assert.deepEqual(replacements, [href]);
  assert.equal(shareLink.href, href);
  assert.equal(settlement.settle(), true);
  assert.deepEqual(replacements, [href]);

  settlement.schedule(180);
  settlement.dispose();
  assert.equal(timers.size, 0);
  assert.equal(settlement.settle(), false);
});
