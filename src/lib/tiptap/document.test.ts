import { describe, expect, it } from "vitest";
import { EMPTY_DOC, hasText, isSafeHttpUrl, normalizeLinkInput, sanitizeDoc } from "./document";

const supported = {
  type: "doc",
  content: [
    { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "عنوان" }] },
    {
      type: "paragraph",
      content: [
        { type: "text", text: "پررنگ", marks: [{ type: "bold" }] },
        { type: "text", text: "مورب", marks: [{ type: "italic" }] },
        { type: "text", text: "لینک", marks: [{ type: "link", attrs: { href: "https://example.com" } }] },
      ],
    },
    { type: "bulletList", content: [{ type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "یک" }] }] }] },
    { type: "orderedList", attrs: { start: 3 }, content: [{ type: "listItem", content: [{ type: "paragraph" }] }] },
    { type: "blockquote", content: [{ type: "paragraph", content: [{ type: "text", text: "نقل" }] }] },
  ],
};

describe("sanitizeDoc", () => {
  it("restores every supported node and mark unchanged", () => {
    expect(sanitizeDoc(supported)).toEqual(supported);
  });

  it("accepts empty documents", () => {
    expect(sanitizeDoc({ type: "doc", content: [] })).toEqual(EMPTY_DOC);
    expect(sanitizeDoc(EMPTY_DOC)).toEqual(EMPTY_DOC);
    expect(hasText(EMPTY_DOC)).toBe(false);
  });

  it.each([null, undefined, "<p>html</p>", 42, { type: "paragraph" }, { type: "doc", content: "nope" }])(
    "degrades malformed input %s to an empty document",
    (value) => expect(sanitizeDoc(value)).toEqual(EMPTY_DOC),
  );

  it("drops unsafe link schemes but keeps the text", () => {
    for (const href of ["javascript:alert(1)", "data:text/html,x", "vbscript:x", "//evil.com", "mailto:a@b.c"]) {
      const doc = sanitizeDoc({
        type: "doc",
        content: [{ type: "paragraph", content: [{ type: "text", text: "x", marks: [{ type: "link", attrs: { href } }] }] }],
      });
      expect(doc.content?.[0].content?.[0]).toEqual({ type: "text", text: "x" });
    }
  });

  it("removes unsupported nodes, marks and attributes", () => {
    const doc = sanitizeDoc({
      type: "doc",
      content: [
        { type: "codeBlock", content: [{ type: "text", text: "rm -rf" }] },
        { type: "image", attrs: { src: "https://x/y.png" } },
        { type: "text", text: "inline at block level" },
        {
          type: "paragraph",
          attrs: { onclick: "alert(1)" },
          content: [{ type: "text", text: "t", marks: [{ type: "strike" }, { type: "link", attrs: { href: "https://ok.dev", onclick: "x" } }] }],
        },
        { type: "heading", attrs: { level: 1 }, content: [{ type: "text", text: "h" }] },
      ],
    });
    expect(doc).toEqual({
      type: "doc",
      content: [
        { type: "paragraph", content: [{ type: "text", text: "t", marks: [{ type: "link", attrs: { href: "https://ok.dev" } }] }] },
        { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "h" }] },
      ],
    });
  });
});

describe("link helpers", () => {
  it("allows only http and https", () => {
    expect(isSafeHttpUrl("https://a.com")).toBe(true);
    expect(isSafeHttpUrl("http://a.com")).toBe(true);
    expect(isSafeHttpUrl("javascript:alert(1)")).toBe(false);
    expect(isSafeHttpUrl("ftp://a.com")).toBe(false);
  });

  it("normalizes scheme-less input to https and rejects other schemes", () => {
    expect(normalizeLinkInput("example.com/path")).toBe("https://example.com/path");
    expect(normalizeLinkInput(" http://a.com ")).toBe("http://a.com");
    expect(normalizeLinkInput("javascript:alert(1)")).toBeNull();
    expect(normalizeLinkInput("   ")).toBeNull();
  });
});
