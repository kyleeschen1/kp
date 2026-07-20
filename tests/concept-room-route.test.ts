import assert from "node:assert/strict";
import test from "node:test";

import {
  formatBrowserConceptRoomRoute,
  parseBrowserConceptRoomRoute
} from "../src/app-adapters/public-api.ts";
import {
  KpConceptRoomRouteError,
  canonicalizeConceptRoomRoute,
  formatConceptRoomRoute,
  parseConceptRoomRoute,
  type KpConceptRoomRoute
} from "../src/kernel/public-api.ts";
import {
  formatServerConceptRoomRoute,
  parseServerConceptRoomRoute
} from "../server/concept-room-route.ts";

const canonicalRoute: KpConceptRoomRoute = {
  schemaVersion: "kp.room-route.v1",
  conceptId: "mathematics.linear-equations.solve-with-balance",
  conceptVersion: "1.0.0",
  checkpoint: "subtract-three",
  timePermille: 400,
  mode: "touch",
  projection: "balance",
  parameters: { seed: "canonical", equation: "2x + 3 = 8" },
  focus: ["operation.subtract-three", "diagram.balance"],
  branch: "guided",
  provider: {
    id: "linear-problems.exact-rational",
    protocol: "linear-problem.v1",
    version: "1.0.0",
    provenance: "generator.v1:canonical"
  },
  snapshot: {
    id: "confusion.subtract-three",
    integrity: `sha256:${"a".repeat(64)}`
  }
};

test("room routes round trip every durable state field canonically", () => {
  const formatted = formatConceptRoomRoute(canonicalRoute);
  assert.deepEqual(parseConceptRoomRoute(formatted), {
    ...canonicalRoute,
    parameters: { equation: "2x + 3 = 8", seed: "canonical" },
    focus: ["diagram.balance", "operation.subtract-three"]
  });
  assert.equal(canonicalizeConceptRoomRoute(formatted), formatted);
  assert.equal(Object.isFrozen(parseConceptRoomRoute(formatted)), true);
});

test("route round trips hold across modes, projections, checkpoints, and times", () => {
  const modes = ["watch", "touch", "ask", "review"] as const;
  const projections = ["coordinated", "symbolic", "balance"] as const;
  for (let index = 0; index < 64; index += 1) {
    const route: KpConceptRoomRoute = {
      ...canonicalRoute,
      checkpoint: `step-${index}`,
      timePermille: (index * 137) % 1001,
      mode: modes[index % modes.length]!,
      projection: projections[index % projections.length]!,
      parameters: { seed: String(index), difficulty: String(index % 4) },
      focus: [`term.${index}`, "equation.initial"],
      branch: index % 2 === 0 ? "guided" : "independent"
    };
    const formatted = formatConceptRoomRoute(route);
    assert.equal(formatConceptRoomRoute(parseConceptRoomRoute(formatted)), formatted);
  }
});

test("browser and server adapters share exactly one route meaning", () => {
  const formatted = formatConceptRoomRoute(canonicalRoute);
  assert.equal(formatBrowserConceptRoomRoute(canonicalRoute), formatted);
  assert.equal(formatServerConceptRoomRoute(canonicalRoute), formatted);
  assert.deepEqual(parseBrowserConceptRoomRoute(formatted), parseServerConceptRoomRoute(formatted));
});

test("route parsing rejects malformed, partial, unknown, and old-schema URLs", () => {
  const valid = formatConceptRoomRoute(canonicalRoute);
  const malformed = [
    valid.replace("route=1", "route=0"),
    valid.replace("&providerVersion=1.0.0", ""),
    valid.replace("t=400", "t=1001"),
    `${valid}&unknown=value`,
    `${valid}#browser-only-state`,
    valid.replace("checkpoint=subtract-three", "checkpoint=")
  ];
  malformed.forEach((value) => assert.throws(() => parseConceptRoomRoute(value), KpConceptRoomRouteError));
  assert.throws(
    () => parseConceptRoomRoute(malformed[0]!),
    (error: unknown) => error instanceof KpConceptRoomRouteError && error.code === "unsupported-schema"
  );
});
