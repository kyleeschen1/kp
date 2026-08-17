import assert from "node:assert/strict";
import test from "node:test";

import {
  createKpProjectDashboardCapabilityLoader
} from "../src/project-dashboard/capability-loader.ts";

test("dashboard data settles before the selected renderer is requested", async () => {
  const events: string[] = [];
  let settleData: ((value: { readonly id: "data" }) => void) | undefined;
  const data = new Promise<{ readonly id: "data" }>((resolve) => {
    settleData = resolve;
  });
  const loader = createKpProjectDashboardCapabilityLoader({
    importData: () => {
      events.push("data-requested");
      return data;
    },
    importSelectedRenderer: async () => {
      events.push("renderer-requested");
      return { id: "renderer" } as const;
    }
  });

  const loading = loader.load();
  await Promise.resolve();
  assert.deepEqual(events, ["data-requested"]);
  settleData?.({ id: "data" });
  assert.deepEqual(await loading, {
    data: { id: "data" },
    render: { id: "renderer" }
  });
  assert.deepEqual(events, ["data-requested", "renderer-requested"]);
});

test("dashboard capability imports coalesce and failed imports can retry", async () => {
  let dataCalls = 0;
  let rendererCalls = 0;
  const loader = createKpProjectDashboardCapabilityLoader({
    importData: async () => ({ call: ++dataCalls }),
    importSelectedRenderer: async () => {
      rendererCalls += 1;
      if (rendererCalls === 1) throw new Error("transient renderer failure");
      return { call: rendererCalls };
    }
  });

  await assert.rejects(loader.load(), /transient renderer failure/);
  const [left, right] = await Promise.all([loader.load(), loader.load()]);
  assert.equal(dataCalls, 1);
  assert.equal(rendererCalls, 2);
  assert.strictEqual(left.data, right.data);
  assert.strictEqual(left.render, right.render);
});
