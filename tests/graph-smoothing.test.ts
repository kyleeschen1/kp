import { strict as assert } from "node:assert";
import test from "node:test";

import { catmullRomToBezierPathCommands } from "../src/rendering/graph-smoothing.ts";

test("catmullRomToBezierPathCommands converts sampled points into cubic commands", () => {
  const commands = catmullRomToBezierPathCommands([
    { x: 0, y: 0 },
    { x: 1, y: 1 },
    { x: 2, y: 0 },
    { x: 3, y: 1 }
  ]);

  assert.equal(commands.length, 4);
  assert.deepEqual(commands[0], {
    kind: "move",
    point: { x: 0, y: 0 }
  });
  assert.deepEqual(commands[1], {
    kind: "cubic",
    control1: { x: 1 / 6, y: 1 / 6 },
    control2: { x: 1 - 2 / 6, y: 1 },
    point: { x: 1, y: 1 }
  });
  assert.deepEqual(commands[3], {
    kind: "cubic",
    control1: { x: 7 / 3, y: 0 },
    control2: { x: 17 / 6, y: 5 / 6 },
    point: { x: 3, y: 1 }
  });
});

test("catmullRomToBezierPathCommands keeps empty and single-point paths stable", () => {
  assert.deepEqual(catmullRomToBezierPathCommands([]), []);
  assert.deepEqual(catmullRomToBezierPathCommands([{ x: 4, y: 2 }]), [
    {
      kind: "move",
      point: { x: 4, y: 2 }
    }
  ]);
});
