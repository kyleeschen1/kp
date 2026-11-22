import assert from "node:assert/strict";
import { createServer } from "node:net";
import { test } from "node:test";
import { assertPortFree, servicePlan } from "../scripts/dev-service.mjs";

test("persistent service owns both processes outside the terminal, with pinned local ports", () => {
  const jobs = servicePlan("/repo/kp", "/opt/node", "/user");
  assert.deepEqual(jobs.map((job) => job.port), [8001, 8000]);
  for (const job of jobs) {
    assert.match(job.plist, /<key>KeepAlive<\/key><true\/>/);
    assert.match(job.plist, /<key>RunAtLoad<\/key><true\/>/);
    assert.match(job.plist, /<string>127\.0\.0\.1<\/string>/);
    assert.match(job.filename, /^\/user\/Library\/LaunchAgents\//);
    assert.match(job.plist, /<string>\/opt\/node<\/string>/);
    assert.doesNotMatch(job.plist, /npm|nohup|zsh/);
  }
  assert.match(jobs[1].plist, /<string>--strictPort<\/string>/);
  assert.match(jobs[0].plist, /<string>--watch<\/string>/);
});

test("checkout identity isolates stop targets and log paths; XML protects path characters", () => {
  const first = servicePlan("/repo/a & <b>", "/node", "/user");
  const second = servicePlan("/repo/other", "/node", "/user");
  assert.notEqual(first[0].label, second[0].label);
  assert.notEqual(first[0].label, first[1].label);
  assert.match(first[0].plist, /a &amp; &lt;b&gt;/);
  assert.match(first[0].log, /^\/repo\/a & <b>\//);
});

test("an occupied port is refused without disturbing its existing listener", async () => {
  const server = createServer();
  await new Promise((done) => server.listen(0, "127.0.0.1", done));
  const { port } = server.address();
  try {
    await assert.rejects(assertPortFree(port), /refusing to replace another server/);
    assert.equal(server.listening, true);
  } finally {
    await new Promise((done) => server.close(done));
  }
  await assertPortFree(port);
});
