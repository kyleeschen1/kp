import assert from "node:assert/strict";
import test from "node:test";

import {
  bindKpReaderSemanticLinks,
  readKpReaderSemanticFocusRefs
} from "../src/reader/runtime/semantic-focus-bindings.ts";

test("semantic focus refs normalize compiler whitespace without projection policy", () => {
  const element = {
    dataset: { kpFocus: "  equation.left\n equation.x  " }
  } as unknown as HTMLElement;

  assert.deepEqual(readKpReaderSemanticFocusRefs(element), [
    "equation.left",
    "equation.x"
  ]);
});

test("semantic link bindings preserve input source and remove delegated listeners", () => {
  const previousElement = Object.getOwnPropertyDescriptor(globalThis, "Element");
  class TestElement {
    readonly dataset = { kpFocus: "equation.x equation.right" };
    closest(): TestElement { return this; }
  }
  Object.defineProperty(globalThis, "Element", {
    configurable: true,
    value: TestElement
  });
  try {
    const listeners = new Map<string, EventListener>();
    const root = {
      contains: () => true,
      addEventListener(type: string, listener: EventListenerOrEventListenerObject) {
        if (typeof listener === "function") listeners.set(type, listener);
      },
      removeEventListener(type: string) { listeners.delete(type); }
    } as unknown as Document;
    const changes: string[] = [];
    const bindings = bindKpReaderSemanticLinks({
      root,
      selector: ".kp-semantic-link",
      setFocus: (source, refs) => changes.push(`${source}:${refs.join(",")}`),
      clearFocus: (source) => changes.push(`${source}:clear`)
    });
    const owner = new TestElement();
    const dispatch = (type: string, relatedTarget: EventTarget | null = null): void => {
      listeners.get(type)?.({ target: owner, relatedTarget } as unknown as Event);
    };

    dispatch("pointerover");
    dispatch("pointerout");
    dispatch("focusin");
    dispatch("focusout");
    assert.deepEqual(changes, [
      "pointer:equation.x,equation.right",
      "pointer:clear",
      "keyboard:equation.x,equation.right",
      "keyboard:clear"
    ]);

    bindings.dispose();
    assert.equal(listeners.size, 0);
  } finally {
    if (previousElement === undefined) Reflect.deleteProperty(globalThis, "Element");
    else Object.defineProperty(globalThis, "Element", previousElement);
  }
});
