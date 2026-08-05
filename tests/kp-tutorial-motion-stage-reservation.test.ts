import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  KpTutorialMotionStageReservationHost,
  kpTutorialMotionStageBlockSizeProperty,
  kpTutorialMotionStageReservationClass
} from "../src/tutorial/kp-tutorial-motion-stage-reservation.ts";

test("reservation geometry survives hydration and dehydration", () => {
  const operations: string[] = [];
  const root = fakeElement("root", operations);
  const staticSurface = fakeElement("static", operations);
  const liveSurface = fakeElement("live", operations);
  let pauses = 0;
  let disposals = 0;
  const host = new KpTutorialMotionStageReservationHost({
    root: root.element,
    staticSurface: staticSurface.element,
    liveSurface: liveSurface.element,
    reservedBlockSize: 480
  });

  assert.equal(host.snapshot(), "dehydrated");
  assert.equal(root.style.get(kpTutorialMotionStageBlockSizeProperty), "480px");
  assert.ok(root.classes.has(kpTutorialMotionStageReservationClass));
  assert.equal(staticSurface.hidden(), false);
  assert.equal(liveSurface.hidden(), true);
  assert.equal(staticSurface.dataset["kpTutorialStaticStage"], "");
  assert.equal(liveSurface.dataset["kpTutorialLiveStage"], "");

  const session = host.hydrate((surface) => {
    assert.equal(surface, liveSurface.element);
    assert.equal(liveSurface.hidden(), true);
    return {
      pause: () => { pauses += 1; },
      dispose: () => { disposals += 1; }
    };
  });
  assert.equal(host.hydrate(() => assert.fail("mount must be idempotent")), session);
  assert.equal(host.snapshot(), "hydrated");
  assert.equal(liveSurface.hidden(), false);
  assert.equal(staticSurface.hidden(), true);
  assert.equal(root.style.get(kpTutorialMotionStageBlockSizeProperty), "480px");

  operations.length = 0;
  host.dehydrate();
  assert.equal(host.snapshot(), "dehydrated");
  assert.equal(staticSurface.hidden(), false);
  assert.equal(liveSurface.hidden(), true);
  assert.equal(pauses, 1);
  assert.equal(disposals, 1);
  assert.equal(liveSurface.replacements(), 1);
  assert.ok(operations.indexOf("static.hidden=false") <
    operations.indexOf("live.hidden=true"));
  assert.ok(operations.indexOf("live.hidden=true") <
    operations.indexOf("live.replaceChildren"));
  assert.equal(root.style.get(kpTutorialMotionStageBlockSizeProperty), "480px");
});

test("failed mounts retain the static accessible surface", () => {
  const root = fakeElement("root", []);
  const staticSurface = fakeElement("static", []);
  const liveSurface = fakeElement("live", []);
  const host = new KpTutorialMotionStageReservationHost({
    root: root.element,
    staticSurface: staticSurface.element,
    liveSurface: liveSurface.element,
    reservedBlockSize: 320
  });

  assert.throws(() => host.hydrate(() => {
    throw new Error("mount failed");
  }), /mount failed/);
  assert.equal(host.snapshot(), "dehydrated");
  assert.equal(staticSurface.hidden(), false);
  assert.equal(staticSurface.attributes.get("aria-hidden"), "false");
  assert.equal(liveSurface.hidden(), true);
  assert.equal(liveSurface.replacements(), 1);
});

test("terminal disposal releases only the reservation-owned geometry", () => {
  const root = fakeElement("root", []);
  const staticSurface = fakeElement("static", []);
  const liveSurface = fakeElement("live", []);
  const host = new KpTutorialMotionStageReservationHost({
    root: root.element,
    staticSurface: staticSurface.element,
    liveSurface: liveSurface.element,
    reservedBlockSize: 480
  });

  host.dispose();
  host.dispose();
  assert.equal(host.snapshot(), "disposed");
  assert.equal(root.style.has(kpTutorialMotionStageBlockSizeProperty), false);
  assert.equal(root.classes.has(kpTutorialMotionStageReservationClass), false);
  assert.equal(staticSurface.dataset["kpTutorialStaticStage"], undefined);
  assert.equal(liveSurface.dataset["kpTutorialLiveStage"], undefined);
  assert.throws(() => host.hydrate(() => ({
    pause: () => undefined,
    dispose: () => undefined
  })), /cannot be reused/);
});

test("reservation CSS overlays both surfaces without hidden display collapse", async () => {
  const css = await readFile(
    new URL(
      "../src/tutorial/kp-tutorial-motion-stage-reservation.css",
      import.meta.url
    ),
    "utf8"
  );
  assert.match(css, /block-size:\s*var\(--kp-tutorial-motion-stage-block-size\)/);
  assert.match(css, /min-block-size:\s*var\(--kp-tutorial-motion-stage-block-size\)/);
  assert.match(css, /grid-area:\s*1\s*\/\s*1/);
  assert.match(css, /\[hidden\][\s\S]*display:\s*block/);
  assert.match(css, /visibility:\s*hidden/);
});

function fakeElement(name: string, operations: string[]) {
  let hidden = false;
  let replacements = 0;
  const style = new Map<string, string>();
  const classes = new Set<string>();
  const attributes = new Map<string, string>();
  const dataset = {} as Record<string, string>;
  const element = {
    dataset,
    style: {
      setProperty(property: string, value: string): void {
        style.set(property, value);
      },
      removeProperty(property: string): string {
        const previous = style.get(property) ?? "";
        style.delete(property);
        return previous;
      }
    },
    classList: {
      add(value: string): void { classes.add(value); },
      remove(value: string): void { classes.delete(value); }
    },
    get hidden(): boolean { return hidden; },
    set hidden(value: boolean) {
      hidden = value;
      operations.push(`${name}.hidden=${value}`);
    },
    setAttribute(attribute: string, value: string): void {
      attributes.set(attribute, value);
      operations.push(`${name}.${attribute}=${value}`);
    },
    replaceChildren(): void {
      replacements += 1;
      operations.push(`${name}.replaceChildren`);
    }
  } as unknown as HTMLElement;
  return {
    element,
    style,
    classes,
    attributes,
    dataset,
    hidden: () => hidden,
    replacements: () => replacements
  };
}
