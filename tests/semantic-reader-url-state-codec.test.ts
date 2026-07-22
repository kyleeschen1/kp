import assert from "node:assert/strict";
import test from "node:test";

import {
  composeKpReaderUrlStateCodecs,
  defineKpReaderUrlStateCodec
} from "../src/reader/runtime/url-state-codec.ts";

const moment = defineKpReaderUrlStateCodec({
  parameters: ["kpLesson", "kpProgress"] as const,
  read: (parameters: URLSearchParams) => ({
    lesson: parameters.get("kpLesson") ?? "",
    progress: Number(parameters.get("kpProgress") ?? 0)
  }),
  write: (parameters: URLSearchParams, state: { readonly lesson: string; readonly progress: number }) => {
    parameters.set("kpLesson", state.lesson);
    parameters.set("kpProgress", String(state.progress));
  }
});

const direction = defineKpReaderUrlStateCodec({
  parameters: ["kpDirection"] as const,
  read: (parameters: URLSearchParams) =>
    parameters.get("kpDirection") === "inverse" ? "inverse" as const : "forward" as const,
  write: (parameters: URLSearchParams, state: "forward" | "inverse") => {
    parameters.set("kpDirection", state);
  }
});

test("composed URL codecs infer and round-trip independent state facets", () => {
  const codec = composeKpReaderUrlStateCodecs({ moment, direction });
  const encoded = codec.write(
    "https://kinetic.press/reader?utm_source=teacher&kpProgress=old",
    { moment: { lesson: "lesson.test", progress: 640 }, direction: "inverse" }
  );
  const url = new URL(encoded);
  assert.equal(url.searchParams.get("utm_source"), "teacher");
  assert.equal(url.search, "?kpDirection=inverse&kpLesson=lesson.test&kpProgress=640&utm_source=teacher");
  assert.deepEqual(codec.read(encoded), {
    moment: { lesson: "lesson.test", progress: 640 },
    direction: "inverse"
  });
});

test("composition rejects overlapping query-parameter ownership", () => {
  assert.throws(
    () => composeKpReaderUrlStateCodecs({ moment, duplicate: defineKpReaderUrlStateCodec({
      parameters: ["kpProgress"] as const,
      read: () => 0,
      write: () => undefined
    }) }),
    /owned by both/
  );
});
