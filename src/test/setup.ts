import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

afterEach(() => cleanup());

// jsdom gaps used by Headless UI (floating anchors) and ProseMirror (selection geometry).
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver ??= ResizeObserverStub;

const emptyRects = () => Object.assign([], { item: () => null }) as unknown as DOMRectList;
Range.prototype.getBoundingClientRect = () => new DOMRect();
Range.prototype.getClientRects = emptyRects;
Element.prototype.getClientRects = emptyRects;
Element.prototype.scrollIntoView ??= () => {};
Element.prototype.getAnimations ??= () => [];
document.elementFromPoint ??= () => null;
