import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { compileKpArticleDocument } from "../src/article/kp-article-document.ts";
import {
  createKpArticleStageActivationController,
  type KpArticleStageActivation
} from "../src/article/kp-article-stage-activation.ts";
import { compileKpArticleStageManifests } from "../src/article/kp-article-stage-manifest.ts";
import type { KpArticleImportLock } from "../src/article/kp-article-import-lock.ts";
import { createKpArticleSource } from "../src/article/kp-article-source.ts";
import { kpArticleVignetteRegistry } from "../src/article/vignettes/economics-demand-shift-vignette.ts";

test("each article stage receives one exact-release interaction manifest", () => {
  const manifests = compileManifests();
  const manifest = manifests[0]!;

  assert.equal(manifests.length, 1);
  assert.equal(manifest.stageId, "market");
  assert.deepEqual(manifest.release, {
    vignetteId: "vignette.economics.demand-shift",
    version: "1.1.0",
    integrity: "sha256:c21624c64a35a5e26302639ffe8c1a3b89ab6a3dc447a5f3b0dfc75ad26bb393",
    moduleSpecifier: "../../tutorial/economics-demand-shift/economics-demand-shift-animation-capability.ts",
    animationId: "animation.economics.supply-demand-equilibrium-shift"
  });
  assert.deepEqual(manifest.activation, {
    policy: "on-demand",
    triggers: ["direct-address", "near-viewport"],
    initialCheckpointId: "lesson.economics.demand-shift#market/initial"
  });
  assert.deepEqual(manifest.semantic.transitionPaths, ["shift-demand"]);
  assert.ok(Object.isFrozen(manifest));
});

test("interaction remains unloaded until direct address or near-viewport demand", async () => {
  const requests: string[] = [];
  const controller = createKpArticleStageActivationController({
    manifests: compileManifests(),
    load: async (manifest, reason) => {
      requests.push(`${manifest.stageId}:${reason}`);
      return { id: manifest.release.animationId };
    }
  });

  assert.equal(controller.state("market"), "idle");
  assert.deepEqual(requests, []);
  const session = await controller.activateStage("market", "near-viewport");
  assert.equal(session.id, "animation.economics.supply-demand-equilibrium-shift");
  assert.deepEqual(requests, ["market:near-viewport"]);
  assert.equal(controller.state("market"), "ready");
});

test("semantic fragments directly activate their owning stage without replay", async () => {
  let resolveLoad!: (session: { id: string }) => void;
  const changes: KpArticleStageActivation[] = [];
  const controller = createKpArticleStageActivationController<{ id: string }>({
    manifests: compileManifests(),
    load: () => new Promise((resolve) => { resolveLoad = resolve; }),
    onChange: (change) => changes.push(change)
  });

  const semantic = controller.activateAddress("#kp-ref:market/demand");
  const duplicate = controller.activateStage("market", "near-viewport");
  assert.equal(controller.state("market"), "loading");
  assert.equal(changes.length, 1);
  assert.equal(changes[0]!.reason, "direct-address");
  resolveLoad({ id: "session.market" });
  assert.equal((await semantic)?.id, "session.market");
  assert.equal((await duplicate).id, "session.market");
  assert.equal(changes.length, 2);
  assert.equal(controller.state("market"), "ready");
  assert.equal(await controller.activateAddress("#unrelated"), undefined);
});

test("failed activation is observable and can be retried", async () => {
  let attempts = 0;
  const controller = createKpArticleStageActivationController({
    manifests: compileManifests(),
    load: async () => {
      attempts += 1;
      if (attempts === 1) throw new Error("offline");
      return "ready";
    }
  });

  await assert.rejects(controller.activateStage("market", "near-viewport"), /offline/u);
  assert.equal(controller.state("market"), "failed");
  assert.equal(await controller.activateStage("market", "direct-address"), "ready");
  assert.equal(controller.state("market"), "ready");
});

function compileManifests() {
  const source = createKpArticleSource(
    "economics-demand-shift.md",
    readFileSync(
      new URL("./fixtures/kp-article-v1-rc1/economics-demand-shift.md", import.meta.url),
      "utf8"
    )
  );
  const lock = JSON.parse(readFileSync(
    new URL("./fixtures/kp-article-v1-rc1/economics-demand-shift.lock.json", import.meta.url),
    "utf8"
  )) as KpArticleImportLock;
  return compileKpArticleStageManifests(compileKpArticleDocument({
    source,
    registry: kpArticleVignetteRegistry,
    lock
  }).document);
}
