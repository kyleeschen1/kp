import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

import {
  defineKpApplicationEntryOwners,
  findKpApplicationEntryOwner,
  kpApplicationEntryOwnerIds,
  kpApplicationEntryOwners
} from "../src/architecture/kp-application-entry-ownership.ts";

test("application entry ownership is complete immutable and filesystem-backed", () => {
  assert.deepEqual(
    kpApplicationEntryOwners.map(({ id }) => id),
    [...kpApplicationEntryOwnerIds]
  );
  assert.ok(Object.isFrozen(kpApplicationEntryOwners));
  for (const owner of kpApplicationEntryOwners) {
    assert.ok(Object.isFrozen(owner));
    assert.ok(Object.isFrozen(owner.entryModules));
    assert.ok(Object.isFrozen(owner.hostDocuments));
    for (const path of [
      ...owner.entryModules,
      ...owner.hostDocuments,
      ...owner.currentBuildConfigs
    ]) assert.ok(existsSync(path), `${path} must exist`);
  }
  assert.deepEqual(
    JSON.parse(JSON.stringify(kpApplicationEntryOwners)),
    kpApplicationEntryOwners
  );
});

test("entry owners state the migrations that slices 16 through 19 must prove", () => {
  assert.deepEqual(
    kpApplicationEntryOwners.map((owner) => ({
      id: owner.id,
      current: owner.currentBoundary,
      required: owner.requiredBoundary
    })),
    [
      {
        id: "entry-owner.kernel",
        current: "framework-neutral-library",
        required: "framework-neutral-library"
      },
      {
        id: "entry-owner.internal-studio",
        current: "dedicated-production-graph",
        required: "dedicated-production-graph"
      },
      {
        id: "entry-owner.public-web",
        current: "dedicated-production-graph",
        required: "dedicated-production-graph"
      },
      {
        id: "entry-owner.development-tooling",
        current: "development-erased",
        required: "development-erased"
      },
      {
        id: "entry-owner.compatibility",
        current: "routing-only-compatibility",
        required: "routing-only-compatibility"
      }
    ]
  );
});

test("the shared main build does not compile or own Public Web routes", () => {
  const publicWeb = findKpApplicationEntryOwner("entry-owner.public-web");
  const developmentInputs = readFileSync(
    "src/dev-toolbar/development-page-build-entries.ts",
    "utf8"
  );
  const mainConfig = readFileSync("vite.config.ts", "utf8");

  assert.deepEqual(publicWeb.currentBuildConfigs, publicWeb.requiredBuildConfigs);
  assert.ok(publicWeb.currentBuildConfigs.every((path) =>
    path.startsWith("vite.public-")
  ));
  for (const document of publicWeb.hostDocuments) {
    assert.doesNotMatch(developmentInputs, new RegExp(escapeRegExp(document)));
  }
  assert.doesNotMatch(mainConfig, /src\/public-web\//u);
  assert.doesNotMatch(mainConfig, /kp-(?:typescript|fraction)-.+publication/u);
});

test("public and development entry roots cannot masquerade as kernel or Studio", () => {
  const kernel = findKpApplicationEntryOwner("entry-owner.kernel");
  const studio = findKpApplicationEntryOwner("entry-owner.internal-studio");
  const publicWeb = findKpApplicationEntryOwner("entry-owner.public-web");
  const development = findKpApplicationEntryOwner(
    "entry-owner.development-tooling"
  );
  assert.deepEqual(kernel.entryModules, ["src/kernel/public-api.ts"]);
  assert.deepEqual(studio.entryModules, [
    "src/internal-studio/internal-studio-entry.ts"
  ]);
  assert.ok(publicWeb.entryModules.every((path) =>
    path.startsWith("src/public-web/")
  ));
  assert.ok(development.entryModules.every((path) =>
    path.startsWith("src/dev-toolbar/") ||
    path.startsWith("src/dev-review/") ||
    path.startsWith("src/experiments/")
  ));
  assert.ok(publicWeb.requiredBuildConfigs.every((path) =>
    path.startsWith("vite.public-")
  ));
  assert.deepEqual(development.requiredBuildConfigs, []);
  assert.deepEqual(development.currentBuildConfigs, []);
});

test("every production build inspects Rollup's rendered modules for development leaks", () => {
  const configs = [
    "vite.config.ts",
    "vite.internal-studio.config.ts",
    ...findKpApplicationEntryOwner("entry-owner.public-web").currentBuildConfigs
  ];
  for (const config of configs) {
    assert.match(
      readFileSync(config, "utf8"),
      /kpProductionDevelopmentErasurePlugin\(\{ projectRoot \}\)/u,
      `${config} must enforce development erasure`
    );
  }
});

test("ownership rejects duplicate roots incomplete registries and unsafe dev policy", () => {
  const owners = kpApplicationEntryOwners.map((owner) => ({ ...owner }));
  assert.throws(() => defineKpApplicationEntryOwners([
    ...owners.slice(0, -1),
    { ...owners.at(-1)!, id: "entry-owner.kernel" }
  ]), /duplicated/);
  assert.throws(() => defineKpApplicationEntryOwners([
    ...owners.slice(0, -1),
    {
      ...owners.at(-1)!,
      entryModules: [owners[0]!.entryModules[0]!]
    }
  ]), /two owners/);
  assert.throws(() => defineKpApplicationEntryOwners(
    owners.filter(({ id }) => id !== "entry-owner.compatibility")
  ), /every owner once/);
  assert.throws(() => defineKpApplicationEntryOwners(owners.map((owner) =>
    owner.id === "entry-owner.development-tooling"
      ? { ...owner, requiredBoundary: "shared-main-graph" }
      : owner
  )), /erased from production/);
});

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
}
