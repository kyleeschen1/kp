import { strict as assert } from "node:assert";
import { rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import {
  createKpDevReviewServiceFromEnvironment,
  createKpDevReviewServicesFromEnvironment,
  KP_DEV_REVIEW_ENABLE_ENV,
  KP_DEV_REVIEW_ROOT_ENV
} from "./dev-review-config.ts";

test("server review capability is off unless explicitly enabled", async () => {
  assert.equal(await createKpDevReviewServiceFromEnvironment({}), undefined);
  assert.equal(await createKpDevReviewServiceFromEnvironment({ [KP_DEV_REVIEW_ENABLE_ENV]: "0" }), undefined);
  await assert.rejects(
    () => createKpDevReviewServiceFromEnvironment({ [KP_DEV_REVIEW_ENABLE_ENV]: "1" }),
    new RegExp(KP_DEV_REVIEW_ROOT_ENV)
  );
});

test("explicit development configuration opens the local inbox", async (context) => {
  const root = join(tmpdir(), `kp-dev-review-config-${process.pid}-${Date.now()}`);
  context.after(() => rm(root, { recursive: true, force: true }));
  const service = await createKpDevReviewServiceFromEnvironment({
    [KP_DEV_REVIEW_ENABLE_ENV]: "1",
    [KP_DEV_REVIEW_ROOT_ENV]: root
  });

  assert.ok(service);
  assert.deepEqual(service.read(), {
    schemaVersion: "kp.dev-review.v1",
    notes: [],
    cursors: {}
  });
});

test("explicit configuration shares one append-only store across legacy and round services", async (context) => {
  const root = join(tmpdir(), `kp-dev-review-services-${process.pid}-${Date.now()}`);
  context.after(() => rm(root, { recursive: true, force: true }));
  const services = await createKpDevReviewServicesFromEnvironment({
    [KP_DEV_REVIEW_ENABLE_ENV]: "1",
    [KP_DEV_REVIEW_ROOT_ENV]: root
  });

  assert.ok(services);
  assert.equal(services.legacy.read().notes.length, 0);
  assert.equal(services.rounds.read().rounds.length, 0);
});
